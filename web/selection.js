'use strict';
// Ranking supplied by the player; illustrated portraits and live rig share the same roster identities.
const rosterNames=['Cesar','Quique','Carlos','Albert','Jordi','Albert','Abel','David','Jon','Igor','Martín','Cristian','Xavi'];
const rosterColors=['#e7e4d4','#ed895a','#53b6c9','#ec626d','#b3ce62','#9683d8','#e7b24e','#58a99a','#5e92d5','#cb638e','#40b8ef','#c3b8a4','#94bdcf'];
const rosterSkins=['#e2af84','#c48b61','#945d3e','#75462f','#d9a47d','#b57a52','#f0c6a3','#885d43','#c99772','#efd1b2','#b47b56','#a57050','#d3a17c'];
const rosterStyles=['TACTICIAN','VOLLEY SPECIALIST','WALL DEFENDER','NET HUNTER','COUNTER ATTACKER','LOB SPECIALIST','ALL ROUNDER','STEADY HAND','FAST FEET','BIG HITTER','CREATIVE PLAYMAKER','RALLY BUILDER','RISING TALENT'];
const roster=rosterNames.map((name,i)=>({id:i,name,short:name.toUpperCase(),rank:i+1,rating:[96,88,84,81,77,74,70,67,64,60,57,53,48][i],shirt:rosterColors[i],skin:rosterSkins[i],shade:['#ad7854','#8a5338','#603a27'][i%3],hair:['#543628','#211f24','#8a6241','#161d24'][i%4],style:rosterStyles[i],look:i%4,build:[1.18,1,.92,1.06,1.12,.94,1.04,.97,1,1.17,1.08,.94,1][i]}));
// Explicit identity traits shared by portraits and on-court rendering.
const appearanceUpdates={
 0:{look:4,skin:'#f0c9a8',shade:'#bc8c6b'},
 1:{look:0,hair:'#ededdf',sockColor:'#e52335',longSocks:true,ageReference:55},
 2:{look:0,hair:'#15191e',beard:'chinstrap',beardColor:'#262024'},
 3:{look:4,skin:'#efc8a9',shade:'#bb8969'},
 5:{look:4,skin:'#efc8a9',shade:'#bb8969'},
 6:{look:4,build:.84,ageReference:38},
 7:{look:7,hair:'#e5e4de',skin:'#c99973',shade:'#936543',ageReference:55},
 8:{look:4,skin:'#bd8a63',shade:'#895a3d'},
 9:{shirt:'#24272d',capColor:'#ed3884',beard:'circle',beardColor:'#a6a5a0',hair:'#787875',ageReference:60},
 12:{hair:'#201c1d'},
 10:{look:5,skin:'#75492f',shade:'#4c2b20',hair:'#19191d'},
 11:{skin:'#e7bc97',shade:'#b38160',glasses:true}
};
Object.entries(appearanceUpdates).forEach(([id,traits])=>Object.assign(roster[id],traits));
[
 {name:'Jeni',skin:'#f0c9a8',shade:'#bc8c6b',hair:'#dfb956',shirt:'#b6a2ed',glasses:true,rating:76,style:'STEADY HAND'},
 {name:'Laura',skin:'#f2c6ac',shade:'#c28b70',hair:'#b74c29',shirt:'#55c9b3',rating:80,style:'NET HUNTER'},
 {name:'Rosalia',skin:'#f1d0b9',shade:'#bd947a',hair:'#191a22',shirt:'#ef88b5',rating:72,style:'WALL DEFENDER'}
].forEach(p=>{const id=roster.length;roster.push({...p,id,short:p.name.toUpperCase(),rank:id+1,look:2,build:1,gender:'woman'});});

roster.push({id:16,name:'Trapiche',short:'TRAPICHE',rank:17,rating:75,skin:'#d9aa89',shade:'#a7785b',hair:'#29202e',hairAccent:'#b990ee',shirt:'#42d9e5',style:'CREATIVE PLAYMAKER',look:6,build:.98});

roster.push({id:17,name:'Claudia',short:'CLAUDIA',rank:18,rating:78,skin:'#efc5ab',shade:'#bc8267',hair:'#b94722',shirt:'#b91e50',hairAccent:'#253655',style:'FAST FEET',balancedStats:[3,2,3,4],look:8,build:.99,gender:'woman'});

