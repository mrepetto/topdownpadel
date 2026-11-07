// Run the shipped menu scripts in page order. Click helpers require the button to
// be present in the rendered markup, and match outcomes use the game scorer.
const vm=require('node:vm'), fs=require('node:fs'), assert=require('node:assert/strict');
const KEY='topdownpadel-campaign-career-v1';
function boot(storage=new Map(),portrait=false,withHistory=false){
 const nodes=new Map(),handlers={},documentHandlers={},timers=[];let serial=0;
 function el(id){
  if(id==='dialog[open]')return [...nodes.values()].find(e=>e.open)||null;
  if(nodes.has(id))return nodes.get(id);
  const classes=new Set(),listeners={};
  const e={id:id.slice(1),value:'',dataset:{},innerHTML:'',textContent:'',children:[],listeners,
   style:{setProperty(){}},classList:{add:(...v)=>v.forEach(x=>classes.add(x)),remove:(...v)=>v.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)},
   setAttribute(){},getAttribute(){return null;},focus(){},remove(){},click(){this.onclick?.();},
   getBoundingClientRect:()=>portrait?{width:390,height:844}:{width:1280,height:720},getContext:()=>({setTransform(){}}),
   addEventListener:(n,f)=>listeners[n]=f,querySelectorAll:()=>[],querySelector:el,
   append(...children){children.forEach(child=>this.appendChild(child));},appendChild(child){this.children.push(child);nodes.set('#'+child.id,child);},
   insertAdjacentHTML(_,html){this.innerHTML=html+this.innerHTML;},show(){this.open=true;},showModal(){this.open=true;},close(){this.open=false;this.listeners.close?.();}};
  if(id==='.splash-video'){e.play=()=>Promise.resolve();e.pause=()=>{};}
  nodes.set(id,e);return e;
 }
 const box={assert,console,Math,Date,devicePixelRatio:1,performance,URLSearchParams,URL,location:{href:'https://example.test/'},
  setInterval(){},setTimeout(fn){timers.push(fn);return timers.length;},clearTimeout(){},
  document:{querySelector:el,querySelectorAll:()=>[],getElementById:id=>el('#'+id),createElement:()=>el('#created'+serial++),body:el('body'),addEventListener(name,fn){(documentHandlers[name]||=[]).push(fn);}},
  window:{},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
  addEventListener(name,fn){(handlers[name]||=[]).push(fn);},requestAnimationFrame(){return 1;},MutationObserver:class{observe(){}}};
 if(withHistory){
  const entries=[];let index=-1;
  const go=dir=>{const n=index+dir;if(n<0||n>=entries.length)return;index=n;for(const fn of handlers.popstate||[])fn({state:entries[index]});};
  box.history={get state(){return entries[index]||null;},replaceState(v){if(index<0)index=0;entries[index]=v;},
   pushState(v){entries.splice(++index,Infinity,v);},back:()=>go(-1),forward:()=>go(1)};
 }
 vm.createContext(box);
 const run=src=>vm.runInContext(src,box);
 for(const m of fs.readFileSync('web/index.html','utf8').matchAll(/<script src="([^"?]+)(?:\?[^"]*)?"><\/script>/g)){
  vm.runInContext(fs.readFileSync('web/'+m[1],'utf8'),box,{filename:m[1]});
 }
 run('unlockAudio=()=>{};sfx=()=>{};portraitMode='+portrait+';');
 const markup=()=>el('#meta-screen').innerHTML;
 function meta(v,requireVisible=true){
  if(requireVisible)assert(markup().includes('data-meta="'+v+'"'),'Missing '+v+' in '+markup().replace(/<[^>]+>/g,' ').slice(-500));
  const button={dataset:{meta:v}};
  el('#meta-screen').listeners.click({target:{closest:()=>button}});
 }
 function kit(v){
  const dlg=el('#kit-room');
  assert(dlg.open&&dlg.innerHTML.includes('data-kit="'+v+'"'),'Missing kit action '+v);
  dlg.onclick({target:{closest:()=>({dataset:{kit:v}})}});
  while(timers.length)timers.shift()();
 }
 const suspend=()=>{box.document.hidden=true;for(const fn of documentHandlers.visibilitychange||[])fn();for(const fn of handlers.pagehide||[])fn();};
 return {storage,run,meta,kit,el,markup,suspend,handlers,profile:()=>JSON.parse(storage.get(KEY)),box};
}
function landing(t){t.meta('home');t.meta('campaign:ladder');}
function enter(t){
 if(t.markup().includes('data-meta="campaign:retry"'))t.meta('campaign:retry');
 else t.meta('campaign:enter');
 if(t.run('state')==='point')t.run('continuePoint()');
 assert.equal(t.run('state'),'serve');
 assert.equal(t.run('matchGames'),1);
}
function point(t,team,reason='DOUBLE BOUNCE'){
 if(reason==='DOUBLE FAULT · NET')t.run("state='play';serveAttempt=2;ball.last="+(1-team)+";serveFault('NET');");
 else t.run("state='play';point("+team+','+JSON.stringify(reason)+');');
 if(t.run('state')==='point')t.run('continuePoint()');
}
function finish(t,winningTeam,losers){
 for(let i=0;i<losers;i++)point(t,1-winningTeam,i===0?'DOUBLE FAULT · NET':'DOUBLE BOUNCE');
 for(let i=0;i<4;i++)point(t,winningTeam);
 // The match scorer may show the winning pair before opening the campaign receipt.
 if(t.run('state')==='over')t.run('continuePoint()');
}
function collect(t){
 if(!t.el('#kit-room').open)t.meta('campaign:bag');
 for(let i=0;t.el('#kit-room').open&&i<8;i++)t.kit('advance');
 assert(!t.el('#kit-room').open,'bag did not close');
}
function state(t){return t.run('Career.campaign.state(CampaignMenu.profile)');}
const legacyKey='topdownpadel-career-v1';
const legacySave=boot().profile();
legacySave.coins=9900;
legacySave.owned.push(11);
legacySave.campaigns.casual.rung=12;
legacySave.campaigns.competitive.rung=8;
{
 const game=boot(new Map(),true);
 game.run("newMatch();state='play';globalThis.matchControlMode='casual'");
 const touch=(type,timeStamp,x,id=1)=>game.handlers[type].forEach(fn=>fn({type,timeStamp,clientX:x,clientY:150,pointerId:id,pointerType:'touch',target:{closest:()=>null},preventDefault(){}}));
 const tap=t=>{touch('pointerdown',t,100);touch('pointerup',t+65,102);};
 const drag=t=>{touch('pointerdown',t,100);touch('pointermove',t+30,150);touch('pointerup',t+60,180);};
 tap(100);assert.equal(game.run('pendingShot'),null);
 drag(300);assert.equal(game.run('pendingShot.lob'),true);
 drag(450);assert.equal(game.run('pendingShot.lob'),false);
 tap(600);drag(1500);assert.equal(game.run('pendingShot.lob'),false);
 touch('pointerdown',2000,100);touch('pointercancel',2030,100);
 drag(2100);assert.equal(game.run('pendingShot.lob'),false);
}
const browser=boot();
browser.meta('home');browser.meta('collection');browser.meta('inspect:0');browser.meta('campaign:map:0');
assert.equal(browser.run('CampaignMenu.screen'),'campaign-map-0');
assert.deepEqual([...browser.markup().matchAll(/class="cp-node">(\d+)</g)].map(match=>Number(match[1])),Array.from({length:68},(_,i)=>68-i));
assert.equal((browser.markup().match(/data-boss=/g)||[]).length,17);
assert.equal((browser.markup().match(/class="cp-ladder cp-locked"/g)||[]).length,16);
assert.match(browser.markup(),/data-boss="0"><span class="cp-node">68/);
browser.meta('campaign:current');
assert.equal(browser.run('CampaignMenu.screen'),'campaign');
assert.equal(browser.profile().coins,100);
let game=boot(new Map([[legacyKey,JSON.stringify(legacySave)]]));
assert.equal(game.profile().campaigns.casual.rung,0);
assert.equal(game.profile().campaigns.competitive.rung,0);
landing(game);
assert.equal(game.profile().coins,100);
assert.deepEqual(game.profile().owned,[12]);
assert.match(game.markup(),/Cristian/);
game.meta('campaign:team');assert.match(game.markup(),/Club partner/);game.meta('campaign:ladder');
for(let i=0;i<4;i++){
 const coins=game.profile().coins;
 enter(game);
 if(i<3)assert.equal(game.run("teamLabel(1)"),"Club Rivals");
 const entry=state(game).attempt;
 assert.equal(game.profile().coins,coins-entry.fee);
 if(i===0){
  point(game,0);
  game=boot(game.storage,true);landing(game);enter(game);
  assert.equal(state(game).attempt.id,entry.id);
  assert.equal(game.profile().coins,coins-entry.fee);
  assert.equal(game.run('score[0]'),1);
  for(let j=0;j<3;j++)point(game,0);
  if(game.run('state')==='over')game.run('continuePoint()');
 }else finish(game,0,i);
 assert.equal(state(game).rung,i+1);
 const result=state(game).result;
 assert.equal(result.bagTier,3-i);
 assert.equal(game.profile().kit.pending[0].tier,3-i);
 assert(game.markup().includes('/kit-bag-'+result.bagTier+'.webp'));
 if(i===3){
  assert(game.profile().owned.includes(11));
  game=boot(game.storage);landing(game);
  game.meta('campaign:unlock');assert.match(game.markup(),/joins your team/);
  game.meta('campaign:as-partner');assert.equal(game.profile().partner,11);
  game.kit('advance');
  const inventory=game.profile().kit.inventory,earnedSkins=game.profile().skins;
  game=boot(game.storage);landing(game);
  assert(!game.markup().includes('data-meta="campaign:unlock"'),'repeated unlock after interrupted reveal');
  game.meta('campaign:bag');assert.deepEqual(game.profile().kit.inventory,inventory);assert.deepEqual(game.profile().skins,earnedSkins);
 }
 collect(game);
}
enter(game);
assert.equal(game.run('players[1].appearance.id'),11);
assert(!game.run('players[1].human'));
console.log('PASS campaign UI through 3 club wins and Cristian golden point, all 4 bag tiers, paid resume and immediate partner in match five');
const originalOpponents=Array.from(state(game).attempt.ids).slice(2);
finish(game,1,2);
assert.equal(state(game).rung,4);assert.equal(game.profile().kit.pending.length,0);
const lossCoins=game.profile().coins;
assert.match(game.markup(),/Retry/);enter(game);
assert.equal(game.profile().coins,lossCoins-state(game).attempt.fee);
assert.deepEqual(Array.from(state(game).attempt.ids).slice(2),originalOpponents);
game.run('launchServe();tick(1/120);');
const suspended=game.run('JSON.stringify([score,ball.x,ball.y,ball.z,players[1].x])');
const paid=game.profile().coins,attemptId=state(game).attempt.id;
game.suspend();game=boot(game.storage);landing(game);game.meta('campaign:enter');
assert.equal(game.run('state'),'play');assert.equal(game.run('JSON.stringify([score,ball.x,ball.y,ball.z,players[1].x])'),suspended);
assert.equal(game.profile().coins,paid);assert.equal(state(game).attempt.id,attemptId);
console.log('PASS loss and paid retry keep opponent pair and rung; pagehide and foreground reopen preserve a live rally and its entry');

