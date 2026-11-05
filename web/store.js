'use strict';
// Money offers are display-only. Coin purchases use the shared saved-profile transaction.
globalThis.PadelStore=(()=>{
 const PERIOD=5*86400000,ANCHOR=Date.UTC(2026,0,1),HALLOWEEN_END=Date.parse('2026-12-01T00:00:00+01:00');
 const L=(en,es)=>language==='es'?es:en;
 const num=n=>n.toLocaleString(language==='es'?'es-ES':'en-US');
 const coin='<img class="store-coin" src="/currency-coin.webp" alt="">';
 const period=(now=Date.now())=>Math.floor((now-ANCHOR)/PERIOD);
 function rotation(now=Date.now()){
  let seed=(period(now)^0x725afe31)>>>0;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const ids=Career.ladder.map(r=>r.id);for(let i=ids.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
  return ids.slice(0,3).map((id,i)=>({id,tier:i+1,key:period(now)+'-'+id+'-'+(i+1),price:Career.skinPrice(id,i+1)}));
 }
 function buySkin(p,key,now=Date.now()){
  const offer=rotation(now).find(o=>o.key===key);if(!offer)return false;
  return Career.buySkin(p,offer.id,offer.tier)===null;
 }
 const exclusive=(name,alt='')=>'<img class="store-exclusive-art" src="/store-'+name+'.webp?v=gold2" alt="'+alt+'" loading="lazy">';
 const paid=(price,label=L('PREVIEW OFFER','VER OFERTA'))=>'<button class="primary store-paid" data-meta="offer"><span>'+label+'</span><strong>€'+price+'</strong></button>';
 const heading=(title,note='')=>'<div class="store-section-title"><h2>'+title+'</h2>'+(note?'<span>'+note+'</span>':'')+'</div>';
 function offerCountdown(now=Date.now()){
  const seconds=Math.max(0,Math.ceil((HALLOWEEN_END-now)/1000));if(!seconds)return null;
  const days=Math.floor(seconds/86400),pad=v=>String(v).padStart(2,'0');
  return (days?days+'d ':'')+pad(Math.floor(seconds/3600)%24)+':'+pad(Math.floor(seconds/60)%60)+':'+pad(seconds%60);
 }
 function render(p,refill=false,now=Date.now()){
  const tabs='<nav class="store-tabs" aria-label="'+L('Store sections','Secciones de tienda')+'"><button data-meta="store" aria-pressed="'+!refill+'">'+coin+L('COIN MARKET','MERCADO')+'</button><button data-meta="refill" aria-pressed="'+refill+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8h18v13H3zM2 4h20v5H2zM12 4v17M12 4C4-4 2 7 12 4c8-8 10 3 0 0"/></svg>'+L('COINS & OFFERS','MONEDAS Y PACKS')+'</button></nav>';
  let body='';
  if(!refill){
   const days=Math.ceil((ANCHOR+(period(now)+1)*PERIOD-now)/86400000);
   body+=heading(L('FEATURED SKINS','ASPECTOS DESTACADOS'),L('Refresh in ','Cambian en ')+days+'d');
   body+='<div class="store-skins">'+rotation(now).map(o=>{const r=roster[o.id],owned=Career.hasSkin(p,o.id,o.tier),skin=PadelSkins.get(o.id,o.tier);return '<article class="store-skin" style="--rarity:'+KitBags.tiers[o.tier][2]+'"><span class="store-rarity">'+L(...KitBags.tiers[o.tier].slice(0,2))+'</span><div class="store-skin-art">'+CharacterPortraits.side(r,o.tier)+'</div><h3>'+r.name+'</h3><p>'+skin.name+'</p>'+(!p.owned.includes(o.id)?'<small>'+L('Skin only · player locked','Solo aspecto · jugador bloqueado')+'</small>':'')+'<button class="primary" data-meta="store-skin:'+o.key+'" '+(owned?'disabled':'')+'>'+(owned?L('OWNED','EN COLECCIÓN'):coin+num(o.price))+'</button></article>';}).join('')+'</div>';
   for(const [kind,title] of [['rackets',L('RACKETS','PALAS')],['boosts',L('MATCH BOOSTS','MEJORAS DE PARTIDO')]]){
    body+=heading(title,kind==='boosts'?L('One match · equip in Inventory','Un partido · prepara en Inventario'):'');
    const ids=Array.from({length:36},(_,i)=>i).filter(i=>kind==='rackets'?KitBags.kind(i)===3:KitBags.stats[KitBags.kind(i)]);
    body+='<div class="store-items">'+ids.map(id=>{const t=KitBags.tier(id),k=KitBags.kind(id),stat=KitBags.stats[k],details=k===3?'+'+KitBags.rackets[t][0]+' '+L('Technique','Técnica')+' · +'+KitBags.rackets[t][1]+' '+L('Power','Potencia'):'+'+KitBags.bonus(id)+' '+({speed:L('Speed','Velocidad'),stamina:L('Stamina','Resistencia'),power:L('Power','Potencia'),technique:L('Technique','Técnica')}[stat]);return '<article style="--rarity:'+KitBags.tiers[t][2]+'"><span class="store-rarity">'+L(...KitBags.tiers[t].slice(0,2))+'</span>'+KitBags.art('item',id)+'<h3>'+KitBags.name(id)+'</h3><p>'+details+'</p><button class="primary" data-meta="store-item:'+id+'" >'+coin+num(KitBags.buyPrice(id))+'</button></article>';}).join('')+'</div>';
   }
  }else{
   body+='<p class="store-preview-note">'+L('COMING SOON · Purchases are not live','PRÓXIMAMENTE · Compras aún no disponibles')+'</p>';
   if(now<HALLOWEEN_END)body+='<article class="halloween-offer"><div><span class="store-rarity">HALLOWEEN · '+L('UNTIL NOV 30','HASTA EL 30 NOV')+'</span><h2>'+L('MIDNIGHT<br>DROP','BOTÍN DE<br>MEDIANOCHE')+'</h2><p>'+L('Epic bag + 2,500 coins','Bolsa épica + 2.500 monedas')+'</p><b class="offer-discount">−30% '+L('BUNDLE PRICE','PRECIO DEL PACK')+'</b><p class="offer-value">'+L('Planned bundle €9.99','Pack previsto €9,99')+'</p>'+paid('6.99')+'</div><div class="offer-art">'+exclusive('halloween',L('Halloween bag with gold coins','Bolsa de Halloween con monedas de oro'))+'</div></article>';
   body+=heading(L('BAG + COIN BUNDLES','PACKS DE BOLSA + MONEDAS'))+'<div class="store-bundles">';
   const bundles=[['STARTER','INICIO',500,'1.99'],['CHALLENGER','RETADOR',1500,'4.99'],['CHAMPION','CAMPEÓN',4000,'9.99'],['LEGEND','LEYENDA',10000,'19.99']];
   body+=bundles.map(([en,es,coins,price],i)=>'<article style="--rarity:'+KitBags.tiers[i][2]+'"><span class="store-rarity">'+L(en,es)+'</span><div class="bundle-art">'+exclusive('bundle-'+i)+'</div><h3>'+L(...KitBags.tiers[i].slice(0,2))+' '+L('bag','bolsa')+'</h3><strong class="bundle-coins">'+coin+' '+num(coins)+'</strong>'+paid(price)+'</article>').join('')+'</div>';
   body+=heading(L('COIN PACKS','PACKS DE MONEDAS'))+'<div class="store-bundles coin-packs">'+[[500,'0.99'],[3000,'4.99'],[7000,'9.99'],[16000,'19.99']].map(([amount,price],i)=>'<article style="--rarity:#ffd45f">'+exclusive('coins-'+i)+'<strong class="bundle-coins">'+coin+num(amount)+'</strong>'+paid(price)+'</article>').join('')+'</div>';
   body+=heading(L('BAGS','BOLSAS'))+'<div class="store-bundles">'+KitBags.tiers.map((t,i)=>'<article style="--rarity:'+t[2]+'"><span class="store-rarity">'+L(...t.slice(0,2))+'</span><div class="bag-only">'+exclusive('bag-'+i)+'</div>'+paid(['0.99','2.99','5.99','12.99'][i])+'</article>').join('')+'</div>';
  }
  return '<div class="game-store">'+tabs+'<div class="store-scroll">'+body+'</div></div>';
 }
 return {render,rotation,buySkin,period,HALLOWEEN_END,offerCountdown};
})();
