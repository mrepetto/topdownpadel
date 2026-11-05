'use strict';
// Local-only practice controller: same contact/shot/physics code, no career settlement.
(()=>{
 const L=(en,es)=>language==='es'?es:en,KEY='topdownpadel-campaign-tutorial-v1';
 const lessons=[
 ['move','MOVE INTO POSITION','MUÉVETE A LA POSICIÓN','Reach the glowing receiving zone.','Llega a la zona iluminada.','ground'],
 ['drive','YOUR FIRST DRIVE','TU PRIMER DRIVE','Let it bounce. Return the ball into the opposite court.','Deja que bote. Devuelve la bola a la otra pista.','ground'],
 ['backhand','BACKHAND','REVÉS','Move behind the feed. Return it on your backhand side.','Colócate detrás de la bola. Devuélvela de revés.','backhand'],
 ['timing','FIND THE SWEET SPOT','ENCUENTRA EL PUNTO DULCE','Release as the ball reaches the racket. Make one PERFECT return.','Suelta cuando la bola llegue a la pala. Logra una devolución PERFECTA.','ground'],
 ['depth','CONTROL YOUR DEPTH','CONTROLA LA PROFUNDIDAD','A longer stroke travels farther. Land in the large back target.','Un trazo largo llega más lejos. Aterriza en la zona del fondo.','ground'],
 ['lob','LOB','GLOBO','Use your lob control. Lift the ball into the back half.','Usa el control de globo. Eleva la bola hacia el fondo.','ground'],
 ['backglass','BACK GLASS','CRISTAL DE FONDO','Let the ball bounce off the back glass, then return it.','Deja que rebote en el cristal de fondo y devuélvela.','backglass'],
 ['sideglass','SIDE GLASS','CRISTAL LATERAL','Wait for the side-glass rebound. Hit before the second bounce.','Espera el cristal lateral. Golpea antes del segundo bote.','sideglass'],
 ['volley','VOLLEY','VOLEA','Meet the ball near the net before it bounces.','Intercepta la bola cerca de la red antes de que bote.','volley'],
 ['drop','DROP SHOT','DEJADA','A short BLUE stroke. Volley below head height into the short target.','Trazo corto AZUL. Volea por debajo de la cabeza hacia la zona corta.','volley'],
 ['bandeja','BANDEJA','BANDEJA','Draw a gentle U for a sliced overhead. Keep the stroke GREEN.','Dibuja una U suave para cortar el golpe alto. Mantén el trazo VERDE.','overhead'],
 ['vibora','VÍBORA','VÍBORA','Draw an arch ∩ for a topspin overhead. Use GREEN or YELLOW power.','Dibuja un arco ∩ para liftar el golpe alto. Usa potencia VERDE o AMARILLA.','overhead'],
 ['smash','SMASH','REMATE','A RED overhead. Keep it inside; no need to hit it out of the court.','Golpe alto ROJO. Que entre; no hace falta sacarla de la pista.','overhead'],
 ['serve','SERVE','SAQUE','Drag diagonally toward the service box. Release to serve.','Arrastra en diagonal al cuadro marcado. Suelta para sacar.','serve'],
 ['slice','SLICE','CORTADO','Draw a shallow U, then release at contact. The ball floats and comes off the glass less.','Dibuja una U suave y suelta al contacto. La bola flota y sale menos del cristal.','ground'],
 ['topspin','TOPSPIN','LIFTADO','Draw an arch like ∩. The ball dips sooner and kicks farther off the glass.','Dibuja un arco como ∩. La bola cae antes y sale más del cristal.','ground'],
 ['finisher','ON FIRE','EN LLAMAS','Five PERFECT hits charge a finisher. You are charged: make one PERFECT return to unleash it.','Cinco PERFECTOS cargan el golpe especial. Ya estás cargado: logra un PERFECTO para activarlo.','ground']
 ];
 const order=[0,1,2,3,4,14,15,5,6,7,8,9,10,11,12,13,16];
 let demo=false,demoInk=null,suspended=false;
 let active=false,tutorial=false,step=0,done=new Set(),end=0,feed='mixed',pace='relaxed',appearance=null,phase='setup',timer=0,age=0,attempt=null,incoming=null,feedback='',feedbackUntil=0,feedCount=0,menuView='setup';
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(Array.isArray(saved?.completed))done=new Set(saved.completed.filter(i=>Number.isInteger(i)&&i>=0&&i<lessons.length));else if(Number.isInteger(saved))done=new Set(Array.from({length:clamp(saved,0,lessons.length)},(_,i)=>i));}catch{}
 const screen=document.createElement('section');screen.id='practice-screen';screen.className='practice-screen hidden';document.body.append(screen);
 const hud=document.createElement('section');hud.id='practice-hud';hud.className='hidden';document.body.append(hud);
 let machine={x:830,y:250,angle:Math.PI,recoil:0},feedBounces=[],feedPredictionAt=0,feedPredictionKey='',hudText=null,hudColor=null;
 const lesson=()=>lessons[step],key=()=>lesson()[0],flip=x=>end?1000-x:x;
 const button=(id,label,primary=false)=>`<button data-practice="${id}" class="${primary?'primary':''}">${label}</button>`;
 // Timed contracts use the same human racket, feeds and first legal bounce as practice.
 let drill=null;
 const calls=[
  ['BANDEJA','BANDEJA','BANDEJA','overhead','Green · overhead','Verde · golpe alto'],
  ['VOLLEY','VOLLEY','VOLEA','volley','Before the bounce','Antes del bote'],
  ['LOB','LOB','GLOBO','ground','Use the lob control','Usa el control de globo'],
  ['VÍBORA','VÍBORA','VÍBORA','overhead','Yellow · overhead','Amarillo · golpe alto'],
  ['BACKHAND','BACKHAND','REVÉS','backhand','Let it bounce on your backhand','Espera el bote de revés'],
  ['SMASH','SMASH','REMATE','overhead','Red · overhead','Rojo · golpe alto']
 ];
 function drillName(){return drill.def.repeatable?L('RETURN RALLY','PELOTEO LIBRE'):drill.def.kind==='cones'?L('CONE STRIKE','DERRIBA LOS CONOS'):drill.def.kind==='zones'?L('PAINT THE COURT','PINTA LA PISTA'):L('COACH CALLS','A LA ORDEN');}
 function setTask(){
  const d=drill,k=d.def.kind,n=d.count+d.offset;
  const call=k==='calls'?calls[n%calls.length]:null;
  // Alternating lanes and depths; attack shots resolve deep with the real overhead solver.
  const lane=[150,345,190,320,165,335][n%6],depth=[830,705,795,880,745][n%5];
  const placement=(n+Math.floor(n/12))%3;
  const combo=!!call&&(placement===1||d.def.weekly&&placement===2);
  d.task={call,feed:call?call[3]:'ground',target:k!=='returns'&&(k!=='calls'||combo),x:call?835:depth,y:lane,
   rx:k==='cones'?62:call?130:92,ry:k==='cones'?62:call?107:77};
  d.fellAt=null;
 }
 function drillInstruction(){
  const task=drill.task;
  if(drill.def.repeatable)return L('Land a return across the net','Devuelve la bola dentro del campo rival');
  if(task.call)return L(task.call[1],task.call[2])+(task.target?L(' into the zone',' a la zona'):'');
  return drill.def.kind==='cones'?L('Knock down the cone','Derriba el cono'):L('Aim for the zone','Apunta a la zona');
 }
 function drillHud(){
  const d=drill,t=d.task;
  const hint=d.def.repeatable?L('Any shot counts','Vale cualquier golpe'):t.call?L(t.call[4],t.call[5]):L('Aim with the first bounce','Apunta con el primer bote');
  const scored=phase==='drill-between'&&d.fellAt!=null;
  const hitBanner=scored?`<strong class="drill-hit" role="status">${L('HIT!','¡ACIERTO!')} <i>${d.count} / ${d.def.goal}</i></strong>`:'';
  hud.innerHTML=`${hitBanner}${phase==='waiting'?`<strong class="drill-order" role="status">${drillInstruction()}</strong>`:''}<div class="coach-copy"><span>${drillName()} · ${d.count}/${d.def.goal} · ${L('Ball','Bola')} ${Math.min(d.used+ (phase==='waiting'&&!d.used?1:0),d.limit)}/${d.limit}</span><small>${hint}</small></div><div class="coach-actions">${button('challenge-pause',L('PAUSE','PAUSA'))}</div><strong id="practice-feedback" aria-live="polite"></strong>`;
 }
 function series(){
  const d=drill;d.limit=d.def.goal+3;d.used=0;d.start=d.count;d.result='';setTask();stage(false);
 }
 function drillPanel(result){
  clearInput();drill.result=result;state='paused';hud.classList.add('hidden');screen.classList.remove('hidden');globalThis.syncPointerLock?.();
  const paused=result==='pause',won=result==='complete',expired=result==='expired';
  const title=paused?L('PAUSED','EN PAUSA'):won?L('CHALLENGE COMPLETE','DESAFÍO COMPLETADO'):expired?L('SESSION CLOSED','SESIÓN CERRADA'):L('SERIES COMPLETE','SERIE COMPLETADA');
  const subtitle=expired?L('Check your challenge board for current progress.','Consulta el progreso actual en el panel de desafíos.'):won?(drill.def.repeatable?'+'+drill.def.reward+' '+L('coins added to your balance.','monedas en tu saldo.'):L('Collect your coins on the challenge board.','Recoge tus monedas en el panel de desafíos.')):paused?drillInstruction():L('Try again for free.','Vuelve a intentarlo gratis.');
  screen.innerHTML=`<div class="practice-shell"><header><span>${L('CHALLENGES','DESAFÍOS')} / ${drillName()}</span></header><h1>${title}</h1><div class="practice-options"><div><h2>${drill.count} / ${drill.def.goal}</h2><p>${L('Challenge hits','Aciertos del desafío')}</p></div><div><h2>+${drill.count-drill.start}</h2><p>${L('Hits this series','Aciertos en esta serie')}</p></div></div><p class="lesson-instruction">${subtitle}</p><footer>${button('challenge-exit',drill.def.returnToLadder?L('‹ CAMPAIGN','‹ CAMPAÑA'):L('‹ CHALLENGES','‹ DESAFÍOS'),drill.def.returnToLadder&&won)}${paused?button('challenge-resume',L('CONTINUE','CONTINUAR'),true):!expired&&(!won||drill.def.repeatable)?button('challenge-retry',won?L('PLAY AGAIN','JUGAR OTRA VEZ'):L('FREE RETRY','REINTENTAR GRATIS'),!won):''}</footer></div>`;
 }
 function drillTarget(){
  const d=drill,t=d.task;if(!t.target)return;
  const cone=d.def.kind==='cones',fall=d.fellAt===null?0:clamp((clock-d.fellAt)*4,0,1);
  ctx.save();ctx.translate(flip(t.x),t.y);
  if(cone){
   if(portraitMode)ctx.rotate(Math.PI/2);if(farCamera())ctx.rotate(Math.PI);
   ctx.fillStyle='#071d297d';ctx.beginPath();ctx.ellipse(4+8*fall,3,18,6,0,0,Math.PI*2);ctx.fill();ctx.rotate(fall*1.42);
   ctx.fillStyle='#bf4624';ctx.fillRect(-14,-2,28,6);
   ctx.fillStyle='#ff8a34';ctx.beginPath();ctx.moveTo(-10,0);ctx.lineTo(-2,-22);ctx.lineTo(3,-22);ctx.lineTo(11,0);ctx.closePath();ctx.fill();
   ctx.fillStyle='#fff4d8';ctx.beginPath();ctx.moveTo(-7,-8);ctx.lineTo(-5,-13);ctx.lineTo(6,-13);ctx.lineTo(8,-8);ctx.closePath();ctx.fill();
  }else{
  ctx.fillStyle=fall?'#c9ff643c':'#54eddb32';ctx.strokeStyle=fall?'#daff7d':'#82ffeb';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.ellipse(0,0,t.rx,t.ry,0,0,Math.PI*2);ctx.fill();ctx.setLineDash([9,5]);ctx.stroke();ctx.setLineDash([]);
   ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(-21,0);ctx.lineTo(-8,0);ctx.moveTo(8,0);ctx.lineTo(21,0);ctx.moveTo(0,-21);ctx.lineTo(0,-8);ctx.moveTo(0,8);ctx.lineTo(0,21);ctx.stroke();
  }
  ctx.restore();
 }
 function drillResolve(b){
  if(!['incoming','outgoing'].includes(phase))return;
  const d=drill,t=d.task,legal=b&&attempt&&b.legalBounce&&b.bounces===1&&side(b.x)!==b.last&&b.x>=5&&b.x<=995&&b.y>=5&&b.y<=495;
  const placed=legal&&(!t.target||((flip(b.x)-t.x)/t.rx)**2+((b.y-t.y)/t.ry)**2<=1);
  const correct=legal&&(!t.call||attempt.kind===t.call[0]);
  if(placed&&correct){
   const count=globalThis.challengeMachineHit(d.def.id);
   if(!Number.isInteger(count)||count<0){drillPanel('expired');return;}
   d.count=count;d.fellAt=clock;feedback='';sfx('hit',.6);
  }else feedback=!legal?L('TRY AGAIN','OTRO INTENTO'):!correct?L('REQUESTED: ','SE PEDÍA: ')+L(t.call[1],t.call[2]):L('OUTSIDE THE TARGET','FUERA DE LA ZONA');
  feedbackUntil=clock+1.25;phase='drill-between';timer=1.3;afterPointAge=0;feedBounces=[];clearInput();renderHud();
 }
 function openChallenge(def,character,count=0){
  stop();end=0;tutorial=false;appearance=character;gameSpeed=def.repeatable?65:85;
  let offset=0;for(const letter of String(def.seed))offset=(offset*31+letter.charCodeAt(0))>>>0;
  drill={def,count,offset:offset%30};series();
 }
 function leaveDrill(){stop();globalThis.openChallenges();}
 function clearInput(){cancelShot();for(const k in keys)keys[k]=false;joy={x:0,y:0};}
 function save(){try{localStorage.setItem(KEY,JSON.stringify({completed:[...done]}));}catch{}}
 function instruction(){if(tutorial&&key()==='move'&&globalThis.matchControlMode==='casual')return L('Your player runs automatically. Better Speed reaches more balls; you only swipe to hit.','Tu jugador corre solo. Más Velocidad permite llegar a más bolas; tú solo deslizas para golpear.');return tutorial?L(lesson()[3],lesson()[4]):L('Make your shot. Read the contact and the result.','Golpea. Lee la calidad del contacto y el resultado.');}
 function controls(){if(typeof portraitMode!=='undefined'&&portraitMode)return L('Swipe: hit · Tap, then swipe: lob','Desliza: golpe · Toca y luego desliza: globo');if(globalThis.matchControlMode==='casual')return L('AUTO MOVE · MOUSE 1: DRAG & RELEASE · MOUSE 2: LOB','MOVIMIENTO AUTO · RATÓN 1: ARRASTRA Y SUELTA · RATÓN 2: GLOBO');return typeof padConnected!=='undefined'&&padConnected?L('LEFT STICK · MOVE / RIGHT STICK · AIM / HOLD A · HIT / HOLD B · LOB / RELEASE · SWING','STICK IZQ. · MOVER / STICK DER. · APUNTAR / MANTÉN A · GOLPE / MANTÉN B · GLOBO / SUELTA · GOLPEAR'):L('WASD · MOVE / MOUSE 1 · DRAG & RELEASE / MOUSE 2 · LOB','WASD · MOVER / RATÓN 1 · ARRASTRA Y SUELTA / RATÓN 2 · GLOBO');}
 function drawMenu(view='setup'){
  if(drill){drillPanel(drill.result||'pause');return;}
  menuView=view;clearInput();state='paused';hud.classList.add('hidden');screen.classList.remove('hidden');globalThis.syncPointerLock?.();
  const title=view==='lesson'?L(lesson()[1],lesson()[2]):view==='complete'?L('COURT READY.','LISTO PARA LA PISTA.'):tutorial?L('LEARN THE GAME.','APRENDE A JUGAR.'):L('JUST YOU & THE BALL.','TÚ Y LA BOLA.');
  let body='',actions='';
  if(view==='complete'){
   body=`<div class="training-complete">✓</div><p class="lesson-instruction">${L('Session complete. Keep practicing or try a match.','Sesión completada. Sigue practicando o prueba un partido.')}</p>`;
   actions=button('exit',L('TUTORIAL MENU','MENÚ DEL TUTORIAL'))+button('free',L('FREE PRACTICE','PRÁCTICA LIBRE'),true);
  }else{
   body=`<div class="practice-options"><div><h2>${L('CHOOSE YOUR END','ELIGE TU LADO')}</h2><div class="practice-mini-court"><button data-practice="end:0" aria-pressed="${end===0}">${end===0?'● ':''}${L('PLAY LEFT','JUGAR IZQUIERDA')}</button><i></i><button data-practice="end:1" aria-pressed="${end===1}">${end===1?'● ':''}${L('PLAY RIGHT','JUGAR DERECHA')}</button></div><p>${L('The machine stays opposite you.','La máquina se coloca enfrente.')}</p></div><div>`;
   if(tutorial)body+=`<h2>${done.size} / ${lessons.length} ${L('COMPLETE','COMPLETADAS')}</h2><label>${L('LESSON','LECCIÓN')}<select id="practice-lesson">${order.map((i)=>{const l=lessons[i];return `<option value="${i}" ${i===step?'selected':''}>${done.has(i)?'✓ ':''}${order.indexOf(i)+1}. ${L(l[1],l[2])}</option>`;}).join('')}</select></label><p>${L('Progress is saved on this device. Replay any lesson.','Progreso guardado en este dispositivo. Repite cualquier lección.')}</p>`;
   else body+=`<label>${L('BALL FEED','TIPO DE BOLA')}<select id="practice-feed">${[['mixed','Mixed','Variado'],['ground','Groundstrokes','Golpes de fondo'],['volley','Volleys','Voleas'],['overhead','Overheads','Golpes altos'],['backglass','Back glass','Cristal de fondo'],['sideglass','Side glass','Cristal lateral']].map(([v,en,es])=>`<option value="${v}" ${v===feed?'selected':''}>${L(en,es)}</option>`).join('')}</select></label><label>${L('FEED PACE','RITMO DE BOLAS')}<select id="practice-pace">${[['relaxed','Relaxed','Tranquilo'],['normal','Normal','Normal'],['fast','Fast','Rápido']].map(([v,en,es])=>`<option value="${v}" ${v===pace?'selected':''}>${L(en,es)}</option>`).join('')}</select></label><p>${L('No score. No clock. Keep swinging.','Sin puntos. Sin reloj. Sigue golpeando.')}</p>`;
   body+=`</div></div><label class="practice-speed">${L('TRAINING SPEED','VELOCIDAD DE ENTRENAMIENTO')} <output id="practice-speed-value">${gameSpeed}%</output><input id="practice-speed" type="range" min="25" max="150" step="5" value="${gameSpeed}"></label>`;
   actions=button('exit',suspended?L('RESUME','REANUDAR'):L('‹ BACK','‹ VOLVER'))+(suspended?button('hub',L('TUTORIAL MENU','MENÚ DEL TUTORIAL')):'')+button('start',tutorial?done.size?L('CONTINUE / REPLAY','CONTINUAR / REPETIR'):L('START LESSON','EMPEZAR LECCIÓN'):L('START PRACTICE','EMPEZAR PRÁCTICA'),true);
  }
  screen.innerHTML=`<div class="practice-shell"><header><span>TOP DOWN PADEL / ${tutorial?L('TUTORIAL','TUTORIAL'):L('FREE PRACTICE','PRÁCTICA LIBRE')}</span><button data-practice="language">${language==='es'?'ES / EN':'EN / ES'}</button></header><h1>${title}</h1>${body}<footer>${actions}</footer></div>`;
  screen.querySelector('#practice-speed')?.addEventListener('input',e=>{gameSpeed=clamp(Number(e.target.value),25,150);$('#practice-speed-value').textContent=gameSpeed+'%';bounceRefresh=0;feedPredictionKey='';try{localStorage.setItem('padelmaster-training-speed',String(gameSpeed));}catch{}});
  screen.querySelector('#practice-lesson')?.addEventListener('change',e=>{step=Number(e.target.value);active=false;drawMenu();});
  screen.querySelector('#practice-feed')?.addEventListener('change',e=>{feed=e.target.value;active=false;drawMenu();});
  screen.querySelector('#practice-pace')?.addEventListener('change',e=>{pace=e.target.value;active=false;drawMenu();});
  screen.querySelector('footer .primary')?.focus();
 }
 function renderHud(){hudText=null;hudColor=null;if(drill){drillHud();return;}
  hud.innerHTML=`<div class="coach-copy"><b>${tutorial?`${order.indexOf(step)+1} / ${lessons.length} · ${L(lesson()[1],lesson()[2])}`:L('FREE PRACTICE','PRÁCTICA LIBRE')}</b><span>${instruction()}</span><small>${controls()}</small></div><div class="coach-actions">${tutorial?`<em>${demo?L('WATCH THE DEMO','MIRA LA DEMOSTRACIÓN'):L('YOUR TURN · ONE GOOD SHOT','TU TURNO · UN BUEN GOLPE')}</em>${button(demo?'try':'watch',demo?L('TRY IT','PROBAR'):L('WATCH AGAIN','VER EJEMPLO'),demo)}`:''}${button('pause',L('‹ LESSONS / MENU','‹ LECCIONES / MENÚ'))}</div><strong id="practice-feedback" aria-live="polite"></strong>`;
 }
 function stage(watch=false){
  demo=tutorial&&watch;demoInk=null;suspended=false;
  active=true;unlockAudio();clearInput();endsChanged=!!end;pendingEndChange=false;globalThis.humanPosition=0;globalThis.careerSession=false;globalThis.trainingSession=true;globalThis.playerCharacter=appearance;resetPlayers();players=[{...players[0],human:true,team:0,name:globalThis.customPlayerName||'YOU',appearance}];
  score=[0,0];games=[0,0];hits=0;best=0;celebration=null;effects=[];trail=[];gestureStrokes=[];energy=1;afterPointAge=2;notice='';noticeTime=0;
  $('#intro').classList.add('hidden');$('#paused').classList.add('hidden');$('#point-result').classList.add('hidden');document.body.classList.remove('meta-visible');document.body.classList.add('practice-active');
  screen.classList.add('hidden');hud.classList.remove('hidden');state='play';phase='waiting';timer=1.25;feedCount=0;feedBounces=[];feedback='';renderHud();position();prepareFeed();parkBall();resize();canvas.focus();globalThis.captureMouse?.();
 }
 // The demonstration runs the real feed, racket contact and ball solver. It never saves progress.
 function demoPlan(){const k=key(),power=k==='drop'?.2:k==='vibora'?.72:k==='smash'?.9:k==='finisher'?.92:.6,spin=['slice','bandeja'].includes(k)?-.65:['topspin','vibora'].includes(k)?.65:0;
  return {power,lob:k==='lob',spin,aim:{x:end?-1:1,y:0,mouse:true,targetX:flip(k==='drop'?590:820),targetY:250,spin}};
 }
 function demoShot(p){
  if(phase!=='incoming'||attempt)return;
  const k=key(),plan=demoPlan(),family=shotFamily(plan.lob,plan.power,ball,p,plan.spin);
  const requested={backhand:'BACKHAND',volley:'VOLLEY',drop:'VOLLEY',bandeja:'BANDEJA',vibora:'VÍBORA',smash:'SMASH',lob:'LOB'}[k];
  if(ball.z>205||!racketContact(p,ball)||(requested?family!==requested:ball.bounces<1)||k==='backglass'&&!ball.practiceBack||k==='sideglass'&&!ball.practiceSide||['timing','finisher'].includes(k)&&releaseTiming(p)!=='PERFECT')return;
  if(hit(p,plan.lob,plan.power,plan.aim,'PERFECT')){
   demoInk={x:ball.x,y:ball.y-ball.z*.28,at:clock,...plan};feedback=L('RELEASE → WATCH THE FLIGHT','SUELTA → MIRA LA TRAYECTORIA');feedbackUntil=clock+2;
  }
 }

 function feedType(){if(drill)return drill.task.feed;return tutorial?lesson()[5]:feed==='mixed'?['ground','volley','overhead','backglass','sideglass'][feedCount%5]:feed;}
 function position(){const p=players[0],f=feedType();p.x=flip(f==='volley'?390:f==='overhead'?390:f==='backglass'?120:f==='sideglass'?110:130);p.y=f==='sideglass'?95:250;p.angle=end?Math.PI:0;p.vx=p.vy=0;p.cool=0;}
 function feedSpeed(){if(drill)return drill.def.weekly ? .57 : .48;return tutorial?(step<=5?.40:.52):pace==='fast'?.85:pace==='normal'?.65:.45;}
 function prepareFeed(){const f=feedType();machine.x=flip(830);machine.y=f==='sideglass'?300:250;let tx=180,ty=250,vz=120;
  if(f==='backhand')ty=end?284:216;
  if(f==='ground'&&(drill||tutorial&&key()==='drive'))ty=end?218:282;
  if(f==='volley'){tx=325;vz=55;}
  if(f==='overhead'){tx=300;vz=330;}
  if(f==='backglass'){tx=65;vz=35;}
  if(f==='sideglass'){tx=115;ty=30;vz=30;}
  machine.angle=Math.atan2(ty-machine.y,flip(tx)-machine.x);return {f,tx:flip(tx),ty,vz};
 }
 // Predict once per feed with the same solver and speed as the real ball.
 function predictFeed(){feedBounces=floorBounceTargets(ball,2);feedPredictionAt=clock;feedPredictionKey=ball.bounces+':'+(ball.glassTouches||0);}
 function bounceMarkers(){
  if(!active||attempt||phase!=='incoming'||state!=='play')return [];
  const key=ball.bounces+':'+(ball.glassTouches||0);
  if(key!==feedPredictionKey||clock-feedPredictionAt>=.15)predictFeed();
  return feedBounces.map(b=>({...b,eta:Math.max(0,b.eta-(clock-feedPredictionAt))}));
 }
 function parkBall(){ball={x:machine.x,y:machine.y,z:38,vx:0,vy:0,vz:0,last:1,bounces:0,power:.5,shotColor:shotColor(.5),shotKind:'DRIVE'};}
 function launch(){
  clearInput();const f=feedType();if(tutorial||drill)position();attempt=null;incoming=null;age=0;if(tutorial&&key()==='finisher')players[0].finisherCharge=5;trail=[];bounceRefresh=0;shotSerial++;phase='incoming';
  if(f==='serve'){
   const p=players[0];p.x=flip(100);p.y=360;p.angle=end?Math.PI:0;serverIndex=0;serveAttempt=1;receiveLane=0;serveLane=1;serveTimer=999;const r=racketPose(p,0,22);ball={x:r.x,y:r.y,z:22,vx:0,vy:0,vz:0,last:0,bounces:0};state='serve';return;
  }
  const plan=prepareFeed();parkBall();ball.x+=Math.cos(machine.angle)*36;ball.y+=Math.sin(machine.angle)*36;
  if(f==='overhead')ball.shotKind='LOB';if(f==='backglass'||f==='sideglass'){ball.power=.3;ball.shotColor=shotColor(.3);}
  Object.assign(ball,trajectory(ball.x,ball.y,ball.z,plan.tx,plan.ty,plan.vz),{practiceFeedSpeed:feedSpeed()});machine.recoil=1;feedCount++;if(drill){drill.used++;renderHud();}predictFeed();sfx('hit',.2);feedback='';feedbackUntil=clock+1.7;
 }
 function onHit(b,shot){if(drill&&phase!=='incoming')return;feedBounces=[];incoming=b;attempt={...shot};phase='outgoing';age=0;hits=0;notice='';noticeTime=0;}
 function success(b){
  if(!attempt)return false;
  const k=key(),a=attempt;
  if(k==='slice')return a.spin<-.035;if(k==='topspin')return a.spin>.035;if(k==='finisher')return !!a.finisher;
  if(k==='drive')return a.kind==='DRIVE';if(k==='backhand')return a.kind==='BACKHAND';
  if(k==='timing')return a.timing==='PERFECT';
  if(k==='depth')return (end?b.x<250:b.x>750)&&b.y>50&&b.y<450;
  if(k==='lob')return a.kind==='LOB'&&(end?b.x<250:b.x>750);
  if(k==='backglass')return incoming.glassTouches>0&&incoming.practiceBack;
  if(k==='sideglass')return incoming.glassTouches>0&&incoming.practiceSide;
  if(k==='volley')return incoming.bounces===0&&incoming.z<90&&a.kind==='VOLLEY';
  if(k==='drop')return a.kind==='DROP SHOT'&&Math.abs(b.x-500)<160;
  if(k==='bandeja')return a.kind==='BANDEJA'&&a.spin<-.035;if(k==='vibora')return a.kind==='VÍBORA'&&a.spin>.035;if(k==='smash')return a.kind==='SMASH';
  return k==='serve'&&a.kind==='SERVE';
 }
 function complete(){if(demo){phase='waiting';timer=2;afterPointAge=0;return;}done.add(step);save();phase='success';afterPointAge=0;afterPointExit=false;timer=1.5;feedback=L('✓ COMPLETE!','✓ ¡COMPLETADO!');feedbackUntil=clock+2;clearInput();ring(players[0].x,players[0].y,'#d7ff50');sfx('hit',.7);}
 function correction(reason){
  if(!attempt)return L('Missed. Move behind the ball and release near contact.','Sin contacto. Colócate detrás y suelta cerca de la bola.');
  if(reason!=='IN')return reason==='NET'?L('NET · Aim through the net with more height.','RED · Busca más altura para pasar la red.'):L('OUT · Aim inside and shorten your stroke.','FUERA · Apunta dentro y acorta el trazo.');
  if(key()==='slice'||key()==='topspin')return instruction();
  if(key()==='timing'||key()==='finisher')return attempt.timing==='EARLY'?L('EARLY · Let it come closer.','PRONTO · Deja que se acerque.'):L('LATE · Release a little earlier.','TARDE · Suelta un poco antes.');
  if(['bandeja','vibora','smash','drop'].includes(key()))return L('Use the requested power color and contact height.','Usa el color de potencia y la altura indicados.');
  if(key()==='lob'||key()==='depth')return L('Land deeper inside the highlighted target.','Busca más profundidad dentro de la zona marcada.');
  if(key().includes('glass'))return L('Let it touch the requested glass first.','Deja que toque el cristal indicado primero.');
  return L('IN · Good return. Now try the requested shot / target.','DENTRO · Buena devolución. Prueba el golpe / objetivo indicado.');
 }
 function onFloor(b){if(phase!=='outgoing'||b.last!==0)return;if(drill){drillResolve(b);return;}if(demo){resolve('IN');return;}if(!tutorial){resolve('IN');return;}if(success(b))complete();else resolve('IN');}
 function resolve(reason){if(!active||!['incoming','outgoing'].includes(phase))return;if(drill){drillResolve(null);return;}
  feedback=demo?L('WATCH THE TRACE · THEN TRY IT','MIRA EL TRAZO · LUEGO PRUEBA'):tutorial?correction(reason):!attempt?L('NO CONTACT','SIN CONTACTO'):reason==='IN'?L('IN ✓','DENTRO ✓'):reason==='NET'?L('NET','RED'):L('OUT','FUERA');feedbackUntil=clock+3;
  phase='waiting';feedBounces=[];prepareFeed();timer=tutorial?2.2:pace==='fast'?.65:pace==='normal'?1.3:2.1;state='play';clearInput();afterPointAge=0;afterPointExit=reason.includes('OUT');
 }
 function tick(dt){
  if(state==='paused')return;
  if(drill&&Date.now()>=drill.def.expires){drillPanel('expired');return;}
  clock+=dt;machine.recoil=Math.max(0,machine.recoil-dt*5);noticeTime=0;hits=0;comboPulse=0;effects.forEach(e=>e.t-=dt);effects=effects.filter(e=>e.t>0);
  if(drill&&phase==='drill-between'){
   animateAfterPoint(dt);timer-=dt;updateFeedback();
   if(timer<=0){
    if(drill.count>=drill.def.goal)drillPanel('complete');
    else if(drill.used>=drill.limit)drillPanel('series');
    else {setTask();phase='waiting';timer=1.25;position();prepareFeed();parkBall();renderHud();}
   }return;
  }
  if(phase==='success'){animateAfterPoint(dt*(ball.practiceFeedSpeed||1));timer-=dt;if(timer<=0){const next=order[order.indexOf(step)+1];if(next===undefined){active=false;drawMenu('complete');}else{step=next;stage(true);}}updateFeedback();return;}
  if(phase==='waiting'){animateAfterPoint(dt*(ball.practiceFeedSpeed||1));timer-=dt;if(timer<=0){if(tutorial&&key()==='move'){phase='move';position();parkBall();}else launch();}}
  const p=players[0];p.cool=Math.max(0,p.cool-dt);p.swing=Math.max(0,p.swing-dt);
  if(state==='serve'){
   if(demo&&!p.servePending&&age>.9){const dx=end?-600:600,dy=-220,n=Math.hypot(dx,dy);queueServe(p,.5,{x:dx/n,y:dy/n,mouse:true});demoInk={x:p.x,y:p.y,at:clock,power:.5,spin:0,aim:{x:dx/n,y:dy/n}};}age+=dt;
   advanceCharge(dt);const r=racketPose(p,0,22);ball.x=r.x;ball.y=r.y;
   if(p.servePending){p.serveWindup-=dt;ball.z=22*Math.abs(1-2*clamp(1-p.serveWindup/.45,0,1));if(p.serveWindup<=0){launchServe(p.servePending);attempt={kind:'SERVE',power:ball.power,timing:'PERFECT'};phase='outgoing';age=0;}}else ball.z=22;
  }else{
   if(!demo&&isCasual(p))updateCasualBoost(p,dt,keys.ShiftLeft||keys.ShiftRight);
   const automatic=!demo&&isCasual(p)?casualAxes(p,phase==='move'?{x:flip(260),y:250}:null):null;
   const dx=automatic?automatic.x:demo?(phase==='move'?Math.sign(flip(260)-p.x):0):(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joy.x,dy=automatic?automatic.y:demo?0:(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0)+joy.y,n=Math.max(1,Math.hypot(dx,dy)),speed=humanMoveSpeed(p);
   p.vx+=(dx/n*speed-p.vx)*Math.min(1,dt*16);p.vy+=(dy/n*speed-p.vy)*Math.min(1,dt*16);p.x+=p.vx*dt;p.y+=p.vy*dt;p.gait+=Math.hypot(p.vx,p.vy)*dt*.095;constrainPlayer(p);faceBall(p,dt);
   if(phase==='move'&&Math.hypot(p.x-flip(260),p.y-250)<42)complete();
   if(demo)demoShot(p);
   if(!demo&&['incoming','outgoing'].includes(phase)){advanceCharge(dt);if(pendingShot){const s=pendingShot;if(hit(p,s.lob,s.power,s.aim,s.timing))pendingShot=null;else if((s.remaining-=dt)<=0){pendingShot=null;p.swing=.22;}}}
  }
  if(state==='play'&&['incoming','outgoing'].includes(phase)){
   age+=dt;const oldGlass=ball.glassTouches||0,oldVX=ball.vx,oldVY=ball.vy;
   if(!demo)updateContactAssist(dt);physics(ball,dt);if((ball.glassTouches||0)>oldGlass){if(oldVX*ball.vx<0)ball.practiceBack=true;if(oldVY*ball.vy<0)ball.practiceSide=true;}
   trail.push({x:ball.x,y:ball.y,z:ball.z,color:ball.shotColor});if(trail.length>40)trail.shift();if(age>14)resolve('TIMEOUT');
  }updateFeedback();
 }
 function updateFeedback(){const el=$('#practice-feedback');if(!el)return;const value=clock<feedbackUntil?feedback:'',color=phase==='success'?'#d7ff50':attempt?shotColor(attempt.power):'#eef6fa';if(value!==hudText){el.textContent=value;hudText=value;}if(color!==hudColor){el.style.color=color;hudColor=color;}}
 function draw(){if(!active)return;if(drill)drillTarget();
  // Animated gesture example is anchored at contact, with the same power palette as live ink.
  if(demo&&demoInk){const age=clock-demoInk.at,t=clamp(age/.55,0,1),d=demoInk,len=70+130*d.power;
   if(age<2){ctx.save();ctx.translate(d.x,d.y);ctx.strokeStyle=shotColor(d.power);ctx.fillStyle=shotColor(d.power);ctx.globalAlpha=Math.min(1,(2-age)/.5);ctx.lineCap='round';ctx.lineWidth=6;
    ctx.beginPath();for(let i=0;i<=30*t;i++){const u=i/30,x=d.aim.x*len*u,y=(d.aim.y||0)*len*u-d.spin*55*Math.sin(Math.PI*u);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
    const x=d.aim.x*len*t,y=(d.aim.y||0)*len*t-d.spin*55*Math.sin(Math.PI*t);ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.fill();ctx.restore();}
  }

  // Fixed chassis, rotating launch head: the muzzle is also the ball's real origin.
  ctx.save();ctx.translate(machine.x,machine.y);
  ctx.fillStyle='#020b1690';ctx.beginPath();ctx.ellipse(4,9,36,29,0,0,Math.PI*2);ctx.fill();
  for(const y of [-26,20]){ctx.fillStyle='#081420';ctx.fillRect(-22,y,44,9);for(let x=-17;x<23;x+=8)line(x,y+1,x,y+7,'#476078',2);}
  ctx.fillStyle='#d9edf1';ctx.beginPath();ctx.roundRect(-28,-22,56,44,9);ctx.fill();ctx.strokeStyle='#69c8e4';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='#173a50';ctx.beginPath();ctx.roundRect(-23,-17,46,34,6);ctx.fill();
  for(let x=-17;x<=15;x+=8)line(x,-13,x,13,'#33596c',2);
  ctx.fillStyle='#76e6c5';ctx.beginPath();ctx.arc(-21,-16,3,0,Math.PI*2);ctx.fill();
  ctx.rotate(machine.angle);ctx.translate(-machine.recoil*3,0);
  ctx.fillStyle='#0a2033';ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#7bbbd0';ctx.stroke();
  ctx.fillStyle='#b8dce7';ctx.beginPath();ctx.roundRect(0,-10,34,20,5);ctx.fill();
  ctx.fillStyle='#36b6e5';ctx.fillRect(11,-8,14,16);ctx.fillStyle='#081923';ctx.fillRect(31,-8,7,16);
  line(38,-5,38,5,'#d7ff50',3);line(4,0,28,0,'#f3fcff',2);
  ctx.fillStyle='#102638';ctx.beginPath();ctx.roundRect(-24,-14,18,28,4);ctx.fill();
  for(const [x,y] of [[-18,-8],[-13,0],[-18,8]]){ctx.fillStyle='#e8ef59';ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();line(x-2,y-2,x+1,y+2,'#b2c74b',1);}
  ctx.restore();
  // Match-style targets, numbered for the incoming drill only. No stale markers on returns.
  for(const b of bounceMarkers())drawFloorBounceMarker(b,b.n===1?'#a8edff':'#ffd66b');

  if(tutorial){let x0=flip(260),y0=250,w=82,h=82;if(key()==='depth'||key()==='lob'){x0=flip(850);w=180;h=360;}else if(key()==='drop'){x0=flip(590);w=140;h=330;}else if(key()==='serve'){x0=flip(675);y0=125;w=340;h=230;}else if(phase!=='move')return;ctx.save();ctx.strokeStyle='#d7ff50';ctx.fillStyle='#d7ff5014';ctx.lineWidth=3;ctx.setLineDash([9,7]);ctx.fillRect(x0-w/2,y0-h/2,w,h);ctx.strokeRect(x0-w/2,y0-h/2,w,h);ctx.restore();}
 }
 function stop(){drill=null;if(active||!screen.classList.contains('hidden')){speedMode=null;applyModeSpeed(globalThis.preferredControlMode);}active=false;demo=false;suspended=false;screen.classList.add('hidden');hud.classList.add('hidden');document.body.classList.remove('practice-active');clearInput();}
 function open(mode,character){stop();gameSpeed=globalThis.trainingSpeed?.()||70;tutorial=mode==='tutorial';appearance=character;step=order.find(i=>!done.has(i))??0;$('#intro').classList.add('hidden');document.body.classList.remove('meta-visible');drawMenu();}
 function resume(){screen.classList.add('hidden');hud.classList.remove('hidden');state=phase==='incoming'&&feedType()==='serve'?'serve':'play';renderHud();resize();canvas.focus();globalThis.captureMouse?.();}
 function back(){if(drill){if(drill.result==='pause'){drill.result='';resume();}else leaveDrill();return;}if(suspended){if(active)resume();else stage(tutorial);return;}stop();globalThis.openTrainingHub?.();}
 function action(e){const b=e.target.closest('[data-practice]');if(!b)return;const [a,v]=b.dataset.practice.split(':');if(drill){
   if(a==='challenge-exit')leaveDrill();
   else if(a==='challenge-pause')drillPanel('pause');
   else if(a==='challenge-retry')globalThis.retrySkillChallenge?.();
   else if(a==='challenge-resume'){drill.result='';resume();}
   return;
  }if(a==='end'){end=Number(v);active=false;drawMenu();}else if(a==='language'){setLanguage(language==='es'?'en':'es');drawMenu(menuView);}else if(a==='start'||a==='watch')stage(tutorial);else if(a==='try')stage(false);else if(a==='setup'||a==='pause'){suspended=active;drawMenu();}else if(a==='resume')resume();else if(a==='hub'){stop();globalThis.openTrainingHub?.();}else if(a==='free'){active=false;tutorial=false;suspended=false;drawMenu();}else if(a==='exit')back();}
 screen.addEventListener('click',action);hud.addEventListener('click',action);
 addEventListener('keydown',e=>{if(e.code==='Escape'&&(drill||!screen.classList.contains('hidden'))){e.preventDefault();e.stopImmediatePropagation();if(drill)leaveDrill();else back();}},true);
 globalThis.Practice={get active(){return active;},get tutorial(){return active&&tutorial;},get demonstrating(){return active&&demo;},get finisherLesson(){return active&&tutorial&&key()==='finisher';},open,openChallenge,stop,tick,draw,bounceMarkers,onHit,onFloor,resolve,menu:()=>{suspended=active;drawMenu();},isMenu:()=>!screen.classList.contains('hidden'),back,lessons};
})();
