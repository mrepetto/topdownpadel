'use strict';
globalThis.KitBags=(()=>{
 const tiers=[['Common','Común','#90e6cc'],['Rare','Raro','#56b9ff'],['Epic','Épico','#bf8dff'],['Legendary','Legendario','#ffcb52']];
 const items=[['Water bottle','Botella de agua'],['Energy drink','Bebida energética'],['Protein bar','Barrita proteica'],['Padel racket','Pala de pádel']];
 const L=(en,es)=>language==='es'?es:en;
 const art=(type,id)=>'<img class="kit-art" alt="" src="/kit-'+type+'-'+id+'.webp">';
 const tabIcons={consumables:'M14 2 5 14h6l-1 8 9-13h-6z',rackets:'M7 16c-4-4-1-12 5-13 5-1 8 3 7 7-1 5-6 9-10 7l-5 5-2-2z',courts:'M2 4h20v16H2z M12 4v16 M5 7h14v10H5z',finishes:'m4 15 9-10 6 6-9 10H4z M14 4l2-2 6 6-2 2z'};
 const iconTab=key=>'<svg aria-hidden="true" viewBox="0 0 24 24"><path d="'+tabIcons[key]+'"/></svg>';
 const gifts=[null,['Grip wrap','Overgrip'],null,['Court dye','Tinte de pista'],['Racket finish','Acabado de pala']];
 const tier=id=>id<16?id>>2:Math.floor((id-16)/5);
 const kind=id=>id<16?id%4:4+(id-16)%5;
 const name=id=>L(...[...items,...gifts][kind(id)]);
 const stats=['speed','stamina','power',null,null,'technique',null];
 const statNames={speed:['speed','velocidad'],power:['power','potencia'],stamina:['stamina','resistencia'],technique:['technique','técnica']};
 const bonus=id=>(tier(id)+1)*.5;
 const rackets=[[.25,.25],[.75,.5],[.75,1.25],[1.5,1.75]];
 const buyPrice=id=>kind(id)===3?[900,2400,6000,14500][tier(id)]:[30,70,155,340][tier(id)];
 function buy(p,id){if(!valid(id)||(!stats[kind(id)]&&kind(id)!==3)||p.coins<buyPrice(id))return false;p.coins-=buyPrice(id);p.kit.inventory[id]=(p.kit.inventory[id]||0)+1;return true;}
 const valid=id=>Number.isInteger(id)&&id>=0&&id<36&&kind(id)!==4&&kind(id)!==6;
 // Retired boosts become the same stat and rarity on existing saves.
 const migrate=id=>kind(id)===4?17+5*tier(id):kind(id)===6?4*tier(id)+2:id;
 function toggle(s,id){
  if(!valid(id)||!s.inventory[id])return false;
  const slots=stats[kind(id)]?s.queued:s.gear,k=kind(id);
  if(slots[k]===id)delete slots[k];else slots[k]=id;
  return true;
 }
 // Obsolete buttons and older callers cannot exchange gear for coins.
 const sell=()=>false;
 function start(s){
  const boosts=Object.values(s.queued).filter(id=>s.inventory[id]);
  for(const id of boosts)if(--s.inventory[id]===0)delete s.inventory[id];
  s.queued={};return {boosts,gear:{...s.gear}};
 }
 const empty=()=>({day:'',entries:[],campaignWins:[],pending:[],inventory:{},queued:{},gear:{},receipt:null});
 function load(raw){
  const s=empty();if(!raw)return s;
  s.day=String(raw.day||'');s.entries=(Array.isArray(raw.entries)?raw.entries:[]).filter(x=>typeof x==='string').slice(-100);
  s.campaignWins=Array.isArray(raw.campaignWins)?[...new Set(raw.campaignWins.filter(id=>typeof id==='string'))]:[];
  const validBag=b=>b&&Number.isInteger(b.tier)&&tiers[b.tier]&&Array.isArray(b.items)&&b.items.length>0&&b.items.length<=4&&b.items.every(i=>Number.isInteger(i)&&i>=0&&i<36);
  function migrateBag(b,credited=false){
   const bag={tier:b.tier,source:b.source==='campaign'?'campaign':'legacy',items:b.items.map(migrate)};
   if(typeof b.attemptId==='string')bag.attemptId=b.attemptId;
   if(credited||b.credited===true)bag.credited=true;
   if(b.skin&&bag.tier===3&&globalThis.PadelSkins?.get(b.skin.id,b.skin.tier))
    bag.skin={id:b.skin.id,tier:b.skin.tier,repeat:b.skin.repeat===true};
   if(Number.isInteger(b.step)&&b.step>0)bag.step=Math.min(b.step,bag.items.length-1+(bag.skin?1:0));
   return bag;
  }
  s.pending=(Array.isArray(raw.pending)?raw.pending:[]).filter(validBag).map(b=>migrateBag(b));
  s.receipt=validBag(raw.receipt)?migrateBag(raw.receipt,true):null;
  for(let i=0;i<36;i++)if(Number.isSafeInteger(raw.inventory?.[i])&&raw.inventory[i]>0){const id=migrate(i);s.inventory[id]=(s.inventory[id]||0)+raw.inventory[i];}
  for(const slots of ["queued","gear"])for(const id of Object.values(raw[slots]||{}).filter(Number.isInteger).map(migrate))if(valid(id)&&s.inventory[id]&&(stats[kind(id)]?"queued":"gear")===slots)s[slots][kind(id)]=id;return s;
 }
 const award=()=>false; // Retired daily, online and wager payouts.
 function awardCampaign(s,tier,attemptId,rng=Math.random){
  if(!Number.isInteger(tier)||!tiers[tier]||typeof attemptId!=='string'||!attemptId||s.campaignWins.includes(attemptId))return false;
  const drops=Array.from({length:tier+1},(_,i)=>{const t=i===0?tier:Math.floor(rng()*(tier+1)),k=[0,1,2,3,5,7,8][Math.floor(rng()*7)];return k<4?4*t+k:16+t*5+k-4;});
  const bag={tier,source:'campaign',attemptId,items:drops};
  s.campaignWins.push(attemptId);s.pending.unshift(bag);return bag;
 }
 function prioritize(s,id){
  if(s.receipt?.attemptId===id||(!s.receipt&&s.pending[0]?.attemptId===id))return true;
  const at=s.pending.findIndex(b=>b.attemptId===id);
  if(at<0)return false;
  const [bag]=s.pending.splice(at,1);
  if(s.receipt){s.pending.unshift(s.receipt);s.receipt=null;}
  s.pending.unshift(bag);return true;
 }
 function open(p,rng=Math.random){
  const s=p.kit;if(s.receipt||!s.pending.length)return false;
  const b=s.pending.shift();
  if(!b.credited){
   if(b.tier===3){
    const skin=PadelSkins.drawForBag(p.skins,rng);
    if(!skin.repeat)(p.skins[skin.id]||=[]).push(skin.tier);
    b.skin=skin;
   }
   for(const i of b.items)s.inventory[i]=(s.inventory[i]||0)+1;
   b.credited=true;
  }
  s.receipt=b;return true;
 }
 const dropCount=b=>b.items.length+(b.skin?1:0);
 let busy=false;
 function soundFx(i,tier=0){if(allMuted||!sound)return;unlockAudio();if(!audio)return;if(i===0){noise(.24,.16,1900);tone(120,.3,.16,'sine',fxBus,0,52);}[0,1,2].forEach((n)=>tone(330*Math.pow(1.19,n+i+tier*.6),.18,.09,'triangle',fxBus,n*.055));}
 function present(persist,get,inventory=false,market=false,onCollected=null,attemptId=null){
  const dlg=document.getElementById('kit-room');if(!dlg||!dlg.showModal)return;
  if(attemptId&&!persist(p=>prioritize(p.kit,attemptId))){onCollected?.();return;}
  let tab=market?'rackets':'consumables';
  const draw=()=>{
   const s=get().kit,b=s.receipt||s.pending[0];if(!b){inventory=true;}
   const title=market?L('Club market','Mercado del club'):inventory?L('Inventory','Inventario'):L(tiers[b.tier][0],tiers[b.tier][1]);
   dlg.style.setProperty('--tier',inventory?'#d7ff58':tiers[b.tier][2]);let body='';
   if(inventory||market){
    const tabs=[['consumables','Boosts','Mejoras'],['rackets','Rackets','Palas'],['courts','Courts','Pistas'],['finishes','Finishes','Acabados']].slice(0,market?2:4);
    const ids=(market?Array.from({length:36},(_,i)=>i):Object.keys(s.inventory).map(Number)).filter(id=>tab==='rackets'?kind(id)===3:tab==='courts'?kind(id)===7:tab==='finishes'?kind(id)===8:stats[kind(id)]);
    body='<nav class="kit-tabs">'+tabs.map(([key,en,es])=>'<button data-kit="tab" data-tab="'+key+'" aria-pressed="'+(key===tab)+'">'+iconTab(key)+'<span>'+L(en,es)+'</span>'+'</button>').join('')+'</nav><div class="kit-grid">'+ids.map(id=>{
     const k=kind(id),t=tier(id),selected=s.queued[k]===id||s.gear[k]===id;
     let detail=stats[k]?'+'+bonus(id)+' '+L(...statNames[stats[k]])+' · '+L('1 match','1 partido'):L('Permanent','Permanente');
     if(k===3){const equipped=s.gear[3],baseline=equipped==null?[0,0]:rackets[tier(equipped)];detail=rackets[t].map((n,i)=>{const delta=n-baseline[i];return L(...statNames[i?'power':'technique'])+' +'+n+' ('+(delta>0?'+':'')+delta+')';}).join(' · ');}
     return '<article style="--tier:'+tiers[t][2]+'">'+art('item',id)+'<strong>'+name(id)+'</strong><small>'+L(...tiers[t].slice(0,2))+' ×'+(s.inventory[id]||0)+'</small><small>'+detail+'</small>'+(market?'<button data-kit="buy" data-id="'+id+'" '+(get().coins<buyPrice(id)?'disabled':'')+'>'+L('Buy','Comprar')+' <img class="kit-money" src="/currency-coin.webp" alt=""> '+buyPrice(id)+'</button>':'<button data-kit="toggle" data-id="'+id+'">'+(selected?L('✓ Selected','✓ Seleccionado'):stats[k]?L('Use next','Preparar'):L('Equip','Equipar'))+'</button>')+'</article>';
    }).join('')+(ids.length?'':'<p>'+L('Open a bag to find this gear.','Abre una bolsa para conseguir equipo.')+'</p>')+'</div>';
   }else if(s.receipt){
    const step=b.step||0,id=b.items[step],skin=step===b.items.length?b.skin:null;
    const t=skin?skin.tier:tier(id),look=skin?PadelSkins.get(skin.id,t):null;
    const athlete=skin?globalThis.characterForId?.(skin.id)?.name:null;
    dlg.style.setProperty('--tier',tiers[t][2]);
    const title=skin?look.name:name(id);
    const detail=skin?[L(...tiers[t].slice(0,2)),athlete,skin.repeat?L('Already owned','Ya en tu colección'):L('New skin','Nuevo aspecto')].filter(Boolean).join(' · '):L(...tiers[t].slice(0,2));
    body='<div class="kit-drop">'+Array.from({length:18+b.tier*9},(_,i)=>'<i class="kit-spark" style="--a:'+i*137.5+'deg;--dist:'+(65+i%7*24)+'px"></i>').join('')+(skin?'<img src="'+look.src+'" alt="">':art('item',id))+'<h2>'+title+'</h2><p>'+detail+' · '+(step+1)+' / '+dropCount(b)+'</p></div>';
   }else body='<div class="kit-satchel">'+art('bag',b.tier)+'</div><p>'+(b.source==='campaign'?L('Campaign victory','Victoria de campaña'):L('Equipment bag','Bolsa de equipo'))+'</p>';
   dlg.innerHTML='<section class="kit-stage '+(inventory||market?'kit-catalog':'')+'"><header><h1>'+title+'</h1>'+(inventory||market?'<b class="kit-balance"><img src="/currency-coin.webp" alt="">'+get().coins+'</b>':'')+'</header>'+body+'<footer>'+((inventory||market||s.receipt)?'<button data-kit="exit">'+L('Close','Cerrar')+'</button>':'')+(!inventory&&!market?'<button class="primary" data-kit="advance">'+(!s.receipt?L('Open bag','Abrir bolsa'):(b.step||0)<dropCount(b)-1?L('Reveal next','Revelar siguiente'):L('Collect','Recoger'))+'</button>':!market&&(s.pending.length||s.receipt)?'<button class="primary" data-kit="bags">'+L('Open bags','Abrir bolsos')+'</button>':'')+'</footer></section>';
  };
  dlg.onkeydown=e=>{if(e.key==='Escape')e.stopPropagation();};busy=false;draw();if(!dlg.open)dlg.showModal();
  dlg.onclick=e=>{const a=e.target.closest?.('[data-kit]')?.dataset.kit||(e.target.closest?.('.kit-satchel')?'advance':'');if(!a||busy)return;
   if(a==='tab'){tab=e.target.closest('[data-tab]').dataset.tab;draw();return;}
   if(a==='buy'||a==='toggle'){const id=Number(e.target.closest('[data-id]').dataset.id);persist(p=>a==='buy'?buy(p,id):toggle(p.kit,id));draw();return;}
   if(a==='exit'){dlg.close();return;}if(a==='bags')inventory=false;
   else{const s=get().kit;if(!s.receipt){if(!persist(p=>open(p)))return;soundFx(0,get().kit.receipt.tier);busy=true;
     dlg.querySelector('[data-kit="advance"]').disabled=true;globalThis.navigator?.vibrate?.([65,85,100,100,140,160,240]);dlg.classList.add('unzipping');setTimeout(()=>{dlg.classList.remove('unzipping');busy=false;if(dlg.open)draw();},2400);return;}
    else if((s.receipt.step||0)<dropCount(s.receipt)-1){
     if(!persist(p=>{const b=p.kit.receipt;if(!b||(b.step||0)>=dropCount(b)-1)return false;b.step=(b.step||0)+1;return true;}))return;
     const b=get().kit.receipt;soundFx(b.step,b.step===b.items.length?b.skin.tier:tier(b.items[b.step]));
    }
    else{if(!persist(p=>{p.kit.receipt=null;return true;}))return;if(onCollected||!get().kit.pending.length){dlg.close();onCollected?.();return;}}
   }draw();
  };
 }
 return {buy,buyPrice,rackets,empty,load,award,awardCampaign,prioritize,open,present,tier,kind,stats,bonus,start,toggle,sell,name,art,tiers};
})();
