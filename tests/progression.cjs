// Persist exactly as the client does, with the real bag and skin catalogs.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const box={console,Math,Date};vm.createContext(box);
for(const file of ['skin-catalog','kit-bags','progression-core','challenges']){
 vm.runInContext(fs.readFileSync('web/'+file+'.js','utf8'),box);
}
const C=box.Career,L=C.campaign;
const reload=p=>C.load(JSON.stringify(p));
const arr=a=>Array.from(a);
let p=C.fresh();
assert.deepEqual(arr(p.owned),[12]);assert.equal(p.coins,100);
assert.equal(L.next(p).rival,11);assert.equal(L.sections.at(-1).rival,0);
assert.equal(new Set([12,...L.sections.map(s=>s.rival)]).size,18);
assert.equal(L.total,68);assert.equal(p.partner,null);
assert(!L.pair(p,11,null));assert(!L.pair(p,12,12));
const first=L.next(p),attempt=L.enter(p);assert.equal(p.coins,90);
attempt.checkpoint={pointScore:[1,2]};p=reload(p);
assert.equal(L.enter(p).id,attempt.id);assert.deepEqual(arr(L.enter(p).checkpoint.pointScore),[1,2]);assert.equal(p.coins,90);
assert.equal(L.settle(p,'stale-token',true,0),null);
assert(L.settle(p,attempt.id,false,0,{forfeit:true}));assert.equal(p.kit.pending.length,0);
p=reload(p);assert.equal(L.state(p).rung,0);assert.equal(L.state(p).retry,true);
const retry=L.enter(p);assert.notEqual(retry.id,attempt.id);assert.equal(p.coins,80);
assert.deepEqual(arr(retry.ids),arr(first.ids));
for(let r=0;r<L.total;r++){
 const a=L.enter(p);assert.equal(a.rung,r);assert.equal(a.featured,r%4===3);
 if(r===4)assert.equal(a.partner,11);
 const before=p.coins,prev=p.owned.length,pts=r%4;
 const result=L.settle(p,a.id,true,pts);
 assert.equal(result.bagTier,3-pts);assert.equal(p.kit.pending[0].tier,3-pts);assert.equal(result.bagId,a.id);
 assert.equal(p.coins,before);assert.equal(L.state(p).rung,r+1);assert.equal(p.owned.length,prev+(a.featured?1:0));
 assert.equal(result.unlocked,a.featured?a.rival:null);
 p=reload(p);assert.equal(L.state(p).result.token,a.id);assert.equal(L.settle(p,a.id,true,pts),null);
 assert.equal(p.kit.pending.length,r+1);L.clearResult(p);
 if(r===3){assert(p.owned.includes(11));assert(L.pair(p,12,11));}
 p.coins=10000; // Isolate reachability from the recovery-drill tests.
}
assert.equal(L.next(p),null);assert.equal(L.enter(p),null);assert.equal(p.owned.length,18);
assert(L.pair(p,0,12));
C.switchMode(p,'competitive');assert.equal(L.state(p).rung,0);assert.equal(p.selected,0);
for(let i=0;i<4;i++){const a=L.enter(p);assert(a.level>=6&&a.level<=15);assert.equal(L.settle(p,a.id,true,3).unlocked,null);}
C.switchMode(p,'casual');assert.equal(L.state(p).rung,68);assert.equal(L.state(reload(p)).rung,68);
let poor=C.fresh();poor.coins=0;assert.equal(L.enter(poor),null);
const firstFee=L.next(poor).fee;L.state(poor).rung=67;const lastFee=L.next(poor).fee;
assert.equal(Math.ceil(firstFee/L.config.recoveryCoins),1);assert.equal(Math.ceil(lastFee/L.config.recoveryCoins),3);
assert.equal(lastFee,68);
const old=C.load({version:4,controlMode:'casual',coins:47,cups:83,won:[2],owned:[11,0],purchased:[16],selected:0,skins:{11:[2],7:[3]},equippedSkins:{11:2},active:{club:0,id:'run-A'},quick:{stake:25,id:'match-A'},universes:{competitive:{cups:19,quick:{id:'match-B',stake:200}}}});
assert.equal(old.coins,47+12+25+200);assert.equal(reload(old).coins,old.coins);
assert.deepEqual(arr(old.owned),[12,11,0,16]);assert.deepEqual(arr(old.legacyHistory.casual.won),[2]);assert.equal(old.legacyHistory.competitive.cups,19);assert.equal(L.state(old).rung,0);
assert(C.hasSkin(old,7,3));assert(!C.equipSkin(old,7,3));assert.equal(old.equippedSkins[11],2);
const wallet=old.coins;assert.equal(C.refill(old),false);assert.equal(C.claimPack(old,'vault'),0);
assert.equal(C.startQuick(old,10),'retired');assert.equal(C.enter(old,0),'retired');assert.equal(C.settleQuick(old,'match-A',true),null);assert.equal(old.coins,wallet);
assert.equal(C.load('{bad').version,5);
console.log('PASS 68 campaign rungs, all score tiers, reload/retry/forfeit, Cristian partner, both modes, legacy refund once, preserved cosmetics, retired payouts, recovery affordability');
