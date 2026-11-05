'use strict';
// Challenge rewards and campaign entry prices share the same economy configuration.
globalThis.Challenges=(()=>{
 const DAY=86400000, machines=['cones','zones','calls'];
 const recoveryId='return-rally';
 let cachedKey='',cachedBoard=[];
 function board(now=Date.now()){
  const day=Math.floor(now/DAY),week=Math.floor((day+3)/7);
  const config=Career.campaign.config,rewards=config.challengeRewards;
  if(day===cachedKey)return cachedBoard;
  function task(kind,weekly,slot,goal,reward){
   const period=weekly?week:day;
   const seed=(Math.imul(period+1,2654435761)^Math.imul(slot+11,2246822519)^(weekly?0x2e81aa79:0))>>>0;
   return {id:'v2-'+(weekly?'w':'d')+'-'+period+'-'+slot,kind,weekly,goal,reward,seed,
    expires:weekly?((week+1)*7-3)*DAY:(day+1)*DAY,machine:machines.includes(kind)};
  }
  const rows=machines.map((kind,i)=>task(kind,false,i,3+(day+i)%3,rewards.daily));
  rows.push(task('campaignWins',false,3,2,rewards.daily));
  rows.push(task(machines[week%3],true,0,9+week%5,rewards.weekly));
  rows.push(task('streak',true,1,3,rewards.streak));
  rows.push(task('campaignWins',true,2,5+week%3,rewards.weekly));
  rows.push({id:recoveryId,kind:'returns',repeatable:true,machine:true,weekly:false,goal:2,
   reward:config.recoveryCoins,seed:0,expires:Infinity});
  cachedKey=day;cachedBoard=rows;return rows;
 }
 const whole=(v,max)=>Number.isSafeInteger(v)&&v>=0?Math.min(max,v):0;
 function load(saved,now=Date.now()){
  const book={rotation:0,pending:whole(saved?.pending,1e9),progress:{}};
  for(const d of board(now)){
   const old=saved?.progress?.[d.id];if(!old)continue;
   const value=whole(old.value,d.goal);
   book.progress[d.id]={value:d.machine&&value!==d.goal?0:value,attempts:whole(old.attempts,Number.MAX_SAFE_INTEGER)};
  }
  return book;
 }
 function startRun(p,id,now=Date.now()){
  const book=p.challenges,d=board(now).find(row=>row.id===id&&row.machine);
  if(!d)return 0;
  const entry=book.progress[id]||{value:0,attempts:0};
  if(!d.repeatable&&entry.value===d.goal)return 0;
  entry.value=0;entry.attempts++;book.progress[id]=entry;return entry.attempts;
 }
 function finishRun(p,id,attempt,now=Date.now()){
  const book=p.challenges,d=board(now).find(row=>row.id===id&&row.machine),entry=book.progress[id];
  if(!d||!entry||entry.attempts!==attempt||entry.value===d.goal)return false;
  entry.value=d.goal;
  if(d.repeatable)p.coins+=d.reward;
  else book.pending+=d.reward;
  return true;
 }
 function result(p,kind,won,_court,now=Date.now()){
  if(kind!=='campaign')return;
  const book=p.challenges;
  for(const d of board(now)){
   if(d.machine)continue;
   const entry=book.progress[d.id]||{value:0,attempts:0};
   if(entry.value===d.goal)continue;
   if(won)entry.value++;
   else if(d.kind==='streak')entry.value=0;
   book.progress[d.id]=entry;
   if(entry.value===d.goal)book.pending+=d.reward;
  }
 }
 function claim(p){
  const coins=p.challenges.pending;
  p.challenges.pending=0;p.coins+=coins;return coins;
 }
 return {board,load,startRun,finishRun,result,claim,recoveryId};
})();
