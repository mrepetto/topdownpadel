const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
const uid=()=>crypto.randomUUID();
const code=()=>Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n%32]).join('');
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const nameOf=n=>typeof n==='string'?n.trim().replace(/[\x00-\x1f<>]/g,'').slice(0,16)||'PLAYER':'PLAYER';
const finite=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)?Math.max(min,Math.min(max,n)):0;
function safeAim(v){return Number.isFinite(v?.targetX)?{targetX:finite(v.targetX,-300,1300),targetY:finite(v.targetY,-300,800),mouse:true,spin:finite(v?.spin,-1,1)}:{x:finite(v?.x,-1,1),y:finite(v?.y,-1,1),mouse:true,...(v?.swipe===true?{swipe:true}:{}),spin:finite(v?.spin,-1,1)};}
function safeInput(v){if(!v||typeof v!=='object')return null;return {skin:Number.isInteger(v.skin?.id)&&v.skin.id>=0&&v.skin.id<18&&Number.isInteger(v.skin.tier)&&v.skin.tier>=0&&v.skin.tier<=3?{id:v.skin.id,tier:v.skin.tier}:null,seq:finite(v.seq,0,9e15),x:finite(v.x,-1,1),y:finite(v.y,-1,1),dash:!!v.dash,aim:safeAim(v.aim),gesturePower:Number.isFinite(v.gesturePower)?finite(v.gesturePower,0,1):null,events:Array.isArray(v.events)?v.events.slice(-16).filter(e=>e&&['charge','release','cancel'].includes(e.kind)).map(e=>({id:finite(e.id,1,9e15),kind:e.kind,lob:!!e.lob,aim:safeAim(e.aim),gesture:!!e.gesture,power:finite(e.power,0,1)})):[]};}
async function api(request,env){
 const url=new URL(request.url),db=env.DB,now=Date.now();if(!db)fail('Room service unavailable',503);
 if(request.method!=='POST')fail('Method not allowed',405);
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin)fail('Origin rejected',403);
 const raw=await request.text();if(raw.length>90000)fail('Request too large',413);let body;try{body=JSON.parse(raw||'{}');}catch{fail('Invalid JSON');}
 const parts=url.pathname.split('/').filter(Boolean),action=parts.at(-1);
 if(action==='create'){
  const recent=await db.prepare('SELECT COUNT(*) AS n FROM rooms WHERE created > ?').bind(now-60000).first();if(recent.n>100)fail('Room service busy. Try again shortly.',429);
  const id=uid(),token=uid()+uid(),room=code();
  await db.batch([db.prepare('DELETE FROM rooms WHERE updated < ?').bind(now-7200000),db.prepare('INSERT INTO rooms(code,host,created,updated) VALUES(?,?,?,?)').bind(room,id,now,now),db.prepare('INSERT INTO members(id,room,token_hash,name,slot,ready,seen) VALUES(?,?,?,?,0,1,?)').bind(id,room,await hash(token),nameOf(body.name),now)]);
  return json({code:room,id,token,slot:0,host:true});
 }
 const roomCode=parts[2];if(!/^[A-Z2-9]{6}$/.test(roomCode||''))fail('Invalid room code');
 const bearer=request.headers.get('Authorization')?.replace(/^Bearer /,'');
 const authHash=bearer?await hash(bearer):'';
 let room=action==='join'?await db.prepare('SELECT * FROM rooms WHERE code=?').bind(roomCode).first():await db.prepare('SELECT r.*,m.id AS member_id FROM rooms r LEFT JOIN members m ON m.room=r.code AND m.token_hash=? WHERE r.code=?').bind(authHash,roomCode).first();if(!room||room.status==='closed'||room.updated<now-45000)fail('Room closed or expired',410);
 if(action==='join'){
  const id=uid(),token=uid()+uid();
  await db.prepare('DELETE FROM members WHERE room=? AND id<>? AND seen < ?').bind(roomCode,room.host,now-20000).run();
  try{
   const r=await db.prepare(`INSERT INTO members(id,room,token_hash,name,slot,seen) SELECT ?,?,?,?,s.slot,? FROM (SELECT 0 slot UNION SELECT 1 UNION SELECT 2 UNION SELECT 3) s WHERE NOT EXISTS(SELECT 1 FROM members m WHERE m.room=? AND m.slot=s.slot) ORDER BY s.slot LIMIT 1`).bind(id,roomCode,await hash(token),nameOf(body.name),now,roomCode).run();if(!r.meta.changes)fail('Room is full',409);
  }catch(e){if(e.status)throw e;fail('Room is full',409);}
  const me=await db.prepare('SELECT slot FROM members WHERE id=?').bind(id).first();return json({code:roomCode,id,token,slot:me.slot,host:false});
 }
 if(!bearer)fail('Session required',401);
 const me=room.member_id?{id:room.member_id}:null;if(!me)fail('Session expired. Join again.',401);
 const host=me.id===room.host;
 if(action==='leave'){if(host)await db.prepare("UPDATE rooms SET status='closed' WHERE code=?").bind(roomCode).run();else await db.prepare('DELETE FROM members WHERE id=?').bind(me.id).run();return json({ok:true});}
 if(action!=='sync')fail('Not found',404);
 const stmts=[db.prepare('UPDATE members SET seen=? WHERE id=?').bind(now,me.id)];
 if(host)stmts.push(db.prepare('UPDATE rooms SET updated=? WHERE code=?').bind(now,roomCode));
 if(body.slot!==undefined){if(room.status!=='lobby')fail('Positions are locked during a match',409);if(!Number.isInteger(body.slot)||body.slot<0||body.slot>3)fail('Invalid position');stmts.push(db.prepare('UPDATE members SET slot=?,ready=0 WHERE id=? AND NOT EXISTS(SELECT 1 FROM members WHERE room=? AND slot=? AND id<>?)').bind(body.slot,me.id,roomCode,body.slot,me.id));}
 if(typeof body.ready==='boolean')stmts.push(db.prepare('UPDATE members SET ready=? WHERE id=?').bind(body.ready?1:0,me.id));
 if(body.action==='start'){
  if(!host)fail('Only the host can start',403);
  const unready=await db.prepare('SELECT COUNT(*) n FROM members WHERE room=? AND id<>? AND seen>? AND ready=0').bind(roomCode,me.id,now-5000).first();if(unready.n)fail('Waiting for players to ready up',409);
  stmts.push(db.prepare("UPDATE rooms SET status='playing' WHERE code=?").bind(roomCode));
 }
 if(body.input&&!host)stmts.push(db.prepare('UPDATE members SET input=? WHERE id=?').bind(JSON.stringify(safeInput(body.input)),me.id));
 if(body.snapshot){if(!host)fail('Only the host can publish the match',403);const s=body.snapshot;if(!Number.isSafeInteger(s.seq)||JSON.stringify(s).length>60000)fail('Invalid snapshot');stmts.push(db.prepare('UPDATE rooms SET snapshot=?,snapshot_seq=? WHERE code=? AND snapshot_seq<?').bind(JSON.stringify(s),s.seq,roomCode,s.seq));}
 for(const signal of (Array.isArray(body.signals)?body.signals.slice(0,3):[])){
  const data=signal.description;if(!data||typeof data.sdp!=='string'||data.sdp.length>18000)fail('Invalid connection signal');
  if(host&&data.type==='offer')stmts.push(db.prepare('UPDATE members SET offer=?,answer=NULL WHERE room=? AND id=? AND id<>?').bind(JSON.stringify(data),roomCode,signal.id,me.id));
  else if(!host&&data.type==='answer')stmts.push(db.prepare('UPDATE members SET answer=? WHERE id=?').bind(JSON.stringify(data),me.id));
  else fail('Invalid connection signal',403);
 }
 stmts.push(db.prepare('SELECT * FROM rooms WHERE code=?').bind(roomCode),db.prepare('SELECT id,name,slot,ready,seen,input,offer,answer FROM members WHERE room=? ORDER BY slot').bind(roomCode));
 const result=await db.batch(stmts);room=result[result.length-2].results[0];const members=result[result.length-1].results;
 return json({code:roomCode,host:room.host,status:room.status,now,members:members.map(m=>({id:m.id,name:m.name,slot:m.slot,ready:!!m.ready,online:m.seen>now-5000,seen:m.seen,...(host?{input:m.input?JSON.parse(m.input):null,answer:m.answer?JSON.parse(m.answer):null}:m.id===me.id?{offer:m.offer?JSON.parse(m.offer):null}:{})})),snapshot:!host&&!body.direct&&room.snapshot?JSON.parse(room.snapshot):null});
}
// Decode portrait bytes only when requested. API and game scripts remain unchanged.
const decodedAssets=new Map();
function serveAsset(request,a){
 const headers={'Content-Type':a.type+(a.binary?'':'; charset=utf-8'),'Cache-Control':a.binary?'public, max-age=3600':'no-cache','ETag':a.etag,'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'};
 if(request.headers.get('If-None-Match')===a.etag)return new Response(null,{status:304,headers});
 
 let body=a.body;
 if(a.binary){if(!decodedAssets.has(a.etag))decodedAssets.set(a.etag,Uint8Array.from(atob(a.body),c=>c.charCodeAt(0)));body=decodedAssets.get(a.etag);}
 if(a.type==='video/mp4'){
  headers['Accept-Ranges']='bytes';
  const range=request.headers.get('Range');
  if(range){const m=/^bytes=(\d*)-(\d*)$/.exec(range);let start=m&&m[1]?Number(m[1]):0,end=m&&m[2]?Number(m[2]):body.length-1;
   if(m&&!m[1]&&m[2]){start=Math.max(0,body.length-Number(m[2]));end=body.length-1;}
   if(!m||start> end||start>=body.length)return new Response(null,{status:416,headers:{...headers,'Content-Range':'bytes */'+body.length}});
   end=Math.min(end,body.length-1);headers['Content-Range']='bytes '+start+'-'+end+'/'+body.length;headers['Content-Length']=String(end-start+1);
   return new Response(request.method==='HEAD'?null:body.slice(start,end+1),{status:206,headers});
  }headers['Content-Length']=String(body.length);
 }
 if(request.method==='HEAD')return new Response(null,{headers});
 return new Response(body,{headers});
}
export default {async fetch(request,env){try{const path=new URL(request.url).pathname;if(path==='/game')return Response.redirect(new URL('/game/'+new URL(request.url).search,request.url),308);if(path==='/generaladmin/')return Response.redirect(new URL('/generaladmin',request.url),308);if(path==='/api/telemetry'||path.startsWith('/api/admin/'))return await handleAnalytics(request,env);if(path.startsWith('/api/'))return await api(request,env);if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});const a=ASSETS[path];if(!a)return new Response('Not found',{status:404});return serveAsset(request,a);}catch(e){return json({error:e.status?e.message:'Room service unavailable. Please try again.'},e.status||500);}}};