const zero=game.profile();zero.coins=0;zero.campaigns.casual.attempt=null;
const broke=boot(new Map([[KEY,JSON.stringify(zero)]]),true);
landing(broke);broke.meta('campaign:recover');assert(broke.run('Practice.active'));
broke.run(`
 for(let i=0;i<5000&&!Practice.isMenu();i++){
  const p=players[0];
  if(ball.last===1&&ball.bounces===1&&racketContact(p,ball))
   hit(p,false,.5,{targetX:670,targetY:375,mouse:true},'PERFECT');
  tick(1/120);
 }
`);
assert.equal(broke.profile().coins,25);
const practicePanel=broke.el('#practice-screen');
assert(practicePanel.innerHTML.includes('data-practice="challenge-exit"'));
practicePanel.listeners.click({target:{closest:()=>({dataset:{practice:'challenge-exit'}})}});
assert.equal(state(broke).rung,4);enter(broke);
assert.equal(broke.profile().coins,12);
console.log('PASS zero balance to two real machine returns, 25 coins, direct return and next 13-coin entry');

const past=boot(game.storage);
past.meta('home');past.meta('preferences');past.meta('controls');past.meta('choose-mode:competitive');
past.meta('nav-back:home');past.meta('campaign:ladder');
assert.equal(state(past).rung,0);assert.equal(past.profile().campaigns.casual.rung,4);
assert.deepEqual(past.profile().owned,[12,11]);assert.equal(past.profile().partner,11);
past.meta('campaign:back');past.meta('training-match');
const before=past.profile();
past.meta('training-next');
assert.equal(past.run('state'),'serve');finish(past,0,1);
assert.equal(past.profile().coins,before.coins);assert.deepEqual(past.profile().kit.pending,before.kit.pending);
assert.deepEqual(past.profile().campaigns,before.campaigns);
past.run('openMainMenu()');past.meta('online');assert(past.el('#multiplayer').open);
past.run("globalThis.onlineBagWin?.('online-test');");assert.deepEqual(past.profile().kit.pending,before.kit.pending);
console.log('PASS independent mode ladders, shared owned pair, free quick-play result and online reward exclusion');

