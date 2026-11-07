function syncControlTheme(mode){applyModeSpeed(mode);document.body?.classList.toggle('competitive-theme',mode==='competitive');}
'use strict';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d'),$=s=>document.querySelector(s);
const W=1000,H=500,G=440,NET=30,keys={};let state='intro',beforePause='play',last=0,acc=0,clock=0,ball,players=[],score=[0,0],games=[0,0],sets=[0,0],completedSets=[],tiebreak=false,hits=0,best=0,wait=0,notice='',noticeTime=0,energy=1,dash=0,sound=true,audio,trail=[],effects=[],scale=1,ox=0,oy=0,cw=0,ch=0,joy={x:0,y:0};
let shotTouch=null,lobTapUntil=0;
let charge=null,pendingShot=null,network=null,gameSpeed=100,swipeSensitivity=80,showAimDot=true,showMouseCursor=false;
let speedMode=null;
let showPlayerNames=false;
try{showPlayerNames=localStorage.getItem('tdp-player-names')==='on';}catch{}
function applyModeSpeed(mode){mode=mode==='casual'?'casual':'competitive';if(speedMode===mode)return;speedMode=mode;gameSpeed=mode==='casual'?70:100;try{const saved=Number(localStorage.getItem('padelmaster-speed-'+mode));if(saved>=25&&saved<=150)gameSpeed=saved;}catch{}}
// Migrate the slider without changing an existing player's effective power.
function swipeGain(value=swipeSensitivity){return (value<=80?value*.5:value-40)/100;}
try{const saved=Number(localStorage.getItem('padelmaster-swipe-sensitivity-v2'));if(saved>=5&&saved<=200)swipeSensitivity=saved;else{const old=Number(localStorage.getItem('padelmaster-swipe-sensitivity'));if(old>=20&&old<=150)swipeSensitivity=old<=40?old*2:old+40;}showMouseCursor=localStorage.getItem('padelmaster-mouse-cursor')==='on';showAimDot=localStorage.getItem('padelmaster-aim-dot')!=='off';}catch{}
function baseBallPace(b){if(b.shotKind==='LOB')return 1.35*(gameSpeed>150?gameSpeed/150:Math.min(1,gameSpeed/100));const fast=clamp(((b.power||0)-.65)/.2,0,1),gentle=gameSpeed>150?gameSpeed/150:Math.min(1,gameSpeed/100);return gentle+(gameSpeed/150-gentle)*fast;}
function rallyPace(count=hits){
 const progress=rallyHeat(count);
 const ramp=globalThis.matchControlMode==='casual'?progress*(2-progress):progress;
 return 1+2*ramp;
}
function rallyHeat(count=hits){return clamp(count/50,0,1);}
function ballPace(b){if(b.practiceFeedSpeed)return (b.contactPace||1)*b.practiceFeedSpeed*gameSpeed/70;return (b.contactPace||1)*(b.paceBoost||1)*baseBallPace(b)*(b.serve?1:rallyPace());}
function hotBallColor(b){return hits>=50?'#ff4934':ballOutOfReach(b)?'#62ed9b':'#e6ef55';}
const localSlot=()=>network?.active?network.slot:(globalThis.humanPosition??0);
const isLocal=p=>players.indexOf(p)===localSlot();
function teamLabel(team){
 const members=players.filter(player=>player.team===team);
 if(globalThis.careerSession&&team===1&&members.length===2&&members.every(player=>player.appearance?.clubTactic))
  return language==='es'?'Rivales del club':'Club Rivals';
 if(network?.active||globalThis.rosterLineup)return members.map(player=>player.displayName||player.name).join(' + ');
 return team===0?'YOU + CESAR':'ALBERT + KIKE';
}
let defaultMatchGames=1,matchGames=1,endsChanged=false,pendingEndChange=false;
try{const saved=Number(localStorage.getItem("padelmaster-match-games"));if(localStorage.getItem("padelmaster-match-games")!==null&&[0,1,3,5,9].includes(saved))defaultMatchGames=saved;}catch{}
function courtSide(team){return Number(team)^Number(endsChanged);}
function matchDurationLabel(n=matchGames){return n===1?"ONE GAME":n===0?"BEST OF 3 SETS":"BEST OF "+n+" GAMES";}
let lastResult=null,pointRemaining=0,afterPointAge=2,afterPointExit=false;
const shotColor=q=>q<.35?'#60c7ff':q<.65?'#69e49a':q<.85?'#ffe16b':'#ff645f';
const LEVELS={beginner:{speed:130,reaction:.48,error:.065,power:.40},club:{speed:162,reaction:.32,error:.032,power:.52},advanced:{speed:215,reaction:.13,error:.008,power:.68}};
let partnerLevel='club',rivalLevel='club',gameTurn=1,tbStart=1,serveAttempt=1,serveTimer=0,serverIndex=2,receiveLane=1,serveLane=0,shotSerial=0,pointNumber=0;
let pointLog=[],targetCounts=[0,0],stats={smashes:0,exits:0,errors:0,points:0};
const serviceOrder=[0,2,1,3];
// Equal twelve-point budgets: personality without large roster advantages.
function characterAttributes(p){const progression=globalThis.progressionAttributes?.(p);if(progression)return progression;const patterns=[[4,3,3,2],[3,4,2,3],[3,2,4,3],[2,3,3,4],[3,3,3,3]];const a=p?.balancedStats||patterns[(p?.id??0)%patterns.length];return {technique:a[0],power:a[1],stamina:a[2],speed:a[3]};}
function characterBaseStats(p){const a=characterAttributes(p);return {speed:170+(a.speed-3)*6,reaction:.30-(a.stamina-3)*.025,error:.028-(a.technique-3)*.003,power:.54+(a.power-3)*.025};}
function levelOf(p){const numeric=Number(p.aiLevel);if(Number.isInteger(numeric)&&numeric>=1&&numeric<=15){const a=characterAttributes(p.appearance);return {speed:[125,137,149,157,162,168,183,198,215,230,240,250,260,270,280][numeric-1]*(1+(a.speed-3)*.025),reaction:[.46,.42,.38,.35,.33,.30,.25,.20,.15,.11,.095,.08,.065,.05,.035][numeric-1]*(1-(a.stamina-3)*.035),error:Math.max(.002,.042-numeric*.003)*(1-(a.technique-3)*.06),power:.35+numeric*.027+(a.power-3)*.015};}const selected=p.aiLevel||(p.team===0?partnerLevel:rivalLevel),base=LEVELS[selected]||LEVELS.club;if(p.rosterStats){const factor=selected==='beginner'?.84:selected==='advanced'?1.12:1;return {...p.rosterStats,speed:p.rosterStats.speed*factor,reaction:p.rosterStats.reaction/(selected==='beginner'?.75:selected==='advanced'?1.35:1),error:p.rosterStats.error/(selected==='beginner'?.8:selected==='advanced'?1.3:1)};}return base;}

function shotDifficulty(p){
 const speed=Math.hypot(ball?.vx||0,ball?.vy||0)*ballPace(ball||{}),run=Math.hypot(p.vx||0,p.vy||0);
 return clamp(.45*clamp((speed-260)/550,0,1)+.25*clamp(run/190,0,1)+.2*clamp((25-(ball?.z||25))/25,0,1)+.1*clamp((Math.hypot((ball?.x||p.x)-p.x,(ball?.y||p.y)-p.y)-38)/30,0,1),0,1);
}
function errorChance(p,power,smash=false){
 if(p.human)return clamp(.006+.045*power*power+.12*Math.max(0,power-.82)+(smash?.008:0),.005,.22);
 const d=shotDifficulty(p),reliable=globalThis.matchControlMode==='casual'?.55:Number(p.aiLevel)<=3?.72:1;return clamp(reliable*(levelOf(p).error*(.035+.8*d*d)+.06*d*d*(1-.6*clamp(((Number(p.aiLevel)||0)-10)/5,0,1))+.2*Math.max(0,power-.8)**2+(smash?.006*d:0)+rallyHeat()*(.012+.065*d)),.0005,.24);
}
let teamAtNet=[false,false];
function aiRecovery(p){
 const incoming=ball.last!==p.team,lobThreat=incoming&&ball.shotKind==='LOB';
 if(lobThreat)teamAtNet[p.team]=false;
 if(incoming&&ball.smash&&ball.power>=.85)return {x:courtSide(p.team)?600:400,y:clamp(ball.y+(p.lane?65:-65),p.lane?290:55,p.lane?445:210)};
 const partner=players.find(q=>q!==p&&q.team===p.team);
 // Shift with the ball, cover the middle, and follow a partner's advance.
 const opponentDepth=courtSide(p.team)?ball.x:1000-ball.x;
 const safeFlight=!incoming&&ball.crossed&&opponentDepth<260;
 const partnerForward=partner&&Math.abs(partner.x-500)<185;
 const press=p.appearance?.clubTactic==='net'&&(!incoming||opponentDepth<260);
 const attack=!lobThreat&&(press||teamAtNet[p.team]||safeFlight||partnerForward);
 const depth=attack?105+clamp(Math.abs(ball.y-p.y)*.12,0,45):lobThreat?375:incoming?335:255;
 const x=500+(courtSide(p.team)?1:-1)*depth;
 const base=p.lane?355:145;
 const y=clamp(base+(ball.y-250)*.24,p.lane?290:55,p.lane?445:210);
 return {x,y};
}

function serverForPoint(){const n=score[0]+score[1];return serviceOrder[(tiebreak?tbStart+(n===0?0:1+Math.floor((n-1)/2)):gameTurn)%4];}
function setupServe(attempt=1){
 teamAtNet=[false,false];
 shakeTime=0;shakeX=shakeY=0;bounceTarget=null;bounceKey='';
 $('#point-result').classList.add('hidden');
 pendingEndChange=false;
 cancelShot();resetPlayers(true);hits=0;comboPulse=0;celebration=null;trail=[];serveAttempt=attempt;serverIndex=serverForPoint();const p=players[serverIndex];
 const parity=(score[0]+score[1])%2;serveLane=courtSide(p.team)===0?1-parity:parity;receiveLane=1-serveLane;
 // Golden point: the receivers choose the receiving side.
 if(!tiebreak&&score[0]===3&&score[1]===3){receiveLane=p.team===1?Number($('#golden-receiver').value||1):Math.floor(Math.random()*2);serveLane=1-receiveLane;}
 // Defensive receiving stance behind x=150 / x=850 service lines.
 for(const receiver of players)if(receiver.team!==p.team){receiver.x=courtSide(receiver.team)?905:95;receiver.y=receiver.lane?355:145;}
 // The partner covers their rally lane about 2.5 m from the net.
 const partner=players.find(q=>q.team===p.team&&q!==p);
 partner.x=courtSide(p.team)?625:375;
 partner.y=partner.lane?355:145;
 teamAtNet[p.team]=true;
 p.x=courtSide(p.team)?900:100;p.y=serveLane?360:140;
 p.angle=Math.atan2((receiveLane?355:145)-p.y,(courtSide(p.team)?210:790)-p.x);const ready=racketPose(p,0,22);
 ball={x:ready.x,y:ready.y,z:22,vx:0,vy:0,vz:0,last:p.team,bounces:0};state='serve';serveTimer=p.human?10:1.8;
 message((p.displayName||p.name)+' · '+(attempt===1?'FIRST':'SECOND')+' SERVE');noticeTime=1.8;
 setText($('#serveinfo'),(p.displayName||p.name)+' SERVING · '+(attempt===1?'1ST':'2ND')+' · DIAGONAL '+(receiveLane?'BOTTOM':'TOP'));
}
function trajectory(x,y,z,tx,ty,vz){const t=(vz+Math.sqrt(vz*vz+2*G*z))/G;return {vx:(tx-x)/t,vy:(ty-y)/t,vz,targetX:tx,targetY:ty};}
function queueServe(p,power,aim){
 if(state!=='serve'||p!==players[serverIndex]||!p.human||p.servePending)return false;
 p.servePending={power:clamp(power,0,1),aim:{...aim}};p.serveWindup=.45;
 const dir=swipeDirection(p,aim);p.angle=Math.atan2(dir.y,dir.x);return true;
}
function launchServe(manual=null){
 const p=players[serverIndex],depth=185+Math.random()*55,tx=courtSide(p.team)?depth:1000-depth,ty=receiveLane?355:145;
 // Automatic underarm serve after the visible pre-serve bounce, below waist height.
 if(manual){const dir=swipeDirection(p,manual.aim);p.angle=Math.atan2(dir.y,dir.x);}else p.angle=Math.atan2(ty-p.y,tx-p.x);const servePose=racketPose(p,0,22);ball.x=servePose.x;ball.y=servePose.y;ball.z=22;p.impactAngle=0;p.contactZ=22;let shot=trajectory(ball.x,ball.y,ball.z,tx,ty,170);
 const chance=(p.human?.035:levelOf(p).error*.65)*(serveAttempt===2?.45:1);
 if(!manual&&Math.random()<chance){if(Math.random()<.5)shot.vz=40;else shot=trajectory(ball.x,ball.y,22,courtSide(p.team)?70:930,ty,170);}
 if(manual)shot=disperseShot(shotPlan(p,false,manual.power,manual.aim,ball),manual.power,ball,false,globalThis.Practice?.tutorial?0:1);
 Object.assign(ball,shot,{swipeFlight:!!manual?.aim?.swipe,power:manual?.power??.35,shotColor:shotColor(manual?.power??.35),shotKind:'SERVE',gestureSpin:0,spinGravity:1,serve:true,netTouch:false,receiverLane:receiveLane,legalBounce:false,wallLifted:false,glassTouches:0,smash:false,bounces:0,crossed:false,last:p.team});
 anchorGestureImpact(p,ball.x,ball.y,ball.z);p.servePending=null;p.serveWindup=0;p.netCharge=null;if(isLocal(p))charge=null;p.swing=.22;state='play';shotSerial++;markReaction();p.lobSwing=false;sfx('hit',manual?.power??.35);message('SERVE · LET IT BOUNCE');
 // Fixed rally quadrants are retained; the serving stance alone alternates sides.
 if(!p.human)p.returningServe=true;
}
function serveFault(reason){if(globalThis.Practice?.active){Practice.resolve(reason);return;}if(state!=='play')return;cancelShot();if(serveAttempt===1){state='fault';wait=matchDelays.serve;afterPointAge=0;afterPointExit=reason.includes('OUT');message('FAULT · '+reason+' · SECOND SERVE');}else{stats.errors++;point(1-ball.last,'DOUBLE FAULT · '+reason);}}
function serveLet(){if(state!=='play')return;state='let';wait=1.5;afterPointAge=0;afterPointExit=false;cancelShot();message('LET · REPLAY '+(serveAttempt===1?'FIRST':'SECOND')+' SERVE');}
function markReaction(){for(const p of players)if(!p.human)p.readyAt=clock+levelOf(p).reaction+(ball.smash?.12:0);}
function updatePointLog(){ setText($('#pointlog'),pointLog.slice(-3).reverse().join('  /  ')||'Serve → rally → point → next serve'); }

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),side=x=>(x<500?0:1)^Number(endsChanged);
// Procedural audio: short filtered transients for ball contact, separate music bus.
let noiseSeed=9182,allMuted=false;
let music=true,musicTimer=null,musicStep=0,musicBus,fxBus,comboPulse=0,celebration=null;
function unlockAudio(){
 if(!audio){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;try { if (globalThis.navigator?.audioSession) navigator.audioSession.type='playback'; } catch {}
 audio=new AC();fxBus=audio.createGain();fxBus.gain.value=allMuted?0:.7;fxBus.connect(audio.destination);musicBus=audio.createGain();musicBus.gain.value=allMuted?0:.22;musicBus.connect(audio.destination);}
 if(audio.state!=='running') audio.resume()?.catch?.(()=>{});
 if(!musicTimer)musicTimer=setInterval(musicBeat,125);
}
// Touch activation also restores Web Audio after an OS interruption.
function wakeTouchAudio() {
 if (!allMuted && audio?.state !== 'running') unlockAudio();
}
addEventListener('touchend', wakeTouchAudio, {capture:true, passive:true});
addEventListener('pageshow', () => { if (audio && !allMuted) wakeTouchAudio(); });
function tone(freq,duration,volume=.1,type='sine',bus=fxBus,delay=0,end=freq){
 if(!audio||!bus)return;const t=audio.currentTime+delay,o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(bus);o.start(t);o.stop(t+duration);
}
function noise(duration,volume,frequency,bus=fxBus){
 if(!audio||!bus)return;const buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*duration),audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++){noiseSeed=(noiseSeed*1664525+1013904223)>>>0;data[i]=(noiseSeed/4294967296*2-1)*Math.exp(-i/data.length*7);}
 const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.8;gain.gain.value=volume;source.connect(filter);filter.connect(gain);gain.connect(bus);source.start();
}
function sfx(kind,power=.5){if(network?.active&&network.isHost)network.soundEvent(kind,power);if(!sound||!audio)return;
 // Layer short felt transients with damped resonances: no glass-shattering effects.
 const strength=.65+clamp(power,0,1)*.55;
 if(kind==='power-smash'){noise(.035,.64,2900);noise(.09,.28,820);tone(185,.14,.26,'sine',fxBus,0,52);}
 else if(kind==='hit'||kind==='smash'||kind==='lob'){
  const hard=kind==='smash'?1.2:kind==='lob'?.7:1;
  noise(.022,.42*strength*hard,2800);noise(.055,.2*strength,750);
  tone(165,.055,.13*strength*hard,'sine',fxBus,0,115);tone(390,.035,.045*hard,'sine',fxBus,.002,320);
 }else if(kind==='bounce'){
  noise(.018,.22*strength,950);tone(145,.065,.17*strength,'sine',fxBus,0,95);tone(310,.025,.035,'sine',fxBus,.002,250);
 }else if(kind==='glass'){
  noise(.016,.34*strength,1900);tone(125,.09,.13*strength,'sine',fxBus,0,110);
  for(const [f,d,v] of [[280,.16,.055],[465,.11,.035],[830,.07,.018]])tone(f,d,v*strength,'sine');
  noise(.075,.08,460);
 }else if(kind==='fence'){
  noise(.17,.3*strength,3200);tone(610,.12,.035,'sine');tone(1070,.09,.025,'sine',fxBus,.012);noise(.055,.1,1200);
 } else if(kind==='net')noise(.11,.3,550);
 else if(kind==='swing')noise(.1,.12,1800);
 else tone(640,.045,.045,'sine');
}
addEventListener('click',e=>{
 if(!['intro','paused'].includes(state)||allMuted||!e.target?.closest?.('button'))return;
 unlockAudio();
 if(sound&&audio&&!e.target.closest('#kit-room,#sound,#music'))tone(740,.055,.055,'triangle',fxBus,0,490);
},true);
function beep(){sfx('ui');}
function rallyMusicLevel(){return state==='play'?Math.min(4,Math.floor(hits/5)):0;}
function musicBeat(){if(!audio||!music||allMuted||document.hidden)return;
 if(state==='intro'||state==='paused'){
  const beat=musicStep++%32,root=[130.81,103.83,116.54,98][beat>>3];
  if(beat%4===0)tone(root/2,.36,.11,'triangle',musicBus);
  if(beat%8===2){tone(root*2,.45,.04,'sine',musicBus);tone(root*3,.42,.026,'sine',musicBus,.12);}
  if(beat%4===3)noise(.025,.045,4200,musicBus);
  return;
 }
 if(!['play','serve'].includes(state))return;const n=musicStep++%32,level=rallyMusicLevel();
 // Keep the beat locked; add layers every five hits rather than abruptly changing tempo.
 if(n%4===0)tone(125,.17,.28,'sine',musicBus,0,40);
 if(n%8===4)noise(.12,.18,1900,musicBus);
 if(n%2===0||level>=2)noise(.025,n%2?.045:.10,7500,musicBus);
 const bass=[55,55,65.41,49][Math.floor(n/8)];if(n%(level>=1?1:2)===0)tone(bass,.16,n%2?.07:.13,'triangle',musicBus);
 const melody=[440,523.25,659.25,587.33];
 if(n%4===2)tone(melody[Math.floor(n/8)],.12,.045,'triangle',musicBus);
 if(level>=2&&n%2===1)tone(melody[(n>>1)%4],.09,.035,'triangle',musicBus);
 if(level>=3&&n%4===0){tone(bass*4,.24,.045,'triangle',musicBus);tone(bass*6,.24,.025,'sine',musicBus);}
 if(level>=4&&n%8>=6)tone(melody[n%4]*2,.07,.026,'sine',musicBus);
}
function celebrate(team,result,reason){
 const exit=reason==='TRAÍDA'||/×[34]/.test(reason),big=result!=='POINT',major=result==='SET'||result==='MATCH',match=result==='MATCH',half=courtSide(team);
 celebration={team,result,exit,half,age:0,duration:match?5:major?3.2:big?2.2:1.8,particles:[]};
 if(exit)impactShake({punishing:true,smash:true});
 const party=exit&&!network?.active&&team===players[localSlot()]?.team?globalThis.matchKit?.boosts.find(id=>KitBags.kind(id)===6):null;
 const count=party!=null?620:exit?(match?520:320):match?360:major?160:big||exit?100:54;
 for(let i=0;i<count;i++)celebration.particles.push({x:half*500+35+(i*137)%430,y:100+(i*73)%330,vx:Math.sin(i*2.4)*45,vy:-65-(i*47)%110,delay:exit?(i%4)*.11:match?(i%6)*.34:0,spin:i*.7,color:party!=null&&i%2?KitBags.tiers[KitBags.tier(party)][2]:['#daed91','#a3c9ff','#f49b7d','#fff2bb','#ffffff'][i%5]});
 if(sound&&audio){const notes=exit?[392,523,659,784,1046]:major?[392,494,587,784,988,1175]:big?[392,494,587,784]:[523,659];notes.forEach((f,i)=>tone(f,.28,big?.13:.08,'triangle',fxBus,i*.1));if(exit)noise(.7,.2,2500);}
 $('#point-result').classList.remove('celebrate-point','celebrate-big','celebrate-set');void $('#point-result').offsetWidth;$('#point-result').classList.add(major?'celebrate-set':big?'celebrate-big':'celebrate-point');
}
// Visual-only winner pose; physics and losing players are untouched.
function celebrationPose(p){
 const c=celebration;if(!c||p.team!==c.team||c.age>=c.duration)return null;
 const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const a=Math.max(0,c.age-(p.lane||0)*.09),fade=Math.min(1,a*7,(c.duration-a)*4),pump=Math.sin(a*12)*.5+.5;
 return {lift:fade,hop:reduced?0:Math.max(0,Math.sin(a*9))*5*fade,pump:reduced?fade:fade*(.7+pump*.3)};
}
const fxCanvas=$('#confetti'),fxCtx=fxCanvas.getContext('2d');
function drawConfetti(){
 fxCtx.clearRect(0,0,cw,ch);const c=celebration;if(!c?.particles.length||c.age>c.duration)return;
 fxCtx.save();courtTransform(fxCtx);fxCtx.beginPath();fxCtx.rect(c.half*500,0,500,500);fxCtx.clip();
 const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 fxCtx.globalAlpha=Math.min(1,(c.duration-c.age)*2);
 for(const p of c.particles){const a=c.age-p.delay;if(a<0)continue;fxCtx.save();fxCtx.translate(p.x+p.vx*a*(reduced?.2:1),p.y+p.vy*a+65*a*a);fxCtx.rotate(p.spin+a*(reduced?1:7));fxCtx.fillStyle=p.color;fxCtx.fillRect(-3,-2,7,4);fxCtx.restore();}fxCtx.restore();
}
function message(t){notice=t;noticeTime=2.2}
function resetPlayers(keepFinisher=false){const charges=keepFinisher?players.map(p=>p.finisherCharge||0):[];players=[{x:210,y:340,team:0,name:'YOU',human:true,lane:1},{x:230,y:140,team:0,name:'CESAR',lane:0},{x:770,y:140,team:1,name:'ALBERT',lane:0},{x:790,y:340,team:1,name:'KIKE',lane:1}].map((p,i)=>({...p,finisherCharge:charges[i]||0,x:endsChanged?1000-p.x:p.x,vx:0,vy:0,cool:0,swing:0,angle:courtSide(p.team)?Math.PI:0,readyAt:clock,seenShot:-1,gait:0,impactAngle:0,contactZ:0,energy:1,dash:0}));if(globalThis.playerCharacter)players[0].appearance=globalThis.playerCharacter;if(globalThis.rosterLineup)players.slice(1).forEach((p,i)=>{const r=globalThis.rosterLineup[i],v=(r.rating-48)/48;Object.assign(p,{name:r.short,appearance:r,rosterStats:characterBaseStats(r)});});if(globalThis.playerCharacter&&globalThis.rosterLineup){[globalThis.playerCharacter,...globalThis.rosterLineup].forEach((r,i)=>{const p=players[i],v=(r.rating-48)/48;p.appearance=r;p.rosterStats=characterBaseStats(r);p.aiLevel=globalThis.slotDifficulties?.[i]||null;p.human=i===(globalThis.humanPosition??0);p.name=p.human?(globalThis.customPlayerName||'YOU'):r.short;});}for(const p of players)p.skinTier=globalThis.PadelSkins?.equipped(p.appearance?.id)||0;if(network?.active)network.applyRoster();}
let onlineBagMatch=null;
let recap={longest:0,smashes:0,x3:0,x4:0,returns:0};
function newMatch(farEnd=false){recap={longest:0,smashes:0,x3:0,x4:0,returns:0};globalThis.startKitMatch?.();if(network?.active&&network.isHost)onlineBagMatch=Date.now()+'-'+Math.random().toString(36).slice(2);syncControlTheme(globalThis.matchControlMode);document.body?.classList.toggle('casual-play',globalThis.matchControlMode==='casual');globalThis.Practice?.stop();players.forEach(p=>p.finisherCharge=0);resize();if(state==='over'&&globalThis.refreshRandomRoster)globalThis.refreshRandomRoster();matchGames=globalThis.CampaignMatch?.playing?1:defaultMatchGames;endsChanged=farEnd===true;pendingEndChange=false;score=[0,0];games=[0,0];sets=[0,0];completedSets=[];tiebreak=false;gameTurn=1;tbStart=1;shotSerial=0;pointNumber=0;pointLog=[];targetCounts=[0,0];aiPlacementHistory=[[],[]];stats={smashes:0,exits:0,errors:0,points:0};updatePointLog();best=0;energy=1;updateScore();resize();$('#intro').classList.add('hidden');$('#pause').classList.remove('is-paused');$('#paused').classList.add('hidden');$('#point-result').classList.add('hidden');setupServe();if(globalThis.rosterLineup){for(let t=0;t<2;t++){const e=document.querySelectorAll('.result-teams span')[t];if(e)setText(e,teamLabel(t));}}if(!network?.active)setText($('.gamehud > span'),globalThis.customPlayerName||'YOU');canvas.focus();globalThis.captureMouse?.();}
function localTeam(){return players[localSlot()]?.team??0;}
function canWinNext(team){
 const other=1-team;
 if(tiebreak)return sets[team]===1&&score[team]>=6&&score[team]>score[other];
 if(score[team]<3)return false;
 return matchGames?games[team]+1>=Math.floor(matchGames/2)+1:
  sets[team]===1&&games[team]+1>=6&&games[team]+1-games[other]>=2;
}
function serveHeadline(){
 if(state!=='serve'||globalThis.Practice?.active)return '';
 const own=canWinNext(localTeam()),other=canWinNext(1-localTeam());
 if(!tiebreak&&score[0]===3&&score[1]===3)return language==='es'?'PUNTO DE ORO\nEl próximo punto decide el juego':'GOLDEN POINT\nNext point wins the game';
 if(own||other)return language==='es'?(own?'TU PUNTO DE PARTIDO':'PUNTO DE PARTIDO RIVAL'):(own?'YOUR MATCH POINT':'THEIR MATCH POINT');
 if(!pointNumber)return matchGames===1?(language==='es'?'PARTIDO A UN JUEGO':'ONE-GAME MATCH'):tr(matchDurationLabel());
 return '';
}
function updateScore(){
 const labels=['0','15','30','40'];
 for(let row=0;row<2;row++){const team=row^localTeam();setText($('#s'+row),tiebreak?score[team]:labels[Math.min(score[team],3)]);setText($('#g'+row),games[team]);setText($('#sets'+row),sets[team]);}
 setText($('.team-blue > span'),language==='es'?'TÚ':'YOU');setText($('.team-coral > span'),language==='es'?'ELLOS':'THEM');
 for(let team=0;team<2;team++)document.querySelectorAll('#dots'+team+' i').forEach((dot,i)=>dot.classList.toggle('won',sets[team^localTeam()]>i));
 const golden=!tiebreak&&score[0]===3&&score[1]===3;
 const detail=matchGames===1?'':matchGames?`${tr(matchDurationLabel())} · ${games[localTeam()]}–${games[1-localTeam()]}`:`SETS ${sets[localTeam()]}–${sets[1-localTeam()]} · ${language==='es'?'JUEGOS':'GAMES'} ${games[localTeam()]}–${games[1-localTeam()]}`;
 setText($('#scoremode'),portraitMode?(tiebreak?'TIEBREAK':golden?(language==='es'?'PUNTO DE ORO':'GOLDEN POINT'):detail):(tiebreak?'TIEBREAK':golden?'GOLDEN POINT':matchDurationLabel()));
 $('#scoremode').classList.toggle('golden',golden);
 setText($('#sethistory'),completedSets.length?'SETS  '+completedSets.map(s=>s.join('–')).join('  /  '):'GOLDEN POINT AT 40–40');
}
function awardPoint(team){
 score[team]++;const other=1-team;
 if(tiebreak){if(score[team]<7||score[team]-score[other]<2)return 'POINT';games[team]++;score=[0,0];tiebreak=false;return finishMatchSet(team);}
 if(score[team]<4)return 'POINT';
 games[team]++;score=[0,0];
 if(matchGames!==0)return games[team]>=Math.floor(matchGames/2)+1?'MATCH':'GAME';
 if(games[team]>=6&&games[team]-games[other]>=2)return finishMatchSet(team);
 if(games[0]===6&&games[1]===6)tiebreak=true;
 return 'GAME';
}
function finishMatchSet(team){sets[team]++;completedSets.push([...games]);if(sets[team]>=2)return 'MATCH';games=[0,0];return 'SET';}

