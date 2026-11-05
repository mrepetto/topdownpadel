// First-party analytics. Schema is owned by drizzle/0001_analytics.sql.
const TA_KINDS=new Set(['page_view','session_start','heartbeat','session_end','match_start','match_complete','match_abandon','video_play','video_complete','browser_play','store_click','client_error','load_time','performance','campaign_milestone','retry','unlock','character_select','multiplayer_error']);
const taEncoder=new TextEncoder();
const taJson=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const taError=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const taClean=(value,max=64)=>typeof value==='string'?value.replace(/[^a-zA-Z0-9_.:/ -]/g,'').slice(0,max):'';
const taId=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{16,80}$/.test(value);
async function taDigest(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',taEncoder.encode(value))),x=>x.toString(16).padStart(2,'0')).join('');}
async function taEqual(a,b){const [x,y]=await Promise.all([taDigest(a),taDigest(b)]);let diff=0;for(let i=0;i<x.length;i++)diff|=x.charCodeAt(i)^y.charCodeAt(i);return diff===0;}
async function taHmac(value,secret){const key=await crypto.subtle.importKey('raw',taEncoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,taEncoder.encode(value))),x=>x.toString(16).padStart(2,'0')).join('');}
function taSameOrigin(request){return request.headers.get('Origin')===new URL(request.url).origin&&request.headers.get('Sec-Fetch-Site')!=='cross-site';}
async function taRead(request){if(Number(request.headers.get('Content-Length'))>16384)taError('Request too large',413);const raw=await request.text();if(raw.length>16384)taError('Request too large',413);try{return JSON.parse(raw);}catch{taError('Invalid JSON');}}
async function taRate(db,key,limit,seconds=60){const now=Date.now(),bucket=Math.floor(now/(seconds*1000)),id=key+':'+bucket;const row=await db.prepare('INSERT INTO tdp_rate_limits(id,count,expires) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(id,now+seconds*2000).first();if(row.count>limit)taError('Too many requests. Try again later.',429);}
async function taAuth(request,env){if(!env.ADMIN_PASSWORD||!env.ADMIN_SESSION_SECRET)taError('Admin access is not configured',503);const token=request.headers.get('Cookie')?.match(/(?:^|;\s*)tdp_admin=([a-f0-9]{64})(?:;|$)/)?.[1];if(!token)taError('Please sign in',401);const digest=await taHmac(token,env.ADMIN_SESSION_SECRET);const found=await env.DB.prepare('SELECT expires FROM tdp_admin_sessions WHERE token_hash=?').bind(digest).first();if(!found||found.expires<Date.now())taError('Session expired. Please sign in',401);return digest;}
function taCookie(token,age=28800){return 'tdp_admin='+token+'; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age='+age;}
function taNormalize(body){
 if(body?.consent!==true||!taId(body.session)||!taId(body.device))taError('Invalid consent or session');
 if(!Array.isArray(body.events)||body.events.length>25)taError('Invalid event batch');
 const context=body.context==='game'?'game':'website';
 const platform=['ios','android','desktop','other'].includes(body.platform)?body.platform:'other';
 const number=(v,max=86400000)=>typeof v==='number'&&Number.isFinite(v)?Math.min(max,Math.max(0,v)):0;
 const active=Math.round(number(body.active_ms)),gameplay=Math.min(active,Math.round(number(body.gameplay_ms)));
 const events=body.events.map(e=>{if(!e||!taId(e.id)||!TA_KINDS.has(e.type))taError('Invalid event');return {id:e.id,kind:e.type,mode:taClean(e.mode,32),label:taClean(e.platform||e.label,64),value:number(e.value)};});
 return {session:body.session,device:body.device,context,platform,language:taClean(body.language,8),version:taClean(body.version,64),internal:body.internal===true?1:0,active,gameplay,referrer:taClean(body.referrer,100),campaign:taClean(body.campaign,64),events};
}
async function taIngest(request,env){
 if(request.method!=='POST')taError('Method not allowed',405);if(!taSameOrigin(request))taError('Origin rejected',403);
 const b=taNormalize(await taRead(request)),now=Date.now();
 // Hashed address is used only for short-lived abuse control, never analytics identity.
 const address=request.headers.get('CF-Connecting-IP')||'unknown';
 await taRate(env.DB,'ingest:'+await taDigest(address),180);
 const existing=await env.DB.prepare('SELECT device,context,started FROM tdp_sessions WHERE id=?').bind(b.session).first();
 if(existing&&(existing.device!==b.device||existing.context!==b.context))taError('Session mismatch',409);
 const elapsed=existing?Math.min(86400000,now-existing.started+30000):30000;
 const active=Math.min(b.active,elapsed),gameplay=Math.min(b.gameplay,active);
 const statements=[env.DB.prepare('INSERT INTO tdp_sessions(id,device,started,updated,context,platform,language,version,internal,active_ms,gameplay_ms,referrer,campaign) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET updated=excluded.updated,active_ms=MAX(active_ms,excluded.active_ms),gameplay_ms=MAX(gameplay_ms,excluded.gameplay_ms)').bind(b.session,b.device,now,now,b.context,b.platform,b.language,b.version,b.internal,active,gameplay,b.referrer,b.campaign)];
 for(const e of b.events)statements.push(env.DB.prepare('INSERT OR IGNORE INTO tdp_events(id,session,kind,created,mode,label,value) VALUES(?,?,?,?,?,?,?)').bind(e.id,b.session,e.kind,now,e.mode,e.label,e.value));
 await env.DB.batch(statements);
 // Bounded occasional housekeeping. Raw analytics have a 90-day retention period.
 if(Math.random()<.01)await env.DB.batch([env.DB.prepare('DELETE FROM tdp_rate_limits WHERE expires<?').bind(now),env.DB.prepare('DELETE FROM tdp_admin_sessions WHERE expires<?').bind(now),env.DB.prepare('DELETE FROM tdp_events WHERE created<?').bind(now-90*86400000),env.DB.prepare('DELETE FROM tdp_sessions WHERE updated<?').bind(now-90*86400000)]);
 return taJson({ok:true});
}
function taRange(url){const endInput=url.searchParams.get('to'),startInput=url.searchParams.get('from'),end=endInput?Date.parse(endInput+'T23:59:59.999Z'):Date.now(),start=startInput?Date.parse(startInput+'T00:00:00Z'):end-7*86400000;if(!Number.isFinite(start)||!Number.isFinite(end)||start>end||end-start>90*86400000)taError('Choose a valid date range of 90 days or less');return {start,end};}
async function taMetrics(request,env){
 const url=new URL(request.url),{start,end}=taRange(url),includeInternal=url.searchParams.get('internal')==='1',platform=url.searchParams.get('platform')||'',version=url.searchParams.get('version')||'';
 const filters="s.started>=? AND s.started<=?"+(includeInternal?'':' AND s.internal=0')+(platform?' AND s.platform=?':'')+(version?' AND s.version=?':'');
 const args=[start,end,...(platform?[platform]:[]),...(version?[version]:[])];
 const all=async(sql,values=args)=>(await env.DB.prepare(sql).bind(...values).all()).results||[];
 const first=async(sql,values=args)=>await env.DB.prepare(sql).bind(...values).first();
 async function period(values){
  const result=await first(`SELECT COUNT(*) sessions,COUNT(DISTINCT s.device) devices,COALESCE(AVG(s.active_ms),0) average_session_ms,COALESCE(SUM(s.active_ms),0) active_ms,COALESCE(SUM(s.gameplay_ms),0) gameplay_ms,COALESCE(SUM(s.context='game'),0) game_sessions,COALESCE(SUM(s.context='website'),0) website_sessions FROM tdp_sessions s WHERE ${filters}`,values);
  const median=await first(`WITH ranked AS (SELECT s.active_ms,ROW_NUMBER() OVER(ORDER BY s.active_ms) rn,COUNT(*) OVER() n FROM tdp_sessions s WHERE ${filters}) SELECT COALESCE(AVG(active_ms),0) median FROM ranked WHERE rn IN ((n+1)/2,(n+2)/2)`,values);result.median_session_ms=median.median;
  const events=await all(`SELECT e.kind,COUNT(*) count,COALESCE(AVG(e.value),0) average_value FROM tdp_events e JOIN tdp_sessions s ON e.session=s.id WHERE ${filters} GROUP BY e.kind`,values);
  const eventMap=Object.fromEntries(events.map(e=>[e.kind,e.count]));
  result.matches_started=eventMap.match_start||0;result.matches_completed=eventMap.match_complete||0;result.explicit_abandons=eventMap.match_abandon||0;result.completion_rate=result.matches_started?Math.min(1,result.matches_completed/result.matches_started):null;result.sessions_per_device=result.devices?result.sessions/result.devices:0;
  return {summary:result,events};
 }
 const {summary,events}=await period(args);const {summary:previous}=await period([start-(end-start+1),start-1,...args.slice(2)]);
 const days=await all(`SELECT strftime('%Y-%m-%d',s.started/1000,'unixepoch') day,COUNT(*) sessions,COUNT(DISTINCT s.device) devices,SUM(s.active_ms) active_ms,SUM(s.gameplay_ms) gameplay_ms FROM tdp_sessions s WHERE ${filters} GROUP BY day ORDER BY day`);
 const devices=await all(`SELECT s.platform,COUNT(*) sessions,COUNT(DISTINCT s.device) devices FROM tdp_sessions s WHERE ${filters} GROUP BY s.platform ORDER BY sessions DESC`);
 const modes=await all(`SELECT e.mode,SUM(e.kind='match_start') started,SUM(e.kind='match_complete') completed,SUM(e.kind='match_abandon') abandoned,AVG(CASE WHEN e.kind='match_complete' THEN e.value END) average_match_ms FROM tdp_events e JOIN tdp_sessions s ON e.session=s.id WHERE ${filters} AND e.kind IN ('match_start','match_complete','match_abandon') GROUP BY e.mode ORDER BY started DESC`);
 const sources=await all(`SELECT s.referrer,s.campaign,COUNT(*) sessions FROM tdp_sessions s WHERE ${filters} AND s.context='website' GROUP BY s.referrer,s.campaign ORDER BY sessions DESC LIMIT 30`);
 const breakdown=await all(`SELECT e.kind,e.label,COUNT(*) count,AVG(e.value) average_value FROM tdp_events e JOIN tdp_sessions s ON e.session=s.id WHERE ${filters} AND e.kind NOT IN ('heartbeat','session_start','session_end') GROUP BY e.kind,e.label ORDER BY count DESC LIMIT 100`);
 const versions=await all(`SELECT s.version,COUNT(*) sessions FROM tdp_sessions s WHERE s.started>=? AND s.started<=? ${includeInternal?'':'AND s.internal=0'} ${platform?'AND s.platform=?':''} GROUP BY s.version ORDER BY MAX(s.started) DESC LIMIT 30`,[start,end,...(platform?[platform]:[])]);
 const firstSeen=await first('SELECT MIN(started) collecting_since FROM tdp_sessions',[]);
 const activity=await first(`SELECT COUNT(DISTINCT CASE WHEN s.started>=? THEN s.device END) daily,COUNT(DISTINCT CASE WHEN s.started>=? THEN s.device END) weekly,COUNT(DISTINCT CASE WHEN s.started>=? THEN s.device END) monthly FROM tdp_sessions s WHERE s.context='game' ${includeInternal?'':'AND s.internal=0'} ${platform?'AND s.platform=?':''} ${version?'AND s.version=?':''}`,[Date.now()-86400000,Date.now()-7*86400000,Date.now()-30*86400000,...args.slice(2)]);
 const audience=await first(`SELECT SUM(CASE WHEN EXISTS(SELECT 1 FROM tdp_sessions old WHERE old.device=s.device ${includeInternal?'':'AND old.internal=0'} AND old.started<?) THEN 1 ELSE 0 END) returning_devices,COUNT(*) total FROM (SELECT DISTINCT device FROM tdp_sessions s WHERE ${filters}) s`,[start,...args]);
 const retention=[];for(const day of [1,7,30]){const r=await first(`WITH firsts AS (SELECT device,MIN(started) first_at FROM tdp_sessions WHERE context='game' ${includeInternal?'':'AND internal=0'} GROUP BY device),cohort AS (SELECT * FROM firsts WHERE first_at>=? AND first_at<=? AND first_at<=?) SELECT COUNT(*) eligible,SUM(EXISTS(SELECT 1 FROM tdp_sessions t WHERE t.device=c.device AND t.context='game' ${includeInternal?'':'AND t.internal=0'} AND t.started>=c.first_at+? AND t.started<c.first_at+?)) returned FROM cohort c`,[start,end,Date.now()-(day+1)*86400000,day*86400000,(day+1)*86400000]);retention.push({day,eligible:r.eligible||0,returned:r.returned||0,rate:r.eligible?(r.returned||0)/r.eligible:null});}
 return taJson({range:{from:new Date(start).toISOString(),to:new Date(end).toISOString(),timezone:'UTC'},summary,previous,activity,days,devices,modes,sources,events,breakdown,versions,audience:{new_devices:(audience.total||0)-(audience.returning_devices||0),returning_devices:audience.returning_devices||0},retention,collecting_since:firstSeen.collecting_since,limitations:['Consent-based browser/device estimates; not verified people.','Session durations count visible activity. Paused/background time is excluded from gameplay.','Match abandons are explicit exits; closed browsers may be unclassified.','Retention uses 24-hour windows after first game session; only mature cohorts are included. Retention spans all platforms and versions.','Raw data retained for 90 days; oldest retained session is the available first-seen date.','Store downloads and purchases are not connected.'],connections:{app_store:'not_connected',google_play:'not_connected',downloads:null}});
}
export async function handleAnalytics(request,env){
 const path=new URL(request.url).pathname;if(path!=='/api/telemetry'&&!path.startsWith('/api/admin/'))return null;
 try{
  if(!env.DB)taError('Metrics storage unavailable',503);
  if(path==='/api/telemetry')return await taIngest(request,env);
  if(!env.ADMIN_PASSWORD||!env.ADMIN_SESSION_SECRET)taError('Admin access is not configured',503);
  if(path==='/api/admin/login'){
   if(request.method!=='POST')taError('Method not allowed',405);if(!taSameOrigin(request))taError('Origin rejected',403);
   const address=request.headers.get('CF-Connecting-IP')||'unknown';await taRate(env.DB,'login:'+await taHmac(address,env.ADMIN_SESSION_SECRET),8,900);
   const body=await taRead(request);if(typeof body.password!=='string'||body.password.length>256||!await taEqual(body.password,env.ADMIN_PASSWORD))taError('Incorrect password',401);
   const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');await env.DB.prepare('INSERT INTO tdp_admin_sessions(token_hash,expires) VALUES(?,?)').bind(await taHmac(token,env.ADMIN_SESSION_SECRET),Date.now()+28800000).run();return taJson({ok:true},200, {'Set-Cookie':taCookie(token)});
  }
  const digest=await taAuth(request,env);
  if(path==='/api/admin/logout'){if(request.method!=='POST')taError('Method not allowed',405);if(!taSameOrigin(request))taError('Origin rejected',403);await env.DB.prepare('DELETE FROM tdp_admin_sessions WHERE token_hash=?').bind(digest).run();return taJson({ok:true},200,{'Set-Cookie':taCookie('',0)});}
  if(path==='/api/admin/metrics'){if(request.method!=='GET')taError('Method not allowed',405);return await taMetrics(request,env);}
  taError('Not found',404);
 }catch(error){return taJson({error:error.status?error.message:'Metrics service temporarily unavailable'},error.status||503);}
}
export {taNormalize,taRange,taSameOrigin};