const legacy={version:4,modeChosen:true,controlMode:'competitive',cups:32,coins:2000,owned:[11,9],purchased:[9],selected:9,
 skins:{9:[1]},equippedSkins:{9:1},quick:{id:'unsettled',stake:200,started:true},training:10,
 kit:{inventory:{1:3},pending:[{tier:0,items:[1],coins:20}]}};
let old=boot(new Map([[KEY,JSON.stringify(legacy)]]));old.meta('home');old.meta('collection');
assert.equal(old.profile().coins,2200);
assert(old.profile().owned.includes(9));assert.equal(old.profile().equippedSkins[9],1);assert.equal(old.profile().kit.inventory[1],3);
assert.equal(old.profile().kit.pending.length,1);
old.meta('inspect:13');assert.match(old.markup(),/Defeat Jeni|DEFEAT JENI/i);
old.meta('variant:1');old.meta('buy-skin:13');
assert(old.profile().skins[13].includes(1));assert(!old.profile().owned.includes(13));
const balance=old.profile().coins;
old=boot(old.storage);old.meta('home');old.meta('collection');old.meta('inspect:13');old.meta('variant:1');
assert.equal(old.profile().coins,balance);assert(old.profile().skins[13].includes(1));
assert(!old.markup().includes('data-meta="buy-skin:13"'));
old.run("setLanguage('es')");assert.match(old.markup(),/COLECCIÓN/);
const count=old.profile().kit.pending.length;
for(const retired of ['club:0','enter','play-round','wager-play','quick-forfeit','buy:500']){
 old.meta(retired,false);assert.equal(old.profile().coins,balance);assert.equal(old.profile().kit.pending.length,count);
}
console.log('PASS migrated paid entry refund once, locked-player skin purchase and reload, ES Collection, retired entry and reward actions');
const completeSeed=boot().profile();completeSeed.coins=8000;
const tour=boot(new Map([[KEY,JSON.stringify(completeSeed)]]));landing(tour);
for(let rung=0;rung<68;rung++){
 enter(tour);
 finish(tour,0,3);
 assert.equal(state(tour).rung,rung+1);
 if(rung%4===3){
  tour.meta('campaign:unlock');
  tour.meta(rung===67?'campaign:as-player':'campaign:keep');
 }
 collect(tour);
}
assert.equal(tour.profile().owned.length,18);assert.equal(tour.profile().selected,0);
assert.match(tour.markup(),/All rivals defeated/);
tour.meta('campaign:quick');tour.meta('training-next');
assert.equal(tour.run('players[humanPosition].appearance.id'),0);
console.log('PASS all 68 matches, 17 unique rivals recruited, completion screen and immediate free match as César');