function point(team,reason){
 if(globalThis.Practice?.active){Practice.resolve(reason);return;}
 if(state!=='play')return;
 recap.longest=Math.max(recap.longest,hits);
 if(players[localSlot()]?.lastStrike===shotSerial&&ball.last===localTeam()){if(reason.includes('×3'))recap.x3++;if(reason.includes('×4'))recap.x4++;if(reason==='TRAÍDA')recap.returns++;}
 afterPointAge=0;afterPointExit=reason.includes('×')||reason.includes('OUT')||reason.includes('EXIT');
 if(reason==='NET'){ball.x=courtSide(ball.last)===0?496:504;ball.vx*=-.16;ball.vy*=.45;ball.vz=Math.min(0,ball.vz);}
 cancelShot();const previousScore=[...score],previousGames=[...games],wasTB=tiebreak,result=awardPoint(team);
 pendingEndChange=false;
 if(result!=='POINT'){gameTurn=wasTB?tbStart+1:gameTurn+1;if(tiebreak)tbStart=gameTurn;}
 stats.points++;pointNumber++;pointLog.push('#'+pointNumber+' '+teamLabel(team)+' · '+reason);updatePointLog();updateScore();best=Math.max(best,hits);
 message((team===(players[localSlot()]?.team??0)?'YOUR ':"RIVALS’ ")+result+' · '+reason);state='point';wait=result==='POINT'?2.3:3.2;noticeTime=wait;
 celebrate(team,result,reason);
 if(result==='MATCH')state='over';
 showPointResult(team,reason,result,previousScore,previousGames);
 if(result==='MATCH')globalThis.progressionMatchEnd?.(team);
 else globalThis.CampaignMatch?.checkpoint();

}
function showPointResult(team,reason,result,previousScore=score,previousGames=games){
 const labels=['0','15','30','40'];
 $('.point-card').classList.toggle('rivals',team===1);
 $('#point-result').classList.toggle('match-finale',result==='MATCH');
 $('#result-bags')?.classList.add('hidden');
 $('#winner-podium').innerHTML='';
 lastResult={team,reason,result,previousScore:[...previousScore],previousGames:[...previousGames],changeEnds:pendingEndChange};setText($('#point-winner'),teamLabel(team)+((result==='MATCH'||(portraitMode&&result==='POINT'))?'':' · '+(result==='POINT'?'SCORED':result==='SET'?'SET WON':'GAME WON')));
 $('#point-winner').className=team===0?'blue':'coral';
 setText($('#point-kind'),result==='MATCH'?'MATCH WON':result==='SET'?'SET WON':result==='GAME'?'GAME WON':'POINT WON');
 const reasons={'NET':'INTO THE NET','GLASS BEFORE FLOOR':'GLASS BEFORE BOUNCE','FENCE BEFORE FLOOR':'FENCE BEFORE BOUNCE','OUT BEFORE BOUNCE':'BALL OUTSIDE','SHORT BALL':'BOUNCE ON YOUR OWN COURT','OWN FENCE':'HIT YOUR OWN FENCE','TRAÍDA':'TRAÍDA · BACK OVER THE NET','DOUBLE BOUNCE':'DOUBLE BOUNCE'};
 setText($('#point-reason'),(reason==='DOUBLE BOUNCE'&&['SMASH','DROP SHOT','BANDEJA','VÍBORA'].includes(ball?.shotKind)?ball.shotKind+' · ':'')+(reasons[reason]||reason));
 const gameSummary=result!=='POINT',current=result==='SET'?completedSets.at(-1):gameSummary?games:score,previous=gameSummary?previousGames:previousScore;
 const value=v=>gameSummary||tiebreak?String(v):labels[Math.min(v,3)];
 $('#point-score').innerHTML=current.map((v,i)=>`<span class="score-roll ${i===team?'scored':''}" style="--score-color:${i===0?'#7ed9ff':'#ff887d'}"><span class="score-old" aria-hidden="true">${value(previous[i])}</span><span class="score-new">${value(v)}</span></span>`).join('<span class="score-separator">–</span>');
 $('#point-score').setAttribute('aria-label',current.map(value).join(' – '));
 $('.point-card').classList.toggle('change-ends',pendingEndChange);
 setText($('#point-matchscore'),pendingEndChange?'CHANGE ENDS':'');
 setText($('#point-detail'),'');
 pointRemaining=matchDelays.point;
 $('#result-home').classList.toggle('hidden',result!=='MATCH');setText($('#result-home'),'MAIN MENU');$('#continue-point').classList.toggle('hidden',result!=='MATCH');$('#point-countdown').classList.toggle('hidden',result==='MATCH');
 setText($('#point-countdown'),pointCountdown());setText($('#continue-point'),'PLAY AGAIN');
 setText($('#point-advance-hint'),network?.active&&!network.isHost?'WAITING FOR HOST':portraitMode?(language==='es'?'TOCA PARA SEGUIR':'TAP TO CONTINUE'):'CLICK TO CONTINUE');
 $('#point-result').classList.remove('hidden');
 for(const key in keys)keys[key]=false;joy={x:0,y:0};
 if(result==='MATCH'){

  const mine=localTeam(),won=team===mine;
  const winners=players.filter(p=>p.team===team&&p.appearance);
  if(globalThis.CharacterPortraits)$('#winner-podium').innerHTML=winners.map(p=>'<div>'+CharacterPortraits.side(p.appearance,p.skinTier)+'</div>').join('');
  $('#point-kind').textContent=teamLabel(team);
  const metrics=$('#match-metrics');if(metrics)metrics.innerHTML=network?.active?'':[[language==='es'?'RALLY MÁS LARGO':'LONGEST RALLY',recap.longest],[language==='es'?'TUS REMATES':'YOUR SMASHES',recap.smashes],['×3 / ×4',recap.x3+' / '+recap.x4],['TRAÍDA',recap.returns]].map(([k,v])=>'<div><strong>'+v+'</strong><small>'+k+'</small></div>').join('');
  $('#point-winner').textContent=language==='es'?(won?'PARTIDO GANADO':'PARTIDO PERDIDO'):(won?'MATCH WON':'MATCH LOST');
  $('#point-winner').className=won?'blue':'coral';
  $('#point-score').textContent='';
  $('#result-home').textContent=language==='es'?'SALIR':'LEAVE';
  $('#continue-point').textContent=globalThis.careerSession?(language==='es'?'CONTINUAR':'CONTINUE'):(language==='es'?'REVANCHA':'REMATCH');
  $('#continue-point').focus();
 }
}
function pointCountdown(){return (pendingEndChange?'CHANGE ENDS':'NEXT SERVE')+' · '+Math.max(1,Math.ceil(pointRemaining));}
function continuePoint(){if(state==='over'&&globalThis.progressionContinue?.())return;if(network?.active&&!network.isHost)return;if(state==='over')newMatch();else if(state==='point')setupServe();}
function ownsLane(p,y){return p.human||(p.lane===0?y<250:y>=250);}
function constrainPlayer(p){
 p.x=clamp(p.x,courtSide(p.team)?520:20,courtSide(p.team)?980:480);
 if(p.returningServe&&(p.lane===0?p.y<=232:p.y>=268))p.returningServe=false;
 const free=p.human||p.returningServe;const lo=free||p.lane===0?20:268,hi=free||p.lane===1?480:232;
 if(p.y<lo||p.y>hi)p.vy=0;
 p.y=clamp(p.y,lo,hi);
}
function ring(x,y,color,size=1){effects.push({x,y,t:.45,color,size});}
// Absolute cursor targeting. Power changes spread, never the selected location.
let mouse={x:0,y:0},gestureStrokes=[],activeStroke=null;
function startGestureStroke(now){activeStroke={points:[{...mouse}],power:.15,released:null,slot:localSlot(),anchor:gestureRacketOrigin(players[localSlot()]),eligible:false};gestureStrokes.push(activeStroke);if(gestureStrokes.length>5)gestureStrokes.shift();}
function recordGestureStroke(x,y){if(!activeStroke)return;const points=activeStroke.points,last=points[points.length-1];if(Math.hypot(x-last.x,y-last.y)<2)return;points.push({x,y});if(points.length>256)activeStroke.points=points.filter((_,i)=>i===0||i%2===1||i===points.length-1);}
function finishGestureStroke(now=gestureNow()){if(activeStroke){activeStroke.power=charge?.power??activeStroke.power;activeStroke.anchor=gestureRacketOrigin(players[activeStroke.slot]);activeStroke.released=now;activeStroke=null;}}
// Only the ink is relocated. Raw pointer samples still determine aim and power.
function gestureRacketOrigin(p){if(!p)return {x:0,y:0,z:0};return racketPose(p,0,state==='serve'?22:clamp(ball?.z||0,0,205));}
function gestureTrailOffset(stroke,rect){const anchor=stroke.released===null?gestureRacketOrigin(players[stroke.slot]):stroke.anchor,first=stroke.points[0],v=viewPoint(anchor.x+shakeX,anchor.y-anchor.z*.28+shakeY);return {x:(rect.left||0)+ox+v.x*scale-first.x,y:(rect.top||0)+oy+v.y*scale-first.y};}
function anchorGestureImpact(p,x,y,z){if(!isLocal(p))return;const now=gestureNow();for(let i=gestureStrokes.length-1;i>=0;i--){const s=gestureStrokes[i];if(s.slot===localSlot()&&s.eligible&&!s.impactAnchored&&s.released!==null&&now-s.released<1000){s.anchor={x,y,z};s.impactAnchored=true;break;}}}
function strokeOpacity(stroke,now){if(stroke.released===null)return .82;const age=now-stroke.released;return age<=550?.82:.82*Math.max(0,1-(age-550)/500);}

