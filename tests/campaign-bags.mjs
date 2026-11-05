import assert from 'node:assert/strict';
import '../web/skin-catalog.js';
import '../web/kit-bags.js';

assert.deepEqual(PadelSkins.bagWeights,{1:65,2:28,3:7});
assert.equal(Object.values(PadelSkins.bagWeights).reduce((a,b)=>a+b),100);
for(const [roll,tier] of [[0,1],[.6499,1],[.65,2],[.9299,2],[.93,3],[.9999,3]])
 assert.equal(PadelSkins.drawForBag({},()=>roll).tier,tier);
const p={coins:0,owned:[12],skins:{},kit:KitBags.empty()};
for(const source of ['win','entry','daily'])assert.equal(KitBags.award(p.kit,source),false);
assert.equal(p.kit.pending.length,0);
for(let i=0;i<55;i++){
 const key='run-'+i;
 assert(KitBags.awardCampaign(p.kit,3,key));
 assert(KitBags.open(p,()=>0));
 const {skin}=p.kit.receipt;assert(PadelSkins.get(skin.id,skin.tier));
 assert.equal(skin.repeat,i===54);
 assert(p.skins[skin.id].includes(skin.tier));
 assert(!KitBags.open(p));
 p.kit.receipt=null;p.kit=KitBags.load(JSON.parse(JSON.stringify(p.kit)));
 assert(!KitBags.awardCampaign(p.kit,3,key));
 assert.equal(p.coins,0);assert.deepEqual(p.owned,[12]);
}
assert.equal(Object.values(p.skins).flat().length,54);
const legacyBag={tier:3,coins:90,items:[15,31],source:'daily'};
const q={coins:5,owned:[12],skins:{},kit:KitBags.load({pending:[legacyBag]})};
assert(KitBags.open(q));
const qty=()=>Object.values(q.kit.inventory).reduce((a,b)=>a+b,0);
assert.equal(qty(),2);assert.equal(q.coins,5);
q.kit.receipt.step=1;
KitBags.awardCampaign(q.kit,1,'target');
assert(KitBags.prioritize(q.kit,'target'));
assert(KitBags.open(q));assert.equal(q.kit.receipt.attemptId,'target');
q.kit.receipt=null;q.kit=KitBags.load(q.kit);
assert(KitBags.open(q));assert.equal(q.kit.receipt.step,1);
assert.equal(qty(),4);assert.equal(Object.values(q.skins).flat().length,1);
console.log('PASS repeat-proof campaign awards, drop percentages, complete wardrobes, locked-character skins, no coins and interrupted reveal priority');

// Exercise the same actions as the dialog, in both languages, including a close
// mid-reveal. Each transaction reloads the profile just like the live menu.
globalThis.allMuted=true;
const blink=globalThis.setTimeout;
globalThis.setTimeout=fn=>{fn();};
try{
 for(const lang of ['en','es']){
  globalThis.language=lang;
  let user={coins:5,kit:KitBags.empty(),skins:{},owned:[12]};
  KitBags.awardCampaign(user.kit,3,'featured');
  const dlg={open:false,style:{setProperty(){}},classList:{add(){},remove(){}},
   querySelector:()=>({}),showModal(){this.open=true;},close(){this.open=false;}};
  globalThis.document={getElementById:()=>dlg};
  const press=action=>dlg.onclick({target:{closest:()=>({dataset:{kit:action}})}});
  const persist=fn=>{
   user={...user,kit:KitBags.load(user.kit)};
   return fn(user);
  };
  let collected=0;
  const launch=()=>KitBags.present(persist,()=>user,false,false,()=>collected++,'featured');
  launch();assert.match(dlg.innerHTML,/kit-bag-3/);
  press('advance');assert.match(dlg.innerHTML,/1 \/ 5/);assert(!dlg.innerHTML.includes('currency-coin'));
  press('advance');press('exit');launch();assert.match(dlg.innerHTML,/2 \/ 5/);
  press('advance');press('advance');press('advance');
  assert.match(dlg.innerHTML,/5 \/ 5/);assert.match(dlg.innerHTML,/skin-[^"]+\.webp/);
  assert.match(dlg.innerHTML,lang==='es'?/Nuevo aspecto/:/New skin/);
  press('advance');assert.equal(collected,1);assert(!dlg.open);
  assert.equal(user.coins,5);assert.equal(Object.values(user.skins).flat().length,1);
 }
}finally{globalThis.setTimeout=blink;}
console.log('PASS targeted bag dialog, EN/ES reveal, mid-opening reload and skin collection callback');
