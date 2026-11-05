'use strict';
// Campaign owns local solo matches only. The attempt token survives page lifecycle events.
globalThis.CampaignMatch=(()=>{
 const menu=()=>globalThis.CampaignMenu;
 const core=()=>Career.campaign;
 const L=(en,es)=>language==='es'?es:en;
 let token=null,screen='ladder',starting=false;
 function show(view='ladder',remember=false){
  const api=menu(); if(!api)return;
  api.show(view==='ladder'?'campaign':'campaign-'+view,remember);
 }
 function render(request,p){
  const c=core(),s=c.state(p),r=s.result;
  const browsing=request.startsWith('map-');
  const confirmRetry=request==='retry'&&s.retry&&!r;
  let view=browsing||request==='retry'||request==='intro'?'ladder':request||'ladder';
  if(!browsing&&s.result&&['ladder','intro','team','complete'].includes(view))view=r.stage||'result';
  if(!r&&['result','unlock'].includes(view))view='ladder';
  if(!browsing&&!c.next(p)&&!r)view='complete';
  if(view==='bag')view='result';
  if(view==='unlock'&&r?.unlocked==null)view='result';
  screen=view;
  const displaying=r&&['unlock','result'].includes(view);
  const rung=displaying?r.rung:s.rung;
  const section=c.sections[Math.min(c.sections.length-1,Math.floor(rung/4))];
  const next=s.attempt||c.next(p);
  const ids=displaying?r.ids:next?.ids;
  const m={rung,browsing,confirmRetry,total:c.sections.length*4,rival:section.rival,theme:section.theme[language==='es'?1:0],fee:next?.fee||0,
   controlMode:p.controlMode,coins:p.coins,owned:p.owned,player:p.selected,partner:p.partner,partnerArt:ids?.[1],
   opponents:ids?.slice(2),attempt:!!s.attempt,retry:s.retry,
   result:r?{...r,score:r.forfeit?L('Forfeit','Abandono'):r.won?'4 – '+r.score:r.score+' – 4',opponents:r.ids.slice(2)}:null};
  return CampaignUI.render(view,m);
 }
 function entry(){
  if(starting)return;
  starting=true;
  try{
   const api=menu();
   if(!api.transaction(p=>{
    const s=core().state(p);
    if(s.result?.won)return false;
    const a=core().enter(p);if(!a)return false;
    if(!a.kit)a.kit=KitBags.start(p.kit);
    return true;
   })){show('ladder');return;}
   const a=core().state(api.profile).attempt;
   token=a.id;
   const anonymous=(id,title,abilityId=a.rival)=>({...roster[id],abilityId,name:title,short:title.toUpperCase(),clubTactic:a.tactic});
   const ids=[a.player,a.partner==null?anonymous(a.ids[1],L('Club partner','Compañero'),a.player):a.partner,
    a.featured?a.rival:anonymous(a.ids[2],L('Club rival','Rival del club')),anonymous(a.ids[3],L('Club rival','Rival del club'))];
   api.configure(ids,a.levels,'campaign',0);
   if(a.checkpoint)restore(a.checkpoint);
   else checkpoint();
  }finally{starting=false;}
 }
 function finishBag(){
  menu().transaction(p=>{core().clearResult(p);return true;});
  show('ladder');
 }
 function bag(){
  const api=menu(),r=core().state(api.profile).result;if(!r?.won)return;
  if(!api.profile.kit.pending.some(b=>b.attemptId===r.token)&&api.profile.kit.receipt?.attemptId!==r.token){finishBag();return;}
  api.locker(finishBag,r.token);
 }
 function action(key){
  const api=menu(),[op,id]=key.split(':'),s=core().state(api.profile);
  if(op==='map'&&core().sections.some(section=>section.rival===Number(id))){show('map-'+id,true);return;}
  if(op==='back'||(op==='ladder'&&api.screen==='campaign-team')){api.back(screen==='ladder'?'home':'campaign');return;}
  if(op==='current'){show('ladder');return;}
  if(op==='quick'){api.quick();return;}
  if(op==='collection'){api.show('collection');return;}
  if(op==='recover'){if(s.result&&!s.result.won)api.transaction(p=>{core().clearResult(p);return true;});api.launchRecovery();return;}
  if(op==='retry'){
   if(s.result&&!s.result.won)api.transaction(p=>{core().clearResult(p);return true;});
   entry();return;
  }
  if(op==='ladder'&&s.result&&!s.result.won)api.transaction(p=>{core().clearResult(p);return true;});
  if(['ladder','team'].includes(op)){show(op,op!=='ladder'||api.screen==='home');return;}
  if(op==='enter'){entry();return;}
  if(op==='partner'&&!s.attempt){
   api.transaction(p=>core().pair(p,p.selected,Number(id)<0?null:Number(id)));
   show('team');return;
  }
  if(!s.result)return;
  if(op==='unlock'){api.transaction(p=>{core().state(p).result.stage='unlock';return true;});show('unlock');return;}
  if(['keep','as-player','as-partner'].includes(op)){
   api.transaction(p=>{
    const r=core().state(p).result;if(!r||r.unlocked==null)return false;
    if(op==='as-player')core().pair(p,r.unlocked,p.partner===r.unlocked?null:p.partner);
    if(op==='as-partner')core().pair(p,p.selected,r.unlocked);
    r.stage='bag';return true;
   });
   bag();return;
  }
  if(op==='bag')bag();
 }
 // Checkpoint only at point boundaries and suspension, never inside the physics loop.
 function checkpoint(){
  if(!token||network?.active)return;
  const phase=state==='paused'?beforePause:state;
  if(!['serve','play','fault','let','point'].includes(phase))return;
  const copy={phase,clock,ball,score,hits,best,wait,serveAttempt,serveTimer,serverIndex,receiveLane,serveLane,
   energy,gameTurn,pointNumber,shotSerial,pointLog,stats,recap,teamAtNet,pointRemaining,afterPointAge,afterPointExit,lastResult,
   players:players.map(({appearance,...motion})=>motion)};
  menu().transaction(p=>{
   const a=core().state(p).attempt;if(a?.id!==token)return false;
   a.checkpoint=copy;return true;
  });
 }
 function restore(c){
  if(!Array.isArray(c.players)||c.players.length!==4||!c.ball||!Array.isArray(c.score))return;
  clock=c.clock;ball={...c.ball};score=[...c.score];hits=c.hits;best=c.best;wait=c.wait;
  serveAttempt=c.serveAttempt;serveTimer=c.serveTimer;serverIndex=c.serverIndex;receiveLane=c.receiveLane;serveLane=c.serveLane;
  energy=c.energy;gameTurn=c.gameTurn;pointNumber=c.pointNumber;shotSerial=c.shotSerial;pointLog=[...c.pointLog];
  stats={...c.stats};recap={...c.recap};teamAtNet=[...c.teamAtNet];lastResult=c.lastResult;
  players.forEach((p,i)=>Object.assign(p,c.players[i],{appearance:p.appearance}));state=c.phase;
  afterPointAge=c.afterPointAge;afterPointExit=c.afterPointExit;updateScore();updatePointLog();
  if(state==='point'&&lastResult){const r=lastResult;showPointResult(r.team,r.reason,r.result,r.previousScore,r.previousGames);}
  pointRemaining=c.pointRemaining;cancelShot();bounceKey='';bounceRefresh=0;acc=0;
 }
 function end(team){
  if(!token||network?.active)return false;
  const won=team===localTeam(),points=lastResult.previousScore[1-team];
  if(!menu().transaction(p=>!!core().settle(p,token,won,points)))return false;
  token=null;celebration=null;menu().endSession();show('result');menu().replaceRoute();return true;
 }
 function leave(){
  if(!token)return false;
  menu().transaction(p=>!!core().settle(p,token,false,score[localTeam()],{forfeit:true}));
  token=null;celebration=null;menu().endSession();show('result');menu().replaceRoute();return true;
 }
 addEventListener('pagehide',checkpoint);
 document.addEventListener?.('visibilitychange',()=>{if(document.hidden)checkpoint();});
 return {show,render,action,checkpoint,end,leave,continue(){show('result');return true;},get playing(){return !!token;}};
})();