function boundedAim(p,aim){return {...aim,targetX:clamp(aim.targetX,courtSide(p?.team??0)?12:512,courtSide(p?.team??0)?488:988),targetY:clamp(aim.targetY,12,488)};}
function cursorAim(){if(globalThis.controlAim)return {...globalThis.controlAim,mouse:true};const rect=canvas.getBoundingClientRect(),p=players[localSlot()];if(!p)return {x:1,y:0,mouse:true};const v=courtVector((mouse.x-(rect.left||0)-ox)/scale,(mouse.y-(rect.top||0)-oy)/scale),dx=v.x+(farCamera()?W:0)-shakeX-p.x,dy=v.y+(farCamera()?H:0)-shakeY-p.y,n=Math.hypot(dx,dy);return {x:n>28?dx/n:Math.cos(p.angle),y:n>28?dy/n:Math.sin(p.angle),mouse:true};}
function aimInput(){return charge?.gesture?{...charge.aim}:cursorAim();}
function gestureNow(){return typeof performance!=='undefined'?performance.now():clock*1000;}
function updateSwipe(x,y,now=gestureNow()){
 mouse={x,y};if(!charge)return;
 if(!charge.gesture){charge.aim=cursorAim();return;}
 recordGestureStroke(x,y);
 const previous=charge.samples[charge.samples.length-1];
 const travel=Math.hypot(x-previous.x,y-previous.y);if(travel<.1)return;
 charge.pathLength=(charge.pathLength||0)+travel/Math.max(.1,scale);
 if(now-previous.t>180)charge.samples=[{x:previous.x,y:previous.y,t:now-16}];
 charge.samples.push({x,y,t:now});if(charge.samples.length>32)charge.samples.shift();
 while(charge.samples.length>2&&charge.samples[1].t<now-110)charge.samples.shift();
 const first=charge.samples[0],dx=(x-first.x)/Math.max(.1,scale),dy=(y-first.y)/Math.max(.1,scale),distance=Math.hypot(dx,dy);
 if(charge.pathLength<5)return;
 const speed=distance/Math.max(.016,(now-first.t)/1000);
 // Length drives depth/power; gesture speed adds at most six percentage points.
 const lengthPower=clamp(charge.pathLength*swipeGain()/120,0,1);
 charge.power=clamp(.15+.85*lengthPower+.06*lengthPower*clamp((speed-200)/1800,0,1),.15,1);
 const strokeX=x-charge.origin.x,strokeY=y-charge.origin.y,strokeLength=Math.hypot(strokeX,strokeY);
 if(strokeLength>=2)charge.aim={...courtVector(strokeX/strokeLength,strokeY/strokeLength),mouse:true,swipe:true};
 charge.moved=true;charge.lastMove=now;charge.lastPower=charge.power;if(activeStroke)activeStroke.power=charge.power;
}
// Screen-space arc: below the endpoint chord = slice, above = topspin.
// Weighted by distance, not event frequency. Reject loops, zigzags and tiny wobble.
function gestureShape(points){
 const neutral={spin:0};if(!points||points.length<3)return neutral;
 const a=points[0],b=points.at(-1),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
 if(len<14*Math.max(.1,scale))return neutral;
 let nx=-dy/len,ny=dx/len;if(ny<-.001||(Math.abs(ny)<=.001&&nx<0)){nx=-nx;ny=-ny;}
 let path=0,area=0,weight=0,absArea=0;
 for(let i=1;i<points.length;i++){
  const p=points[i-1],q=points[i],w=Math.hypot(q.x-p.x,q.y-p.y),x=(p.x+q.x)/2-a.x,y=(p.y+q.y)/2-a.y,u=(x*dx+y*dy)/(len*len);
  path+=w;if(u<.08||u>.92)continue;const offset=x*nx+y*ny;area+=offset*w;absArea+=Math.abs(offset)*w;weight+=w;
 }
 if(path/len>2.4||!weight||Math.abs(area)<absArea*.55)return neutral;
 const curve=area/weight/len,amount=clamp((Math.abs(curve)-.012)/.18,0,1);
 return amount<.035?neutral:{spin:-Math.sign(curve)*amount,x:dx/len,y:dy/len};
}
function spinStrength(spin,power){return Math.abs(spin)*(.4+.6*power);}
function applyGestureSpin(shot,spin,power,origin=ball){
 if(!spin)return shot;
 const strength=spinStrength(spin,power),gravity=1+Math.sign(spin)*.16*strength;
 let vz=shot.vz*(1-Math.sign(spin)*.1*strength);
 // Keep the chosen landing spot; change the flight profile, not gesture accuracy.
 const t=(vz+Math.sqrt(vz*vz+2*G*gravity*origin.z))/(G*gravity);
 if(t>0&&Number.isFinite(shot.targetX)&&Number.isFinite(shot.targetY)&&!shot.errorType){shot={...shot,vx:(shot.targetX-origin.x)/t,vy:(shot.targetY-origin.y)/t,vz};}
 if(shot.smash&&spin<0)shot={...shot,paceBoost:(shot.paceBoost||1)*(1-.18*strength),smashBounce:(shot.smashBounce||.62)*(1-.2*strength)};
 return {...shot,gestureSpin:spin,spinGravity:gravity};
}
function spinShotLabel(kind,spin=0){
 if(['BANDEJA','VÍBORA','FINISHER','ON FIRE','SERVE','SOFT OVERHEAD'].includes(kind)||kind==='SMASH'&&spin>=0)return tr(kind);
 const label=spin<0?'SLICED':spin>0?'TOPSPIN':'STRAIGHT';
 const feminine=['VOLLEY','DROP SHOT'].includes(kind);
 return language==='es'?tr(kind)+' '+(spin<0?(feminine?'CORTADA':'CORTADO'):spin>0?(feminine?'LIFTADA':'LIFTADO'):(feminine?'PLANA':'PLANO')):label+' '+tr(kind);
}
function advanceCharge(dt){if(charge&&!charge.gesture)charge.power=Math.min(1,charge.power+dt/.6);}
function cancelShot(){shotTouch=null;lobTapUntil=0;finishGestureStroke();if(charge&&network?.active&&!network.isHost)network.queueEvent('cancel');charge=null;pendingShot=null;}
function beginCharge(source,lob){if(source==='Space'||source==='KeyL'||globalThis.Practice?.demonstrating)return;if(!['play','serve'].includes(state)||charge)return;pendingShot=null;const now=gestureNow(),gesture=source==='Mouse1'||source==='Mouse2';charge={source,lob,power:gesture?.15:0,origin:{...mouse},aim:aimInput(),gesture,pathLength:0,started:now,samples:[{...mouse,t:now}],moved:false};if(gesture)startGestureStroke(now);if(network?.active&&!network.isHost)network.queueEvent('charge',lob,cursorAim());}
function releaseCharge(source){
 if(!charge||charge.source!==source)return;
 if(charge.gesture){advanceCharge(0);const shape=gestureShape(portraitMode?activeStroke?.points.map(p=>({x:-p.y,y:p.x})):activeStroke?.points);if(shape.spin)charge.aim={...charge.aim,spin:shape.spin};if(activeStroke)activeStroke.eligible=true;}
 if(state==='serve'&&(!network?.active||network.isHost))queueServe(players[localSlot()],charge.power,aimInput());
 if(state==='play')pendingShot={lob:charge.lob,power:charge.power,aim:aimInput(),timing:recordReleaseTiming(players[localSlot()]),remaining:humanShotWindow()};
 if(network?.active&&!network.isHost)network.queueEvent('release',charge.lob,aimInput());sfx('swing');const p=players[localSlot()];p.lobSwing=charge.lob;finishGestureStroke();charge=null;
}
function swipeDirection(p,aim){if(Number.isFinite(aim.targetX)&&Number.isFinite(aim.targetY)){const dx=aim.targetX-p.x,dy=aim.targetY-p.y,n=Math.hypot(dx,dy);return n>.001?{x:dx/n,y:dy/n}:{x:courtSide(p.team)?-1:1,y:0};}const n=Math.hypot(aim.x,aim.y);return n>.001?{x:aim.x/n,y:aim.y/n}:{x:courtSide(p.team)?-1:1,y:0};}
function shotPlan(p,lob,power,aim,origin=ball){
 const q=clamp(power,0,1),risk=clamp((q-.85)/.15,0,1);
 // Absolute cursor location remains fixed across power levels; legacy AI vectors stay supported.
 const dir=swipeDirection(p,aim),forward=courtSide(p.team)?-1:1;
 const desiredDepth=65+340*q,goingForward=dir.x*forward>=0;
 const toNet=Math.abs(500-origin.x),toBack=courtSide(p.team)?995-origin.x:origin.x-5;
 const travelX=goingForward?toNet+desiredDepth:toBack+(495+desiredDepth)/.83;
 const range=clamp(travelX/Math.max(.25,Math.abs(dir.x)),120,2200);
 const depth=(aim.x<0?35+100*q:aim.x>0?260+210*q:140+260*q)+(aim.x>=0?220*risk:0);
 const targetX=Number.isFinite(aim.targetX)?aim.targetX:aim.mouse?origin.x+dir.x*range:courtSide(p.team)===0?500+depth:500-depth;
 const targetY=Number.isFinite(aim.targetY)?aim.targetY:aim.mouse?origin.y+dir.y*range:aim.y?clamp(origin.y+aim.y*(110+130*q),25,475):clamp(origin.y,50,450);
 let vz=lob?430+260*q:(Number.isFinite(aim.targetX)||aim.mouse)?180-90*q-100*risk:100+100*q-150*risk;
 const flight=v=>(v+Math.sqrt(v*v+2*G*origin.z))/G;
 // Comfortable power has net clearance assistance; red-zone shots lose that assistance.
 if(risk===0&&(500-origin.x)/(targetX-origin.x)>0&&(500-origin.x)/(targetX-origin.x)<1){const fraction=(500-origin.x)/(targetX-origin.x);for(let i=0;i<20;i++){const nt=flight(vz)*fraction;if(origin.z+vz*nt-.5*G*nt*nt>=NET+14)break;vz+=12;}}
 const t=flight(vz);
 return {vx:(targetX-origin.x)/t,vy:(targetY-origin.y)/t,vz,targetX,targetY};
}
// Placement memory belongs to the team, so partners do not repeat the same pattern.
let aiPlacementHistory=[[],[]];
function rememberAIPlacement(p,choice,lob){
 const history=aiPlacementHistory[p.team];
 history.push({x:choice.targetX,y:choice.targetY,lob});
 if(history.length>8)history.shift();
}
function aiPlacement(p,lob=false){
 const rivals=players.filter(r=>r.team!==p.team),atNet=Math.abs(p.x-500)<190;
 const history=aiPlacementHistory[p.team],candidates=[];
 for(const depth of (lob?[830,890,930]:[590,680,780,860,925]))for(const lane of [75,145,215,285,355,425]){
  const x=courtSide(p.team)?1000-depth:depth,y=clamp(lane+(Math.random()-.5)*30,65,435);
  const gap=Math.min(...rivals.map(r=>Math.hypot(x-clamp(r.x+(r.vx||0)*.18,courtSide(r.team)?520:20,courtSide(r.team)?980:480),y-clamp(r.y+(r.vy||0)*.18,20,480))));
  const diagonal=Math.abs(y-p.y)>170?24:0;
  const dx=x-p.x,dy=y-p.y,length=dx*dx+dy*dy;
  const blocked=lob?0:Math.max(...rivals.map(r=>{const t=clamp(((r.x-p.x)*dx+(r.y-p.y)*dy)/length,0,1);const distance=Math.hypot(r.x-p.x-t*dx,r.y-p.y-t*dy);return t>.15&&t<.9?Math.max(0,90-distance):0;}));
  // Recent destinations become less attractive, but never override a clear opening.
  const repetition=history.reduce((cost,h,i)=>cost+Math.max(0,1-Math.hypot(x-h.x,y-h.y)/180)*(20+12*i)*(h.lob===lob?1:.5),0);
  const safety=depth===590&&!atNet?-60:0;
  const laneUse=history.filter(h=>(h.y<250)===(y<250)).length;
  const balance=(history.length/2-laneUse)*55;
  const tactical=.85+(characterAttributes(p.appearance).stamina-3)*.06;
  const plan=p.appearance?.clubTactic;
  const preference=plan==='walls'?(Math.abs(y-250)+depth-590)*.17:plan==='diagonal'?diagonal*2:0;
  candidates.push({targetX:x,targetY:y,value:preference+gap*tactical+diagonal-blocked*1.1+safety-repetition+balance});
 }
 const best=Math.max(...candidates.map(c=>c.value));
 // Sample competitive placements rather than always selecting the same corner.
 const elite=clamp(((Number(p.aiLevel)||0)-10)/5,0,1);const options=candidates.filter(c=>c.value>=best-(145-95*elite));
 const weights=options.map(c=>Math.exp((c.value-best)/(65-40*elite)));
 let draw=Math.random()*weights.reduce((a,b)=>a+b,0),choice=options[options.length-1];
 for(let i=0;i<options.length;i++){draw-=weights[i];if(draw<=0){choice=options[i];break;}}
 return {targetX:choice.targetX,targetY:choice.targetY};
}
function aiChoice(p){
 const cfg=levelOf(p),difficulty=shotDifficulty(p),atNet=Math.abs(p.x-500)<190;
 const opponentsAtNet=players.filter(q=>q.team!==p.team&&Math.abs(q.x-500)<190).length;
 const plan=p.appearance?.clubTactic;
 const q=clamp(cfg.power+(plan==='pace'?.07:0)+(Math.random()-.5)*.26-difficulty*.08,.3,Number(p.aiLevel)>10?.88:.78);
 const lob=Math.random()<clamp((opponentsAtNet===2?.8:opponentsAtNet===1?.55:atNet?.08:.22)+(plan==='lob'?.18:0)+(p.appearance?.id===5?.18:p.appearance?.id===9?-.08:0),.03,.92)&&difficulty<.7;
 const target=aiPlacement(p,lob);if(p.team===1)targetCounts[target.targetY<250?0:1]++;
 const punishable=atNet&&shortLob(ball),attack=punishable||atNet&&difficulty<.65&&Math.random()<.78,roll=Math.random(),overheadPower=roll<(punishable?.85:.32)?.93:roll<(punishable?.95:.73)?.74:.54;
 return {power:lob?Math.min(q,.62):q,lob,attack,overheadPower,...target,aim:{x:courtSide(p.team)?-1:1,y:target.targetY<ball.y?-1:1,spin:attack?(overheadPower>=.85?.35:overheadPower>=.65?.6:-.45):0}};
}
function smashPlan(p,power,aim,origin=ball){
 const elite=power>=.88&&origin.z>=135&&Math.abs(origin.x-500)<=135;
 const dir=swipeDirection(p,aim),depth=aim.y?720:620,range=120+100*power,tx=Number.isFinite(aim.targetX)?aim.targetX:aim.mouse?origin.x+dir.x*range:courtSide(p.team)===0?depth:1000-depth,ty=Number.isFinite(aim.targetY)?aim.targetY:aim.mouse?origin.y+dir.y*range:clamp(origin.y+aim.y*70,70,430);
 return {...trajectory(origin.x,origin.y,origin.z,tx,ty,elite?-500-300*power:-350-250*power),smash:true,smashBounce:elite?.91:.62};
}
function mishit(p,shot,power){
 const type=Math.floor(Math.random()*3),dir=courtSide(p.team)===0?1:-1;
 if(type===0){const dist=Math.abs(500-ball.x),time=dist/Math.max(100,Math.abs(shot.vx));shot.vz=(8-ball.z+.5*G*time*time)/Math.max(.04,time);}
 else if(type===1){Object.assign(shot,trajectory(ball.x,ball.y,ball.z,courtSide(p.team)? -180:1180,clamp(ball.y,80,420),220+100*power));}
 else{const t=.65;Object.assign(shot,{vx:(500+dir*180-ball.x)/t,vy:((ball.y<250?-8:508)-ball.y)/t,vz:(65-ball.z+.5*G*t*t)/t});}
 shot.smash=false;shot.errorType=['NET','GLASS','FENCE'][type];stats.errors++;return shot;
}
// One pose definition drives both rendering and ball-contact geometry.
function racketPose(p,offset=0,z=0){
 const angle=p.angle+offset,c=Math.cos(angle),sn=Math.sin(angle);
 return {angle,x:p.x+c*40,y:p.y+sn*40,z,gripX:p.x+c*26.35,gripY:p.y+sn*26.35};
}
function humanShotWindow(){return ball?.glassTouches>0?.52:.42;}
// Timing follows incoming travel independently of the player aim.
function contactTiming(p,b=ball){
 const speed=Math.hypot(b.vx||0,b.vy||0),dx=b.x-p.x,dy=b.y-p.y;
 const ahead=speed>5?-(dx*b.vx+dy*b.vy)/speed:Math.hypot(dx,dy);
 const reachable=b.last!==p.team&&(side(b.x)===p.team||reachBackOverNet(p,b))&&b.z<=205&&Math.hypot(dx,dy)<=(p.human?76:68);
 return {ahead,grade:!reachable||ahead>(p.human?60:52)?'EARLY':ahead<(p.human?14:18)?'LATE':'PERFECT',reachable};
}
function releaseTiming(p){return timingSample(p).grade;}
// Normalized screen position. The bright middle band is the legal sweet spot.
function timingSample(p){
 const t=contactTiming(p);
 const grade=t.grade==='PERFECT'&&!racketContact(p,ball)?'EARLY':t.grade;
 let position;
 if(grade==='EARLY')position=clamp(.38-(Math.max(60,t.ahead)-60)/145,.045,.35);
 else if(grade==='LATE')position=clamp(.62+(14-t.ahead)/115,.65,.955);
 else position=.62-(t.ahead-14)*.24/46;
 return {grade,position};
}
function recordReleaseTiming(p){
 const sample=timingSample(p);
 p.releaseMark=sample.position;
 return sample.grade;
}
function controlledPerfectShot(p,lob,power,aim){
 const base=shotPlan(p,lob,Math.min(power,.78),aim),forward=courtSide(p.team)===0?base.targetX>500:base.targetX<500;
 // Counter-wall directions stay possible; clean forward hits receive placement assistance.
 if(!forward)return base;
 const x=clamp(base.targetX,courtSide(p.team)?75:575,courtSide(p.team)?425:925),y=clamp(base.targetY,65,435);
 let shot=trajectory(ball.x,ball.y,ball.z,x,y,lob?430+220*power:90+55*(1-power));
 return {...comfortableReturn(shot),perfectForward:true};
}
function redBodyContact(b,from){
 if(b.shotKind!=='SMASH'||b.power<.85||!Number.isFinite(b.power)||b.serve||!b.crossed)return null;
 const dx=b.x-from.x,dy=b.y-from.y,d2=dx*dx+dy*dy;
 for(const p of players){
  if(p.team===b.last||side(b.x)!==p.team)continue;
  const t=d2?clamp(((p.x-from.x)*dx+(p.y-from.y)*dy)/d2,0,1):0;
  const z=from.z+(b.z-from.z)*t;
  if(z>=0&&z<=85&&Math.hypot(from.x+dx*t-p.x,from.y+dy*t-p.y)<14)return p;
 }
 return null;
}
function racketContact(p,b){
 // Extra reach after glass makes wall defence forgiving without body hits.
 const assisted=p.human&&b.glassTouches>0,reach=p.human?(assisted?28:22):14,width=p.human?(assisted?27:22):13;
 if(p.human&&Math.hypot(b.x-p.x,b.y-p.y)<22)return null;
 // Sweep the face through a forehand arc, never through the player's torso.
 for(let i=0;i<=16;i++){
  const offset=(p.human?-.65:-.25)+i/16*(p.human?2.35:1.95),pose=racketPose(p,offset,b.z),dx=b.x-pose.x,dy=b.y-pose.y;
  const along=dx*Math.cos(pose.angle)+dy*Math.sin(pose.angle),across=-dx*Math.sin(pose.angle)+dy*Math.cos(pose.angle);
  if((along/reach)**2+(across/width)**2<=1)return {...pose,offset};
 }
 return null;
}
function displayRacketPose(p){
 const progress=p.swing>0?1-p.swing/.22:0,loading=isLocal(p)?charge:p.netCharge;
 // Two-handed forward ready pose; ease into a side backswing only while charging.
 const running=Math.min(1,Math.hypot(p.vx||0,p.vy||0)/180),stride=Math.sin(p.gait||0);
 let offset=p.swing>0?p.impactAngle-Math.sin(progress*Math.PI/2)*(p.lobSwing?.25:1.1):loading?.12+2.18*Math.sin(loading.power*Math.PI/2):.12+running*(.24+stride*.24);
 let z=p.swing>0?(p.lobSwing?p.contactZ+Math.sin(progress*Math.PI/2)*110:p.contactZ*(1-progress)):loading&&loading.lob?-20*loading.power:!loading?Math.abs(stride)*running*8:0;
 if(p.swing>0){const settle=clamp((progress-.6)/.4,0,1),ease=settle*settle*(3-2*settle);offset+=(.12-offset)*ease;z*=1-ease;}
 return racketPose(p,offset,z);
}
function dispersionRadius(power,lob=false){const q=clamp(power,0,1);return lob&&q>=.85?1100+800*(q-.85)/.15:14+420*q**4;}
function disperseShot(shot,power,origin=ball,lob=false,accuracy=1){
 const angle=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*dispersionRadius(power,lob)*accuracy;
 return {...shot,...trajectory(origin.x,origin.y,origin.z,shot.targetX+Math.cos(angle)*r,shot.targetY+Math.sin(angle)*r,shot.vz)};
}
function landingPreview(p,lob,power,aim){
 if(Number.isFinite(aim.targetX)&&Number.isFinite(aim.targetY))return {x:aim.targetX,y:aim.targetY,r:dispersionRadius(power,lob),blocked:false};
 const close=Math.hypot(ball.x-p.x,ball.y-p.y)<100,pose=racketPose(p,0,30),origin=close?ball:pose;
 const high=!lob&&power>=.68&&origin.z>=90&&origin.z<=205;
 const shot=high?smashPlan(p,power,aim,origin):shotPlan(p,lob,power,aim,origin);
 const b={...origin,...shot,last:p.team,bounces:0,legalBounce:false,wallLifted:false,serve:false};
 // Same integration and wall restitution as play; stop at first floor or obstruction.
 for(let i=0;i<480;i++){const result=physics(b,1/120,false);if(b.bounces>0)return {x:b.x,y:b.y,r:dispersionRadius(power,lob),blocked:false};if(result)return {x:b.x,y:b.y,r:dispersionRadius(power,lob),blocked:true};}
 return {x:shot.targetX,y:shot.targetY,r:dispersionRadius(power,lob),blocked:true};
}
// On comfortable AI contacts, keep placement inside and restore net clearance
// after dispersion. Difficult contacts and deliberate pressure errors stay risky.
function comfortableReturn(shot){
 const x=clamp(shot.targetX,65,935),y=clamp(shot.targetY,55,445);
 let safe=trajectory(ball.x,ball.y,ball.z,x,y,shot.vz);
 const f=(500-ball.x)/(x-ball.x);
 if(f>0&&f<1)for(let i=0;i<16;i++){const t=(safe.vz+Math.sqrt(safe.vz**2+2*G*ball.z))/G*f;if(ball.z+safe.vz*t-.5*G*t*t>=NET+18)break;safe=trajectory(ball.x,ball.y,ball.z,x,y,safe.vz+12);}
 return {...shot,...safe};
}
function faceBall(p,dt=1/120){
 if(!p.human||!ball||p.swing>0||p.servePending||state==='serve')return;
 const target=Math.atan2(ball.y-p.y,ball.x-p.x);
 const delta=Math.atan2(Math.sin(target-p.angle),Math.cos(target-p.angle));
 p.angle+=clamp(delta*(1-Math.exp(-18*dt)),-12*dt,12*dt);
}
function shotFamily(lob,power,b=ball,p=null,spin=0){
 if(lob)return 'LOB';
 if(b.bounces>0){const lateral=p?-(b.x-p.x)*Math.sin(p.angle)+(b.y-p.y)*Math.cos(p.angle):0;return lateral < -6?'BACKHAND':'DRIVE';}
 if(b.z>=90&&power<.85&&spin)return spin<0?'BANDEJA':'VÍBORA';
 if(b.z>=90)return power<.35?'SOFT OVERHEAD':power<.65?'BANDEJA':power<.85?'VÍBORA':'SMASH';
 return 'VOLLEY';
}
function reachBackOverNet(p,b=ball){return b.legalBounce&&b.returned&&b.last!==p.team&&Math.abs(b.x-500)<48&&Math.abs(p.x-500)<80;}
function shortLob(b){
 if(b.shotKind!=='LOB'||b.bounces||b.glassTouches)return false;
 const gravity=G*(b.spinGravity||1),time=(b.vz+Math.sqrt(b.vz*b.vz+2*gravity*b.z))/gravity;
 const depth=(b.x+b.vx*time-500)*(courtSide(b.last)?-1:1);
 return depth>0&&depth<=125;
}
// Choose the first bounce so the rising ball reaches the enclosure at the intended height.
function punishLob(p,aim,roll){
 const dir=courtSide(p.team)?-1:1,sideExit=roll<.34,bringBack=roll>=.68;
 const wallX=sideExit?500+dir*230:500+dir*495;
 const wallY=sideExit?(aim.y>0?495:aim.y<0?5:ball.y<250?5:495):clamp(ball.y+(aim.y||0)*80,75,425);
 const vz=-690,flight=2*ball.z/(Math.sqrt(vz*vz+2*G*ball.z)-vz);
 const fraction=flight/(flight+.94*(bringBack?.105:.48));
 return {...trajectory(ball.x,ball.y,ball.z,ball.x+(wallX-ball.x)*fraction,ball.y+(wallY-ball.y)*fraction,vz),family:'SMASH',smash:true,smashBounce:.94,paceBoost:1.2,punishing:true};
}
// A red attacking stroke close to the net can use the player's angle to play for an exit.
function redExitChance(power,perfect){
 return .72+.12*clamp((power-.85)/.15,0,1)+(perfect?.06:0);
}
function humanExitShot(p,aim,family){
 const sideExit=Math.abs(aim.y)>.32;
 if(family==='SMASH'){
  const drive=punishLob(p,aim,sideExit?0:.5),netTime=(500-ball.x)/drive.vx;
  if(ball.z+drive.vz*netTime-G*netTime**2/2>NET+10)return drive;
 }
 // A lower contact needs an ascending flight to clear the net before its kick off the turf.
 const sign=courtSide(p.team)?-1:1,wallX=500+sign*(sideExit?230:495);
 const wallY=sideExit?(aim.y>0?495:5):clamp(ball.y+aim.y*80,75,425);
 const flight=.82,after=.65,fraction=flight/(flight+.94*after);
 const vz=G*flight/2-ball.z/flight;
 const shot=trajectory(ball.x,ball.y,ball.z,ball.x+(wallX-ball.x)*fraction,ball.y+(wallY-ball.y)*fraction,vz);
 return {...shot,family,smash:true,smashBounce:(sideExit?460:530)/(G*flight-vz),paceBoost:1.25,punishing:true};
}
function attackingShot(p,power,aim,family,perfect){
 const base=perfect?controlledPerfectShot(p,false,power,aim):shotPlan(p,false,Math.min(power,.8),aim);
 const forward=courtSide(p.team)===0?base.targetX>500:base.targetX<500;
 if(!forward)return {...base,family};
 const dir=swipeDirection(p,aim),depth=family==='SMASH'?210+power*100:300+power*95;
 const tx=courtSide(p.team)?500-depth:500+depth,ty=clamp(ball.y+dir.y*220,65,435);
 const vz=family==='SMASH'?-230:family==='VÍBORA'?-70:-15;
 let shot=comfortableReturn(trajectory(ball.x,ball.y,ball.z,tx,ty,vz));
 const elite=family==='SMASH'&&perfect&&power>.97&&ball.z>170&&Math.abs(p.x-500)<110&&Math.abs(dir.y)>.6;
 return {...shot,family,perfectForward:perfect,smash:family==='SMASH',smashBounce:elite?.91:.72,paceBoost:family==='SMASH'?1.28:family==='VÍBORA'?1.2:1.1,slice:family==='BANDEJA'?.48:family==='VÍBORA'?.42:0,sideSpin:family==='VÍBORA'?Math.sign(dir.y||p.y-250)*42:0};
}
function dropVolley(p,power,aim){
 const dir=swipeDirection(p,aim),tx=500+(courtSide(p.team)?-1:1)*(55+power*110),ty=clamp(ball.y+dir.y*120,60,440);
 return {...comfortableReturn(trajectory(ball.x,ball.y,ball.z,tx,ty,70)),family:'DROP SHOT',slice:.28,paceBoost:.9};
}
// Five successful perfect contacts arm a finisher; only the next perfect spends it.
function chargeFinisher(p,quality){
 if((globalThis.Practice?.active&&!Practice.finisherLesson)||quality!=='PERFECT')return false;
 if((p.finisherCharge||0)>=5){p.finisherCharge=0;p.finisherUntil=clock+1.3;return true;}
 p.finisherCharge=(p.finisherCharge||0)+1;p.finisherPulse=clock;return false;
}
function hit(p,lob,power=.55,aim=aimInput(),releaseGrade=null){
 if(state!=='play')return false;
 const timing=p.human?(releaseGrade||'EARLY'):null,perfect=timing==='PERFECT';
 const high=!lob&&!(ball.bounces>0)&&ball.z>=90&&ball.z<=205;
 const counter=ball.smash&&ball.legalBounce&&(ball.glassTouches>0||ball.returned)&&Math.abs(p.x-500)<180;
 if(!ownsLane(p,ball.y)||p.cool>0||ball.last===p.team||(!reachBackOverNet(p)&&side(ball.x)!==p.team)||ball.z>(((!lob&&ball.z>=90)||(p.human&&ball.glassTouches>0))?205:115))return false;
 const contact=racketContact(p,ball);if(!contact)return false;
 if(ball.serve){if(ball.bounces===0){if(p.human){point(ball.last,'VOLLEY ON SERVE');return true;}return false;}if(p.lane!==ball.receiverLane)return false;if(ball.netTouch){serveLet();return true;}}
 if(!p.human&&clock<p.readyAt)return false;
 if(!p.human&&p.receivePlan){if(p.receivePlan.waitGlass&&!(ball.glassTouches>0))return false;if(p.receivePlan.waitBounce&&ball.bounces===0)return false;}
 // Resolve the visible impact at the physical racket-face center, not the torso.
 const feedbackQuality=timing||contactTiming(p).grade;
 const finisher=chargeFinisher(p,feedbackQuality);if(finisher)power=Math.max(power,.92);
 const gestureSpin=Number.isFinite(aim.spin)?clamp(aim.spin,-1,1):0;
 const family=shotFamily(lob,power,ball,p,gestureSpin);
 const punish=family==='SMASH'&&shortLob(ball);
 const practiceIncoming=globalThis.Practice?.active?{...ball}:null;
 ball.x=contact.x;ball.y=contact.y;anchorGestureImpact(p,contact.x,contact.y,ball.z);
 let shot;
 if(high&&(power>=.35||gestureSpin))shot=attackingShot(p,power,p.human?aim:{targetX:p.choice?.targetX??(courtSide(p.team)?200:800),targetY:p.choice?.targetY??250},family,perfect);
 else if(family==='VOLLEY'&&power<.35&&Math.abs(p.x-500)<220&&swipeDirection(p,aim).x*(courtSide(p.team)?-1:1)>0)shot=dropVolley(p,power,aim);
 else if(perfect)shot=controlledPerfectShot(p,lob,power,aim);
 else if(p.human)shot=shotPlan(p,lob,power,aim);
 else{
  const choice=aiPlacement(p,lob);
  const short=!lob&&Math.abs(choice.targetX-500)<130;
  if(short&&!finisher)power=Math.min(power,.5);
  const vz=lob?430+260*power:short?105+35*power:100+70*power+Math.random()*45;
  shot=trajectory(ball.x,ball.y,ball.z,choice.targetX,choice.targetY,vz);
  const f=(500-ball.x)/(choice.targetX-ball.x),nt=((shot.vz+Math.sqrt(shot.vz**2+2*G*ball.z))/G)*f;
  if(ball.z+shot.vz*nt-.5*G*nt*nt<NET+12)shot=trajectory(ball.x,ball.y,ball.z,choice.targetX,choice.targetY,vz+85);
 }
 if(!p.human&&Number.isFinite(shot.targetX)&&Number.isFinite(shot.targetY))rememberAIPlacement(p,shot,lob);
 if(family==='VOLLEY'&&power>=.35)shot.paceBoost=1.18;
 const plannedHeading=Math.atan2(shot.vy,shot.vx);
 shot=disperseShot(shot,power,ball,lob,p.human?(globalThis.Practice?.tutorial?0:(perfect?.015:.6))*(1-(characterAttributes(p.appearance).technique-3)*.02):.07+.5*shotDifficulty(p)**2);
 const spreadAngle=Math.atan2(shot.vy,shot.vx)-plannedHeading;
 if((perfect&&shot.perfectForward)||(p.human&&power<.85&&shot.targetX>55&&shot.targetX<945&&shot.targetY>40&&shot.targetY<460&&side(shot.targetX)!==p.team)||(!p.human&&shotDifficulty(p)<.35&&!shot.smash))shot=comfortableReturn(shot);
 if(!p.human&&Math.random()<errorChance(p,power,!!shot.smash))shot=mishit(p,shot,power);
 if(finisher)shot.paceBoost=Math.max(1.25,shot.paceBoost||1);
 shot=applyGestureSpin(shot,gestureSpin,power);
 const direction=swipeDirection(p,aim);
 const nearNetRed=p.human&&!lob&&power>=.85&&Math.abs(p.x-500)<=125&&direction.x*(courtSide(p.team)?-1:1)>0&&!globalThis.Practice?.active;
 if(nearNetRed){
  if(!shot.errorType&&Math.random()<redExitChance(power,perfect))shot=humanExitShot(p,direction,family);
 }else if(punish&&shot.smash&&!shot.errorType&&Math.random()<.87)shot=punishLob(p,swipeDirection(p,aim),Math.random());
 // Shot families determine depth and speed. A human swipe owns the heading.
 if(p.human&&aim.swipe){
  const heading=Math.atan2(direction.y,direction.x)+spreadAngle;
  const speed=Math.hypot(shot.vx,shot.vy);
  const range=Math.hypot(shot.targetX-ball.x,shot.targetY-ball.y);
  shot.targetX=ball.x+range*Math.cos(heading);shot.targetY=ball.y+range*Math.sin(heading);
  shot.vx=speed*Math.cos(heading);shot.vy=speed*Math.sin(heading);
 }
 ball.swipeFlight=!!(p.human&&aim.swipe);
 delete ball.practiceFeedSpeed;delete ball.contactUntil;delete ball.contactUsed;delete ball.contactOwner;ball.contactPace=1;ball.impactPerfect=feedbackQuality==='PERFECT';
 Object.assign(ball,{vx:shot.vx,vy:shot.vy,vz:shot.vz,last:p.team,bounces:0,glassTouches:0,crossed:false,returned:false,serve:false,netTouch:false,legalBounce:false,wallLifted:false,punishing:!!shot.punishing,smash:!!shot.smash,smashBounce:shot.smashBounce||.62,power,timing,paceBoost:(shot.paceBoost||1)*(p.human?1+(characterAttributes(p.appearance).power-3)*.015:1),slice:shot.slice||0,sideSpin:shot.sideSpin||0,counter,finisher,gestureSpin:shot.gestureSpin||0,spinGravity:shot.spinGravity||1,shotColor:shotColor(power),shotKind:shot.family||family,errorType:shot.errorType||null});
 if(!shot.errorType&&(lob||Math.abs(p.x-500)<190||Math.abs(shot.targetX-500)>300))teamAtNet[p.team]=true;
 if(p.human){p.timingFeedback=timing;p.timingMark=p.releaseMark??({EARLY:.2,PERFECT:.5,LATE:.8})[timing];delete p.releaseMark;p.timingUntil=clock+1.2;if(perfect){if(sound&&audio)tone(1046,.12,.06,'triangle');}}
 p.cool=.48;p.swing=.22;p.lobSwing=lob;comboPulse=1;p.impactAngle=contact.offset;p.contactZ=ball.z;hits++;shotSerial++;p.lastStrike=shotSerial;if(isLocal(p)&&shot.smash)recap.smashes++;markReaction();if(hits<=50&&hits%5===0){message(hits===50?'RED HOT · CHAOS BALL':'RALLY SPEED UP');if(sound&&audio){tone(hits>=50?880:660,.22,.09,'triangle');tone(hits>=50?1175:880,.22,.06,'triangle',fxBus,.12);}}
 trail=[];impactShake(ball);
 if(shot.smash)stats.smashes++;
 p.shotFeedback=finisher?'FINISHER':p.finisherCharge===5&&feedbackQuality==='PERFECT'?'ON FIRE':ball.shotKind;p.strokeFamily=ball.shotKind;p.shotSpin=gestureSpin;p.shotQuality=feedbackQuality;p.shotTint=shotColor(power);p.shotUntil=clock+.5;p.impactFlash={x:contact.x,y:contact.y-ball.z*.28,at:clock,color:shot.punishing?'#fff293':p.shotTint,perfect:shot.punishing||feedbackQuality==='PERFECT',power,angle:Math.atan2(ball.vy,ball.vx)};
 if(practiceIncoming)Practice.onHit(practiceIncoming,{kind:ball.shotKind,power,timing:feedbackQuality,spin:gestureSpin,finisher});
 sfx(shot.punishing?'power-smash':shot.smash?'smash':lob?'lob':'hit',power);return true;
}
function contactGestureActive(p){return !!p?.human&&!!(isLocal(p)?charge:p.netCharge);}
function approachingRacket(p,b){
 if(racketContact(p,b))return true;
 // Look a few frames ahead without predicting through a wall or a floor bounce.
 const horizon=Math.min(.045*ballPace(b),35/Math.max(1,Math.hypot(b.vx,b.vy)));
 for(let i=1;i<=3;i++){
  const t=horizon*i/3,x=b.x+b.vx*t,y=b.y+b.vy*t,z=b.z+b.vz*t-.5*G*(b.spinGravity||1)*t*t;
  if(x<5||x>995||y<5||y>495||side(x)!==p.team||z<8||z>205)break;
  if(racketContact(p,{...b,x,y,z}))return true;
 }
 return false;
}
function updateContactAssist(dt){
 if(!ball)return;
 if(ball.contactUntil>clock){if(!contactGestureActive(players[ball.contactOwner]))ball.contactUntil=Math.min(ball.contactUntil,clock+.06);const left=ball.contactUntil-clock;ball.contactPace=.12+.88*(1-clamp(left/.06,0,1));return;}
 ball.contactPace=1;if(ball.contactUsed||state!=='play'||ball.z<8||ball.z>205)return;
 for(const p of players){
  if(!p.human||p.cool>0||p.team===ball.last||side(ball.x)!==p.team||!ownsLane(p,ball.y))continue;
  if(ball.serve&&(!ball.bounces||p.lane!==ball.receiverLane))continue;
  if(contactGestureActive(p)&&!(isLocal(p)?pendingShot:p.netPending)&&approachingRacket(p,ball)){
   ball.contactUsed=true;ball.contactOwner=players.indexOf(p);ball.contactUntil=clock+(globalThis.matchControlMode==='casual'?.40:.28);ball.contactPace=.12;break;
  }
 }
}
function physics(b,dt,events=true){
 const pace=ballPace(b),steps=pace>1.9?Math.min(32,Math.ceil(dt*pace/.0125)):1;
 for(let i=0;i<steps;i++){const ended=physicsStep(b,dt/steps,events);if(ended)return ended;}return null;
}
function physicsStep(b,dt,events=true){
 dt*=ballPace(b);
 b.spin=(b.spin||0)+Math.hypot(b.vx,b.vy)*dt/9*(b.vx<0?-1:1);
 const from={x:b.x,y:b.y,z:b.z},prevX=b.x;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;b.vz-=G*(b.spinGravity||1)*dt;
 const finish=(team,reason)=>{if(events){sfx(reason==='NET'?'net':reason.includes('FENCE')?'fence':'glass');if(b.serve)serveFault(reason);else point(team,reason);}return reason;};
 if(side(prevX)!==side(b.x)){
  if(b.z<NET){if(b.serve&&b.z>=NET-4)b.netTouch=true;else return finish(1-b.last,'NET');}
  if(b.legalBounce&&side(b.x)===b.last&&!b.serve){b.returned=true;if(events)point(b.last,'TRAÍDA');return 'TRAÍDA';}
  b.crossed=true;
 }
 if(b.z<=0){
  b.z=0;b.vz=Math.abs(b.vz)*(b.smash?(b.smashBounce||.62):b.slice|| (b.shotKind==='LOB'?.44:.72));b.vx*=.94;b.vy*=.94;b.bounces++;if(b.gestureSpin)b.vz*=1+Math.sign(b.gestureSpin)*.1*spinStrength(b.gestureSpin,b.power);
  if(events){ring(b.x,b.y,b.smash?'#ffa66f':'#d9e7b4',.55);sfx('bounce');}
  if(b.serve&&b.bounces===1){const validX=courtSide(b.last)===0?b.x>=500&&b.x<=850:b.x>=150&&b.x<=500;const validY=b.receiverLane===0?b.y<=250:b.y>=250;
   if(!validX||!validY)return finish(1-b.last,'WRONG SERVICE BOX');
  }
  if(side(b.x)===b.last){if(b.returned){if(events)point(b.last,'TRAÍDA');return 'TRAÍDA';}return finish(1-b.last,'SHORT BALL');}
  if(b.bounces>=2){if(b.serve&&b.netTouch){if(events)serveLet();return 'LET';}if(events)point(b.last,'DOUBLE BOUNCE');return 'DOUBLE BOUNCE';}
  b.legalBounce=true;
  if(events&&globalThis.Practice?.active)Practice.onFloor(b);
 }
 if(events&&redBodyContact(b,from)){point(b.last,'BODY HIT');sfx('hit',1);return 'BODY HIT';}
 const back=b.x<5||b.x>995,sideWall=b.y<5||b.y>495;
 if(back||sideWall){
  const limit=back||b.x<200||b.x>800?200:150;
  if(b.z>=limit){
   if(!b.legalBounce)return finish(1-b.last,'OUT BEFORE BOUNCE');
   if(b.serve)return finish(1-b.last,'SERVE OUT');
   if(events){stats.exits++;ring(clamp(b.x,0,1000),clamp(b.y,0,500),'#ffb76b');point(b.last,limit===200?'POR CUATRO · ×4':'POR TRES · ×3');}
   return 'EXIT';
  }
  const fence=back?b.z>=150:((b.x>=200&&b.x<=800)||b.z>=150);
  if(fence&&side(b.x)===b.last&&!b.legalBounce)return finish(1-b.last,'OWN FENCE');
  if(b.bounces===0&&side(b.x)!==b.last)return finish(1-b.last,fence?'FENCE BEFORE FLOOR':'GLASS BEFORE FLOOR');
  if(b.serve&&fence)return finish(1-b.last,'SERVE HIT FENCE');
  if(b.serve&&b.netTouch){if(events)serveLet();return 'LET';}
  if(!fence&&b.legalBounce)b.glassTouches=(b.glassTouches||0)+1;
  wallLift(b,fence,Math.hypot(back?b.vx:0,sideWall?b.vy:0));
  if(back){b.x=clamp(b.x,5,995);b.vx*=-wallRetention(b,fence);}
  if(back&&b.sideSpin){b.vy+=b.sideSpin;b.sideSpin=0;}
  if(sideWall){b.y=clamp(b.y,5,495);b.vy*=-wallRetention(b,fence);}
  if(events){ring(b.x,b.y,fence?'#a5b1ca':'#8cd5d7');sfx(fence?'fence':'glass');message(fence?'OFF THE FENCE':'OFF THE GLASS');}
 }
 return null;
}
// Post-point motion is presentation only: it never calls point() or changes the result.
function animateAfterPoint(dt){
 if(afterPointAge>=6)return;afterPointAge+=dt;
 ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;ball.z+=ball.vz*dt;ball.vz-=G*dt;
 if(ball.z<0){ball.z=0;ball.vz=Math.abs(ball.vz)*.4;ball.vx*=.78;ball.vy*=.78;}
 if(!afterPointExit){
  if(ball.x<5||ball.x>995){ball.x=clamp(ball.x,5,995);ball.vx*= -.45;}
  if(ball.y<5||ball.y>495){ball.y=clamp(ball.y,5,495);ball.vy*= -.45;}
 }
 const drag=Math.exp(-dt*(afterPointAge>.9?5:1.2));ball.vx*=drag;ball.vy*=drag;
 for(const p of players){p.swing=Math.max(0,p.swing-dt);p.vx*=Math.exp(-dt*10);p.vy*=Math.exp(-dt*10);p.x+=p.vx*dt;p.y+=p.vy*dt;p.gait+=Math.hypot(p.vx,p.vy)*dt*.095;constrainPlayer(p);}
 trail.push({x:ball.x,y:ball.y,z:ball.z,shotKind:ball.shotKind,swipeFlight:ball.swipeFlight,color:ball.shotColor||shotColor(.2)});if(trail.length>40)trail.shift();
}
// Arcade assist only for low glass rebounds after a legal bounce. High smashes,
// fences and own-glass shots retain their existing trajectories.
function wallLift(b,fence,impactSpeed){
 if(fence||!b.legalBounce||b.z>=65||b.wallLifted)return;
 const lift=clamp(70+impactSpeed*.12,80,135);
 if(b.vz<lift){b.vz=lift;b.wallLifted=true;}
}
function wallRetention(b,fence=false){
 if(!b.legalBounce||!Number.isFinite(b.power))return fence?.62:.83;
 const q=b.power,r=q<.35?.32:q<.65?.46:q<.85?.67:b.smash?.98:.92;
 const effect=1+(b.gestureSpin?Math.sign(b.gestureSpin)*.22*spinStrength(b.gestureSpin,b.power):0);
 return fence?Math.min(.5,r*.75):Math.min(1.02,r*effect);
}
// Look ahead at actual floor/glass physics, then stage on the outgoing side of the rebound.
// Cached at 10 Hz per AI rather than recomputing a flight on every 120 Hz simulation tick.
function receivePlan(p){
 if(p.planShot===shotSerial&&clock<(p.planUntil||0))return p.receivePlan;
 if(p.planShot!==shotSerial){const atNet=Math.abs(p.x-500)<190;p.wallPreference=ball.smash?true:Math.random()<(atNet?.12:.84);p.volleyPreference=Math.random()<(atNet?.92:.23);}
 p.planShot=shotSerial;p.planUntil=clock+.1;
 const b={...ball};let direct=null,ground=null,glass=null,overhead=null;
 for(let t=.025;t<=2.5;t+=.025){
  if(physics(b,.025,false))break;
  if((side(b.x)!==p.team&&!reachBackOverNet(p,b))||!ownsLane(p,b.y)||b.z<9||b.z>(ball.smash||ball.shotKind==='LOB'?205:150)||(b.serve&&(!b.bounces||p.lane!==b.receiverLane)))continue;
  const speed=Math.max(1,Math.hypot(b.vx,b.vy));
  const target={x:clamp(b.x+b.vx/speed*35,courtSide(p.team)?520:20,courtSide(p.team)?980:480),y:clamp(b.y+b.vy/speed*25,p.lane===0?20:268,p.lane===0?232:480)};
  if(Math.hypot(p.x-target.x,p.y-target.y)>levelOf(p).speed*Math.max(0,t-.05)+25)continue;
  const candidate={...target,waitGlass:false,waitBounce:b.bounces>0};
  if(!direct)direct=candidate;
  if(!overhead&&ball.shotKind==='LOB'&&!b.bounces&&b.z>=110&&Math.abs(b.x-500)<190)overhead=candidate;
  if(b.bounces>0&&!ground)ground=candidate;
  if((b.glassTouches||0)>(ball.glassTouches||0)&&b.bounces===1){glass={...candidate,waitGlass:true,waitBounce:true};break;}
 }
 // Never wait for an unreachable rebound or a second bounce. Short balls stay playable.
 p.receivePlan=overhead|| (glass&&p.wallPreference&&!(ball.glassTouches>0)?glass:ground&&(!p.volleyPreference||ball.serve)?ground:direct);
 return p.receivePlan;
}