const customization=boot();customization.meta('home');customization.meta('training-match');
const editor=customization.el('#training-editor');
customization.el('#training-random').onchange({target:{checked:false}});customization.meta('training-next');
assert(editor.innerHTML.includes('data-setup="next:0"'));
const control=value=>editor.onclick({target:{closest:()=>({dataset:{setup:value}})}});
control('next:0');control('position:1');
editor.onchange({target:{dataset:{level:'2'},value:'5'}});
editor.onchange({target:{dataset:{},hasAttribute:k=>k==='data-duration',value:'0'}});
customization.meta('train');
assert.equal(customization.run('defaultMatchGames'),0);assert.equal(customization.run('humanPosition'),1);
assert.equal(customization.run('new Set(players.map(p=>p.appearance.id)).size'),4);
assert.equal(customization.run('players[2].aiLevel'),5);
console.log('PASS custom free-match roster, position, individual AI difficulty and duration');
async function verifyForfeit(){
 const t=boot();landing(t);enter(t);
 t.run('togglePause()');t.el('#main-menu').onclick();
 assert(t.el('#leave-confirm').open);t.el('#leave-cancel').onclick();
 assert(state(t).attempt);assert.equal(t.profile().coins,90);
 t.el('#main-menu').onclick();await t.el('#leave-confirm-button').onclick();
 assert.equal(state(t).rung,0);assert.equal(state(t).attempt,null);
 assert.equal(t.profile().coins,90);assert.equal(t.profile().kit.pending.length,0);
 enter(t);assert.equal(t.profile().coins,80);
 console.log('PASS cancelled leave preserves attempt and confirmed forfeit requires a fresh paid retry');
}
verifyForfeit().catch(err=>{console.error(err);process.exitCode=1;});
const nav=boot(new Map(),false,true);nav.meta('home');nav.meta('collection');
nav.meta('inspect:13');nav.meta('refill');nav.meta('store');nav.meta('nav-back:home');
assert.equal(nav.run('CampaignMenu.screen'),'collection');
nav.box.history.back();assert.equal(nav.run('CampaignMenu.screen'),'home');
nav.box.history.forward();assert.equal(nav.run('CampaignMenu.screen'),'collection');assert.match(nav.markup(),/Jeni/);
nav.run('openMainMenu()');nav.meta('campaign:ladder');nav.meta('campaign:team');nav.box.history.back();
assert.equal(nav.run('CampaignMenu.screen'),'campaign');nav.meta('campaign:team');nav.meta('campaign:ladder');
assert.equal(nav.run('CampaignMenu.screen'),'campaign');nav.meta('campaign:back');
assert.equal(nav.run('CampaignMenu.screen'),'home');assert.equal(nav.profile().coins,100);
nav.meta('campaign:ladder');enter(nav);
nav.box.history.back();assert.equal(nav.run('state'),'paused');
assert.equal(nav.profile().coins,90);assert(state(nav).attempt);
console.log('PASS browser Back/Forward restores collection and Back in paid match pauses without forfeit');
const shop=boot(new Map(),false,true);shop.meta('home');shop.meta('store');
assert.equal(shop.run('CampaignMenu.screen'),'store');shop.meta('refill');shop.meta('store');shop.meta('refill');
const beforeOffer=JSON.stringify(shop.profile());shop.meta('offer');assert.equal(JSON.stringify(shop.profile()),beforeOffer);
shop.meta('nav-back:home');assert.equal(shop.run('CampaignMenu.screen'),'home');
shop.meta('collection');for(let i=0;i<8;i++)shop.meta('variant:1');assert.match(shop.markup(),/SKINS 1\/4/);assert(!shop.markup().includes('skin-mystery'));
shop.meta('nav-back:home');assert.equal(shop.run('CampaignMenu.screen'),'home');
shop.meta('store');shop.meta('store-item:0');assert.equal(shop.profile().coins,70);assert.equal(shop.profile().kit.inventory[0],1);
shop.meta('store-item:0');assert.equal(shop.profile().coins,40);assert.equal(shop.profile().kit.inventory[0],2);
console.log('PASS store tabs do not stack Back; preview offers never mutate balances; 4 skin variants; real coin item purchases persist');
const overlays=boot(new Map(),false,true);overlays.meta('home');overlays.meta('preferences');overlays.meta('rules');
assert(overlays.el('#rules').open);overlays.box.history.back();assert(!overlays.el('#rules').open);assert.equal(overlays.run('CampaignMenu.screen'),'preferences');
overlays.meta('settings');overlays.box.history.back();assert.equal(overlays.run('state'),'intro');assert.equal(overlays.run('CampaignMenu.screen'),'preferences');
overlays.meta('nav-back:home');assert.equal(overlays.run('CampaignMenu.screen'),'home');
overlays.meta('locker');overlays.box.history.back();assert(!overlays.el('#kit-room').open);assert.equal(overlays.run('CampaignMenu.screen'),'home');
console.log('PASS browser Back closes inventory, rules and settings before navigating their parent');
// An unaffordable item remains clickable and routes through a modal, without spending.
const funds=boot(new Map(),false,true);funds.meta('home');funds.meta('store');
const fundsBefore=JSON.stringify(funds.profile());funds.meta('store-item:3');
assert(funds.el('#coin-shortfall').open);assert.match(funds.el('#coin-shortfall').innerHTML,/800/);
assert.equal(JSON.stringify(funds.profile()),fundsBefore);
funds.box.history.back();assert(!funds.el('#coin-shortfall').open);assert.equal(funds.run('CampaignMenu.screen'),'store');
funds.meta('store-item:3');funds.el('#coin-shortfall').onclick({target:{closest:()=>({dataset:{funds:'store'}})}});
assert(!funds.el('#coin-shortfall').open);assert.equal(funds.run('CampaignMenu.screen'),'refill');
funds.meta('nav-back:home');assert.equal(funds.run('CampaignMenu.screen'),'store');
funds.meta('nav-back:home');assert.equal(funds.run('CampaignMenu.screen'),'home');
funds.meta('collection');funds.meta('variant:1');
const skinAction=funds.markup().match(/data-meta="(buy-skin:\d+)"/)[1];funds.meta(skinAction);
assert(funds.el('#coin-shortfall').open);assert.equal(JSON.stringify(funds.profile()),fundsBefore);
funds.el('#coin-shortfall').onclick({target:{closest:()=>({dataset:{funds:'back'}})}});
assert.equal(funds.run('CampaignMenu.screen'),'collection');assert(!funds.el('#coin-shortfall').open);
console.log('PASS insufficient coins popup, no spending, store redirect and single-step Back for items and skins');
