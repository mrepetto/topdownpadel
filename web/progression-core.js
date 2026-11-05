/* Device-local campaign, collection and coin economy. */
(()=>{'use strict';
const ROSTER_COUNT=18, STARTERS=[12];
const validId=id=>Number.isInteger(id)&&id>=0&&id<ROSTER_COUNT;
const modeOf=v=>v==='casual'?'casual':'competitive';
const integer=(n,min,max,fallback)=>Number.isSafeInteger(n)&&n>=min&&n<=max?n:fallback;
const uniqueIds=values=>Array.isArray(values)?[...new Set(values.filter(validId))]:[];
function shuffle(a,rng=Math.random){const q=[...a];for(let i=q.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[q[i],q[j]]=[q[j],q[i]];}return q;}
// Historical price bands only determine cosmetic pricing. Characters are earned in the campaign.
const ladder=[
 [11,0,[2,2,2,2]],[12,350,[3,2,3,4]],[10,650,[3,4,3,2]],[7,1000,[4,3,3,3]],
 [9,1500,[3,4,4,2]],[8,2200,[3,5,3,3]],[6,3200,[4,3,3,4]],[15,4500,[4,3,5,3]],
 [13,6200,[5,3,4,3]],[17,7200,[4,3,3,5]],[5,8500,[4,4,4,4]],[16,11500,[5,3,4,4]],[4,15000,[4,4,4,5]],
 [14,19500,[4,5,4,4]],[2,25000,[4,5,5,4]],[1,32000,[5,4,4,5]],[3,42000,[4,5,4,5]],[0,55000,[5,4,5,5]]
].map(([id,price,stats],rank)=>({id,price,stats,rank}));
const price=id=>ladder.find(x=>x.id===id)?.price??Infinity;
// Prices follow small ladder bands so cosmetic goals stay reachable independently of player stats.
const skinPrices=[[250,800,2000],[550,1500,3200],[900,2400,5000],[1250,3250,6500],[1650,4200,8500],[2100,5500,11000],[2600,6800,14000]];
function skinPrice(id,tier){
 const entry=ladder.find(row=>row.id===id);
 if(!entry||!Number.isInteger(tier)||tier<1||tier>3)return Infinity;
 const band=[350,650,2200,6200,15000,32000].filter(min=>entry.price>=min).length;
 return skinPrices[band][tier-1];
}
function hasSkin(p,id,tier){return tier===0?p.owned.includes(id):Number.isFinite(skinPrice(id,tier))&&!!p.skins[id]?.includes(tier);}
function buySkin(p,id,tier){
 const cost=skinPrice(id,tier);
 if(!Number.isFinite(cost))return 'locked';
 if(hasSkin(p,id,tier))return 'owned';
 if(p.coins<cost)return 'coins';
 p.coins-=cost;
 (p.skins[id]||=[]).push(tier);
 return null;
}
function equipSkin(p,id,tier){
 if(!p.owned.includes(id)||!hasSkin(p,id,tier))return false;
 p.equippedSkins[id]=tier;
 if(p.partner===id)p.partner=null;
 p.selected=id;
 return true;
}

const config={startingCoins:100,baseFee:10,sectionStep:3,featuredExtra:10,recoveryCoins:25,
 challengeRewards:{daily:40,weekly:100,streak:125}};
// Explicit roster, theme and featured difficulty. The three qualifiers ease up to each rival.
const sections=[
 [11,'Pass the net pair','Supera la red','net',2,6],
 [10,'Use the glass','Usa el cristal','walls',2,7],
 [9,'Win the diagonal','Domina la diagonal','diagonal',2,7],
 [8,'Find the gap','Busca el hueco','diagonal',2,8],
 [7,'Reset the rally','Reinicia el punto','lob',3,8],
 [6,'Change the rhythm','Cambia el ritmo','pace',3,9],
 [15,'Defend the corners','Defiende los rincones','walls',3,9],
 [5,'Read the lob','Lee el globo','lob',3,10],
 [16,'Break the pattern','Rompe el patrón','diagonal',4,10],
 [13,'Play the angles','Juega con los ángulos','diagonal',4,11],
 [4,'Counter from deep','Contraataca desde el fondo','walls',4,11],
 [17,'Cover the middle','Cubre el centro','net',4,12],
 [14,'Take the net','Gana la red','net',5,12],
 [3,'Attack the short ball','Ataca la bola corta','pace',5,13],
 [2,'Escape the corner','Sal del rincón','walls',5,13],
 [1,'Beat the volley','Supera la volea','net',6,14],
 [0,'Master the court','Domina la pista','pace',6,15]
].map(([rival,en,es,tactic,casual,competitive])=>({rival,theme:[en,es],tactic,casual,competitive}));
// Collection follows encounter order; preserve each character's established specialties.
const collectionOrder=[STARTERS[0],...sections.map(s=>s.rival)].map((id,rank)=>({...ladder.find(row=>row.id===id),rank}));
const total=sections.length*4;
const emptyTrack=()=>({rung:0,attempt:null,result:null,retry:false,serial:0});
const state=p=>p.campaigns[modeOf(p.controlMode)];
function fresh(){
 return {version:5,seed:Math.floor(Math.random()*4294967296),kit:globalThis.KitBags?.empty(),challenges:{pending:0,progress:{}},
  campaigns:{casual:emptyTrack(),competitive:emptyTrack()},controlMode:'casual',modeChosen:false,coins:config.startingCoins,
  cups:0,legacyHistory:{},owned:[...STARTERS],selected:12,partner:null,skins:{},equippedSkins:{},training:3};
}
function pair(p,player,partner){
 if(!p.owned.includes(player)||(partner!==null&&(!p.owned.includes(partner)||partner===player)))return false;
 p.selected=player;p.partner=partner;return true;
}
function switchMode(p,next){p.controlMode=modeOf(next);}
function next(p){
 const track=state(p),rung=track.rung,section=Math.floor(rung/4),row=sections[section];
 if(!row)return null;
 if(track.attempt)return track.attempt;
 const index=rung%4,featured=index===3;
 // Seed independent from attempt and time, so fees, reloads and retries cannot reroll opponents.
 let seed=(p.seed^Math.imul(rung+1,2654435761)^(p.controlMode==='casual'?0:10619863))>>>0;
 const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const pool=shuffle(ladder.map(r=>r.id).filter(id=>id!==row.rival),random);
 const opponents=featured?[row.rival,pool[0]]:pool.slice(0,2);
 const partnerArt=p.partner??pool.find(id=>id!==p.selected&&!opponents.includes(id));
 const floor=p.controlMode==='casual'?1:6,level=Math.max(floor,row[p.controlMode]-(index<2?1:0));
 const fee=config.baseFee+section*config.sectionStep+(featured?config.featuredExtra:0);
 return {rung,section,index,rival:row.rival,featured,tactic:row.tactic,theme:row.theme,fee,level,
  ids:[p.selected,partnerArt,...opponents],levels:[0,Math.max(floor,level-1),level,Math.max(floor,level-(featured?1:0))]};
}
function enter(p){
 const t=state(p);if(t.attempt)return t.attempt;
 const draw=next(p);if(!draw||p.coins<draw.fee)return null;
 p.coins-=draw.fee;t.result=null;t.serial++;
 t.attempt={...draw,id:p.controlMode+'-'+p.seed+'-'+t.rung+'-'+t.serial,player:p.selected,partner:p.partner,checkpoint:null};
 return t.attempt;
}
function settle(p,id,won,losingPoints,{forfeit=false}={}){
 const t=state(p),a=t.attempt;
 if(!a||a.id!==id||a.rung!==t.rung||typeof won!=='boolean'||won&&forfeit||
    !Number.isSafeInteger(losingPoints)||losingPoints<0||losingPoints>3)return null;
 const bagTier=won?3-losingPoints:null;
 let bagId=null,unlocked=null;
 if(won){
  const bag=globalThis.KitBags.awardCampaign(p.kit,bagTier,id);
  if(!bag)return null;
  bagId=bag.attemptId;
  if(a.featured&&!p.owned.includes(a.rival)){p.owned.push(a.rival);unlocked=a.rival;}
  t.rung++;
 }
 globalThis.Challenges?.result(p,'campaign',won);
 t.retry=!won;t.result={token:id,rung:a.rung,won,forfeit,unlocked,bagTier,bagId,player:a.player,partner:a.partner,ids:[...a.ids],score:losingPoints};
 t.attempt=null;return t.result;
}
function clearResult(p){state(p).result=null;}
const campaign={config,sections,total,state,next,pair,enter,settle,clearResult};
function attributes(id){const a=id===12?[2,2,2,2]:id===11?[3,2,3,3]:(ladder.find(x=>x.id===id)||ladder[0]).stats;return {technique:a[0],power:a[1],stamina:a[2],speed:a[3]};}
// Retain retired entry prices only for one-time refunds from the two legacy universes.
const legacyFees=[50,120,250,500,900,1500];
function migrateLegacy(p,old){
 const modes=['casual','competitive'],seen=new Set();let refunded=0;
 for(const mode of modes){
  const u=mode===p.controlMode?old:old.universes?.[mode];if(!u)continue;
  p.legacyHistory[mode]={cups:integer(u.cups,0,1e9,0),won:uniqueIds(u.won).filter(id=>id<6)};
  for(const [kind,run] of [['quick',u.quick],['club',u.active]]){
   if(!run||typeof run.id!=='string'||seen.has(kind+run.id))continue;
   seen.add(kind+run.id);
   const fee=legacyFees[run.club];
   refunded+=kind==='quick'?integer(run.stake,1,1500,0):!fee?0:
    modeOf(run.controlMode??mode)==='casual'?Math.max(10,Math.floor(fee*.25)):fee;
  }
 }
 p.coins+=refunded;p.migrationRefund=refunded;
}
function load(raw,now=Date.now()){
 try{
  const old=typeof raw==='string'?JSON.parse(raw):raw;
  if(!old||![1,2,3,4,5].includes(old.version))return fresh();
  const p=fresh();p.controlMode=old.version>=3?modeOf(old.controlMode):'competitive';
  p.modeChosen=old.modeChosen===true;p.training=integer(old.training,1,15,3);
  p.coins=integer(old.coins,0,1e9,0);p.cups=integer(old.cups,0,1e9,0);
  p.owned=uniqueIds([...STARTERS,...(old.version<5?[11]:[]),...uniqueIds(old.owned),...uniqueIds(old.purchased)]);
  if(p.owned.includes(old.selected))p.selected=old.selected;
  if(p.owned.includes(old.partner)&&p.selected!==old.partner)p.partner=old.partner;
  for(let id=0;id<ROSTER_COUNT;id++){
   if(Array.isArray(old.skins?.[id]))p.skins[id]=[...new Set(old.skins[id].filter(t=>Number.isFinite(skinPrice(id,t))))];
   const equipped=old.equippedSkins?.[id];
   if(hasSkin(p,id,equipped)&&p.owned.includes(id))p.equippedSkins[id]=equipped;
  }
  p.kit=globalThis.KitBags?.load(old.kit);p.challenges=globalThis.Challenges?.load(old.challenges,now)||p.challenges;
  if(old.version<5)migrateLegacy(p,old);
  else{
   p.seed=integer(old.seed,0,4294967295,p.seed);p.legacyHistory=old.legacyHistory||{};
   p.migrationRefund=integer(old.migrationRefund,0,1e9,0);
   for(const mode of ['casual','competitive']){
    const t=p.campaigns[mode],s=old.campaigns?.[mode];if(!s)continue;
    t.rung=integer(s.rung,0,total,0);t.serial=integer(s.serial,0,1e9,0);t.retry=s.retry===true;
    const a=s.attempt;if(a&&t.rung<total&&a.rung===t.rung&&typeof a.id==='string'&&Array.isArray(a.ids)&&a.ids.length===4&&a.ids.every(validId)&&Array.isArray(a.levels)&&a.levels.length===4)t.attempt={...a};
    const r=s.result;if(!t.attempt&&r&&typeof r.token==='string'&&typeof r.won==='boolean'&&r.rung===t.rung-(r.won?1:0))t.result={...r};
   }
  }
  return p;
 }catch{return fresh();}
}
// Keep physical court colors available to training callers, without the old club identities.
const clubs=[['Jade','Jade'],['Blue','Azul'],['Violet','Violeta'],['Clay','Arcilla'],['Slate','Pizarra'],['Rose','Rosa']].map(([en,es],id)=>({id,en,es}));
globalThis.Career={campaign,hasSkin,skinPrice,buySkin,equipSkin,switchMode,modeOf,ladder:collectionOrder,price,shuffle,ROSTER_COUNT,clubs,STARTERS,fresh,load,attributes,
 // Even stale menu handlers cannot debit stakes, buy players, refill or award coins.
 coinPacks:[],stakes:[],stakesFor:()=>[],claimPack:()=>0,refill:()=>false,startQuick:()=>'retired',enter:()=>'retired',settle:()=>null,settleQuick:()=>null};
})();