function isCasual(p){return !!p?.human&&globalThis.matchControlMode==='casual';}
function casualAttributes(p){return globalThis.matchKit&&!network?.active?characterAttributes(p?.appearance):globalThis.Career?.attributes(p?.appearance?.id??11)||characterAttributes(p?.appearance);}
function humanMoveSpeed(p){return isCasual(p)?(190+casualAttributes(p).speed*19)*(p.boosting?1.65:1):235*(1+(characterAttributes(p.appearance).speed-3)*.015);}
function updateCasualBoost(p,dt,held){
 p.energy??=1;if(!held)p.boostExhausted=false;
 p.boosting=!!held&&!p.boostExhausted&&p.energy>0;
 if(p.boosting){p.energy=Math.max(0,p.energy-dt*.5/(1+.12*(casualAttributes(p).stamina-3)));p.boostShowUntil=clock+1.2;if(p.energy===0){p.boostExhausted=true;p.boosting=false;}}
 else p.energy=Math.min(1,p.energy+dt*.26);
}
function casualAxes(p,goal=null){
 const a=casualAttributes(p),forward=courtSide(p.team)?-1:1;
 if(!goal){
  if(p.autoShot!==shotSerial){p.autoShot=shotSerial;p.autoReady=clock+.19-a.stamina*.025;p.autoUntil=0;p.autoTarget=null;}
  if(clock>=p.autoReady&&clock>=(p.autoUntil||0)){
   p.autoUntil=clock+.1;let target=null;
   const partner=players.find(q=>q!==p&&q.team===p.team),incoming=ball.last!==p.team;
   // Respect the service receiver and let the partner handle their side unless chasing a wide ball.
   const assigned=!partner||(ball.serve?p.lane===(ball.receiverLane??p.lane):((ball.y<250?0:1)===p.lane||Math.hypot(ball.x-p.x,ball.y-p.y)+70<Math.hypot(ball.x-partner.x,ball.y-partner.y)));
   if(incoming&&assigned){const b={...ball};for(let t=.025;t<=3.5;t+=.025){
    if(physics(b,.025,false))break;
    if(side(b.x)!==p.team||b.z<10||b.z>185||(b.serve&&!b.bounces))continue;
    const vx=b.vx||-forward,vy=b.vy||0,n=Math.hypot(vx,vy)||1;
    const candidate={x:clamp(b.x+vx/n*38,courtSide(p.team)?525:25,courtSide(p.team)?975:475),y:clamp(b.y+vy/n*30,25,475)};
    if(Math.hypot(candidate.x-p.x,candidate.y-p.y)<=humanMoveSpeed(p)*Math.max(0,t-.04)+12){target=candidate;break;}
   }}
   p.autoTarget=target||{x:courtSide(p.team)?(incoming?830:650):(incoming?170:350),y:p.lane?355:145};
  }
  goal=p.autoTarget;
 }
 if(!goal||p.swing>0)return {x:0,y:0};const dx=goal.x-p.x,dy=goal.y-p.y,n=Math.hypot(dx,dy);return n>7?{x:dx/n,y:dy/n}:{x:0,y:0};
}

