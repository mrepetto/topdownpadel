'use strict';
(()=>{
 const KEY='topdownpadel-campaign-career-v1';let profile,screen='home',collectionFocus=12,mode='none',matchToken=null,toast='',saveError=false;let previewTier=0;let modeReturn='home';let trainingSetup,randomTraining=true;let homePreview=null;
 const root=document.createElement('section');root.id='meta-screen';root.className='hidden';$('#intro').appendChild(root);
 // Campaign saves have their own key so older tabs cannot restore pre-launch progress.
 const read=()=>{
  try{return Career.load(JSON.parse(localStorage.getItem(KEY)));}
  catch{return Career.fresh();}
 };
 profile=read();globalThis.skinLoadout=id=>profile.equippedSkins[id]||0;globalThis.preferredControlMode=profile.controlMode;
 function save(){
  try{localStorage.setItem(KEY,JSON.stringify(profile));}catch{saveError=true;return false;}
  saveError=false;return true;
 }
 function refresh(){if(!saveError)profile=read();globalThis.preferredControlMode=profile.controlMode;}
 const n=v=>Number(v).toLocaleString(language==='es'?'es-ES':'en-US');
 const icon=kind=>`<img class="currency-icon ${kind}-icon" src="/currency-${kind}.webp" alt="" aria-hidden="true">`;
 const btn=(action,label,primary=false,extra='')=>`<button data-meta="${action}" class="${primary?'primary':'meta-button'}" ${extra}>${label.replace(/↗️?/g,'<svg class="gui-arrow" aria-hidden="true" viewBox="0 0 20 20"><path d="M4 16 16 4M5 4h11v11"/></svg>')}</button>`;
 const back=(action='home')=>btn('nav-back:'+action,tx('‹ BACK','‹ VOLVER'));
 const modeLabel=m=>Career.modeOf(m)==='casual'?tx('CASUAL','CASUAL'):tx('COMPETITIVE','COMPETITIVO');
 const selectedMode=()=>profile.controlMode;
 const rosterName=r=>r.name==='Albert'?r.name+' #'+String(r.rank).padStart(2,'0'):r.name;


 const trainingSpeed=()=>{try{return clamp(Number(localStorage.getItem('padelmaster-training-speed'))||70,25,150);}catch{return 70;}};
 globalThis.trainingSpeed=trainingSpeed;
 const attrs=id=>Career.attributes(id);
 function bars(id,balanced=false){const a=balanced?{technique:3,power:3,stamina:3,speed:3}:attrs(id);return [['technique','TECHNIQUE','TÉCNICA'],['power','POWER','POTENCIA'],['stamina','STAMINA','RESISTENCIA'],['speed','SPEED','VELOCIDAD']].map(([k,en,es])=>`<div class="meta-stat"><span>${tx(en,es)}</span><div aria-label="${a[k]} / 5">${[1,2,3,4,5].map(i=>`<i class="${i<=a[k]?'on':''}"></i>`).join('')}</div></div>`).join('');}
 function kitTransaction(change){
  refresh();const before=JSON.stringify(profile);
  if(!change(profile))return false;
  if(save())return true;
  profile=Career.load(before);return false;
 }
 function locker(inventory=false){if(inventory)recordRoute(false,'overlay-kit');KitBags.present(kitTransaction,()=>profile,inventory);}
 function shell(title,subtitle,body,footer){root.innerHTML=`<header class="meta-header"><div><h1>${title}</h1><p>${subtitle}</p></div><div class="meta-wallet">${screen==='home'?btn('preferences','⚙',false,'aria-label="'+tx('Settings','Ajustes')+'" title="'+tx('Settings','Ajustes')+'"'): ''}<button data-meta="refill" aria-label="${tx('Coins and market','Monedas y mercado')}">${icon('coin')} ${n(profile.coins)}</button></div></header><div class="meta-content">${body}</div><footer class="meta-footer">${footer}<span class="meta-notice" role="status">${saveError?tx('Storage unavailable: progress cannot be saved.','Guardado no disponible: no se puede conservar el progreso.'):toast}</span></footer>`;}

 function purchaseBanner(item,heading=tx('PURCHASE COMPLETE','COMPRA COMPLETADA')){
  if(!document.createElement||!document.body.append)return;
  document.querySelector('.purchase-banner')?.remove();
  const banner=document.createElement('div');banner.className='purchase-banner';banner.setAttribute('role','status');
  const title=document.createElement('small');title.textContent=heading;
  const name=document.createElement('strong');name.textContent=item;banner.append(title,name);
  for(let i=0;i<14;i++){const spark=document.createElement('i');spark.style.setProperty('--angle',i*360/14+'deg');banner.append(spark);}
  document.body.append(banner);setTimeout(()=>banner.remove(),2400);
  if(sound&&!allMuted)[523,659,784].forEach((f,i)=>tone(f,.15,.09,'triangle',fxBus,i*.07));
 }
 // Insufficient funds is an actionable dialog, never a silent disabled purchase.
 const funds=document.createElement('dialog');funds.id='coin-shortfall';funds.setAttribute('aria-labelledby','coin-shortfall-title');funds.onkeydown=e=>{if(e.key==='Escape')e.stopPropagation();};document.body.append(funds);
 let fundsRouting=false;
 function insufficientCoins(cost){
  funds.innerHTML=`<section><img class="funds-art" src="/store-coins-0.webp?v=gold2" alt=""><h2 id="coin-shortfall-title">${tx('NOT ENOUGH COINS','FALTAN MONEDAS')}</h2><p>${tx('You need','Necesitas')} <strong>${n(Math.max(0,cost-profile.coins))}</strong> ${tx('more coins','monedas más')}</p><footer><button data-funds="back">${tx('BACK','VOLVER')}</button><button class="primary" data-funds="store">${tx('COIN STORE','TIENDA DE MONEDAS')}</button></footer></section>`;
  recordRoute(true);recordRoute(false,'overlay-coins');funds.showModal();
 }
 funds.addEventListener('close',()=>{if(!fundsRouting&&historyState()?.screen==='overlay-coins')globalThis.history.back();});
 funds.onclick=e=>{
  const action=e.target.closest?.('[data-funds]')?.dataset.funds;if(!action)return;
  if(action==='back'){funds.close();return;}
  fundsRouting=true;funds.close();fundsRouting=false;
  navigation.push({screen,collectionFocus,previewTier});show('refill',false);
 };
 function skinDetails(r,t){
  const id=r.id,owned=profile.owned.includes(id),equipped=profile.selected===id,hidden=t===4;
  const have=Career.hasSkin(profile,id,t),wearing=equipped&&have&&(profile.equippedSkins[id]||0)===t;
  const name=t===0?tx('Original','Original'):hidden?'???':PadelSkins.get(id,t).name;
  const rarity=[tx('COMMON','COMÚN'),tx('RARE','RARO'),tx('EPIC','ÉPICO'),tx('LEGENDARY','LEGENDARIO'),tx('UNIQUE','ÚNICO')][t];
  const cost=Career.skinPrice(id,t);
  let title,detail='',button='';
  if(hidden){
   title=tx('SECRET EDITION','EDICIÓN SECRETA');detail=tx('Its identity is still a mystery.','Su identidad sigue siendo un misterio.');
  }else if(!owned&&(t===0||have)){
   title=have&&t?tx('SKIN OWNED','ASPECTO EN TU COLECCIÓN'):tx('FEATURED RIVAL','RIVAL DESTACADO');
   detail=tx('Defeat '+rosterName(r)+' in Campaign.','Vence a '+rosterName(r)+' en Campaña.');
   button=btn('campaign:map:'+id,tx('VIEW IN CAMPAIGN','VER EN CAMPAÑA'),true);
  }else if(!have){
   title=tx('UNLOCK THIS LOOK','DESBLOQUEA ESTE ASPECTO');
   detail=owned?'':tx('Skin only. Defeat '+rosterName(r)+' in Campaign to play.','Solo el aspecto. Vence a '+rosterName(r)+' en Campaña para jugar.');
   if(profile.coins<cost)detail+=' '+tx('Need ','Faltan ')+n(cost-profile.coins)+' '+tx('more coins.','monedas.');
   button=btn('buy-skin:'+id,tx('UNLOCK SKIN','DESBLOQUEAR ASPECTO'),true);
  }else{
   title=wearing?tx('READY TO PLAY','LISTO PARA JUGAR'):tx('IN YOUR COLLECTION','EN TU COLECCIÓN');
   button=btn((t?'wear-skin:':'equip:')+id,wearing?tx('✓ EQUIPPED','✓ EQUIPADO'):tx('EQUIP ','EQUIPAR A ')+r.name+'',true,wearing?'disabled':'');
  }
  const price=!hidden&&t>0&&!have?`<div class="player-price">${icon('coin')}${n(cost)}</div>`:'';
  return {name,rarity,button,access:`<strong>${title}</strong>${price}<p>${detail}</p>`,status:hidden?tx('HIDDEN','OCULTO'):wearing?tx('EQUIPPED','EQUIPADO'):have?tx('OWNED','DISPONIBLE'):owned?tx('LOCKED SKIN','ASPECTO BLOQUEADO'):tx('LOCKED PLAYER','JUGADOR BLOQUEADO')};
 }
 let weeklyBoard=false,boardExpires=0,activeDrill=null,runHits=0,runAttempt=0,recoveryFromCampaign=false;
 const drillLabels={
  cones:['Cone strike','Derriba los conos','Knock down marked cones with the first bounce.','Derriba los conos marcados con el primer bote.'],
  zones:['Paint the court','Pinta la pista','Land the first bounce inside the marked zone.','Coloca el primer bote dentro de la zona marcada.'],
  calls:['Coach calls','A la orden','Play the requested shot. Aim for the zone when marked.','Ejecuta el golpe pedido. Si aparece una zona, apunta allí.'],
  returns:['Return rally','Peloteo libre','Land two returns anywhere in the opposite half. Earn coins every time.','Devuelve dos bolas dentro del campo rival. Gana monedas cada vez.'],
  streak:['Winning streak','En racha','Win consecutive Campaign matches.','Encadena victorias en la campaña.'],
  campaignWins:['Ladder wins','Victorias de campaña','Win Campaign matches before the challenge expires.','Gana partidos de campaña antes de que termine el desafío.']
 };
 const marks={
  cones:'<path d="M13 45 26 12h6l14 33z" fill="#f69b4f"/><path d="m20 29 3-8h12l3 8z" fill="#fff0c9"/><path d="M9 46h41" stroke="#ffa450" stroke-width="5"/>',
  zones:'<path d="M7 15h46v32H7z M30 15v32 M13 23h34v17H13z" fill="none" stroke="#74e1cf" stroke-width="2"/><circle cx="39" cy="30" r="7" fill="none" stroke="#d7ff52" stroke-width="3"/><circle cx="39" cy="30" r="2.5" fill="#d7ff52"/>',
  calls:'<path d="m11 23 22-8v26l-22-8z M19 34l4 12" fill="none" stroke="#bda8ff" stroke-width="4"/><path d="M40 19q10 8 0 18m5-23q16 13 0 28" fill="none" stroke="#dacdff" stroke-width="2.5"/>'
 };
 function timeRemaining(){
  const minutes=Math.max(1,Math.ceil((boardExpires-Date.now())/60000)),days=Math.floor(minutes/1440),hours=Math.floor(minutes%1440/60);
  return tx('REFRESH IN ','SE RENUEVA EN ')+(days?days+'d ':'')+(days||hours?hours+'h ':'')+(minutes%60)+'m';
 }
 const phoneUI=()=>document.body.classList.contains('portrait');
 const emblems={
  streak:'<path d="M34 9 15 33h12l-3 17 22-28H32z" fill="#ffd45f"/>',
  returns:'<path d="M13 23h27m-6-7 9 7-9 8M47 38H20m6 7-9-7 9-8" fill="none" stroke="#dbff61" stroke-width="4"/>',
  campaignWins:'<image href="/currency-cup.webp" x="10" y="10" width="40" height="40"/>',
  online:'<g fill="#b3a2ff"><circle cx="20" cy="23" r="7"/><circle cx="40" cy="23" r="7"/><path d="M8 43q0-22 24-9 4-6 11-5 10 2 10 14z"/></g>'
 };
 function challengeIcon(d){
  return `<svg class="event-emblem" viewBox="0 0 60 60" aria-hidden="true"><path d="M12 3h39l6 6-4 39-10 9H7l-4-6 3-40z" fill="#0c263b" stroke="#6299af" stroke-width="2"/><path d="m9 42 36-31h8l-5 34-8 7H9z" fill="#173d52"/><path d="M12 6h25L8 34z" fill="#35627b"/><path d="m9 48 32 1 9-8-2 7-7 6H9z" fill="#528092"/>${marks[d.kind]||emblems[d.kind]}<path class="emblem-glint" d="m48 4 1.5 4.5L54 10l-4.5 1.5L48 16l-1.5-4.5L42 10l4.5-1.5z" fill="#fff5ba"/></svg>`;
 }
 function challengeRail(){
  const rows=Challenges.board(Date.now(),profile.challenges.rotation);
  return `<section class="home-challenges"><h2><button data-meta="challenges">${tx('Challenges','Desafíos')}</button></h2><div>${rows.map(d=>`<button data-meta="brief:${d.id}">${challengeIcon(d)}<strong>${tx(...drillLabels[d.kind].slice(0,2))}</strong><small>${d.repeatable?tx('Always free','Siempre gratis'):d.weekly?tx('Weekly','Semanal'):tx('Daily','Diario')}</small></button>`).join('')}</div></section>`;
 }
 function challengeBoard(){
  const defs=Challenges.board(Date.now(),profile.challenges.rotation).filter(d=>!d.repeatable&&d.weekly===weeklyBoard);
  boardExpires=defs[0].expires;
  const cards=defs.map(d=>{
   const [en,es,hintEn,hintEs]=drillLabels[d.kind],value=profile.challenges.progress[d.id]?.value||0,done=value>=d.goal;
   const art=challengeIcon(d);
   return `<button class="challenge-card ${d.kind} ${done?'cleared':''}" data-meta="${'brief'}:${d.id}" ${done?'disabled':''}><span class="challenge-art">${art}</span><span class="challenge-copy"><small>${d.machine?tx('FREE ENTRY','ENTRADA GRATIS'):tx('CAMPAIGN','CAMPAÑA')}</small><strong>${tx(en,es)}</strong>${phoneUI()?'':'<span>'+tx(hintEn,hintEs)+'</span>'}</span><span class="challenge-reward">${icon('coin')} +${n(d.reward)}</span><span class="challenge-track"><i style="width:${value/d.goal*100}%"></i></span><b class="challenge-count">${done?'✓ ':''}${value} / ${d.goal}</b></button>`;
  }).join('');
  const pending=profile.challenges.pending;
  shell(tx('CHALLENGES','DESAFÍOS'),phoneUI()?'':tx('Finish challenges to collect coins. Machine drills are free to retry.','Completa desafíos para cobrar monedas. Los ejercicios tienen reintentos gratis.'),`<div class="challenge-board"><div class="challenge-tabs"><button data-meta="challenge-tab:day" aria-pressed="${!weeklyBoard}">${phoneUI()?tx('DAILY','DIARIOS'):tx('DAILY CHALLENGES','DESAFÍOS DIARIOS')}</button><button data-meta="challenge-tab:week" aria-pressed="${weeklyBoard}">${phoneUI()?tx('WEEKLY','SEMANALES'):tx('WEEKLY CHALLENGES','DESAFÍOS SEMANALES')}</button><span id="challenge-reset">${timeRemaining()}</span></div><div class="challenge-grid ${weeklyBoard?'week':''}">${cards}</div></div>`,back()+btn('brief:'+Challenges.recoveryId,tx('RETURN RALLY','PELOTEO LIBRE')+' · '+icon('coin')+' +'+n(Career.campaign.config.recoveryCoins))+(pending?btn('challenge-claim',icon('coin')+' '+n(pending)+' · '+tx('COLLECT','COBRAR'),true):''));
 }
 function launchChallenge(id,returnToLadder=false){
  refresh();const d=Challenges.board(Date.now(),profile.challenges.rotation).find(row=>row.id===id);
  if(!d||(!d.repeatable&&(profile.challenges.progress[id]?.value||0)>=d.goal)){render();return;}
  if(!d.machine){globalThis.CampaignMatch.show('ladder');return;}
  const before=JSON.stringify(profile);
  runAttempt=Challenges.startRun(profile,id);runHits=0;
  if(!runAttempt){render();return;}
  if(!save()){profile=Career.load(before);render();return;}
  recoveryFromCampaign=d.repeatable&&returnToLadder;mode='challenge';matchToken=null;activeDrill=id;globalThis.matchControlMode=profile.controlMode;globalThis.careerVenue=null;globalThis.quickSession=false;syncControlTheme(profile.controlMode);document.body.classList.toggle('casual-play',profile.controlMode==='casual');
  root.classList.add('hidden');if(historyState()?.screen!=='challenge-court')recordRoute(false,'challenge-court');Practice.openChallenge({...d,returnToLadder:recoveryFromCampaign},roster[profile.selected],0);
 }
 globalThis.startCampaignRecovery=()=>launchChallenge(Challenges.recoveryId,true);
 globalThis.retrySkillChallenge=()=>{if(mode==='challenge'&&activeDrill)launchChallenge(activeDrill,recoveryFromCampaign);};
 globalThis.challengeMachineHit=id=>{
  if(mode!=='challenge'||id!==activeDrill)return -1;
  refresh();const d=Challenges.board(Date.now(),profile.challenges.rotation).find(row=>row.id===id);
  if(!d||profile.challenges.progress[id]?.attempts!==runAttempt)return -1;
  if(++runHits<d.goal)return runHits;
  const before=JSON.stringify(profile);
  if(Challenges.finishRun(profile,id,runAttempt)&&save())return d.goal;
  profile=Career.load(before);return -1;
 };
 globalThis.openChallenges=()=>{
  const fromCourt=historyState()?.screen==='challenge-court';
  Practice.stop();activeDrill=null;mode='none';
  if(recoveryFromCampaign){recoveryFromCampaign=false;globalThis.CampaignMatch.show('ladder');return;}
  show('challenges',false);
  if(fromCourt&&historyState()?.depth>0)globalThis.history.back();
 };
 function collectChallenges(){
  const commit=()=>{
   refresh();const before=JSON.stringify(profile),amount=Challenges.claim(profile);
   if(amount){if(save())toast='+'+n(amount)+' '+tx('COINS','MONEDAS');else profile=Career.load(before);}
   render();
  };
  if(globalThis.navigator?.locks)navigator.locks.request(KEY,commit);else commit();
 }
 let storeEpoch=-1,storeSeason=false;
 function render(){
  storeEpoch=globalThis.PadelStore?.period();storeSeason=Date.now()<globalThis.PadelStore?.HALLOWEEN_END;
  root.dataset.view=screen;
  syncControlTheme(selectedMode());
  if(screen==='campaign'||screen.startsWith('campaign-')){
   const previousStage=root.querySelector?.('.cp-view-ladder .cp-stage');
   const offset=previousStage?.dataset.route===screen?previousStage.scrollTop:null;
   root.innerHTML=CampaignMatch.render(screen==='campaign'?'ladder':screen.slice(9),profile);
   const stage=root.querySelector?.('.cp-view-ladder .cp-stage');
   if(stage){
    stage.dataset.route=screen;
    if(offset!=null)stage.scrollTop=offset;
    else{
     const target=screen.startsWith('campaign-map-')?'[data-boss="'+screen.slice(13)+'"]':'[aria-current="step"]';
     stage.querySelector?.(target)?.scrollIntoView?.({block:screen.startsWith('campaign-map-')?'center':'end'});
    }
   }
  }else if(screen==='splash'){
   root.innerHTML=`<div class="splash-content"><img class="splash-logo" src="/menu-logo-single-trail.webp" alt="Top Down Padel"><h1 class="splash-headline">${tx('OWN THE<br><em>COURT!</em>','¡DOMINA<br><em>LA PISTA!</em>')}</h1><p class="splash-tagline">${tx('Easy to play, hard to master','Fácil de jugar, difícil de dominar')}</p>${btn('home',tx('CONTINUE','CONTINUAR'),true)}<div class="splash-developer"><span>${tx('Developed by','Desarrollado por')} <strong>KorposConsulting</strong></span><a href="https://korposconsulting.com" target="_blank" rel="noopener noreferrer">korposconsulting.com</a></div></div>`;
  }else if(screen==='credits'){
   root.innerHTML=`<header class="meta-header"><div><h1>${tx('CREDITS','CRÉDITOS')}</h1><p>TOP DOWN PADEL</p></div></header><div class="meta-content credits-content"><section><span class="credits-label">KORPOS STUDIOS</span><h2>Martín &amp; Max</h2><p>${tx('Developed by Martín and Max, game development veterans and founders of Korpos Studios, using AI-assisted development.','Desarrollado por Martín y Max, veteranos del desarrollo de videojuegos y fundadores de Korpos Studios, mediante desarrollo asistido por IA.')}</p><p class="credits-signature">${tx('Developed by','Desarrollado por')} <strong>KorposConsulting</strong><br><a href="https://korposconsulting.com" target="_blank" rel="noopener noreferrer">korposconsulting.com</a></p></section><section><span class="credits-label">${tx('TECHNOLOGY','TECNOLOGÍA')}</span><h2>${tx('Behind the game','Detrás del juego')}</h2><dl><dt>JavaScript · HTML · CSS</dt><dd>${tx('Game logic, menus and responsive interface.','Lógica del juego, menús e interfaz adaptable.')}</dd><dt>Canvas 2D</dt><dd>${tx('Court, characters, animation and visual effects.','Pista, personajes, animaciones y efectos visuales.')}</dd><dt>Web Audio API</dt><dd>${tx('Procedural sound effects and adaptive music.','Efectos sonoros procedurales y música adaptativa.')}</dd><dt>Cloudflare Workers · D1</dt><dd>${tx('Online services and multiplayer room state.','Servicios online y estado de salas multijugador.')}</dd><dt>Node.js · localStorage</dt><dd>${tx('Build and automated tests; progress saved on your device.','Compilación y pruebas automatizadas; progreso guardado en tu dispositivo.')}</dd></dl></section></div><footer class="meta-footer">${back()}</footer>`;
  }else if(screen==='controls'){
   shell(tx('HOW DO YOU WANT TO PLAY?','¿CÓMO QUIERES JUGAR?'),tx('Same shots. Two ways to own the court.','Los mismos golpes. Dos formas de dominar la pista.'),`<div class="control-mode-grid"><article class="control-mode-card casual"><span>${tx('START HERE','EMPIEZA AQUÍ')}</span><h2>CASUAL</h2><div class="mode-demo" aria-hidden="true">◉ <i>→ →</i> ◌</div><h3>${tx('YOU SWIPE. YOUR PLAYER MOVES.','TÚ DESLIZAS. TU JUGADOR SE MUEVE.')}</h3><p>${tx('Automatic positioning. You still aim, shape and time every shot. Hold Shift to boost automatic movement. The bar above your player shows stamina; release to recover. Speed and stamina stats help you reach the ball.','Posicionamiento automático. Tú apuntas, das efecto y eliges cuándo soltar. Mantén Shift para acelerar. La barra sobre tu jugador muestra la resistencia; suelta para recuperarla. La velocidad e resistencia ayudan a llegar a la bola.')}</p><ul><li>${tx('AI 1–6 · Learn the shots','IA 1–6 · Aprende los golpes')}</li></ul>${btn('choose-mode:casual',tx('PLAY CASUAL','JUGAR CASUAL'),true)}</article><article class="control-mode-card competitive"><span>${tx('THE NEXT CHALLENGE','EL SIGUIENTE DESAFÍO')}</span><h2>${tx('COMPETITIVE','COMPETITIVO')}</h2><div class="mode-demo" aria-hidden="true">W A S D <i>＋</i></div><h3>${tx('YOUR MOVEMENT. YOUR SHOT.','TÚ TE MUEVES. TÚ GOLPEAS.')}</h3><span class="phone-only">${tx('Steer in the lower left. Swipe to shoot.','Muévete abajo a la izquierda. Desliza para golpear.')}</span><p>${tx('Move with WASD, the left stick or touch joystick. Swipe to shoot. Win the net yourself against much stronger opponents.','Muévete con WASD, stick izquierdo o joystick táctil. Desliza para golpear. Gana la red por tu cuenta ante rivales mucho más fuertes.')}</p><ul><li>${tx('AI 6–15 · Elite opponents at the top','IA 6–15 · Rivales de élite al máximo')}</li></ul>${btn('choose-mode:competitive',tx('PLAY COMPETITIVE','JUGAR COMPETITIVO'),true)}</article></div>`,`${back()}<span class="mode-footnote">${tx('Two separate journeys. Shared coins and collection.','Dos rutas independientes. Monedas y colección compartidas.')}</span>`);
  }else if(screen==='home'){
   const id=homePreview??profile.selected,r=roster[id],owned=profile.owned.includes(id);
   const action=owned?(id===profile.selected?'':btn('home-equip:'+id,tx('SELECT','ELEGIR'))):btn('home-portrait:'+id,tx('VIEW RIVAL','VER RIVAL'));
   shell('','',`<div class="lobby-scene"><img class="lobby-background" src="/menu-abstract-background.webp" alt=""><div class="lobby-shade"></div></div>
   <div class="home-store"><button class="floating-store" data-meta="store" aria-label="${tx('Store','Tienda')}"><img src="/store-proshop-icon.webp?v=1" alt=""><strong>${tx('STORE','TIENDA')}</strong></button><button class="home-offer ${PadelStore.offerCountdown()?'':'hidden'}" id="home-store-offer" data-meta="refill" aria-label="${tx('View special offer','Ver oferta especial')}"><span>${tx('SPECIAL OFFER','OFERTA ESPECIAL')}</span><span>${tx('ENDS IN','TERMINA EN')}</span><strong id="home-offer-countdown">${PadelStore.offerCountdown()||''}</strong></button></div><div class="hero-home"><div class="athlete-stage">${btn('home-cycle:-1','‹',false,'aria-label="'+tx('Previous player','Jugador anterior')+'"')}<button class="home-athlete" data-meta="home-portrait:${id}" aria-label="${tx('Open collection','Abrir colección')} · ${r.name}">${CharacterPortraits.side(r,profile.equippedSkins[id]||0)}</button>${btn('home-cycle:1','›',false,'aria-label="'+tx('Next player','Jugador siguiente')+'"')}</div><div class="home-picker"><div><strong>${r.name}</strong>${action}</div></div>
   <nav class="home-play" aria-label="${tx('Main menu','Menú principal')}">${challengeRail()}${btn('campaign:ladder',tx('PLAY CAMPAIGN','JUGAR CAMPAÑA'),true)}${btn('training-match',tx('QUICK PLAY','PARTIDA RÁPIDA'))}${btn('online',tx('ONLINE PLAY','JUGAR ONLINE'))}${btn('collection',tx('COLLECTION','COLECCIÓN'))}${btn('training','TUTORIAL')}${btn('locker',tx('INVENTORY','INVENTARIO'))}</nav></div>`,'');
  }else if(screen==='store'||screen==='refill'){
   shell(tx('STORE','TIENDA'),'',PadelStore.render(profile,screen==='refill'),back());
  }else if(screen==='preferences'){
   shell(tx('SETTINGS','AJUSTES'),'',`<div class="preferences-list">${btn('controls',tx('PLAY STYLE','MODO DE JUEGO')+' · '+modeLabel(selectedMode()))}${btn('settings',tx('MATCH, CONTROLS & SOUND','PARTIDO, CONTROLES Y SONIDO'))}${btn('language',tx('LANGUAGE · ENGLISH','IDIOMA · ESPAÑOL'))}${btn('rules',tx('HOW TO PLAY','CÓMO JUGAR'))}${btn('credits',tx('CREDITS','CRÉDITOS'))}</div>`,back());
  }else if(screen==='collection'){
   const rosterOffset=root.querySelector?.('.collection-grid')?.scrollLeft||0;
   const r=roster[collectionFocus]||roster[profile.selected],art=CharacterPortraits.identity(r),skin=skinDetails(r,previewTier);
   const arrow=(step,label)=>`<button class="variant-arrow ${step<0?'prev':'next'}" data-meta="variant:${step}" aria-label="${label}">${step<0?'‹':'›'}</button>`;
   const figure=previewTier===4?`<div class="skin-mystery" aria-hidden="true">?</div>`:CharacterPortraits.side(r,previewTier);
   shell(tx('COLLECTION','COLECCIÓN'),tx('Choose a player. Find your look.','Elige un jugador y su aspecto.'),`<div class="collection-stage" style="--accent:${art.color}"><section class="collection-roster"><div class="collection-legend"><strong>${tx('PLAYERS','JUGADORES')} · ${profile.owned.length}/${roster.length}</strong></div><div class="collection-grid">${Career.ladder.map(({id},rank)=>{const p=roster[id],have=profile.owned.includes(id),active=profile.selected===id;return `<button data-meta="inspect:${id}" class="collection-tile ${have?'owned':'locked'} ${active?'equipped':''} ${r.id===id?'focused':''}" style="grid-column:${Math.floor(rank/6)*3+rank%3+1};grid-row:${Math.floor(rank%6/3)+1};--tile:${CharacterPortraits.identity(p).color}" aria-pressed="${r.id===id}" aria-label="${p.name} · ${active?tx('Equipped','Equipado'):have?tx('Owned','Disponible'):tx('Locked','Bloqueado')}"><span class="collection-thumb">${CharacterPortraits.thumbnail(p)}</span><span class="collection-tile-name">${rosterName(p)}</span><span class="collection-ownership">${active?'◆':have?'✓':String(rank+1).padStart(2,'0')}</span><span class="collection-price">${have?'✓':''}</span></button>`;}).join('')}</div></section><section class="collection-showcase"><div class="collection-art-backplate"></div><span class="collection-watermark" aria-hidden="true">${r.name}</span><div class="collection-full-art skin-preview">${figure}</div><div class="skin-selector">${arrow(-1,tx('Previous skin','Aspecto anterior'))}<b>${tx('SKINS','ASPECTOS')} ${previewTier+1}/4</b>${arrow(1,tx('Next skin','Aspecto siguiente'))}</div><span class="collection-edition skin-edition tier-${previewTier}" aria-live="polite">${skin.name} · ${skin.rarity}</span></section><section class="collection-info"><span class="collection-status">${skin.status}</span><h2>${rosterName(r)}</h2><h3>${r.id===Career.STARTERS[0]?tx('BALANCED STARTER','INICIAL EQUILIBRADO'):tx(art.en,art.es)}</h3><div class="collection-stats">${bars(r.id)}</div><div class="collection-access">${skin.access}</div></section></div>`,`${back()}${skin.button}`);
   const grid=root.querySelector?.('.collection-grid');if(grid)grid.scrollLeft=rosterOffset;
  }else if(screen.startsWith('brief-')){
   const d=Challenges.board(Date.now(),profile.challenges.rotation).find(row=>'brief-'+row.id===screen);
   if(!d){show('challenges',false);return;}
   const [en,es,hen,hes]=drillLabels[d.kind],progress=profile.challenges.progress[d.id]||{};
   const played=d.repeatable?0:progress.value||0;
   const label=d.repeatable?tx('Always available','Siempre disponible'):d.weekly?tx('Weekly challenge','Desafío semanal'):tx('Daily challenge','Desafío diario');
   shell(tx(en,es),label,`<section class="challenge-brief"><div class="challenge-marquee">${challengeIcon(d)}</div><h2>${tx(hen,hes)}</h2><div class="brief-goal"><strong>${played} / ${d.goal}</strong><span>${tx('TARGET','OBJETIVO')}</span></div><div class="brief-prize">${icon('coin')}<strong>+${n(d.reward)}</strong><span>${tx('COINS','MONEDAS')}</span></div>${d.machine?'<p>'+tx('Free entry and retries','Entrada y reintentos gratis')+'</p>':''}</section>`,back()+(played<d.goal?btn('challenge-play:'+d.id,tx('PLAY','JUGAR'),true):btn('challenges',tx('REWARDS','PREMIOS'),true)));
  }else if(screen==='challenges'){challengeBoard();
  }else if(screen==='training'){
   const cards=[['tutorial',tx('GUIDED LESSONS','LECCIONES GUIADAS'),tx('Watch a shot, then try it.','Mira un golpe y luego inténtalo.')],
    ['free',tx('FREE PRACTICE','PRÁCTICA LIBRE'),tx('Unlimited feeds from the ball machine.','Bolas ilimitadas de la máquina.')],
    ['training-match',tx('TRAINING MATCH','PARTIDO DE ENTRENAMIENTO'),tx('Choose your teams and match settings.','Elige los equipos y configura el partido.')]];
   shell('TUTORIAL','',`<div class="training-modes mode-pair">${cards.map(([action,label,description],i)=>`<button class="training-mode" data-meta="${action}"><span>0${i+1}</span><strong>${label}</strong><p>${description}</p></button>`).join('')}</div>`,back());
  }else if(screen==='training-match'||screen==='training-config'){
   const players=screen==='training-config';
   if(!trainingSetup){
    trainingSetup=MatchSetup.fresh(profile.training);
    const used=trainingSetup.ids.indexOf(profile.selected);
    if(used>0)trainingSetup.ids[used]=trainingSetup.ids[0];
    trainingSetup.ids[0]=profile.selected;
   }
   trainingSetup.controlMode=profile.controlMode;trainingSetup=MatchSetup.clean(trainingSetup);const lo=profile.controlMode==='casual'?1:6,hi=profile.controlMode==='casual'?6:15;profile.training=clamp(profile.training,lo,hi);
   shell(tx('TRAINING MATCH','PARTIDO DE ENTRENAMIENTO'),players?tx('Choose teams and positions.','Elige equipos y posiciones.'):'',`<div id="training-editor"></div><div class="training-tuning"><label class="training-random"><input type="checkbox" id="training-random" ${randomTraining?'checked':''}> ${tx('Randomize rivals and court position','Sortear rivales y posición en pista')}</label><div class="meta-training-level"><label for="training-level">${tx('ALL AI LEVELS','TODOS LOS NIVELES IA')} <b id="training-value">${profile.training} / ${hi}</b></label><input id="training-level" type="range" min="${lo}" max="${hi}" step="1" value="${profile.training}"><span>${lo} → ${hi} · ${modeLabel(profile.controlMode)}</span></div><label class="training-speed">${tx('MATCH SPEED','VELOCIDAD DE PARTIDO')} <output id="training-speed-value">${trainingSpeed()}%</output><input id="training-speed" type="range" min="25" max="150" step="5" value="${trainingSpeed()}"></label></div>`,`${back(players?'training-match':'home')}${btn(players?'train':'training-next',players?tx('PLAY','JUGAR'):tx('NEXT','SIGUIENTE'),true)}`);
   MatchSetup.render($('#training-editor'),trainingSetup,{courts:Career.clubs});
   if(players)return;
   $('#training-random').onchange=e=>{randomTraining=e.target.checked;};
   $('#training-speed').oninput=e=>{const v=clamp(Number(e.target.value),25,150);$('#training-speed-value').textContent=v+'%';try{localStorage.setItem('padelmaster-training-speed',String(v));}catch{}};
   $('#training-level').oninput=e=>{profile.training=Number(e.target.value);trainingSetup.levels.fill(profile.training);save();$('#training-value').textContent=profile.training+' / '+hi;MatchSetup.render($('#training-editor'),trainingSetup,{courts:Career.clubs});};

  }
 }
 const navigation=[];
 const historyState=()=>globalThis.history?.state?.padelMenu;
 function recordRoute(replace=false,route=screen){if(!globalThis.history)return;const previous=historyState();const entry={scrollTop:root.querySelector?.('.store-scroll')?.scrollTop||0,parents:navigation.slice(),underlying:screen,screen:route,collectionFocus,previewTier,depth:replace?(previous?.depth||0):(previous?.depth||0)+1};globalThis.history[replace?'replaceState':'pushState']({padelMenu:entry},'');}
 addEventListener('popstate',e=>{
  const route=e.state?.padelMenu;if(!route)return;
  const overlay=document.querySelector('dialog[open]');if(overlay&&overlay.id!=='multiplayer')overlay.close();
  // Back during play pauses instead of silently forfeiting a paid match.
  if(mode==='challenge'&&activeDrill){globalThis.openChallenges();return;}
  if(network?.active||(!document.body.classList.contains('meta-visible')&&!globalThis.Practice?.isMenu()&&!$('#multiplayer').open)){
   if(network?.active&&!network.started){$('#main-menu').onclick();}else if(['play','serve','fault','let'].includes(state))togglePause();recordRoute(false,'match');return;
  }
  globalThis.Practice?.stop();$('#multiplayer').close();$('#rules').close();$('#paused').classList.add('hidden');
  navigation.splice(0,navigation.length,...(route.parents||[]));collectionFocus=route.collectionFocus??profile.selected;previewTier=Math.min(3,route.previewTier||0);
  if(route.screen==='splash'&&screen!=='splash'){show('home',false);return;}
  if(route.screen==='challenge-court'){show('challenges',false);return;}
  if(route.screen==='online'){show('home',false);network.open();return;}
  if(route.screen==='match'){show(mode==='campaign'||Career.campaign.state(profile).result?'campaign':'training-match',false);return;}
  show(route.screen.startsWith('overlay-')?route.underlying:route.screen==='practice'?'training':route.screen,false);
  const storeScroll=root.querySelector?.('.store-scroll');if(storeScroll)storeScroll.scrollTop=route.scrollTop||0;
 });
 globalThis.recordMenuRoute=route=>recordRoute(false,route);
 globalThis.menuBrowserBack=()=>{if(historyState()?.depth>0){globalThis.history.back();return true;}return false;};

 function goBack(fallback='home'){if(screen==='home')return;if(navigation.length&&historyState()?.depth>0){globalThis.history.back();return;}const previous=navigation.pop();if(previous){collectionFocus=previous.collectionFocus;previewTier=previous.previewTier||0;show(previous.screen,false);}else show(fallback,false);}
 function show(next='home',remember=true,nextPlayer=null){if(root.classList.contains('hidden'))speedMode=null;if(['run','matchup','abandon','clubs','club','reward'].includes(next))next='campaign';if(['quick','quick-menu','quick-result','review-forfeit'].includes(next))next='training-match';if(next==='shop')next='store';if(next==='home'){navigation.length=0;homePreview=null;}else if(remember&&next!==screen)navigation.push({screen,collectionFocus,previewTier});refresh();if(remember&&next==='collection'&&screen!=='collection'){collectionFocus=nextPlayer??profile.selected;previewTier=profile.equippedSkins[collectionFocus]||0;}screen=next;menuStep='meta';state='intro';cancelShot();$('#paused').classList.add('hidden');$('#point-result').classList.add('hidden');if($('#intro').classList.contains('hidden'))$('#intro').classList.remove('hidden');for(const child of $('#intro').children)child.classList.toggle('hidden',child!==root);document.body.classList.add('meta-visible');render();recordRoute(!remember||screen==='home'||historyState()?.screen===screen);globalThis.syncPointerLock?.();}
 function endSession(){mode='none';matchToken=null;globalThis.careerSession=globalThis.quickSession=false;globalThis.careerVenue=null;}
 function configure(ids,levels,kind,human=0){
  const forced=kind==='campaign';
  speedMode=null;mode=kind;
  globalThis.matchControlMode=profile.controlMode;document.body.classList.toggle('casual-play',profile.controlMode==='casual');
  globalThis.careerVenue=kind==='training'?Career.clubs[trainingSetup?.court??0]:null;
  globalThis.trainingSession=kind==='training';globalThis.careerSession=forced;globalThis.quickSession=false;
  const squad=ids.map(id=>typeof id==='number'?roster[id]:id);
  globalThis.playerCharacter=squad[0];globalThis.rosterLineup=squad.slice(1);globalThis.humanPosition=human;
  globalThis.slotDifficulties=levels;selectionMode='custom';
  root.classList.add('hidden');document.body.classList.remove('meta-visible');
  $('#ai-settings').disabled=$('#partner-level').disabled=$('#rival-level').disabled=true;
  unlockAudio();recordRoute(false,'match');
  const savedDuration=defaultMatchGames;
  if(forced)defaultMatchGames=1;
  try{newMatch(kind==='training'&&randomTraining?Math.random()<.5:false);}finally{defaultMatchGames=savedDuration;}
  if(kind==='training')gameSpeed=trainingSpeed();
 }
 let skinSwipe=null,skinAnimating=false;
 function changeSkin(direction){
  if(skinAnimating||screen!=='collection')return;
  skinAnimating=true;
  const art=root.querySelector?.('.skin-preview'),reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const finish=()=>{if(screen!=='collection'){skinAnimating=false;return;}previewTier=(previewTier+direction+4)%4;recordRoute(true);render();const next=root.querySelector?.('.skin-preview');next?.animate?.([{transform:'translateX('+direction*90+'px)',opacity:0},{transform:'translateX(0)',opacity:1}],{duration:reduced?0:230,easing:'cubic-bezier(.2,.7,.2,1)'});skinAnimating=false;};
  if(art?.animate&&!reduced){art.animate([{transform:art.style.transform||'translateX(0)',opacity:1},{transform:'translateX('+(-direction*100)+'px)',opacity:0}],{duration:150,easing:'ease-in',fill:'forwards'}).finished.then(finish,finish);}else finish();
 }
 root.addEventListener('pointermove',e=>{if(!skinSwipe||skinSwipe.id!==e.pointerId||skinAnimating)return;const art=root.querySelector?.('.skin-preview');if(art)art.style.transform='translateX('+Math.max(-90,Math.min(90,e.clientX-skinSwipe.x))+'px)';});
 root.addEventListener('pointerdown',e=>{
  if(screen!=='collection'||!e.target.closest('.collection-showcase')||e.target.closest('button'))return;
  skinSwipe={id:e.pointerId,x:e.clientX,y:e.clientY};
  e.target.setPointerCapture?.(e.pointerId);
 });
 root.addEventListener('pointerup',e=>{
  const start=skinSwipe;skinSwipe=null;
  if(!start||start.id!==e.pointerId||screen!=='collection')return;
  const dx=e.clientX-start.x,dy=e.clientY-start.y;
  if(Math.abs(dx)<35||Math.abs(dx)<Math.abs(dy)*1.3){const art=root.querySelector?.('.skin-preview');if(art)art.style.transform='';return;}
  changeSkin(dx<0?1:-1);
 });
 root.addEventListener('pointercancel',()=>{skinSwipe=null;const art=root.querySelector?.('.skin-preview');if(art)art.style.transform='';});
 root.addEventListener('click',e=>{const button=e.target.closest('[data-meta]');if(!button||button.disabled)return;const [action,value]=button.dataset.meta.split(':');toast='';
  if(action==='campaign'){CampaignMatch.action(button.dataset.meta.slice(9));return;}
  if(action==='locker'){locker(true);return;}
  if(action==='home'&&screen==='splash'){show('home');if(profile.kit?.receipt&&!Career.campaign.state(profile).result)locker();return;}
  if(action==='controls'){modeReturn=screen==='controls'?modeReturn:screen;show('controls');}
  else if(action==='choose-mode'){Career.switchMode(profile,value);profile.modeChosen=true;globalThis.preferredControlMode=profile.controlMode;trainingSetup=null;save();navigation.length=0;show(['run','matchup','reward','abandon','quick-result'].includes(modeReturn)?'home':modeReturn,false);recordRoute(true);}
  else if(action==='nav-back')goBack(value);
  else if(['clubs','club','enter','play-round','run','matchup','reward','abandon','confirm-abandon'].includes(action))show('campaign');
  else if(action==='challenge-tab'){weeklyBoard=value==='week';render();}
  else if(action==='brief')show('brief-'+value);
  else if(action==='challenge-play')launchChallenge(value);
  else if(action==='challenge-claim')collectChallenges();
  else if(action==='tutorial'||action==='free'){mode='practice';matchToken=null;globalThis.careerSession=false;globalThis.quickSession=false;globalThis.trainingSession=true;globalThis.careerVenue=null;globalThis.matchControlMode=profile.controlMode;document.body.classList.toggle('casual-play',profile.controlMode==='casual');syncControlTheme(profile.controlMode);root.classList.add('hidden');recordRoute(false,'practice');Practice.open(action,roster[profile.selected]);}
  else if(['quick-menu','quick','wager-play','quick-forfeit','review-forfeit','quick-result'].includes(action))show('training-match');
  else if(action==='training-next'){
   if(!randomTraining){show('training-config');return;}
   const others=Career.shuffle(roster.map(r=>r.id).filter(id=>id!==profile.selected)).slice(0,3);
   trainingSetup.human=Math.random()<.5?0:1;
   trainingSetup.ids=others;
   trainingSetup.ids.splice(trainingSetup.human,0,profile.selected);
   trainingSetup.levels.fill(profile.training);
   matchToken=null;defaultMatchGames=trainingSetup.duration;configure(trainingSetup.ids,trainingSetup.levels,'training',trainingSetup.human);
  }
  else if(action==='training-match'){if(screen!=='training-config'){randomTraining=true;trainingSetup=null;}show(action);}
  else if(action==='train'){matchToken=null;defaultMatchGames=trainingSetup.duration;configure(trainingSetup.ids,trainingSetup.levels,'training',trainingSetup.human);}
  else if(action==='home-portrait')show('collection',true,Number(value));
  else if(action==='home-cycle'){const i=Career.ladder.findIndex(r=>r.id===(homePreview??profile.selected));homePreview=Career.ladder[(i+Number(value)+Career.ladder.length)%Career.ladder.length].id;render();}
  else if(action==='home-equip'){refresh();const id=Number(value);if(profile.owned.includes(id)){Career.campaign.pair(profile,id,id===profile.partner?null:profile.partner);save();}render();}
  else if(action==='inspect'){const id=Number(value);if(roster[id]){collectionFocus=id;previewTier=profile.equippedSkins[id]||0;recordRoute(true);render();}}
  else if(action==='variant')changeSkin(Number(value));
  else if(['equip','wear-skin','buy-skin'].includes(action)){
   const id=Number(value),tier=action==='equip'?0:previewTier;
   const commit=()=>{
    refresh();if(action==='buy-skin'&&!Career.hasSkin(profile,id,tier)&&profile.coins<Career.skinPrice(id,tier)){insufficientCoins(Career.skinPrice(id,tier));return;}const before=JSON.stringify(profile);
    const ok=action==='buy-skin'?Career.buySkin(profile,id,tier)===null:Career.equipSkin(profile,id,tier);
    if(ok&&save()){if(action==='buy-skin')purchaseBanner(roster[id].name+' · '+skinDetails(roster[id],tier).name);toast=action==='buy-skin'?tx('SKIN UNLOCKED','ASPECTO DESBLOQUEADO'):tx('EQUIPPED','EQUIPADO');}
    else if(ok)profile=Career.load(before);
    render();
   };
   if(globalThis.navigator?.locks)navigator.locks.request(KEY,commit);else commit();
  }
  else if(action==='find'||action==='purchase')show('collection',true,Number(value));
  else if(['shop','claim-pack','store','refill'].includes(action)){show(action==='refill'?'refill':'store',!['store','refill'].includes(screen));}
  else if(action==='market')show('store');
  else if(action==='offer'){purchaseBanner(tx('Purchases are not available yet.','Las compras aún no están disponibles.'),tx('COMING SOON','PRÓXIMAMENTE'));}
  else if(action==='store-item'||action==='store-skin'){
   const commit=()=>{refresh();const offer=action==='store-skin'?PadelStore.rotation().find(o=>o.key===value):null;const cost=action==='store-item'?KitBags.buyPrice(Number(value)):offer?.price;if(cost!=null&&profile.coins<cost){insufficientCoins(cost);return;}const offset=root.querySelector?.('.store-scroll')?.scrollTop||0;const ok=kitTransaction(p=>action==='store-item'?KitBags.buy(p,Number(value)):PadelStore.buySkin(p,value));if(ok)purchaseBanner(tx('Added to inventory','Añadido al inventario'));else toast=tx('Unavailable or not enough coins','No disponible o faltan monedas');render();const scroller=root.querySelector?.('.store-scroll');if(scroller)scroller.scrollTop=offset;};
   if(globalThis.navigator?.locks)navigator.locks.request(KEY,commit);else commit();
  }
  else if(action==='online'){mode='online';globalThis.careerVenue=null;globalThis.careerSession=globalThis.trainingSession=globalThis.quickSession=false;MatchSetup.resetOnline();recordRoute(false,'online');network.open();}
  else if(action==='settings')togglePause();else if(action==='rules'){recordRoute(false,'overlay-rules');$('#rules').showModal();}
  else if(action==='language'){setLanguage(language==='es'?'en':'es');render();}
  else if(['preferences','credits','home','collection','challenges','training','training-match','training-config'].includes(action))show(action);
 });
 const previousShow=showMenuStep;showMenuStep=function(step){if(step==='home'){show('home');return;}root.classList.add('hidden');document.body.classList.remove('meta-visible');previousShow(step);};
 const previousLang=setLanguage;setLanguage=function(next){previousLang(next);if(!root.classList.contains('hidden'))render();};
 globalThis.progressionAttributes=p=>{const base=globalThis.matchControlMode==='casual'?Career.attributes(p?.abilityId??p?.id??11):globalThis.trainingSession?{technique:3,power:3,stamina:3,speed:3}:globalThis.careerSession?Career.attributes(p?.abilityId??p?.id??10):null;
  if(!base||!globalThis.matchKit||network?.active||globalThis.Practice?.active||p!==players[localSlot()]?.appearance)return base;
  const out={...base},rid=matchKit.gear[3];if(rid!=null){const [tech,power]=KitBags.rackets[KitBags.tier(rid)];out.technique+=tech;out.power+=power;}for(const id of matchKit.boosts)out[KitBags.stats[KitBags.kind(id)]]+=KitBags.bonus(id);return out;
 };
 globalThis.startKitMatch=()=>{
  globalThis.matchKit=null;
  const hud=$('#kit-boosts');if(hud)hud.innerHTML='';
  if(network?.active||!globalThis.KitBags||!['training','campaign'].includes(mode))return;
  let kit;
  if(mode==='campaign'){kit=Career.campaign.state(profile).attempt?.kit;if(!kit)return;}
  else if(!kitTransaction(p=>{kit=KitBags.start(p.kit);return true;}))return;
  globalThis.matchKit=kit;
  if(hud)hud.innerHTML=kit.boosts.map(id=>'<img src="/kit-item-'+id+'.webp" title="'+KitBags.name(id)+'" alt="'+KitBags.name(id)+'">').join('');
 };
 globalThis.onlineBagWin=()=>{};
 globalThis.progressionMatchEnd=team=>{if(mode==='campaign'&&!network?.active)CampaignMatch.end(team);};
 globalThis.progressionContinue=()=>{if(mode==='campaign'&&!network?.active){CampaignMatch.continue();return true;}if(mode==='training'&&!network?.active){newMatch();return true;}return false;};
 globalThis.progressionBack=()=>{if(root.classList.contains('hidden')||document.querySelector('dialog[open]')?.open)return false;if(screen!=='home')goBack();return true;};
 const previousMain=globalThis.leaveMatchNow;
 globalThis.leaveMatchNow=async()=>{const wasCampaign=mode==='campaign';if(wasCampaign)CampaignMatch.leave();endSession();await previousMain();if(!network?.active)show(wasCampaign?'campaign':'home');};
 globalThis.CampaignMenu={get profile(){return profile;},get mode(){return mode;},get screen(){return screen;},show,render,back:goBack,replaceRoute:()=>recordRoute(true),transaction:kitTransaction,configure,endSession,save,refresh,quick:()=>{trainingSetup=null;randomTraining=true;show('training-match');},launchRecovery:()=>globalThis.startCampaignRecovery(),locker:(after,bagId)=>KitBags.present(kitTransaction,()=>profile,false,false,after,bagId)};
 setInterval(()=>{if(root.classList.contains('hidden'))return;const before=profile.coins;refresh();if(['store','refill'].includes(screen)&&(storeEpoch!==PadelStore.period()||storeSeason!==(Date.now()<PadelStore.HALLOWEEN_END))||profile.coins!==before||screen==='challenges'&&Date.now()>=boardExpires)render();else if(screen==='challenges'){const timer=$('#challenge-reset');if(timer)timer.textContent=timeRemaining();}else if(screen==='home'){const remaining=PadelStore.offerCountdown();const offer=$('#home-store-offer'),timer=$('#home-offer-countdown');if(offer)offer.classList.toggle('hidden',!remaining);if(timer)timer.textContent=remaining||'';}},1000);
 addEventListener('storage',e=>{if(e.key===KEY&&!root.classList.contains('hidden')){refresh();render();}});
 globalThis.openMainMenu=()=>show('home');
 $('#kit-room').addEventListener('close',()=>{if(historyState()?.screen==='overlay-kit')globalThis.history.back();else if(!root.classList.contains('hidden'))render();});
 $('#rules').addEventListener('close',()=>{if(historyState()?.screen==='overlay-rules')globalThis.history.back();});
 const originalPause=togglePause;togglePause=function(){const opening=state==='intro',closing=state==='paused'&&beforePause==='intro';originalPause();if(opening&&state==='paused')recordRoute(false,'overlay-settings');else if(closing&&historyState()?.screen==='overlay-settings')globalThis.history.back();};
 $('#resume').onclick=togglePause;$('#pause').onclick=togglePause;
 globalThis.openTrainingHub=()=>{globalThis.Practice?.stop();show('training');};
 globalThis.metaScreenOpen=()=>!root.classList.contains('hidden');
 save();show('splash',false);recordRoute(true);document.body.classList.remove('booting');
})();