let selectedSlot=-1,previewId=0,selectionMode='random',menuStep='home',matchMode='solo',chosenDifficulty='club';
globalThis.slotDifficulties=['club','club','club','club'];
globalThis.playerCharacter=roster[10];
globalThis.refreshRandomRoster=()=>{if(selectionMode==='random')globalThis.rosterLineup=shuffledLineup();};
function shuffledLineup(){const ids=roster.filter(p=>p.id!==globalThis.playerCharacter.id).map(p=>p.id);for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}return ids.slice(0,3).map(i=>roster[i]);}
globalThis.rosterLineup=shuffledLineup();
function portrait(p){return CharacterPortraits.side(p);}
globalThis.characterForId=id=>roster[id];
const tx=(en,es)=>language==='es'?es:en;
const styleES=['ESTRATEGA','ESPECIALISTA EN VOLEA','DEFENSOR DE CRISTAL','CAZADOR DE RED','CONTRAATACANTE','ESPECIALISTA EN GLOBOS','TODOTERRENO','MANO SEGURA','PIES RÁPIDOS','PEGADOR','JUGADOR CREATIVO','CONSTRUCTOR DE RALLIES','TALENTO EMERGENTE'];
globalThis.humanPosition=0;
globalThis.customPlayerName='';
const courtPlayers=()=>[globalThis.playerCharacter,...globalThis.rosterLineup];
function assignCourtPlayer(position,id){const all=courtPlayers(),r=roster[id];if(!r||position<0||position>3)return;const old=all.findIndex(x=>x.id===id);if(old>=0)[all[old],all[position]]=[all[position],all[old]];else all[position]=r;globalThis.playerCharacter=all[0];globalThis.rosterLineup=all.slice(1);selectionMode='custom';renderSelection();}
function courtAvatar(p){return CharacterPortraits.head(p);}
// Pointer-based dragging works with mouse, pen and touch inside the scaled lobby.
function bindRosterDrag(button){
 let gesture=null,suppressClick=false;
 const clear=()=>{gesture?.ghost?.remove();document.querySelectorAll('.drop-ready').forEach(n=>n.classList.remove('drop-ready'));gesture=null;};
 button.onclick=()=>{if(suppressClick){suppressClick=false;return;}previewId=Number(button.dataset.fighter);renderSelection();};
 button.onpointerdown=e=>{if(e.button!==0)return;suppressClick=false;gesture={x:e.clientX,y:e.clientY,id:e.pointerId,ghost:null};button.setPointerCapture(e.pointerId);};
 button.onpointermove=e=>{
  if(!gesture||gesture.id!==e.pointerId)return;
  if(!gesture.ghost&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)<7)return;
  if(!gesture.ghost){const ghost=button.cloneNode(true);ghost.removeAttribute('id');ghost.className='lineup-drag-ghost';ghost.setAttribute('aria-hidden','true');document.body.appendChild(ghost);gesture.ghost=ghost;}
  gesture.ghost.style.left=e.clientX+'px';gesture.ghost.style.top=e.clientY+'px';
  const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-position]');
  document.querySelectorAll('[data-position]').forEach(n=>n.classList.toggle('drop-ready',n===target));
 };
 button.onpointerup=e=>{
  if(!gesture||gesture.id!==e.pointerId)return;
  const dragged=!!gesture.ghost,target=dragged?document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-position]'):null;
  clear();suppressClick=dragged;
  if(target){previewId=Number(button.dataset.fighter);assignCourtPlayer(Number(target.dataset.position),previewId);}
 };
 button.onpointercancel=clear;button.onlostpointercapture=clear;
}
function renderSelection(){
 const all=courtPlayers();
 $('#roster-grid').innerHTML=roster.map(r=>`<button draggable="false" class="fighter ${r.id===previewId?'focused':''}" data-fighter="${r.id}" aria-label="${r.name}, ${tx('rank','puesto')} ${r.rank}" style="--kit:${r.shirt}"><span class="fighter-rank">${String(r.rank).padStart(2,'0')}</span><span class="roster-avatar">${courtAvatar(r)}</span><strong>${r.name}</strong><small>${tx('BALANCED','EQUILIBRADO')}</small></button>`).join('');
 $('#court-positions').innerHTML=all.map((r,i)=>`<div class="court-position position-${i} ${i===globalThis.humanPosition?'controlled':''}" data-position="${i}"><button class="place-player" data-place="${i}" aria-label="${tx('Place selected character','Colocar personaje seleccionado')} ${i+1}"><span class="court-token" style="--kit:${r.shirt}">${courtAvatar(r)}</span><strong>${r.name}</strong><small>${i===globalThis.humanPosition?tx('YOU','TÚ'):'AI'}</small></button><button class="control-here" data-control="${i}" aria-pressed="${i===globalThis.humanPosition}">${i===globalThis.humanPosition?tx('◆ YOU','◆ TÚ'):tx('PLAY AS','CONTROLAR')}</button></div>`).join('');
 $('#selection-title').textContent=tx('PICK YOUR FOUR.','ELIGE TU EQUIPO.');$('#selection-kicker').textContent=tx('MATCH SETUP   /   01 LINEUP → 02 DIFFICULTY','PREPARAR PARTIDO   /   01 EQUIPO → 02 DIFICULTAD');$('#selection-instructions').textContent=tx('Drag to the court. Build your matchup.','Arrastra a la pista. Prepara el duelo.');$('#roster-tip').textContent=tx('DRAG & DROP · Or select, then choose a slot','ARRASTRA Y SUELTA · O selecciona y elige posición');$('#random-match').textContent=tx('SHUFFLE ↻','SORTEAR ↻');$('#start').textContent=tx('CONTINUE →','CONTINUAR →');$('#name-label').textContent=tx('PLAYER NAME','NOMBRE DE JUGADOR');$('#setup-name').placeholder=tx('Enter your name','Escribe tu nombre');
 document.querySelectorAll('[data-fighter]').forEach(bindRosterDrag);
 document.querySelectorAll('[data-position]').forEach(b=>{b.ondragover=e=>{e.preventDefault();e.dataTransfer.dropEffect='move';b.classList.add('drop-ready');};b.ondragleave=()=>b.classList.remove('drop-ready');b.ondrop=e=>{e.preventDefault();const value=e.dataTransfer.getData('text/plain');if(/^\d+$/.test(value))assignCourtPlayer(Number(b.dataset.position),Number(value));};});
 document.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>assignCourtPlayer(Number(b.dataset.place),previewId));
 document.querySelectorAll('[data-control]').forEach(b=>b.onclick=()=>{globalThis.humanPosition=Number(b.dataset.control);renderSelection();});
}
function statSteps(p){const a=characterAttributes(p);return [['technique','TECHNIQUE','TÉCNICA'],['power','POWER','POTENCIA'],['stamina','STAMINA','RESISTENCIA'],['speed','SPEED','VELOCIDAD']].map(([key,en,es])=>`<div class="step-stat"><span>${tx(en,es)}</span><div class="stat-segments" role="img" aria-label="${tx(en,es)}: ${a[key]} / 5">${[1,2,3,4,5].map(v=>`<i class="${v<=a[key]?'filled':''}"></i>`).join('')}</div><b>${a[key]}</b></div>`).join('');}
function matchCards(){return `<div class="match-four">${courtPlayers().map((r,i)=>{const human=i===globalThis.humanPosition,team=i<2?0:1,myTeam=globalThis.humanPosition<2?0:1;return `<article class="match-player ${human?'is-human':''}" style="--kit:${r.shirt}"><div class="match-role">${human?tx('YOU','TÚ'):team===myTeam?tx('YOUR PARTNER','TU COMPAÑERO'):tx('OPPONENT','RIVAL')}</div><div class="match-portrait">${portrait(r)}</div><h2>${r.name}</h2><div class="match-stats">${statSteps(r)}</div>${human?`<div class="human-control">${tx('YOU ARE IN CONTROL','TÚ TIENES EL CONTROL')}</div>`:`<label class="individual-level"><span>${tx('AI DIFFICULTY','DIFICULTAD IA')}</span><select data-slot-level="${i}" aria-label="${tx('AI difficulty for','Dificultad IA de')} ${r.name}">${[['beginner','RELAXED','TRANQUILO'],['club','CLUB','CLUB'],['advanced','COMPETITIVE','COMPETITIVO']].map(([id,en,es])=>`<option value="${id}" ${globalThis.slotDifficulties[i]===id?'selected':''}>${tx(en,es)}</option>`).join('')}</select></label>`}</article>`;}).join('')}</div>`;}
function bindMatchCardControls(){document.querySelectorAll('[data-slot-level]').forEach(el=>el.onchange=()=>{const id=Number(el.dataset.slotLevel);if(LEVELS[el.value]){globalThis.slotDifficulties[id]=el.value;if(players[id])players[id].aiLevel=el.value;}});}
function slotName(i){if(i===-1)return tx('YOU','TÚ');return [tx('YOUR PARTNER','TU COMPAÑERO'),tx('RIVAL 1','RIVAL 1'),tx('RIVAL 2','RIVAL 2')][i];}
$('#random-match').onclick=()=>{selectionMode='random';globalThis.rosterLineup=shuffledLineup();previewId=globalThis.rosterLineup[0].id;renderSelection();};
const playSolo=$('#start').onclick;
function showMenuStep(step){menuStep=step;$('#gallery-screen').classList.toggle('hidden',step!=='gallery');$('#home-screen').classList.toggle('hidden',step!=='home');$('#character-screen').classList.toggle('hidden',step!=='characters');$('#difficulty-screen').classList.toggle('hidden',step!=='difficulty');$('#intro').scrollTop=0;renderMenuFlow();if(step==='characters')renderSelection();if(step==='gallery')globalThis.renderCharacterGallery?.();}
function beginMatchSetup(mode){matchMode=mode;selectedSlot=-1;previewId=globalThis.playerCharacter.id;if(selectionMode==='random')globalThis.rosterLineup=shuffledLineup();showMenuStep('characters');}
function renderMenuFlow(){
 $('#home-characters').textContent=tx('CHARACTERS','PERSONAJES');
 $('#home-title').innerHTML='<img class="home-logo" src="top-down-padel-logo.svg" width="900" height="142" alt="Top Down Padel">';
 $('#home-tag').textContent=tx('PADEL. WITH ATTITUDE.','PÁDEL. CON ACTITUD.');
 $('#home-new').textContent=tx('NEW MATCH','NUEVO PARTIDO');$('#home-coop').textContent=tx('CO-OP / ONLINE','COOPERATIVO / ONLINE');$('#home-settings').textContent=tx('SETTINGS','AJUSTES');$('#home-rules').textContent=tx('HOW TO PLAY','CÓMO JUGAR');$('#home-language').textContent=language==='es'?'ES / EN':'EN / ES';
 $('#selection-back').textContent=tx('‹ BACK','‹ VOLVER');$('#difficulty-back').textContent=tx('‹ BACK','‹ VOLVER');
 $('#difficulty-title').textContent=tx('SET THE CHALLENGE.','ELIGE EL DESAFÍO.');$('#difficulty-tag').textContent=tx('02 / DIFFICULTY','02 / DIFICULTAD');
 $('#difficulty-hint').textContent=tx('Four players. Your rules. Set each AI separately.','Cuatro jugadores. Tus reglas. Ajusta cada IA por separado.');
 $('#difficulty-options').innerHTML=matchCards();bindMatchCardControls();
 $('#setup-summary').innerHTML='';
 $('#launch-match').textContent=matchMode==='solo'?tx('PLAY MATCH','JUGAR PARTIDO'):tx('CONTINUE TO ROOM →','CONTINUAR A LA SALA →');
 $('#room-flow-note').textContent=matchMode==='solo'?tx('First to 5 games · Golden point','Primero a 5 juegos · Punto de oro'):tx('Create a room or join with a code. Empty slots use your AI lineup.','Crea una sala o únete con un código. Los huecos se rellenan con IA.');
 $('#home-athletes').innerHTML='';
}
$('#home-new').onclick=()=>beginMatchSetup('solo');$('#home-coop').onclick=()=>beginMatchSetup('coop');$('#home-settings').onclick=()=>$('#intro-settings').click();$('#home-rules').onclick=()=>$('#intro-help').click();$('#home-language').onclick=()=>setLanguage(language==='es'?'en':'es');
$('#selection-back').onclick=()=>showMenuStep('home');$('#difficulty-back').onclick=()=>showMenuStep('characters');$('#start').onclick=()=>showMenuStep('difficulty');
$('#launch-match').onclick=()=>{globalThis.customPlayerName=$('#setup-name').value.trim().slice(0,16);$('#player-name').value=globalThis.customPlayerName;partnerLevel=rivalLevel=chosenDifficulty;$('#partner-level').value=chosenDifficulty;$('#rival-level').value=chosenDifficulty;if(matchMode==='solo')playSolo();else network.open();};
const oldSetLanguage=setLanguage;setLanguage=function(next){oldSetLanguage(next);renderSelection();renderMenuFlow();if(menuStep==='gallery')globalThis.renderCharacterGallery?.();};
const menuObserver=new MutationObserver(()=>{const showing=!$('#intro').classList.contains('hidden');document.body.classList.toggle('selecting',showing);if(showing&&!globalThis.metaScreenOpen?.())showMenuStep('home');});menuObserver.observe($('#intro'),{attributes:true,attributeFilter:['class']});

previewId=globalThis.playerCharacter.id;document.body.classList.add('selecting');renderSelection();showMenuStep('home');if(typeof state!=='undefined'&&state==='intro')resetPlayers();

$('#setup-name').oninput=e=>{globalThis.customPlayerName=e.target.value.trim().slice(0,16);};

const enterConfiguredRoom=network.enter.bind(network);network.enter=async function(host){await enterConfiguredRoom(host);if(this.active&&!this.started&&this.slot!==globalThis.humanPosition&&!this.room?.members.some(m=>m.slot===globalThis.humanPosition)){await this.sync({slot:globalThis.humanPosition});}};