function prediction(team,player){if(player)return receivePlan(player);return {x:ball.x,y:ball.y};}
function tick(dt){if(globalThis.Practice?.active){Practice.tick(dt);return;}if(network?.active)network.beforeTick(dt);clock+=dt;noticeTime-=dt;comboPulse=Math.max(0,comboPulse-dt*3);if(celebration)celebration.age+=dt;effects.forEach(e=>e.t-=dt);effects=effects.filter(e=>e.t>0);if(state==='over'){animateAfterPoint(dt);return;}if(state==='point'){animateAfterPoint(dt);pointRemaining=Math.max(0,pointRemaining-dt);if(pointRemaining<=0)setupServe();return;}if(['fault','let'].includes(state)){animateAfterPoint(dt);wait-=dt;if(wait<=0)setupServe(state==='fault'?2:state==='let'?serveAttempt:1);return;}
if(state==='serve'){
 for(const p of players)if(p!==players[serverIndex])p.angle=courtSide(p.team)?Math.PI:0;
 const server=players[serverIndex];serveTimer=Math.max(0,serveTimer-dt);advanceCharge(dt);
 const pose=racketPose(server,0,22);ball.x=pose.x;ball.y=pose.y;
 if(server.servePending){server.serveWindup-=dt;const progress=clamp(1-server.serveWindup/.45,0,1);ball.z=22*Math.abs(1-2*progress);if(server.serveWindup<=0)launchServe(server.servePending);}
 else {ball.z=server.human?22:serveTimer>.65?Math.abs(Math.sin((1.8-serveTimer)*Math.PI/1.15))*36:22;if(serveTimer<=0)launchServe();}
 return;
}if(state!=='play')return;advanceCharge(dt);energy=Math.min(1,energy+dt*.24*(1+.1*(characterAttributes(players[localSlot()]?.appearance).stamina-3)));dash=Math.max(0,dash-dt);if(!isCasual(players[localSlot()])&&(keys.ShiftLeft||keys.ShiftRight)&&energy>.45&&dash===0){dash=.18;energy-=.45;sfx('swing');}
for(const p of players){p.cool=Math.max(0,p.cool-dt);p.swing=Math.max(0,p.swing-dt);let dx=0,dy=0,spd=p.human?humanMoveSpeed(p):levelOf(p).speed;spd*=1+(rallyPace()-1)*.3;if(isCasual(p)){updateCasualBoost(p,dt,isLocal(p)?keys.ShiftLeft||keys.ShiftRight:p.netInput?.dash);spd=humanMoveSpeed(p)*(1+(rallyPace()-1)*.3);const move=casualAxes(p);dx=move.x;dy=move.y;}else if(p.human&&isLocal(p)){dx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joy.x;dy=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0)+joy.y;if(dash>0)spd=520;}else if(p.human){const input=p.netInput||{};dx=input.x||0;dy=input.y||0;p.energy=Math.min(1,(p.energy??1)+dt*.24*(1+.1*(characterAttributes(p.appearance).stamina-3)));p.dash=Math.max(0,(p.dash||0)-dt);if(input.dash&&p.energy>.45&&!p.dash){p.dash=.18;p.energy-=.45;}if(p.dash>0)spd=520;}else{let target=aiRecovery(p);
let pred=ball.last!==p.team&&clock>=p.readyAt?prediction(p.team,p):null;
if(pred&&ownsLane(p,pred.y))target={x:pred.x,y:pred.y};
target={x:clamp(target.x,courtSide(p.team)?520:20,courtSide(p.team)?980:480),y:clamp(target.y,p.lane===0?20:268,p.lane===0?232:480)};
const d=Math.hypot(target.x-p.x,target.y-p.y);if(d>8){dx=(target.x-p.x)/d;dy=(target.y-p.y)/d;}}
let n=Math.max(1,Math.hypot(dx,dy));p.vx+=(dx/n*spd-p.vx)*Math.min(1,dt*16);p.vy+=(dy/n*spd-p.vy)*Math.min(1,dt*16);p.x=clamp(p.x+p.vx*dt,courtSide(p.team)?520:20,courtSide(p.team)?980:480);p.y+=p.vy*dt;p.gait+=Math.hypot(p.vx,p.vy)*dt*.095;constrainPlayer(p);if(p.human)faceBall(p,dt);else if(p.swing<=0)p.angle=Math.atan2(ball.y-p.y,ball.x-p.x);if(p.human){const shot=isLocal(p)?pendingShot:p.netPending;if(shot){if(hit(p,shot.lob,shot.power,shot.aim,shot.timing)){if(isLocal(p))pendingShot=null;else p.netPending=null;}else{shot.remaining-=dt;if(shot.remaining<=0){if(isLocal(p))pendingShot=null;else p.netPending=null;p.swing=.22;p.impactAngle=-.65;p.contactZ=0;p.cool=.18;message('MISSED · RELEASE WHEN THE BALL IS CLOSE');}}}}else if(p.cool===0&&ball.last!==p.team&&clock>=p.readyAt){
 if(p.seenShot!==shotSerial){p.seenShot=shotSerial;p.choice=aiChoice(p);}
 const opportunity=p.choice.attack&&ball.bounces===0&&ball.z>=110&&ball.z<=205&&Math.abs(p.x-500)<200;
 hit(p,opportunity?false:p.choice.lob,opportunity?p.choice.overheadPower:p.choice.power,p.choice.aim);
 }}
