/* Optional first-party measurement. No device identifier or requests before consent. */
(()=>{
 'use strict';
 const context=document.currentScript?.dataset.context==='game'?'game':'website',version=document.currentScript?.dataset.version||'webmaster-2026-11-05';
 const consentKey='tdp-analytics-consent-v1',deviceKey='tdp-analytics-device-v1';
 let progressSnapshot=null;
 let allowed=false,session='',device='',queue=[],active=0,gameplay=0,last=performance.now(),lastInput=last,lastFlush=last,match=null,inflight=false,errors=0,sessionAt=Date.now();
 const uuid=()=>crypto.randomUUID().replaceAll('-','');
 const get=k=>{try{return localStorage.getItem(k);}catch{return null;}};
 const put=(k,v)=>{try{localStorage.setItem(k,v);}catch{}};
 const platform=/Android/i.test(navigator.userAgent)?'android':/iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1?'ios':/Windows|Mac|Linux/i.test(navigator.userAgent)?'desktop':'other';
 const clean=v=>String(v||'').replace(/[^a-zA-Z0-9_.:/ -]/g,'').slice(0,64);
 const internal=new URL(location.href).searchParams.get('internal')==='1';
 let referrer='';try{referrer=document.referrer?new URL(document.referrer).hostname:'';}catch{}
 const campaign=clean(new URL(location.href).searchParams.get('utm_campaign'));
 function track(type,data={}){if(!allowed)return;queue.push({id:uuid(),type,mode:clean(data.mode),label:clean(data.label),platform:clean(data.platform),value:Number.isFinite(data.value)?Math.max(0,data.value):0});if(queue.length>25)queue.shift();}
 function payload(events){return {consent:true,session,device,context,platform,language:navigator.language.slice(0,8),version,internal,active_ms:Math.round(active),gameplay_ms:Math.round(gameplay),referrer,campaign,events};}
 async function flush(beacon=false){if(!allowed||!queue.length||inflight)return;const events=queue.splice(0,25),body=JSON.stringify(payload(events));lastFlush=performance.now();if(beacon&&navigator.sendBeacon){if(!navigator.sendBeacon('/api/telemetry',new Blob([body],{type:'application/json'})))queue.unshift(...events);return;}inflight=true;try{const r=await fetch('/api/telemetry',{method:'POST',headers:{'Content-Type':'application/json'},body,credentials:'same-origin',keepalive:true});if(!r.ok&&r.status>=500)queue.unshift(...events);}catch{queue.unshift(...events);}finally{queue=queue.slice(-25);inflight=false;}}
 function mode(){try{return globalThis.Practice?.active?'practice':typeof network!=='undefined'&&network?.active?'online':globalThis.CampaignMatch?.playing?'campaign':globalThis.matchControlMode||'training';}catch{return 'unknown';}}
 function gameState(){try{return typeof state==='string'?state:'intro';}catch{return 'intro';}}
 function progress(){
  const p=globalThis.CampaignMenu?.profile;if(!p)return;
  const snapshot={selected:p.selected,owned:[...(p.owned||[])],skins:Object.entries(p.skins||{}).flatMap(([id,tiers])=>tiers.map(t=>id+'-'+t)),tracks:Object.fromEntries(Object.entries(p.campaigns||{}).map(([key,t])=>[key,{rung:t.rung,retry:t.retry,serial:t.serial}]))};
  if(progressSnapshot){
   if(snapshot.selected!==progressSnapshot.selected)track('character_select',{label:'character-'+snapshot.selected});
   for(const id of snapshot.owned)if(!progressSnapshot.owned.includes(id))track('unlock',{label:'character-'+id});
   for(const id of snapshot.skins)if(!progressSnapshot.skins.includes(id))track('unlock',{label:'skin-'+id});
   for(const [key,t] of Object.entries(snapshot.tracks)){const before=progressSnapshot.tracks[key];if(!before)continue;if(t.rung>before.rung)track('campaign_milestone',{mode:key,label:'rung-'+t.rung,value:t.rung});if(t.serial>before.serial&&before.retry)track('retry',{mode:key,label:'rung-'+t.rung});}
  }
  progressSnapshot=snapshot;
 }
 function result(){const p=globalThis.CampaignMenu?.profile;return p?.campaigns?.[p.controlMode]?.result;}
 function tick(){const now=performance.now(),dt=Math.min(2000,Math.max(0,now-last));last=now;if(!allowed)return;
  const visible=document.visibilityState==='visible',playing=context==='game'&&['play','serve','point','fault','let'].includes(gameState());
  if(visible&&(now-lastInput<120000||playing))active+=dt;
  if(visible&&playing){gameplay+=dt;if(match)match.active+=dt;}
  if(context==='game'){
   progress();const current=gameState();
   if(!match&&playing&&!globalThis.Practice?.active){match={id:uuid(),mode:mode(),active:0,resultToken:result()?.token};track('match_start',{mode:match.mode});}
   if(match&&(current==='over'||match.mode==='campaign'&&result()?.token&&result().token!==match.resultToken&&!result().forfeit)){track('match_complete',{mode:match.mode,value:match.active,label:match.mode==='campaign'?(result()?.won?'won':'lost'):''});match=null;}
   else if(match&&current==='intro'){track('match_abandon',{mode:match.mode,value:match.active});match=null;}
  }
  if(Date.now()-sessionAt>=86400000){track('session_end');flush(true);session=uuid();sessionAt=Date.now();active=0;gameplay=0;track('session_start');}
  if(now-lastFlush>30000){track('heartbeat');flush();}
 }
 function begin(){if(allowed)return;allowed=true;progressSnapshot=null;device=get(deviceKey)||uuid();put(deviceKey,device);session=uuid();sessionAt=Date.now();active=0;gameplay=0;last=performance.now();lastInput=last;track('session_start');track('page_view',{label:context});const nav=performance.getEntriesByType('navigation')[0];if(nav?.loadEventEnd>0)track('load_time',{value:nav.loadEventEnd});flush();}
 function stop(){progressSnapshot=null;allowed=false;queue=[];match=null;device='';session='';try{localStorage.removeItem(deviceKey);}catch{}}
 function settings(){
  document.getElementById('tdp-privacy-choice')?.remove();const es=navigator.language.startsWith('es'),panel=document.createElement('aside');panel.id='tdp-privacy-choice';panel.setAttribute('aria-label',es?'Preferencias de privacidad':'Privacy preferences');panel.style.cssText='position:fixed;z-index:100000;left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));max-width:520px;margin:auto;padding:18px;background:#0b2239;color:#fff;border:1px solid #54758c;border-radius:16px;box-shadow:0 10px 45px #0008;font:15px/1.45 system-ui;text-align:left';
  const p=document.createElement('p');p.style.cssText='margin:0 0 12px';p.textContent=es?'¿Nos ayudas a mejorar Top Down Padel? Las estadísticas opcionales miden sesiones, partidas y errores con un identificador aleatorio. Sin publicidad. Puedes cambiar esta opción en Privacidad.':'Help us improve Top Down Padel? Optional analytics measure sessions, matches and errors with a random identifier. No advertising. Change your choice in Privacy.';panel.append(p);
  for(const [yes,label] of [[false,es?'Solo lo necesario':'Essential only'],[true,es?'Permitir estadísticas':'Allow analytics']]){const button=document.createElement('button');button.type='button';button.textContent=label;button.style.cssText='font:600 15px system-ui;padding:12px 14px;margin:4px 8px 0 0;border:1px solid #8ca5bc;border-radius:8px;background:'+(yes?'#ffe16b':'#183b55')+';color:'+(yes?'#12253a':'white')+';cursor:pointer';button.onclick=()=>{put(consentKey,yes?'yes':'no');yes?begin():stop();panel.remove();};panel.append(button);}const link=document.createElement('a');link.href='/privacy';link.textContent=es?'Leer privacidad':'Read privacy';link.style.cssText='display:block;color:#bce9ff;margin-top:10px';panel.append(link);document.body.append(panel);
 }
 globalThis.TDPTelemetry={track,settings,flush};
 for(const name of ['pointerdown','keydown','touchstart'])addEventListener(name,()=>{lastInput=performance.now();},{passive:true});
 addEventListener('visibilitychange',()=>{tick();if(document.visibilityState==='hidden'){track('heartbeat');flush(true);}else{last=performance.now();lastInput=last;}});
 addEventListener('pagehide',()=>{tick();track('session_end');flush(true);});
 addEventListener('error',e=>{if(errors++<5)track('client_error',{label:e.error?.name||'ResourceError'});});
 addEventListener('unhandledrejection',()=>{if(errors++<5)track('client_error',{label:'UnhandledPromise'});});
 addEventListener('storage',e=>{if(e.key===consentKey){e.newValue==='yes'?begin():stop();}});
 setInterval(tick,1000);
 // Sample rendered frames in short windows rather than emitting per-frame events.
 setInterval(()=>{if(!allowed||context!=='game'||document.visibilityState!=='visible'||!['play','serve'].includes(gameState()))return;let frames=0;const start=performance.now();function sample(t){if(!allowed||document.visibilityState!=='visible')return;frames++;if(t-start<3000)requestAnimationFrame(sample);else track('performance',{label:'sampled-fps',value:Math.round(frames*1000/(t-start))});}requestAnimationFrame(sample);},60000);
 addEventListener('load',()=>{const nav=performance.getEntriesByType('navigation')[0];if(allowed&&nav)track('load_time',{value:performance.now()});},{once:true});
 const ready=()=>{if(context==='game'){const panel=document.querySelector('#panel-general .menu-grid');if(panel){const b=document.createElement('button');b.type='button';b.textContent='PRIVACY / PRIVACIDAD';b.onclick=settings;panel.append(b);}}if(get(consentKey)==='yes')begin();else if(get(consentKey)!=='no')settings();};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
