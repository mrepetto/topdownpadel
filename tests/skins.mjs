import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker from '../dist/server/index.js';
import '../web/skin-catalog.js';
import '../web/progression-core.js';
import '../web/character-portraits.js';

const p=Career.fresh(0),allNames=new Set();
const legacy=JSON.parse(JSON.stringify(p));
delete legacy.skins;
delete legacy.equippedSkins;
legacy.coins=731;
assert.equal(Career.load(legacy).coins,731);
assert.deepEqual(Career.load(legacy).skins,{});
globalThis.skinLoadout=id=>p.equippedSkins[id]||0;
for(const {id} of Career.ladder){
 const player={id,name:'Player'};
 assert(!PadelSkins.get(id,4));
 assert.equal(Career.buySkin(p,id,4),'locked');
 if(!p.owned.includes(id)){
  const price=Career.skinPrice(id,1);p.coins=price;
  assert.equal(Career.buySkin(p,id,1),null);
  assert.equal(Career.equipSkin(p,id,1),false);
  assert(Career.hasSkin(Career.load(JSON.stringify(p)),id,1));
  assert(!p.owned.includes(id));delete p.skins[id];p.owned.push(id);

 }
 const original=Career.attributes(id);
 let lastPrice=0;
 for(let t=1;t<=3;t++){
  const skin=PadelSkins.get(id,t),price=Career.skinPrice(id,t);
  assert(skin.name&&skin.motif&&/^#[0-9a-f]{6}$/i.test(skin.primary)&&/^#[0-9a-f]{6}$/i.test(skin.accent));
  assert(!allNames.has(skin.name),skin.name);allNames.add(skin.name);
  assert(price>lastPrice);lastPrice=price;
  p.coins=price-1;assert.equal(Career.buySkin(p,id,t),'coins');
  assert.equal(Career.equipSkin(p,id,t),false);
  p.coins=price;assert.equal(Career.buySkin(p,id,t),null);
  assert.equal(p.coins,0);assert.equal(Career.buySkin(p,id,t),'owned');
  assert.equal(Career.equipSkin(p,id,t),true);assert.equal(p.selected,id);
  assert(CharacterPortraits.side(player).includes(skin.src));
  assert(CharacterPortraits.head(player).includes(skin.thumb));
  assert(CharacterPortraits.thumbnail(player).includes(skin.thumb));
  assert(CharacterPortraits.side(player,0).includes('athlete-v3'));
  for(const path of [skin.src,skin.thumb]){
   const bytes=fs.readFileSync('web'+new URL(path,'https://padel.test').pathname);
   const res=await worker.fetch(new Request('https://padel.test'+path),{});
   assert.equal(res.status,200);assert.equal(res.headers.get('Content-Type'),'image/webp');
   assert(bytes.length>1000&&Buffer.from(await res.arrayBuffer()).equals(bytes),path);
  }
 }
 assert.deepEqual(Career.attributes(id),original);
}
assert.equal(allNames.size,54);
Career.switchMode(p,'competitive');
const loaded=Career.load(JSON.stringify(p));
assert.deepEqual(loaded.skins,p.skins);assert.deepEqual(loaded.equippedSkins,p.equippedSkins);
const corrupt=Career.load({...p,skins:{11:[-1,2,2,4,'3']},equippedSkins:{11:3}});
assert.deepEqual(corrupt.skins[11],[2]);assert(!corrupt.equippedSkins[11]);
console.log('PASS all 54 unique cosmetics, 108 served assets, prices, guards, stats, previews, persistent loadouts and old saves');