// Bodies have mass and cannot occupy the same spot.
for(let a=0;a<players.length;a++)for(let b=a+1;b<players.length;b++){let p=players[a],q=players[b],dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy);if(d>0&&d<31){let k=(31-d)/2;p.x-=dx/d*k;p.y-=dy/d*k;q.x+=dx/d*k;q.y+=dy/d*k;}}
for(const p of players)constrainPlayer(p);
if(state!=='play')return;
updateContactAssist(dt);physics(ball,dt);trail.push({x:ball.x,y:ball.y,z:ball.z,shotKind:ball.shotKind,swipeFlight:ball.swipeFlight,color:ball.shotColor||shotColor(.2)});if(trail.length>40)trail.shift();}
function farCamera(){return !!courtSide(players[localSlot()]?.team??0);}
function courtVector(x,y){
 if(farCamera()){x=-x;y=-y;}
 return portraitMode?{x:-y,y:x}:{x,y};
}
function viewVector(x,y){return portraitMode?{x:y,y:-x}:{x,y};}
function viewPoint(x,y){return farCamera()?viewVector(W-x,H-y):viewVector(x,y);}
function courtTransform(context){
 context.translate(ox,oy);if(portraitMode)context.rotate(-Math.PI/2);context.scale(scale,scale);
 if(farCamera()){context.translate(W,H);context.rotate(Math.PI);}
}
function movementKey(code){
 if(portraitMode)code=({KeyW:'KeyD',KeyD:'KeyS',KeyS:'KeyA',KeyA:'KeyW',ArrowUp:'ArrowRight',ArrowRight:'ArrowDown',ArrowDown:'ArrowLeft',ArrowLeft:'ArrowUp'})[code]||code;
 if(farCamera())code=({KeyW:'KeyS',KeyS:'KeyW',KeyA:'KeyD',KeyD:'KeyA',ArrowUp:'ArrowDown',ArrowDown:'ArrowUp',ArrowLeft:'ArrowRight',ArrowRight:'ArrowLeft'})[code]||code;
 return code;
}
function defaultPortraitMode(device) {
 const agent = device?.userAgent || '';
 // iPadOS can advertise a Mac desktop user agent.
 if (/iPad/i.test(agent) || (device?.platform === 'MacIntel' && device.maxTouchPoints > 1)) return false;
 if (typeof device?.userAgentData?.mobile === 'boolean') return device.userAgentData.mobile;
 return /iPhone|iPod|Android.*Mobile|Windows Phone/i.test(agent);
}
const buildLayout=document.documentElement?.dataset?.layout;
let portraitMode = defaultPortraitMode(globalThis.navigator);
try {
 const saved = localStorage.getItem('tdp-orientation');
 if (!portraitMode && (saved === 'portrait' || saved === 'landscape')) portraitMode = saved === 'portrait';
} catch {}
if(buildLayout)portraitMode=buildLayout==='mobile';
function applyPresentation(){
 document.body?.classList.toggle('portrait',portraitMode);
 const desktop=$('#desktop-style'),phone=$('#phone-style');
 if(desktop)desktop.media=portraitMode?'not all':'all';
 if(phone)phone.media=portraitMode?'all':'not all';
}
applyPresentation();
const desktopCourtLabel=canvas.getAttribute?.('aria-label');
function updateCourtLabel(){
 if(!desktopCourtLabel)return;
 const mobile=language==='es'?'Pista de pádel. Desliza para golpear. Para un globo, toca, levanta el dedo y desliza enseguida. En competitivo, mueve el pulgar en la zona inferior izquierda.':'Padel court. Swipe to hit. For a lob, tap, lift, then immediately swipe. In Competitive, steer with your thumb in the lower left.';
 const original=staticTranslations.find(item=>item.node===canvas&&item.attr==='aria-label')?.raw||desktopCourtLabel;
 canvas.setAttribute('aria-label',portraitMode?mobile:tr(original));
}
function orientationLabel(){updateCourtLabel();const b=$('#orientation');if(b)b.textContent=language==='es'?'ORIENTACIÓN · '+(portraitMode?'VERTICAL':'HORIZONTAL'):'ORIENTATION · '+(portraitMode?'PORTRAIT':'LANDSCAPE');}
globalThis.refreshOrientationLabel=orientationLabel;
const orientationButton=$('#orientation');
orientationLabel();
if(orientationButton&&buildLayout)orientationButton.hidden=true;
if(orientationButton&&!buildLayout)orientationButton.onclick=()=>{portraitMode=!portraitMode;applyPresentation();try{localStorage.setItem('tdp-orientation',portraitMode?'portrait':'landscape');}catch{}cancelShot();globalThis.controlAim=null;joy={x:0,y:0};for(const k in keys)keys[k]=false;orientationLabel();resize();};
function resize(){
 const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);if(r.width<1||r.height<1)return;canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);cw=r.width;ch=r.height;ctx.setTransform(canvas.width/cw,0,0,canvas.height/ch,0,0);fxCanvas.width=canvas.width;fxCanvas.height=canvas.height;fxCtx.setTransform(d,0,0,d,0,0);
 if(portraitMode){const hud=globalThis.Practice?.active?94:matchGames!==1?82:60;/* Entire enclosure, including posts, fits from either camera end. */scale=Math.min(Math.max(1,cw-8)/600,Math.max(1,ch-hud-8)/1100);ox=cw/2-250*scale;oy=hud+(ch-hud)/2+500*scale;return;}
 const compact=cw<650,sidePad=compact?45:95,topPad=compact?65:48,bottomPad=compact?155:90;
 scale=Math.max(.1,Math.min((cw-sidePad)/1000,(ch-topPad-bottomPad)/500));ox=(cw-1000*scale)/2;oy=topPad+Math.max(0,(ch-topPad-bottomPad-500*scale)/2);
}
let courtArt=null,courtPaletteKey='';
function drawCourt(){
 const venue=globalThis.careerVenue&&!network?.active?globalThis.careerVenue:null;
 globalThis.ClubArt?.updateHUD(venue,language);
 const dye=!network?.active&&!globalThis.Practice?.active?globalThis.matchKit?.gear[7]:null;
 const dyed=dye!=null?[['#227e77','#176960','#125750'],['#227897','#196584','#155777'],['#86598e','#734e83','#664274'],['#555c66','#444c56','#343d47']][KitBags.tier(dye)]:null;
 const palette=dyed||globalThis.ClubArt?.palette(venue)||['#1478c4','#096ab4','#075797'],paletteKey=palette.join(',');
 if(!courtArt||courtPaletteKey!==paletteKey){
  courtPaletteKey=paletteKey;
  courtArt=document.createElement('canvas');courtArt.width=2200;courtArt.height=1200;const g=courtArt.getContext('2d');g.scale(2,2);g.translate(50,50);
  const stroke=(x1,y1,x2,y2,color,width=1)=>{g.beginPath();g.strokeStyle=color;g.lineWidth=width;g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();};
  const poly=(pts,fill,border)=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=fill;g.fill();if(border){g.strokeStyle=border;g.lineWidth=1;g.stroke();}};
  g.shadowColor='#0009';g.shadowBlur=25;g.shadowOffsetY=12;g.fillStyle='#0a1622';g.fillRect(-24,-25,1048,550);g.shadowBlur=0;g.shadowOffsetY=0;
  const turf=g.createLinearGradient(0,0,850,550);turf.addColorStop(0,palette[0]);turf.addColorStop(.5,palette[1]);turf.addColorStop(1,palette[2]);g.fillStyle=turf;g.fillRect(0,0,1000,500);
  for(let x=0;x<1000;x+=100){g.fillStyle=x%200===0?'#d1f0ff05':'#002c5809';g.fillRect(x,0,100,500);}
  // Seeded, cached microfibres: no gameplay RNG and no per-frame texture work.
  let turfSeed=71327;
  const grain=()=>{turfSeed=(Math.imul(turfSeed,1664525)+1013904223)>>>0;return turfSeed/4294967296;};
  for(let i=0;i<155000;i++){const x=grain()*1000,y=grain()*500,v=grain();g.fillStyle=v>.5?'#b9eaff12':'#00254c16';g.fillRect(x,y,(dyed?1+KitBags.tier(dye)*.3:.35)+grain()*.45,.4+grain()*.8);}
  const edge=g.createLinearGradient(0,0,0,500);edge.addColorStop(0,'#001d472a');edge.addColorStop(.15,'#001d4700');edge.addColorStop(.85,'#001d4700');edge.addColorStop(1,'#001d472a');g.fillStyle=edge;g.fillRect(0,0,1000,500);
  g.strokeStyle='#e6f4ffcc';g.lineWidth=2.2;g.strokeRect(2,2,996,496);stroke(150,0,150,500,'#e6f4ffcc',2.2);stroke(850,0,850,500,'#e6f4ffcc',2.2);stroke(150,250,850,250,'#e6f4ffcc',2.2);
  // Panel shadows fall onto the floor without changing playable bounds.
  poly([[0,0],[1000,0],[1000,23],[20,23]],'#00234135');
  for(let x=0;x<=1000;x+=100)stroke(x,0,x+17,24,'#001d4633',2);
  poly([[0,0],[0,500],[17,486],[17,20]],'#00244325');
  // Centered, nearly upright projection: both ends open equally, with no leftward shear.
  // Art heights follow the approved 4 m glass / 3 m mesh silhouette.
  const wallTop=(x,y,h)=>[x+(x-500)*h*.003,y-h*10];
  const rail=(a,b)=>{stroke(...a,...b,'#092438',4);stroke(a[0],a[1]-.6,b[0],b[1]-.6,'#a0dce7',1.6);};
  const post=(x,y,h,corner=false)=>{
   const t=wallTop(x,y,h);stroke(x,y,...t,'#071b2b',corner?9:5.5);stroke(x-1,y,t[0]-1,t[1],'#47768e',corner?4.5:2.5);
   g.beginPath();g.ellipse(t[0],t[1],corner?5:2.8,corner?3.7:2,0,0,Math.PI*2);g.fillStyle='#284e66';g.fill();g.strokeStyle='#a1d4e3';g.lineWidth=.8;g.stroke();
  };
  const panel=(ax,ay,bx,by,h,mesh)=>{
   const a=[ax,ay],b=[bx,by],ta=wallTop(ax,ay,h),tb=wallTop(bx,by,h);
   const sheen=g.createLinearGradient(ta[0],ta[1],ax,ay);sheen.addColorStop(0,mesh?'#092235db':'#83d9e54a');sheen.addColorStop(1,mesh?'#081b2bdd':'#2381a132');
   poly([a,b,tb,ta],sheen);
   g.save();g.beginPath();g.moveTo(...a);g.lineTo(...b);g.lineTo(...tb);g.lineTo(...ta);g.closePath();g.clip();
   if(mesh){
    for(let x=Math.min(ax,bx)-15;x<=Math.max(ax,bx);x+=4)stroke(x,ay,...wallTop(x,ay,h),'#9bc2d04d',.48);
    for(let k=3;k<h*10;k+=3.5){const f=k/(h*10);stroke(ax+(ta[0]-ax)*f,ay-k,bx+(tb[0]-bx)*f,by-k,'#92b8cc48',.48);}
   }else if(ay===by){
    poly([[ta[0]+8,ta[1]+3],[ta[0]+30,ta[1]+3],[ax+65,ay-3],[ax+43,ay-3]],'#d0faff0b');
   }else{
    // Slim reflections on the end panes preserve visibility near the baseline.
    poly([[ta[0]+1,ta[1]+12],[ta[0]+3,ta[1]+16],[ax-2,ay+76],[ax-3,ay+68]],'#d0faff18');
   }
   g.restore();rail(ta,tb);stroke(...a,...b,'#9ed6df9c',1.5);
  };
  // End glass first, both long sides share its exact corner coordinates.
  for(const x of [0,1000]){
   for(let y=0;y<500;y+=100){panel(x,y,x,y+100,4,false);if(y)post(x,y,4);}
  }
  for(const y of [0,500]){
   for(let x=0;x<1000;x+=100){const mesh=x>=200&&x<800;panel(x,y,x+100,y,mesh?3:4,mesh);}
   for(let x=100;x<1000;x+=100)post(x,y,x<=200||x>=800?4:3);
   // A short upright joins the two rail levels at every material transition.
   for(const x of [200,800])rail(wallTop(x,y,4),wallTop(x,y,3));
  }
  for(const x of [0,1000])for(const y of [0,500])post(x,y,4,true);
  // Raised net reads clearly while collision stays on x=500.
  poly([[500,0],[514,8],[514,500],[500,500]],'#00162d70');g.fillStyle='#0b1b2ddd';g.fillRect(494,0,9,500);
  for(let y=0;y<500;y+=5)stroke(494,y,503,y,'#8aa9ba88',.6);for(let x=495;x<504;x+=3)stroke(x,0,x,500,'#91adbb55',.6);
  stroke(494,0,494,500,'#e5edf4',2.5);stroke(503,0,503,500,'#264453',1.5);
  for(const y of [-5,505]){g.fillStyle='#102836';g.fillRect(489,y-4,16,8);g.fillStyle='#c1d9df';g.fillRect(491,y-4,4,8);}
 }
 ctx.drawImage(courtArt,-50,-50,1100,600);

 const heat=rallyHeat();if(heat>0){ctx.save();ctx.globalAlpha=heat*.7;ctx.fillStyle='#d82835';ctx.fillRect(3,3,490,494);ctx.fillRect(505,3,492,494);ctx.restore();
 line(150,2,150,498,'#e6f4ffcc',2.2);line(850,2,850,498,'#e6f4ffcc',2.2);line(150,250,493,250,'#e6f4ffcc',2.2);line(505,250,850,250,'#e6f4ffcc',2.2);}

}
function line(x1,y1,x2,y2,c,w=1){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function circle(x,y,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function drawOnFireLabel(x,y){
 text('ON FIRE',x,y,14,'#ffbd62');
 const width=ctx.measureText(tr('ON FIRE')).width;
 ctx.save();ctx.translate(x+width/2+11,y-6);ctx.scale(1,1+.06*Math.sin(clock*9));
 ctx.shadowColor='#ff8d36';ctx.shadowBlur=4;ctx.fillStyle='#ff8538';
 ctx.beginPath();ctx.moveTo(0,8);ctx.bezierCurveTo(-10,7,-7,-2,-3,-5);ctx.quadraticCurveTo(-4,0,-1,1);ctx.quadraticCurveTo(3,-5,1,-11);ctx.bezierCurveTo(10,-4,9,7,0,8);ctx.fill();
 ctx.shadowBlur=0;ctx.fillStyle='#ffe19a';ctx.beginPath();ctx.moveTo(0,6);ctx.quadraticCurveTo(-4,3,0,-2);ctx.quadraticCurveTo(5,4,0,6);ctx.fill();ctx.restore();
}
function courtLabel(label,x,y,outline=false){if(!portraitMode&&!farCamera()){if(outline)ctx.strokeText(label,x,y);ctx.fillText(label,x,y);return;}ctx.save();ctx.translate(x,y);ctx.rotate((portraitMode?Math.PI/2:0)+(farCamera()?Math.PI:0));if(outline)ctx.strokeText(label,0,0);ctx.fillText(label,0,0);ctx.restore();}
function text(t,x,y,size,color,align='center'){ctx.fillStyle=color;ctx.font=`800 ${Math.max(size,(portraitMode?21:20)/Math.max(.1,scale))}px 'Barlow Condensed',sans-serif`;ctx.textAlign=align;courtLabel(tr(t),x,y);}
function drawRacket(team,target=ctx,skin=null,grip=null){
 const ctx=target;
 const line=(x,y,X,Y,color,width)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(X,Y);ctx.stroke();};
 const circle=(x,y,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();};
 ctx.save();
 // Wrapped grip, open throat, solid teardrop face and drilled holes.
 line(-8,0,2,0,'#10202c',6);line(-7,0,1,0,grip!=null?KitBags.tiers[KitBags.tier(grip)][2]:'#e5e6d9',3.5);
 for(let x=-7;x<1;x+=2)line(x,-2,x+1,2,'#667783',.7);
 ctx.strokeStyle=team?'#ef9e7d':'#b4d7ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(1,-1);ctx.lineTo(8,-6);ctx.lineTo(8,6);ctx.closePath();ctx.stroke();
 ctx.beginPath();ctx.moveTo(5,0);ctx.bezierCurveTo(8,-10,16,-16,24,-14);ctx.bezierCurveTo(36,-12,36,12,24,14);ctx.bezierCurveTo(16,16,8,10,5,0);ctx.closePath();
 ctx.fillStyle='#102a3d';ctx.fill();ctx.strokeStyle=skin?.accent||(team?'#ffb290':'#b9dfff');ctx.lineWidth=2.4;ctx.stroke();
 ctx.save();ctx.clip();ctx.fillStyle=skin?.primary||(team?'#ec865d':'#6ab8ed');ctx.beginPath();ctx.moveTo(10,-14);ctx.lineTo(16,-14);ctx.lineTo(30,14);ctx.lineTo(24,14);ctx.closePath();ctx.fill();
 for(let x=12;x<=28;x+=4)for(let y=-9;y<=9;y+=4.5){if(((x-21)/13)**2+(y/12)**2<.82){circle(x,y,1.25,'#07151f');circle(x-.25,y-.3,.42,'#8ba4af');}}
 ctx.restore();line(15,-11,23,-12,'#f1f6ec80',1);ctx.restore();
}
function oval(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function drawFinisherAura(p){
 if(globalThis.Practice?.active)return;const n=p.finisherCharge||0,burst=Math.max(0,(p.finisherUntil||0)-clock);if(!n&&!burst)return;
 const ready=n===5,level=burst?1:n/5,pulse=1+Math.sin(clock*5)*.06;
 ctx.save();ctx.globalAlpha=.08+.12*level;ctx.fillStyle=ready||burst?'#ff653c':'#ffc34c';ctx.beginPath();ctx.ellipse(p.x,p.y+5,(22+level*9)*pulse,(14+level*6)*pulse,0,0,Math.PI*2);ctx.fill();
 ctx.globalAlpha=.3+.35*level;ctx.strokeStyle=ready||burst?'#ff8b43':'#ffc34c';ctx.lineWidth=ready?2.4:1.3;ctx.beginPath();ctx.ellipse(p.x,p.y+5,29,18,0,-Math.PI/2,-Math.PI/2+Math.PI*2*level);ctx.stroke();
 if(ready||burst){for(let i=0;i<5;i++){const a=i*Math.PI*2/5+clock*.7,x=p.x+Math.cos(a)*25,y=p.y+Math.sin(a)*14;ctx.fillStyle=i%2?'#ff7040':'#ffdf73';ctx.beginPath();ctx.moveTo(x-3,y+3);ctx.quadraticCurveTo(x-5,y-3,x+Math.sin(clock*7+i)*3,y-12);ctx.quadraticCurveTo(x+6,y-2,x+3,y+3);ctx.fill();}}
 ctx.restore();
}
function drawFinisherMeter(p){
 if(globalThis.Practice?.active)return;const n=p.finisherCharge||0,ready=n===5,x=clamp(p.x,35,965),y=clamp(p.y+63,25,480);
 ctx.save();ctx.fillStyle='#071b2de6';ctx.fillRect(x-27,y-4,54,9);for(let i=0;i<5;i++){ctx.fillStyle=i<n?(ready?'#ff813f':'#ffd16a'):'#39566c';ctx.fillRect(x-24+i*10,y-2,8,5);}if(ready){ctx.font="800 10px 'Barlow Condensed',sans-serif";ctx.textAlign='center';ctx.fillStyle='#ffbd62';ctx.fillText(tr('ON FIRE'),x,y+18);}ctx.restore();
}
function drawPlayer(p){
 const loading=(isLocal(p)?charge:p.netCharge)?.power||0,progress=p.swing>0?1-p.swing/.22:0;
 const skin=globalThis.PadelSkins?.get(p.appearance?.id,p.skinTier);
 const pose={...displayRacketPose(p)},win=celebrationPose(p);
 if(win){pose.gripX+=Math.cos(p.angle)*10*win.lift;pose.gripY-=18*win.lift;pose.z+=35*win.lift;pose.angle-=.65*win.pump;}
 // Finisher visuals are text-only; charge and shot mechanics stay active.
 ctx.save();
 if(portraitMode){const x=pose.gripX,y=pose.gripY-pose.z*.28;ctx.translate(x,y);ctx.scale(1.5,1.5);ctx.translate(-x,-y);}
 ctx.save();if(win)ctx.translate(0,-win.hop);CharacterRenderer.draw(ctx,p,{pose,loading,progress,celebration:win,skin});ctx.restore();
 if(isCasual(p)&&(p.boosting||p.boostShowUntil>clock)){ctx.save();ctx.globalAlpha=p.boosting?1:clamp(p.boostShowUntil-clock,0,1);ctx.fillStyle='#071722dd';ctx.fillRect(p.x-25,p.y-46,50,7);ctx.fillStyle=p.boostExhausted?'#ff8176':'#d7ff58';ctx.fillRect(p.x-24,p.y-45,48*(p.energy??1),5);ctx.restore();}


 ctx.save();ctx.translate(pose.gripX,pose.gripY-pose.z*.28-(win?.hop||0));ctx.rotate(pose.angle);ctx.scale(.65,.65*racketFaceWidth(loading,progress,p.swing));const k=!network?.active&&!globalThis.Practice?.active&&p===players[localSlot()]?globalThis.matchKit:null;
 const finish=k?.gear[8]??k?.gear[3],grip=k?.boosts.find(id=>KitBags.kind(id)===5);
 drawRacket(p.team,ctx,finish!=null?{...skin,accent:KitBags.tiers[KitBags.tier(finish)][2],primary:KitBags.tiers[KitBags.tier(finish)][2]}:skin,grip);ctx.restore();ctx.restore();
 const flash=p.impactFlash,age=flash?clock-flash.at:1;

 if(flash&&age>=0&&age<.3){const fade=1-age/.3,perfect=!!flash.perfect,punch=perfect?1.4:1;ctx.save();ctx.translate(flash.x,flash.y);ctx.rotate(flash.angle||0);ctx.globalAlpha=fade;ctx.strokeStyle=flash.color;ctx.fillStyle=flash.color;ctx.lineWidth=perfect?3.5:2.5;ctx.shadowColor=flash.color;ctx.shadowBlur=perfect?20:12;
 for(let i=0;i<(perfect?12:8);i++){const a=i*2.39996,r=(10+age*120)*punch,len=(9+(i%3)*7)*fade*punch;ctx.beginPath();ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);ctx.lineTo(Math.cos(a)*(r+len),Math.sin(a)*(r+len));ctx.stroke();}
 ctx.scale(punch,punch);ctx.beginPath();ctx.moveTo(-26*fade,0);ctx.lineTo(-5,-4);ctx.lineTo(0,-17*fade);ctx.lineTo(5,-4);ctx.lineTo(30*fade,0);ctx.lineTo(5,4);ctx.lineTo(0,17*fade);ctx.lineTo(-5,4);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#ffffff';ctx.fillRect(-3*fade,-7*fade,6*fade,14*fade);ctx.restore();}

 if(skin&&flash?.perfect&&age>=0&&age<.26)CharacterRenderer.strike(ctx,flash,age,p.skinTier,skin,p.appearance?.id);
 if(!showPlayerNames)return;
 ctx.save();ctx.shadowColor='#06213e';ctx.shadowBlur=4;ctx.fillStyle=p.human?'#e5f7ff':'#d4e4ef';const local=isLocal(p),labelSize=portraitMode?(local?24:21)/Math.max(.1,scale):Math.max(13,20/Math.max(.1,scale));ctx.font="800 "+labelSize+"px 'Barlow Condensed',sans-serif";ctx.lineJoin='round';ctx.strokeStyle='#071929';ctx.lineWidth=3/Math.max(.35,scale);ctx.textAlign='center';courtLabel(p.displayName||tr(p.name),p.x+(portraitMode?(farCamera()?58:-58):0),p.y+(portraitMode?0:farCamera()?-53:53),true);ctx.restore();
}
// Screen-space marker stays upright as the player turns or changes ends.
function drawControlledMarker(){
 const p=players[localSlot()];
 if(!p||state==='intro')return;
 const point=viewPoint(p.x+shakeX,p.y+shakeY);
 const x=ox+point.x*scale,y=oy+point.y*scale+(portraitMode?29:22)*scale+3;
 ctx.save();ctx.translate(x,y);ctx.lineJoin='round';
 ctx.beginPath();ctx.moveTo(-7,9);ctx.lineTo(7,9);ctx.lineTo(0,0);ctx.closePath();
 ctx.strokeStyle='#092437';ctx.lineWidth=3.5;ctx.stroke();
 ctx.fillStyle=p.team===0?'#53dcff':'#ff887e';ctx.fill();
 ctx.strokeStyle='#effbff';ctx.lineWidth=1;ctx.stroke();ctx.restore();
}
// Fixed screen coordinates keep the rail upright on either end and orientation.
function drawTimingMeter(p){
 if(!p||!['serve','play','fault','let','point','over'].includes(state))return;
 const approaching=state==='play'&&ball&&ball.last!==p.team&&side(ball.x)===p.team&&
  Math.hypot(ball.x-p.x,ball.y-p.y)<150&&ball.z<=220;
 const sample=approaching?timingSample(p):Number.isFinite(p.timingMark)?
  {grade:p.timingFeedback,position:p.timingMark}:null;
 const w=portraitMode?51:64,h=clamp(ch*.29,108,194);
 const x=portraitMode?7:14,y=(ch-h)*.5;
 const center=y+h*.5;
 ctx.save();ctx.translate(x,0);
 ctx.globalAlpha=approaching||p.timingUntil>clock?1:.82;
 ctx.fillStyle='#071b2ee6';ctx.fillRect(0,y,w,h);
 ctx.fillStyle='#315674';ctx.fillRect(0,y,3,h);
 ctx.fillStyle='#385342';ctx.fillRect(0,y+h*.38,w,h*.24);
 ctx.fillStyle='#cfff57';ctx.fillRect(0,y+h*.38,3,h*.24);
 ctx.textAlign='center';ctx.textBaseline='middle';
 const accent=sample?.grade==='PERFECT'?'#dcff71':'#ffffff';
 if(sample){
 const markerY=y+sample.position*h;
 ctx.fillStyle=accent;ctx.fillRect(0,markerY-1.5,w,3);
 ctx.beginPath();ctx.moveTo(w+6,markerY-5);ctx.lineTo(w,markerY);ctx.lineTo(w+6,markerY+5);ctx.fill();
 }
 ctx.font="900 "+(portraitMode?13:16)+"px 'Barlow Condensed',sans-serif";
 for(const [grade,labelY] of [['EARLY',y+12],['PERFECT',center],['LATE',y+h-12]]){
  const label=tr(grade);ctx.lineWidth=3;ctx.strokeStyle='#102432';ctx.strokeText(label,w/2,labelY,w-5);
  ctx.fillStyle=grade===sample?.grade?accent:'#bfcdcf';ctx.fillText(label,w/2,labelY,w-5);
 }
 ctx.restore();
}
function racketFaceWidth(loading,progress,swing){return swing>0?.18+.82*(1-clamp((progress-.55)/.45,0,1)):.18+.62*loading;}
// Preserve the screen-space ribbon, translated to the racket; pointer stays at the mouse.
function drawGestureOverlay(){
 const now=gestureNow();gestureStrokes=gestureStrokes.filter(s=>s.released===null||now-s.released<1050);
 if(!['play','serve','point','over','fault','let'].includes(state))return;
 const rect=canvas.getBoundingClientRect();ctx.save();ctx.translate(-(rect.left||0),-(rect.top||0));ctx.lineCap='round';ctx.lineJoin='round';
 for(const stroke of gestureStrokes){const points=stroke.points;if(points.length<2)continue;const alpha=strokeOpacity(stroke,now),color=shotColor(stroke===activeStroke?charge?.power??stroke.power:stroke.power);
  // Cache a twice-smoothed ribbon; one filled silhouette avoids jagged joins
  // and opacity seams between the old individually stroked segments.
  if(stroke.meshCount!==points.length||stroke.meshPoints!==points){
   let smooth=points;
   for(let pass=0;pass<2;pass++){const next=[smooth[0]];for(let i=1;i<smooth.length;i++){const a=smooth[i-1],b=smooth[i];next.push({x:a.x*.75+b.x*.25,y:a.y*.75+b.y*.25},{x:a.x*.25+b.x*.75,y:a.y*.25+b.y*.75});}next.push(smooth[smooth.length-1]);smooth=next;}
   let total=0;const distances=[0];for(let i=1;i<smooth.length;i++){total+=Math.hypot(smooth[i].x-smooth[i-1].x,smooth[i].y-smooth[i-1].y);distances.push(total);}
   const left=[],right=[];for(let i=0;i<smooth.length;i++){const p=smooth[i],a=smooth[Math.max(0,i-1)],b=smooth[Math.min(smooth.length-1,i+1)],len=Math.hypot(b.x-a.x,b.y-a.y)||1,r=.6+10*Math.pow(distances[i]/Math.max(1,total),1.7),nx=-(b.y-a.y)/len,ny=(b.x-a.x)/len;left.push({x:p.x+nx*r,y:p.y+ny*r});right.push({x:p.x-nx*r,y:p.y-ny*r});}
   stroke.mesh=[...left,...right.reverse()];stroke.meshCount=points.length;stroke.meshPoints=points;
  }
  const offset=gestureTrailOffset(stroke,rect);ctx.save();ctx.translate(offset.x,offset.y);
  ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=6;ctx.globalAlpha=alpha;
  const tip=points[points.length-1],half=stroke.mesh.length/2,edge=stroke.mesh[half-1],angle=Math.atan2(edge.y-tip.y,edge.x-tip.x);
  ctx.beginPath();for(let i=0;i<half;i++){const p=stroke.mesh[i];i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}
  ctx.arc(tip.x,tip.y,10.6,angle,angle-Math.PI,true);
  for(let i=half;i<stroke.mesh.length;i++)ctx.lineTo(stroke.mesh[i].x,stroke.mesh[i].y);
  ctx.closePath();ctx.fill();ctx.restore();
 }
 if(showMouseCursor&&['play','serve'].includes(state)&&!globalThis.controlAim){ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.fillStyle='#ffffff1c';ctx.strokeStyle='#ffffff88';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(mouse.x,mouse.y,14,0,Math.PI*2);ctx.fill();ctx.stroke();}
 ctx.restore();
}
function drawMouseDot(p){
 if(!showAimDot||!p)return;
 const d=cursorAim();ctx.save();ctx.shadowColor='#06213e';ctx.shadowBlur=2/Math.max(.1,scale);
 circle(p.x+d.x*68,p.y+d.y*68,2/Math.max(.1,scale),'#ffffff');ctx.restore();
}
function drawAimGuide(p){
 if(!charge||charge.gesture)return;
 const q=charge?.power||0,dir=swipeDirection(p,aimInput()),angle=Math.atan2(dir.y,dir.x),start=40,length=26+96*q,width=4+10*q*q,color=shotColor(q),end=start+length,shaft=1+2.5*q*q;
 ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);
 const fade=ctx.createLinearGradient(start,0,end+10,0);fade.addColorStop(0,color+'25');fade.addColorStop(.35,color+'99');fade.addColorStop(1,color+'e8');
 ctx.fillStyle=fade;ctx.beginPath();ctx.moveTo(start,-shaft);ctx.lineTo(end-9,-shaft);ctx.lineTo(end-9,-width);ctx.lineTo(end+9,0);ctx.lineTo(end-9,width);ctx.lineTo(end-9,shaft);ctx.lineTo(start,shaft);ctx.closePath();ctx.fill();ctx.restore();
}
// One translucent tapered ribbon, not overlapping discs. Neutral colour keeps
// shot-power colours out of the ball; a small gap prevents tinting its silhouette.
// In top-down view a lob shows height through size, shadow and reach color.
function ballDrawY(b){return b.shotKind==='LOB'||b.swipeFlight?b.y:b.y-b.z*.28;}
function drawBallTrail(b){
 const head={x:b.x,y:ballDrawY(b)},gap=(6+b.z*.033)*1.2,points=[];
 let distance=0,last=head;
 for(let i=trail.length-1;i>=Math.max(0,trail.length-22);i--){
  const t=trail[i],p={x:t.x,y:ballDrawY(t)};distance+=Math.hypot(p.x-last.x,p.y-last.y);last=p;
  if(distance>140)break;
  if(Math.hypot(p.x-head.x,p.y-head.y)<gap)continue;
  if(!points.length||Math.hypot(p.x-points[points.length-1].x,p.y-points[points.length-1].y)>.5)points.push(p);
 }
 if(points.length<2)return;
 points.reverse();ctx.save();ctx.shadowBlur=0;
 const start=points[0],end=points[points.length-1];
 const fade=ctx.createLinearGradient(start.x,start.y,end.x,end.y);
 fade.addColorStop(0,'#fff5bc00');fade.addColorStop(.45,'#fff5bc0c');fade.addColorStop(1,'#fff5bc42');
 ctx.fillStyle=fade;
 for(const [width,alpha] of [[3.4,.28],[1.8,.7]]){
  const left=[],right=[];
  for(let i=0;i<points.length;i++){
   const p=points[i],a=points[Math.max(0,i-1)],z=points[Math.min(points.length-1,i+1)],len=Math.hypot(z.x-a.x,z.y-a.y)||1;
   const w=width*Math.pow(i/(points.length-1),.7),nx=-(z.y-a.y)/len,ny=(z.x-a.x)/len;
   left.push([p.x+nx*w,p.y+ny*w]);right.push([p.x-nx*w,p.y-ny*w]);
  }
  ctx.globalAlpha=alpha;ctx.beginPath();[...left,...right.reverse()].forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
 }
 ctx.restore();
}
// Fine felt is generated once, independently of gameplay randomness. Its transparent
// fibres preserve the normal, out-of-reach and heated ball colours underneath.
let ballFelt=null;
function ballFeltTexture(){
 if(ballFelt)return ballFelt;
 const tile=document.createElement('canvas');tile.width=tile.height=128;
 const g=tile.getContext('2d');let seed=47021;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 g.lineCap='round';
 for(let i=0;i<10500;i++){
  const x=rand()*128,y=rand()*128,a=rand()*Math.PI*2,len=.45+rand()*1.1;
  g.strokeStyle=i%3?'rgba(255,255,218,.18)':'rgba(50,67,15,.20)';g.lineWidth=.35+rand()*.4;
  g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*len,y+Math.sin(a)*len);g.stroke();
 }
 ballFelt=tile;return tile;
}
function drawBallTexture(b,y,r){
 ctx.save();ctx.translate(b.x,y);
 ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.clip();
 ctx.save();ctx.rotate((b.spin||0)*.08);
 // The same material scales naturally into view on a high lob.
 ctx.drawImage(ballFeltTexture(),-r,-r,r*2,r*2);
 const seams=()=>{for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*r*.5,-r);ctx.bezierCurveTo(side*r*.12,-r*.35,side*r*.12,r*.35,side*r*.5,r);ctx.stroke();}};
 ctx.strokeStyle='#64733b55';ctx.lineWidth=Math.max(1,r*.16);seams();
 ctx.strokeStyle='#fff6cbd9';ctx.lineWidth=Math.max(.65,r*.095);seams();
 ctx.restore();
 // Fixed soft lighting: the felt and seams spin, the light source does not.
 const shade=ctx.createRadialGradient(-r*.35,-r*.4,r*.08,-r*.14,-r*.2,r*1.3);
 shade.addColorStop(0,'#ffffdd45');shade.addColorStop(.35,'#ffffdf18');shade.addColorStop(.55,'#354b0800');shade.addColorStop(1,'#21320b90');
 ctx.fillStyle=shade;ctx.fillRect(-r,-r,r*2,r*2);ctx.restore();
}
function ballOutOfReach(b){return !!b&&b.z>205;}
// Cosmetic impact motion; never consumes gameplay RNG or changes simulation state.
let shakeTime=0,shakeDuration=0,shakeStrength=0,shakeX=0,shakeY=0;
function impactShake(b){
 if(!b||b.serve)return;
 if(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 shakeDuration=b.punishing?.38:b.smash?.23:b.impactPerfect?.19:.11;shakeTime=shakeDuration;shakeStrength=b.punishing?11:Math.min(8,(b.smash?6:b.impactPerfect?4:1.2+(b.power||0)*1.5)+rallyHeat()*1.5);
}
function updateCamera(dt){
 if(state!=='play'&&!(celebration?.exit&&['over','point'].includes(state))){shakeTime=0;shakeX=shakeY=0;return;}
 shakeTime=Math.max(0,shakeTime-dt);if(!shakeTime){shakeX=shakeY=0;return;}const envelope=shakeDuration?shakeTime/shakeDuration:0,t=shakeDuration-shakeTime;
 shakeX=Math.sin(t*125)*shakeStrength*envelope*envelope;
 shakeY=Math.sin(t*157+1)*shakeStrength*.65*envelope*envelope;
}
// Use the actual collision solver on a copy: includes glass/fence rebounds and exits.
function floorBounceTargets(source,count=1){
 if(!source)return [];
 const b={...source},targets=[];
 for(let i=0;i<(source.practiceFeedSpeed?1440:480);i++){
  const before=b.bounces,result=physics(b,1/120,false);
  if(b.bounces>before){
   if(result&&result!=='DOUBLE BOUNCE')break;
   targets.push({x:b.x,y:b.y,n:b.bounces,eta:(i+1)/120});
   if(targets.length>=count)break;
  }
  if(result)break;
 }
 return targets;
}
function nextFloorBounce(source){return floorBounceTargets(source)[0]||null;}
let bounceTarget=null,bounceKey='',bounceRefresh=0;
function drawFloorBounceMarker(target,color){
 const {x,y,eta}=target,r=12+Math.min(1,eta/1.5)*13;
 ctx.save();ctx.translate(x,y);ctx.fillStyle='#081a2960';ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle=color;ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
 ctx.strokeStyle='#f1faff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.stroke();
 for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])line(dx*10,dy*10,dx*16,dy*16,color,2);
 ctx.restore();
}
function drawBounceTarget(){
 if(state!=='play'||!ball||globalThis.Practice?.active){bounceTarget=null;bounceKey='';return;}
 const key=pointNumber+':'+shotSerial+':'+ball.bounces+':'+(ball.glassTouches||0);
 if(key!==bounceKey||clock>=bounceRefresh){bounceTarget=nextFloorBounce(ball);bounceKey=key;bounceRefresh=clock+.08;}
 if(bounceTarget)drawFloorBounceMarker(bounceTarget,ball.shotColor||'#d9f0ff');
}
// Local-only drama: bounded procedural effects, never included in network snapshots.
let dramaHits=0,dramaStage=0,dramaPulseAt=-100;
const dramaReducedMotion=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
function drawRallyDrama(){
 const stage=Math.min(5,Math.floor(hits/10));
 if(hits<dramaHits||!['play','point','over','paused'].includes(state)){dramaStage=0;dramaPulseAt=-100;}
 if(Math.floor(Math.min(hits,50)/5)>Math.floor(Math.min(dramaHits,50)/5)&&state==='play')dramaPulseAt=clock;
 dramaHits=hits;dramaStage=stage;
 if(!stage||!['play','point','over','paused'].includes(state))return;
 const reduced=!!dramaReducedMotion?.matches,heat=stage/5,age=clock-dramaPulseAt;
 const pulse=reduced?0:Math.max(0,1-age/1.1),breath=reduced?.5:.5+.5*Math.sin(clock*2.6);
 const aftermath=state==='point'||state==='over'?Math.max(0,1-afterPointAge/1.3):1;
 ctx.save();ctx.globalAlpha=aftermath;
 // Warm perimeter light leaves the central playing surface unobscured.
 const glow=ctx.createLinearGradient(0,-22,0,50);glow.addColorStop(0,'rgba(255,72,18,'+(.16+heat*.24+breath*.08)+')');glow.addColorStop(1,'rgba(255,40,10,0)');
 ctx.fillStyle=glow;ctx.fillRect(-22,-22,1044,72);ctx.save();ctx.translate(0,500);ctx.scale(1,-1);ctx.fillRect(-22,-22,1044,72);ctx.restore();
 ctx.strokeStyle=stage===5?'#ffad46':'#ff683b';ctx.lineWidth=1+heat*2;ctx.globalAlpha=aftermath*(.2+heat*.25+breath*.12);ctx.strokeRect(-9,-9,1018,518);
 // One soft perimeter burst per ten-hit milestone, not a full-screen strobe.
 if(pulse>0){ctx.globalAlpha=aftermath*pulse*.65;ctx.lineWidth=2+pulse*6;ctx.strokeStyle=stage===5?'#ffe6ac':'#ffb155';const inset=22*(1-pulse);ctx.strokeRect(-12-inset,-12-inset,1024+inset*2,524+inset*2);}
 if(stage>=3){
  const intensity=(stage-2)/3;
  // Flames grow outwards from the glass; no fire over the ball or players.
  for(let edge=0;edge<2;edge++)for(let i=0;i<18;i++){
   const phase=clock*(2.3+(i%3)*.3)+i*2.37,base=18+i*56.5;
   const flicker=reduced?.6:.55+.25*Math.sin(phase)+.2*Math.sin(phase*1.7);
   const height=(12+intensity*38)*flicker,width=9+intensity*8,sway=reduced?0:Math.sin(phase*.8)*9;
   ctx.save();ctx.translate(base,edge?508:-8);ctx.scale(1,edge?1:-1);
   ctx.globalAlpha=aftermath*(.22+intensity*.35);ctx.fillStyle='#ff4d1f';ctx.beginPath();ctx.moveTo(-width,0);ctx.quadraticCurveTo(-width*.7,height*.6,sway,height);ctx.quadraticCurveTo(width*.7,height*.4,width,0);ctx.closePath();ctx.fill();
   ctx.globalAlpha=aftermath*(.3+intensity*.3);ctx.fillStyle='#ffc45b';ctx.beginPath();ctx.moveTo(-width*.4,0);ctx.quadraticCurveTo(-width*.25,height*.3,sway*.4,height*.55);ctx.quadraticCurveTo(width*.3,height*.2,width*.4,0);ctx.closePath();ctx.fill();ctx.restore();
  }
  if(!reduced)for(let i=0;i<36;i++){
   const life=(clock*(.32+(i%5)*.04)+i*.618)%1,x=12+(i*73.31)%976+Math.sin(clock*1.4+i)*7,y=i%2?510+life*42:-10-life*42;
   ctx.globalAlpha=aftermath*intensity*Math.sin(life*Math.PI)*.75;ctx.fillStyle=i%3?'#ff903c':'#ffe1a0';ctx.fillRect(x,y,1.5+(i%3)*.6,3+(i%3));
  }
 }
 // A brief arcade title accompanies entry to RED HOT; normal HUD remains visible.
 if(stage===5&&age>=0&&age<1.6&&!reduced){ctx.globalAlpha=aftermath*Math.min(1,age*8,(1.6-age)*3);text(tr('RED HOT'),500,-30,32,'#ffe4b0');}
 ctx.restore();
}
function draw(){
 $('#point-result').classList.toggle('follow-through',['point','over'].includes(state)&&afterPointAge<.85);
 setText($('#mouse-cursor'),showMouseCursor?'MOUSE CURSOR ON':'MOUSE CURSOR OFF');$('#mouse-cursor').setAttribute('aria-pressed',String(showMouseCursor));
 setText($('#aim-dot'),showAimDot?'AIM DOT ON':'AIM DOT OFF');$('#aim-dot').setAttribute('aria-pressed',String(showAimDot));
 if($('#swipe-sensitivity').value!==String(swipeSensitivity))$('#swipe-sensitivity').value=swipeSensitivity;setText($('#sensitivity-value'),swipeSensitivity+'%');
 $('#game-speed').disabled=!!(network?.active&&!network.isHost);if($('#game-speed').value!==String(gameSpeed))$('#game-speed').value=gameSpeed;setText($('#speed-value'),gameSpeed+'%');
 canvas.classList.toggle('aim-cursor',['play','serve','fault','let'].includes(state));ctx.clearRect(0,0,cw,ch);
 const bg=ctx.createRadialGradient(cw*.5,ch*.45,0,cw*.5,ch*.45,Math.max(cw,ch)*.65);bg.addColorStop(0,'#162d40');bg.addColorStop(1,'#07111d');ctx.fillStyle=bg;ctx.fillRect(0,0,cw,ch);
 ctx.save();courtTransform(ctx);ctx.translate(shakeX,shakeY);drawCourt();drawRallyDrama();drawBounceTarget();
 if(state==='serve'){const sx=courtSide(players[serverIndex].team)===0?500:150;ctx.fillStyle='#e5ed9110';ctx.fillRect(sx,receiveLane?250:0,350,250);}
for(const e of effects){ctx.globalAlpha=e.t/.45;ctx.strokeStyle=e.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,(8+(1-e.t/.45)*25)*(e.size??1),0,7);ctx.stroke();}ctx.globalAlpha=1;
globalThis.Practice?.draw();for(const p of players)drawPlayer(p);
if(ball){drawBallTrail(ball);ctx.save();ctx.translate(ball.x,ball.y);ctx.scale(1,.55);circle(0,0,7+ball.z*.025,'#081e2977');ctx.restore();let by=ballDrawY(ball),br=6+ball.z*.033;ctx.shadowColor=hits>=50?'#ff4020':ballOutOfReach(ball)?'#68ffad':'#f4ee67';ctx.shadowBlur=hits>=50?24:4;circle(ball.x,by,br,hotBallColor(ball));ctx.shadowBlur=0;drawBallTexture(ball,by,br);const felt=!network?.active&&!globalThis.Practice?.active&&globalThis.matchKit?.boosts.find(id=>KitBags.kind(id)===4);if(Number.isInteger(felt)){ctx.strokeStyle=KitBags.tiers[KitBags.tier(felt)][2];ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(ball.x,by,br*.76,.2,2.5);ctx.stroke();}if(ball.z>65&&by!==ball.y){ctx.setLineDash([3,6]);line(ball.x,ball.y-9,ball.x,by+br+4,'#d7eca23a');ctx.setLineDash([]);}}
if(['play','serve'].includes(state)){drawAimGuide(players[localSlot()]);}
ctx.restore();drawControlledMarker();drawGestureOverlay();drawConfetti();
 const me=players[localSlot()],stroke=$('#local-stroke');
 drawTimingMeter(me);
 const label=me&&state==='play'&&me.shotUntil>clock?spinShotLabel(me.strokeFamily||me.shotFeedback,me.shotSpin||0):'';
 if(stroke){
  if(stroke.textContent!==label || (label && stroke._shotUntil!==me.shotUntil)){
   stroke.textContent=label;stroke._shotUntil=me?.shotUntil;
   stroke.style.color=me?.shotTint||'#fff';
   stroke.getAnimations?.().forEach(a=>a.cancel());
   if(label){
    const still=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    // Measure once per hit so the enlarged name stays inside either court view.
    stroke._halfWidth=stroke.offsetWidth;
    stroke._height=stroke.offsetHeight*2;
    const pose=k=>'translate(-50%,-100%) scale('+k+')';
    stroke.animate?.([{transform:pose(1),opacity:1},{transform:pose(still?1:2),opacity:1,offset:.14},{transform:pose(still?1:1.9),opacity:1,offset:.36},{transform:pose(still?1:1.7),opacity:0}],{duration:Math.max(1,(me.shotUntil-clock)*1000),fill:'forwards'});
   }
  }
  if(label){
   const pos=viewPoint(me.x+shakeX,me.y+shakeY);
   const inset=Math.min(cw/2,stroke._halfWidth+8);
   stroke.style.left=clamp(ox+pos.x*scale,inset,cw-inset)+'px';
   stroke.style.top=clamp(oy+pos.y*scale-Math.max(130,200*scale),stroke._height+8,ch-8)+'px';
  }
 }
 const banner=$('#serve-banner'),headline=serveHeadline();if(banner.textContent!==headline)banner.textContent=headline;if(state==='point')setText($('#point-countdown'),pointCountdown()); $('#combo').style.transform='scale('+(1+comboPulse*.28)+') rotate('+(-comboPulse*4)+'deg)';$('#combo').classList.toggle('hot',hits>=50);$('#combo').style.setProperty('--heat-color','hsl('+Math.max(5,48-Math.min(hits,50)*.86)+' 100% 61%)');$('#rally-fill').style.width=Math.min(100,hits*2)+'%';$('#rally-heat').setAttribute('aria-valuenow',Math.min(50,hits));setText($('#combo-label'),'RALLY');setText($('#rally'),String(hits).padStart(2,'0'));$('#energy').style.width=energy*100+'%';setText($('#toast'),state==='serve'&&players[serverIndex].human?(isLocal(players[serverIndex])?'YOUR SERVE · DRAG & RELEASE · ':'WAITING FOR SERVER · ')+Math.max(1,Math.ceil(serveTimer))+'s':noticeTime>0?notice:'');setText($('#height'),'BALL HEIGHT '+((ball?.z||0)/50).toFixed(1)+' m');setText($('#status'),state==='intro'?'READY WHEN YOU ARE':state==='paused'?'PAUSED':state==='over'?'MATCH COMPLETE':state==='point'?'NEXT POINT':state==='fault'?'SECOND SERVE COMING':state==='let'?'LET · REPLAY SERVE':state==='serve'?(players[serverIndex].displayName||players[serverIndex].name)+' SERVES IN '+Math.max(1,Math.ceil(serveTimer)):'LIVE RALLY  /  BEST '+best);}
