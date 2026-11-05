import assert from 'node:assert/strict';
import '../web/skin-catalog.js';
import '../web/kit-bags.js';
import '../web/progression-core.js';
for(let tier=0;tier<4;tier++){
 let p={coins:7,kit:KitBags.empty(),skins:{}};
 const bag=KitBags.awardCampaign(p.kit,tier,'campaign-test-'+tier,()=>.4);
 assert.equal(bag.tier,tier);assert.equal(bag.items.length,tier+1);assert.equal(KitBags.tier(bag.items[0]),tier);
 assert(KitBags.open(p));assert.equal(p.coins,7);
 p.kit=KitBags.load(JSON.parse(JSON.stringify(p.kit)));assert(!KitBags.open(p));assert.equal(p.coins,7);
 assert.deepEqual(p.kit.receipt,bag);assert.equal(Object.values(p.kit.inventory).reduce((a,b)=>a+b,0),tier+1);
 assert.equal(!!bag.skin,tier===3);
}
console.log('PASS all four campaign bag tiers, no coins, legal gear, legendary skin, reload and double-open guard');

const p=Career.fresh();p.kit.inventory={32:2,35:1};
assert(KitBags.toggle(p.kit,32));assert(KitBags.toggle(p.kit,35));
const restored=KitBags.load(p.kit),match=KitBags.start(restored);
assert.deepEqual(match.boosts,[32]);assert.equal(match.gear[8],35);
assert.equal(restored.inventory[32],1);assert.deepEqual(KitBags.start(restored).boosts,[]);
assert(!KitBags.sell(p,35));assert.equal(p.kit.gear[8],35);assert(!KitBags.sell(p,35));

const shopper=Career.fresh();shopper.coins=2399;assert(!KitBags.buy(shopper,7));assert.equal(shopper.coins,2399);
shopper.coins=2400;assert(KitBags.buy(shopper,7));assert.equal(shopper.coins,0);assert(!KitBags.sell(shopper,7));assert.equal(shopper.coins,0);
console.log('PASS market coin balance, racket purchase, disabled resale and insufficient funds');
for(let t=0;t<4;t++){assert.equal(KitBags.stats[KitBags.kind(4*t)],'speed');assert.equal(KitBags.stats[KitBags.kind(4*t+1)],'stamina');assert.equal(KitBags.stats[KitBags.kind(4*t+2)],'power');assert.equal(KitBags.stats[KitBags.kind(17+t*5)],'technique');}

const legacy=KitBags.load({inventory:{31:2,32:1,33:3},queued:{4:31,6:33},pending:[{tier:3,coins:90,items:[31,33]}]});
assert.deepEqual(legacy.inventory,{32:3,14:3});
assert.deepEqual(legacy.pending[0].items,[32,14]);
assert.deepEqual(legacy.queued,{5:32,2:14});
assert.deepEqual(KitBags.load(legacy),legacy);
for (let slot=0;slot<7;slot++){
 const kit=KitBags.empty();
 KitBags.awardCampaign(kit,3,'test',()=>slot/7+.001);
 assert(kit.pending[0].items.every(id=>![4,6].includes(KitBags.kind(id))));
}