function frame(t){if(Math.abs(canvas.clientWidth-cw)>.5||Math.abs(canvas.clientHeight-ch)>.5)resize();globalThis.pollController?.(t);globalThis.syncPointerLock?.();let dt=Math.min((t-last)/1000,.05);last=t;updateCamera(dt);if(network?.active&&!network.isHost){network.renderGuest(dt);draw();requestAnimationFrame(frame);return;}if(state!=='paused'){acc+=dt;while(acc>=1/120){tick(1/120);acc-=1/120;}}draw();requestAnimationFrame(frame);}
function togglePause(){
 orientationLabel();
 if(globalThis.Practice?.active){Practice.menu();return;}
 $('#main-menu').classList.toggle('hidden',state==='intro'||(state==='paused'&&beforePause==='intro'));
if(network?.active){network.toggleMenu();return;}cancelShot();for(const k in keys)keys[k]=false;joy={x:0,y:0};if(state==='paused'){state=beforePause;$('#paused').classList.add('hidden');canvas.focus();}else{beforePause=state;state='paused';setText($('#matchresult'),'');setText($('#paused h1'),beforePause==='intro'?'SETTINGS':'Match menu');setText($('#resume'),beforePause==='intro'?'BACK TO MENU':'BACK TO COURT');$('#paused').classList.remove('hidden');$('#resume').focus();}$('#pause').classList.toggle('is-paused',state==='paused');}
addEventListener('keydown',e=>{if(state==='intro'&&e.code==='Escape'&&globalThis.progressionBack?.()){e.preventDefault();return;}if(state==='intro'&&e.code==='Escape'&&!$('#gallery-screen').classList.contains('hidden'))return;if($('#rules').open||$('#ai-dialog').open||$('#multiplayer').open||$('#leave-confirm').open)return;if(e.target?.closest?.('button,select,input')&&!['Escape','KeyP'].includes(e.code))return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','KeyL'].includes(e.code))e.preventDefault();keys[movementKey(e.code)]=true;if((e.code==='Escape'||e.code==='KeyP')&&!e.repeat)togglePause();});addEventListener('keyup',e=>{keys[movementKey(e.code)]=false;releaseCharge(e.code);});addEventListener('blur',()=>{cancelShot();for(let k in keys)keys[k]=false;joy={x:0,y:0};if(!network?.active&&['play','serve','fault','let'].includes(state))togglePause();});$('#start').onclick=()=>{unlockAudio();setText($('#sound'),sound?'SFX ON':'SFX OFF');newMatch();};$('#resume').onclick=togglePause;$('#pause').onclick=togglePause;$('#sound').onclick=()=>{unlockAudio();sound=!sound;setText($('#sound'),sound?'SFX ON':'SFX OFF');beep();};$('#music').onclick=()=>{unlockAudio();music=!music;setText($('#music'),music?'MUSIC ON':'MUSIC OFF');musicBus?.gain.setValueAtTime(music&&!allMuted?.22:0,audio.currentTime);};$('#help').onclick=()=>{if(['play','serve','fault','let'].includes(state))togglePause();$('#rules').showModal();};$('#close').onclick=()=>$('#rules').close();
// Mouse controls are court-scoped; release anywhere so swings never get stuck.
canvas.oncontextmenu=e=>e.preventDefault();
canvas.onmousedown=e=>{if(e.sourceCapabilities?.firesTouchEvents)return;if(e.button!==0&&e.button!==2)return;e.preventDefault();canvas.focus();if(document.pointerLockElement!==canvas)mouse={x:e.clientX,y:e.clientY};globalThis.captureMouse?.();beginCharge(e.button===0?'Mouse1':'Mouse2',e.button===2);};
addEventListener('mousemove',e=>{globalThis.controlAim=null;if(document.pointerLockElement===canvas){const r=canvas.getBoundingClientRect();updateSwipe(charge?.gesture?mouse.x+e.movementX:clamp(mouse.x+e.movementX,r.left,r.right),charge?.gesture?mouse.y+e.movementY:clamp(mouse.y+e.movementY,r.top,r.bottom));}else updateSwipe(e.clientX,e.clientY);});
addEventListener('mouseup',e=>{if(document.pointerLockElement!==canvas)updateSwipe(e.clientX,e.clientY);if(e.button===0)releaseCharge('Mouse1');if(e.button===2)releaseCharge('Mouse2');});
const stick = $('#stick');
let moveTouch = null;
const TAP_SLOP = 8, TAP_MAX_MS = 250, LOB_DRAG_WINDOW_MS = 550;
function trackShotTouch(event) {
 const t=shotTouch;
 if (!t.dragging) {
  if (Math.hypot(event.clientX-t.x,event.clientY-t.y)<TAP_SLOP) return;
  mouse={x:t.x,y:t.y};
  beginCharge('Mouse1',t.lob);
  t.dragging=true;
 }
 updateSwipe(event.clientX,event.clientY);
}
function touchInPlay() {
 return ['serve','play'].includes(state) && !network?.menu && !globalThis.Practice?.demonstrating && !document.querySelector('dialog[open]');
}
addEventListener('pointerdown', event => {
 if (event.pointerType !== 'touch' || !touchInPlay() || event.target.closest('button,input,select,dialog')) return;
 const {clientX:x,clientY:y,pointerId:id} = event;
 const bounds = canvas.getBoundingClientRect();
 event.preventDefault();
 event.target.setPointerCapture?.(id);
 if (!moveTouch && !shotTouch && globalThis.matchControlMode !== 'casual' &&
     x < bounds.left + bounds.width / 2 && y > bounds.top + bounds.height / 2) {
  moveTouch = {id,x,y};
  const arena = stick.parentElement.getBoundingClientRect();
  stick.style.left = (x-arena.left)+'px';
  stick.style.top = (y-arena.top)+'px';
  stick.classList.add('touch-active');
 } else if (!shotTouch && !charge) {
  shotTouch={id,x,y,started:event.timeStamp,lob:lobTapUntil>event.timeStamp,dragging:false};
  lobTapUntil=0;
 }
}, {passive:false});
addEventListener('pointermove', event => {
 if (event.pointerType !== 'touch' || !touchInPlay()) return;
 if (event.pointerId === moveTouch?.id) {
  const dx = (event.clientX-moveTouch.x)/32, dy = (event.clientY-moveTouch.y)/32;
  const n = Math.max(1,Math.hypot(dx,dy));
  joy = courtVector(dx/n,dy/n);
  stick.firstChild.style.transform = 'translate('+dx/n*22+'px,'+dy/n*22+'px)';
 } else if (event.pointerId === shotTouch?.id) trackShotTouch(event);
});
function finishTouch(event) {
 if (event.pointerId === moveTouch?.id) {
  moveTouch = null; joy = {x:0,y:0};
  stick.classList.remove('touch-active'); stick.firstChild.style.transform = '';
 } else if (event.pointerId === shotTouch?.id) {
  if (event.type !== 'pointerup' || !touchInPlay()) {cancelShot();return;}
  trackShotTouch(event);
  if (shotTouch.dragging) {
   if (charge?.moved) releaseCharge('Mouse1');else cancelShot();
  } else if (event.timeStamp-shotTouch.started<=TAP_MAX_MS) {
   lobTapUntil=event.timeStamp+LOB_DRAG_WINDOW_MS;
  }
  shotTouch=null;
 }
}
addEventListener('pointerup',finishTouch);
addEventListener('pointercancel',finishTouch);
addEventListener('blur',()=>{moveTouch=null;shotTouch=null;stick.classList.remove('touch-active');stick.firstChild.style.transform='';});
$('#ai-settings').onclick=()=>{if(['play','serve','fault','let'].includes(state))togglePause();$('#ai-dialog').showModal();};$('#ai-close').onclick=()=>{$('#ai-dialog').close();};
// Pointer lock sends court clicks to the canvas even while the result is visible.
function canSkipPoint() {
 return state === 'point' && afterPointAge >= .85 && !network?.menu &&
  (!network?.active || network.isHost) && !document.querySelector('dialog[open]');
}
addEventListener('click', event => {
 if (event.button !== 0 || !canSkipPoint()) return;
 event.preventDefault();
 event.stopImmediatePropagation();
 continuePoint();
}, true);
addEventListener('touchend', event => {
 if (event.touches.length || !canSkipPoint()) return;
 event.preventDefault();
 event.stopImmediatePropagation();
 continuePoint();
}, {capture:true, passive:false});
$('#continue-point').onclick=continuePoint;
$('#result-home').onclick=async()=>{await globalThis.leaveMatchNow();globalThis.openMainMenu?.();};
$('#intro-settings').onclick=togglePause;
$('#audio-toggle').onclick=()=>{allMuted=!allMuted;unlockAudio();fxBus?.gain.setValueAtTime(allMuted?0:.7,audio.currentTime);musicBus?.gain.setValueAtTime(allMuted?0:music?.22:0,audio.currentTime);$('#audio-toggle').classList.toggle('is-muted',allMuted);$('#audio-toggle').setAttribute('aria-pressed',String(allMuted));};
function setTeamDifficulty(team,value){if(!LEVELS[value])return;players.forEach((p,i)=>{if(p.team===team){p.aiLevel=value;if(globalThis.slotDifficulties)globalThis.slotDifficulties[i]=value;}});}
$('#partner-level').onchange=e=>{partnerLevel=e.target.value;setTeamDifficulty(players[localSlot()]?.team??0,partnerLevel);};$('#rival-level').onchange=e=>{rivalLevel=e.target.value;setTeamDifficulty(1-(players[localSlot()]?.team??0),rivalLevel);};
updateScore();resetPlayers();ball={x:630,y:280,z:40,vx:0,vy:0,vz:0,last:1,bounces:0};addEventListener('resize',resize);resize();requestAnimationFrame(frame);

globalThis.leaveMatchNow=async()=>{cancelShot();for(const k in keys)keys[k]=false;joy={x:0,y:0};if(network?.active){await network.leave();return;}state='intro';pointRemaining=0;notice='';noticeTime=0;$('#paused').classList.add('hidden');$('#point-result').classList.add('hidden');$('#intro').classList.remove('hidden');$('#pause').classList.remove('is-paused');};

$('#intro-help').onclick=()=>$('#rules').showModal();

$('#game-speed').oninput=e=>{if(network?.active&&!network.isHost)return;gameSpeed=clamp(Math.round(Number(e.target.value)||100),25,150);bounceRefresh=0;for(const p of players)p.planUntil=0;try{localStorage.setItem('padelmaster-speed-'+(speedMode||'competitive'),String(gameSpeed));}catch{}setText($('#speed-value'),gameSpeed+'%');};

$('#swipe-sensitivity').oninput=e=>{swipeSensitivity=clamp(Math.round(Number(e.target.value)||80),5,200);try{localStorage.setItem('padelmaster-swipe-sensitivity-v2',String(swipeSensitivity));}catch{}setText($('#sensitivity-value'),swipeSensitivity+'%');};

$('#aim-dot').onclick=()=>{showAimDot=!showAimDot;try{localStorage.setItem('padelmaster-aim-dot',showAimDot?'on':'off');}catch{}setText($('#aim-dot'),showAimDot?'AIM DOT ON':'AIM DOT OFF');$('#aim-dot').setAttribute('aria-pressed',String(showAimDot));};

$('#main-menu').onclick=()=>{
 if(state==='intro'||(state==='paused'&&beforePause==='intro')){togglePause();return;}
 setText($('#leave-message'),globalThis.CampaignMatch?.playing?(language==='es'?'Abandonar pierde esta entrada. Reintentar cuesta monedas.':'Forfeit this entry? A retry costs coins.'):network?.active?'You will leave the online room.':'Your current match progress will be lost.');
 $('#leave-confirm').showModal();$('#leave-cancel').focus();
};
$('#leave-cancel').onclick=()=>$('#leave-confirm').close();
$('#leave-confirm-button').onclick=async()=>{$('#leave-confirm').close();await globalThis.leaveMatchNow();};
const matchDelays = {point: 4, serve: 1.8};
for (const [key, choices] of Object.entries({point: [1,2,3,4,6,8,10], serve: [.5,1,1.8,2,3,5]})) {
 const control = $('#' + key + '-delay');
 const storageKey = 'padelmaster-' + key + '-delay';
 try {
  const saved = Number(localStorage.getItem(storageKey));
  if (choices.includes(saved)) matchDelays[key] = saved;
 } catch {}
 control.value = String(matchDelays[key]);
 control.onchange = () => {
  const seconds = Number(control.value);
  if (!choices.includes(seconds)) return;
  matchDelays[key] = seconds;
  try { localStorage.setItem(storageKey, String(seconds)); } catch {}
 };
}
const settingsPages = ['match', 'controls', 'general'];
for (const page of settingsPages) {
 $('#settings-' + page).onclick = () => {
  for (const name of settingsPages) {
   $('#panel-' + name).classList.toggle('hidden', name !== page);
   $('#settings-' + name).setAttribute('aria-pressed', String(name === page));
  }
 };
}
$('#player-names').checked=showPlayerNames;
$('#player-names').onchange=e=>{showPlayerNames=e.target.checked;try{localStorage.setItem('tdp-player-names',showPlayerNames?'on':'off');}catch{}};
$('#match-duration').value=String(defaultMatchGames);
$('#match-duration').onchange=e=>{const n=Number(e.target.value);if(![0,1,3,5,9].includes(n))return;defaultMatchGames=n;try{localStorage.setItem('padelmaster-match-games',String(n));}catch{}};

$('#mouse-cursor').onclick=()=>{showMouseCursor=!showMouseCursor;try{localStorage.setItem('padelmaster-mouse-cursor',showMouseCursor?'on':'off');}catch{}setText($('#mouse-cursor'),showMouseCursor?'MOUSE CURSOR ON':'MOUSE CURSOR OFF');$('#mouse-cursor').setAttribute('aria-pressed',String(showMouseCursor));};

// CSS/menu transitions can resize the arena without a window resize event.
if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>resize()).observe(canvas);

addEventListener('click',event=>{
 const button=event.target?.closest?.('button');
 if(!button||button.disabled||!sound||allMuted)return;
 unlockAudio();tone(620,.055,.08,'triangle',fxBus,0,370);
},true);
