'use strict';
// One authoritative simulation in the host tab; guests send only controls.
// Latest-frame direct channels carry snapshots/inputs; acknowledged input events are repeated.
const networkJSON=value=>JSON.stringify(value,(_,v)=>typeof v==='number'&&!Number.isInteger(v)?Math.round(v*1000)/1000:v);
network={active:false,isHost:false,slot:0,session:null,room:null,peers:new Map(),signals:[],events:[],eventId:0,inputSeq:0,seq:0,lastSeq:0,lastSnapshot:null,previous:null,lastReceived:0,acks:{},received:{},soundSeq:0,sounds:[],lastSound:0,menu:false,started:false,busy:false,stopped:false,lastPoll:0,lastPush:0,noticeKey:'',pointKey:'',
 async request(action,body={},session=this.session){
  const path=action==='create'?'/api/rooms/create':'/api/rooms/'+session.code+'/'+action;
  const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json',...(session?.token?{Authorization:'Bearer '+session.token}:{})},body:networkJSON(body),signal:AbortSignal.timeout(7000)});
  let data;try{data=await response.json();}catch{throw Error('Room service unavailable');}if(!response.ok)throw Object.assign(Error(data.error||'Connection failed'),{status:response.status});return data;
 },
 open(){cancelShot();for(const k in keys)keys[k]=false;if(!this.active&&['play','serve','fault','let'].includes(state))togglePause();setText($('#room-close'),'‹ BACK');$('#multiplayer').show();this.entryState=state;this.paintLobby();},
 async enter(host){if(this.busy)return;this.busy=true;this.error('');this.buttons(true);try{
  const name=$('#player-name').value.trim()||'PLAYER',code=$('#room-code').value.trim().toUpperCase().replace(/[^A-Z2-9]/g,'');
  const session=host?await this.request('create',{name},null):await this.request('join',{name},{code});
  try{localStorage.setItem('padelmaster-online-name',name);}catch{}this.localName=name;this.attach(session);await this.sync();
 }catch(e){this.error(e.message);}finally{this.busy=false;this.buttons(false);}},
 attach(s){document.body.classList.remove('meta-visible');this.session=s;this.active=true;this.isHost=s.host;this.slot=s.slot;this.started=false;this.stopped=false;this.rosterSignature='';this.lobbySkins=[];this.events=[];this.received={};this.acks={};this.seq=0;this.lastSeq=0;this.lastSnapshot=null;this.previous=null;this.predicted=null;this.rtt=0;this.directRtt=null;this.lastScoreKey='';this.labelKey='';this.lastReceived=performance.now();this.pointKey='';this.eventId=Date.now()*1000;this.inputSeq=Date.now()*1000;this.menu=false;state='lobby';cancelShot();$('#intro').classList.add('hidden');$('#paused').classList.add('hidden');$('#point-result').classList.add('hidden');unlockAudio();try{sessionStorage.setItem('padelmaster-room',JSON.stringify(s));}catch{}this.paintLobby();},
 buttons(disabled){for(const id of ['host-room','join-room'])$('#'+id).disabled=disabled;},
 error(msg){setText($('#room-error'),msg);},
 queueEvent(kind,lob=false,aim=cursorAim()){if(!this.active||this.isHost||this.menu)return;this.events.push({id:++this.eventId,kind,lob,aim,gesture:!!charge?.gesture,power:charge?.power});if(this.events.length>16)this.events.shift();this.sendInput();},
 skinForSlot(slot,id){
  const validate=(tier)=>globalThis.PadelSkins?.tier(id,tier)||0;
  if(slot===this.slot)return globalThis.PadelSkins?.equipped(id)||0;
  if(!this.isHost){const entry=this.lobbySkins?.[slot];return entry&&entry.id===id?validate(entry.tier):0;}
  const member=this.room?.members.find(m=>m.slot===slot);
  if(!member)return globalThis.PadelSkins?.equipped(id)||0;
  const entry=this.received[member.id]?.skin;
  return entry&&entry.id===id?validate(entry.tier):0;
 },
 lobbyOutfits(){return (globalThis.MatchSetup?.online.ids||[]).map((id,slot)=>({id,tier:this.skinForSlot(slot,id)}));},
 input(){const id=this.started?players[this.slot]?.appearance?.id:globalThis.MatchSetup?.online.ids[this.slot];return {skin:{id,tier:globalThis.PadelSkins?.equipped(id)||0},seq:++this.inputSeq,x:this.menu?0:clamp((keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joy.x,-1,1),y:this.menu?0:clamp((keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0)+joy.y,-1,1),dash:!this.menu&&!!(keys.ShiftLeft||keys.ShiftRight),aim:charge?.gesture&&charge.moved?charge.aim:cursorAim(),gesturePower:charge?.gesture?charge.power:null,events:this.events};},
 send(peer,data){if(peer?.channel?.readyState==='open'&&peer.channel.bufferedAmount<12000){try{peer.channel.send(typeof data==='string'?data:networkJSON(data));return true;}catch{return false;}}return false;},
 sendInput(){if(!this.active||this.isHost)return;this.send(this.peers.get('host'),{type:'input',input:this.input()});},
 acceptInput(id,input){
  const member=this.room?.members.find(m=>m.id===id);if(!member||id===this.room.host||!input||!Number.isFinite(input.seq))return;
  const prior=this.received[id];if(prior&&input.seq<=prior.seq)return;
  const n=(x,a,b)=>Number.isFinite(x)?clamp(x,a,b):0,aim=v=>Number.isFinite(v?.targetX)?({targetX:n(v.targetX,-300,1300),targetY:n(v.targetY,-300,800),mouse:true,spin:n(v?.spin,-1,1)}):({x:n(v?.x,-1,1),y:n(v?.y,-1,1),mouse:true,swipe:v?.swipe===true,spin:n(v?.spin,-1,1)});
  const skin=Number.isInteger(input.skin?.id)&&input.skin.id>=0&&input.skin.id<18?{id:input.skin.id,tier:globalThis.PadelSkins?.tier(input.skin.id,input.skin.tier)||0}:null;
  this.received[id]={skin,seq:input.seq,time:performance.now(),input:{x:n(input.x,-1,1),y:n(input.y,-1,1),dash:!!input.dash,aim:aim(input.aim),gesturePower:Number.isFinite(input.gesturePower)?n(input.gesturePower,0,1):null}};
  const p=players[member.slot];if(!p)return;
  p.netInput=this.received[id].input;
  for(const event of (Array.isArray(input.events)?input.events.slice(-16):[])){
   if(!Number.isSafeInteger(event.id)||event.id<1||event.id<=(this.acks[id]||0))continue;this.acks[id]=event.id;
   if(event.kind==='charge'&&['play','serve'].includes(state)){p.netCharge={power:0,lob:!!event.lob,aim:aim(event.aim),gesture:!!event.gesture};p.netPending=null;}
   if(event.kind==='release'&&p.netCharge){if(p.netCharge.gesture)p.netCharge.power=n(event.power,0,1);if(state==='serve')queueServe(p,p.netCharge.power,aim(event.aim));if(state==='play')p.netPending={lob:p.netCharge.lob,power:p.netCharge.power,aim:aim(event.aim),timing:recordReleaseTiming(p),remaining:humanShotWindow()};p.netCharge=null;}
   if(event.kind==='cancel'){p.netCharge=null;p.netPending=null;}
  }
 },
 applyRoster(){if(!this.active||!this.room)return;const now=performance.now();for(let i=0;i<4;i++){
  const p=players[i],m=this.room.members.find(m=>m.slot===i),direct=m&&this.received[m.id]?.time>now-5000;
  const human=!!m&&(m.id===this.room.host||m.online||direct);if(p.human&&!human){p.netCharge=null;p.netPending=null;p.netInput=null;p.readyAt=clock+.25;p.seenShot=-1;}
  p.skinTier=this.skinForSlot(i,p.appearance?.id);p.human=human;p.displayName=human?m.name:tr(p.name==='YOU'?'PLAYER':p.name);p.memberId=human?m.id:null;
 }
 this.labels();},
 labels(){if(!this.active)return;const key=[teamLabel(0),teamLabel(1),this.slot,language].join('|');if(key===this.labelKey)return;this.labelKey=key;for(let team=0;team<2;team++){const text=teamLabel(team);document.querySelectorAll('.result-teams span')[team].textContent=text;}$('.gamehud > span').textContent=(this.room?.members.find(m=>m.id===this.session.id)?.name||this.localName||'PLAYER');},
 beforeTick(dt){if(!this.isHost)return;for(const p of players){if(!p.human||isLocal(p))continue;const input=this.received[p.memberId];if(!input||performance.now()-input.time>650){p.netInput={x:0,y:0};if(performance.now()-(input?.time||0)>2000){p.netCharge=null;p.netPending=null;}}if(p.netCharge&&['play','serve'].includes(state)){p.netCharge.power=p.netCharge.gesture?(p.netInput?.gesturePower??.15):Math.min(1,p.netCharge.power+dt/.6);p.netCharge.aim=p.netInput?.aim||p.netCharge.aim;}}},
 soundEvent(kind,power){this.sounds.push({id:++this.soundSeq,kind,power});if(this.sounds.length>12)this.sounds.shift();},
 snapshot(){return {bagMatch:onlineBagMatch,seq:++this.seq,controlMode:globalThis.matchControlMode==='casual'?'casual':'competitive',gameSpeed,matchGames,endsChanged,pendingEndChange,clock,state,ball,players:players.map(p=>{const {autoShot,autoReady,autoUntil,autoTarget,appearance,choice,netInput,netPending,receivePlan,planUntil,planShot,wallPreference,volleyPreference,...view}=p;return {...view,appearanceId:appearance?.id,appearance:appearance?.id===undefined?appearance:undefined};}),score,games,sets,completedSets,tiebreak,hits,best,notice,noticeTime,serveTimer,serveAttempt,serverIndex,receiveLane,pointNumber,pointRemaining,afterPointAge,afterPointExit,lastResult,shotSerial,acks:this.acks,sounds:this.sounds,charge:charge?{power:charge.power,lob:charge.lob,aim:charge.aim,gesture:charge.gesture}:null,hostSlot:this.slot,paused:state==='paused',energy};},
 receiveSnapshot(s){if(!s||!Number.isFinite(s.seq)||s.seq<=this.lastSeq||!Array.isArray(s.players)||s.players.length!==4||!s.ball)return;
  if(s.hits>hits)comboPulse=1;this.previous=this.lastSnapshot;this.lastSnapshot=s;this.lastSeq=s.seq;this.lastReceived=performance.now();this.events=this.events.filter(e=>e.id>(s.acks?.[this.session.id]||0));
  if(this.eventId<(s.acks?.[this.session.id]||0))this.eventId=s.acks[this.session.id];
  if(s.shotSerial!==shotSerial){trail=[];if(this.previous&&this.previous.pointNumber===s.pointNumber&&s.state==='play')impactShake(s.ball);}const was=state;onlineBagMatch=s.bagMatch;globalThis.matchControlMode=s.controlMode==='casual'?'casual':'competitive';syncControlTheme(globalThis.matchControlMode);document.body?.classList.toggle('casual-play',globalThis.matchControlMode==='casual');matchGames=[0,1,3,5,9].includes(s.matchGames)?s.matchGames:1;endsChanged=!!s.endsChanged;pendingEndChange=!!s.pendingEndChange;afterPointAge=s.afterPointAge??2;afterPointExit=!!s.afterPointExit;if(Number.isFinite(s.gameSpeed))gameSpeed=clamp(s.gameSpeed,25,150);state=s.state;clock=s.clock;score=s.score;games=s.games;sets=s.sets;completedSets=s.completedSets;tiebreak=s.tiebreak;hits=s.hits;best=s.best;serveTimer=s.serveTimer;serveAttempt=s.serveAttempt;serverIndex=s.serverIndex;receiveLane=s.receiveLane;pointNumber=s.pointNumber;shotSerial=s.shotSerial;
  players=s.players.map(p=>({...p,skinTier:globalThis.PadelSkins?.tier(p.appearanceId,p.skinTier)||0,appearance:globalThis.characterForId?.(p.appearanceId)||p.appearance}));ball={...s.ball};const localInk=players[this.slot],flash=localInk?.impactFlash;
  if(typeof anchorGestureImpact==='function'&&flash&&flash.at!==this.previous?.players?.[this.slot]?.impactFlash?.at)anchorGestureImpact(localInk,flash.x,flash.y,0);
  if(typeof anchorGestureImpact==='function'&&was==='serve'&&state==='play'&&serverIndex===this.slot){const r=racketPose(localInk,0,22);anchorGestureImpact(localInk,r.x,r.y,22);}
  energy=players[this.slot]?.energy??1;const scoreKey=JSON.stringify([score,games,sets,completedSets,tiebreak,language]);if(scoreKey!==this.lastScoreKey){this.lastScoreKey=scoreKey;updateScore();}this.labels();notice=s.notice;noticeTime=s.noticeTime;
  for(const e of s.sounds||[])if(e.id>this.lastSound){sfx(e.kind,e.power);this.lastSound=e.id;}
  if(!this.started&&state!=='lobby'){this.started=true;$('#multiplayer').close();$('#intro').classList.add('hidden');resize();canvas.focus();}
  if(['point','over'].includes(state)&&s.lastResult){const key=pointNumber+':'+state;if(this.pointKey!==key){this.pointKey=key;const r=s.lastResult;showPointResult(r.team,r.reason,r.result,r.previousScore,r.previousGames);celebrate(r.team,r.result,r.reason);}pointRemaining=s.pointRemaining??4;$('#point-result').classList.remove('hidden');setText($('#continue-point'),'WAITING FOR HOST');$('#continue-point').disabled=true;}
  else {$('#point-result').classList.add('hidden');if(was==='point'||was==='over')cancelShot();}
  if(state==='paused')setText($('#net-status'),'HOST PAUSED');
 },
 renderGuest(dt){
  if(charge&&['play','serve'].includes(state))advanceCharge(dt);
  if(celebration)celebration.age+=dt;comboPulse=Math.max(0,comboPulse-dt*3);effects=effects.filter(e=>(e.t-=dt)>0);
  const s=this.lastSnapshot,prev=this.previous;if(!s)return;
  const age=(performance.now()-this.lastReceived)/1000,gap=prev?Math.max(.016,s.clock-prev.clock):.033;
  // A fixed 35 ms smoothing window replaces the full relay-packet delay.
  const t=clamp(1+(age-.035)/gap,0,1),lead=Math.min(.08,Math.max(0,age-.035));
  for(let i=0;i<4;i++){
   const p=players[i],b=s.players[i],a=prev?.players[i];
   if(a&&prev.state===s.state){p.x=a.x+(b.x-a.x)*t;p.y=a.y+(b.y-a.y)*t;p.angle=a.angle+Math.atan2(Math.sin(b.angle-a.angle),Math.cos(b.angle-a.angle))*t;p.gait=a.gait+(b.gait-a.gait)*t;}
   if(state==='play'){p.x+=b.vx*lead;p.y+=b.vy*lead;constrainPlayer(p);}
  }
  ball={...s.ball};
  if(['point','over','fault','let'].includes(state)&&age<.2){afterPointAge=s.afterPointAge??2;animateAfterPoint(Math.min(age,.08));}
  if(state==='play'&&lead>0){for(let elapsed=0;elapsed<lead;elapsed+=1/120)if(physics(ball,Math.min(1/120,lead-elapsed),false))break;}
  else if(!['point','over','fault','let'].includes(state)&&prev&&prev.state===s.state&&prev.shotSerial===s.shotSerial&&prev.pointNumber===s.pointNumber&&prev.ball.bounces===s.ball.bounces){for(const key of ['x','y','z'])ball[key]=prev.ball[key]+(s.ball[key]-prev.ball[key])*t;}
  // Predict only this client's movement. The host still owns collisions, hits and score.
  const local=players[this.slot],authority=s.players[this.slot];
  if(state==='play'&&age<1&&!isCasual(local)){
   if(!this.predicted)this.predicted={x:local.x,y:local.y,vx:local.vx,vy:local.vy,gait:local.gait};
   const q=this.predicted,input=this.inputAxes(),n=Math.max(1,Math.hypot(input.x,input.y)),speed=authority.dash>0?520:235*(1+(rallyPace()-1)*.3);
   q.vx+=(input.x/n*speed-q.vx)*Math.min(1,dt*16);q.vy+=(input.y/n*speed-q.vy)*Math.min(1,dt*16);q.x+=q.vx*dt;q.y+=q.vy*dt;q.gait+=Math.hypot(q.vx,q.vy)*dt*.095;
   const horizon=Math.min(.18,(this.peers.get('host')?.channel?.readyState==='open'?(this.directRtt??50):(this.rtt||0))/2000+age),tx=authority.x+authority.vx*horizon,ty=authority.y+authority.vy*horizon;
   const error=Math.hypot(tx-q.x,ty-q.y),blend=error>120?1:1-Math.exp(-dt*5);
   q.x+=(tx-q.x)*blend;q.y+=(ty-q.y)*blend;Object.assign(local,q);constrainPlayer(local);q.x=local.x;q.y=local.y;
  }else this.predicted=null;
  if(['play','serve'].includes(state)){if(Number.isFinite(this.aimAngle)&&local.swing<=0&&!local.servePending)local.angle=this.aimAngle;faceBall(local,dt);this.aimAngle=local.angle;}else this.aimAngle=null;
  if(state==='point')pointRemaining=Math.max(0,(s.pointRemaining??4)-age);
  if(state==='play'){this.trailTime=(this.trailTime||0)+dt;while(this.trailTime>=1/120){this.trailTime-=1/120;trail.push({x:ball.x,y:ball.y,z:ball.z,shotKind:ball.shotKind,swipeFlight:ball.swipeFlight,color:ball.shotColor||shotColor(.2)});if(trail.length>40)trail.shift();}}else if(!['point','over'].includes(state))trail=[];
  if(s.charge&&s.hostSlot!==this.slot)players[s.hostSlot].netCharge=s.charge;
 },
 inputAxes(){return {x:this.menu?0:clamp((keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joy.x,-1,1),y:this.menu?0:clamp((keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0)+joy.y,-1,1)};},
 channel(id,pc,channel){const peer=this.peers.get(id);peer.channel=channel;channel.onmessage=e=>{try{const msg=JSON.parse(e.data);if(msg.type==='ping'){this.send(peer,{type:'pong',at:msg.at});return;}if(msg.type==='pong'&&Number.isFinite(msg.at)){const sample=performance.now()-msg.at;if(sample>=0&&sample<3000)this.directRtt=this.directRtt==null?sample:this.directRtt*.75+sample*.25;return;}if(this.isHost&&msg.type==='input')this.acceptInput(id,msg.input);if(!this.isHost&&msg.type==='snapshot')this.receiveSnapshot(msg.snapshot);}catch{}};channel.onopen=()=>this.paintConnection();channel.onclose=()=>this.paintConnection();},
 async gather(pc){if(pc.iceGatheringState==='complete')return;await new Promise(resolve=>{const done=()=>{if(pc.iceGatheringState==='complete'){clearTimeout(timer);pc.removeEventListener('icegatheringstatechange',done);resolve();}};const timer=setTimeout(()=>{pc.removeEventListener('icegatheringstatechange',done);resolve();},8000);pc.addEventListener('icegatheringstatechange',done);});},
 async connectMember(m){if(this.peers.has(m.id)||typeof RTCPeerConnection==='undefined')return;
  const pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.cloudflare.com:3478'},{urls:'stun:stun.l.google.com:19302'}]});this.peers.set(m.id,{pc,created:performance.now()});try{this.channel(m.id,pc,pc.createDataChannel('padel',{ordered:false,maxRetransmits:0}));await pc.setLocalDescription(await pc.createOffer());await this.gather(pc);this.peers.get(m.id).offerReady=true;this.signals.push({id:m.id,description:{...pc.localDescription.toJSON(),negotiation:pc.localDescription.sdp.match(/a=ice-ufrag:([^\r\n]+)/)?.[1]}});}catch{pc.close();this.peers.delete(m.id);}
 },
 async handleSignals(room){if(this.isHost){for(const m of room.members)if(m.id!==room.host){const existing=this.peers.get(m.id);if(existing&&existing.pc.connectionState!=='connected'&&performance.now()-existing.created>15000){existing.pc.close();this.peers.delete(m.id);}this.connectMember(m);const peer=this.peers.get(m.id);if(m.answer&&peer?.offerReady&&(!m.answer.negotiation||peer.pc.localDescription.sdp.includes('a=ice-ufrag:'+m.answer.negotiation))&&!peer.pc.currentRemoteDescription&&!peer.setting){peer.setting=true;peer.pc.setRemoteDescription(m.answer).catch(()=>{}).finally(()=>peer.setting=false);}}for(const [id,p] of this.peers)if(!room.members.some(m=>m.id===id)){p.pc.close();this.peers.delete(id);}}
  else{const m=room.members.find(m=>m.id===this.session.id);if(m?.offer&&this.offerSdp!==m.offer.sdp){this.offerSdp=m.offer.sdp;const old=this.peers.get('host');old?.pc.close();if(typeof RTCPeerConnection==='undefined')return;const pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.cloudflare.com:3478'},{urls:'stun:stun.l.google.com:19302'}]});this.peers.set('host',{pc,created:performance.now()});pc.ondatachannel=e=>this.channel('host',pc,e.channel);try{await pc.setRemoteDescription(m.offer);await pc.setLocalDescription(await pc.createAnswer());await this.gather(pc);this.signals.push({description:{...pc.localDescription.toJSON(),negotiation:m.offer.negotiation}});}catch{pc.close();}}}
 },
 async sync(extra={}){if(!this.active)return;if(this.polling){if(Object.keys(extra).length){await this.pollDone;return this.sync(extra);}return;}this.polling=true;let done;this.pollDone=new Promise(resolve=>done=resolve);const generation=this.session;const signals=this.signals.splice(0);try{
  const direct=this.started&&this.allDirect(),body={...extra,signals,direct};if(this.isHost&&!this.started&&globalThis.MatchSetup)body.snapshot={seq:++this.seq,lobbySetup:MatchSetup.online,lobbySkins:this.lobbyOutfits()};if(this.isHost&&this.started&&(!direct||!this.lastCheckpoint||performance.now()-this.lastCheckpoint>2000)){body.snapshot=this.snapshot();this.lastCheckpoint=performance.now();}if(!this.isHost&&!direct)body.input=this.input();const sentAt=performance.now();
  const room=await this.request('sync',body);if(this.session!==generation)return;this.rtt=this.rtt?this.rtt*.8+(performance.now()-sentAt)*.2:performance.now()-sentAt;this.room=room;const me=room.members.find(m=>m.id===this.session.id);if(!me)throw Object.assign(Error('Session expired. Join again.'),{status:401});this.slot=me.slot;
  if(this.isHost){this.applyRoster();for(const m of room.members)if(m.input&&m.id!==room.host)this.acceptInput(m.id,m.input);}else if(room.snapshot?.lobbySetup){this.lobbySkins=Array.isArray(room.snapshot.lobbySkins)?room.snapshot.lobbySkins:[];globalThis.MatchSetup?.setOnline(room.snapshot.lobbySetup);}else if(room.snapshot)this.receiveSnapshot(room.snapshot);
  this.handleSignals(room).catch(()=>{});this.lastPoll=sentAt;this.failures=0;this.error('');if($('#multiplayer').open)this.paintLobby();this.paintConnection();
 }catch(e){if(this.session!==generation)return;this.signals.unshift(...signals);this.failures=(this.failures||0)+1;this.error(e.message);if([401,410].includes(e.status)){this.ended(e.message);}else setText($('#net-status'),'RECONNECTING…');}finally{this.polling=false;done();}},
 async start(){if(!this.isHost)return;globalThis.MatchSetup?.apply(MatchSetup.online);await this.sync({action:'start'});if(this.room?.status==='playing'&&!this.started){this.started=true;this.pointKey='';newMatch();this.applyRoster();$('#multiplayer').close();$('#paused').classList.add('hidden');await this.sync();}},
 async ready(){const me=this.room?.members.find(m=>m.id===this.session.id);await this.sync({ready:!me?.ready});},
 toggleMenu(){$('#main-menu').classList.remove('hidden');cancelShot();for(const k in keys)keys[k]=false;joy={x:0,y:0};this.menu=!this.menu;if(this.isHost){if(this.menu){beforePause=state;state='paused';}else state=beforePause;}$('#paused').classList.toggle('hidden',!this.menu);if(this.menu){setText($('#resume'),'BACK TO COURT');$('#resume').focus();}else canvas.focus();},
 allDirect(){return this.isHost?!!this.room&&this.room.members.filter(m=>m.id!==this.room.host&&m.online).every(m=>this.peers.get(m.id)?.channel?.readyState==='open'):this.peers.get('host')?.channel?.readyState==='open';},
 paintConnection(){if(!this.active)return;$('#net-status').title='Direct round trip: '+Math.round(this.directRtt||0)+' ms. Relay round trip: '+Math.round(this.rtt||0)+' ms. '+[...this.peers.values()].map(p=>p.pc.connectionState).join(', ');$('#net-status').classList.remove('hidden');const direct=this.isHost?[...this.peers.values()].filter(p=>p.channel?.readyState==='open').length>0:this.peers.get('host')?.channel?.readyState==='open';setText($('#net-status'),state==='paused'?'HOST PAUSED':this.started?(direct?'ONLINE · DIRECT':'ONLINE · RELAY'):'ROOM '+this.session.code);},
 paintLobby(){const active=this.active;$('#host-room').classList.toggle('hidden',active);if(!active){$('#start-online').classList.add('hidden');$('#ready-online').classList.add('hidden');}$('#room-entry').classList.toggle('hidden',active);$('#room-lobby').classList.toggle('hidden',!active);$('#room-close').classList.toggle('hidden',active&&!this.started);$('#leave-room').classList.toggle('hidden',!active);$('#room-menu').classList.toggle('hidden',!active);$('#ai-settings').disabled=active&&!this.isHost;if(!active)return;
  $('#invite-code').textContent=this.session.code;
  const signature=JSON.stringify([language,this.room?.status,this.room?.members.map(m=>[m.id,m.name,m.slot,m.ready,m.online]),globalThis.MatchSetup?.online,this.lobbyOutfits()]);if(signature!==this.rosterSignature){this.rosterSignature=signature;globalThis.MatchSetup?.lobby();}
  $('#start-online').classList.toggle('hidden',!this.isHost||this.started);$('#ready-online').classList.toggle('hidden',this.isHost||this.started);const me=this.room?.members.find(m=>m.id===this.session.id);setText($('#ready-online'),me?.ready?'NOT READY':'READY UP');
  $('#start-online').disabled=!!this.room?.members.some(m=>m.id!==this.room.host&&m.online&&!m.ready);$('#lobby-hint').textContent=(me?.name||this.localName||'PLAYER')+' · '+(language==='es'?(this.started?'PARTIDO EN CURSO':'Elige tu posición y confirma. Los huecos los ocupa la IA.'):(this.started?'MATCH IN PROGRESS':'Choose your position and ready up. Empty slots use AI.'));
 },
 async leave(){const s=this.session;if(s)try{await this.request('leave',{},s);}catch{}this.cleanup();$('#multiplayer').close();$('#paused').classList.add('hidden');$('#point-result').classList.add('hidden');$('#intro').classList.remove('hidden');state='intro';resetPlayers();updateScore();globalThis.openMainMenu?.();},
 cleanup(){this.active=false;this.started=false;this.menu=false;for(const p of this.peers.values())p.pc.close();this.peers.clear();this.signals=[];this.offerSdp=null;this.session=null;this.room=null;this.events=[];charge=null;pendingShot=null;$('#net-status').classList.add('hidden');$('#continue-point').disabled=false;$('#ai-settings').disabled=false;setText($('.team-blue > span'),'YOU + CESAR');setText($('.team-coral > span'),'ALBERT + KIKE');setText($('.gamehud > span'),'YOU');document.querySelectorAll('.result-teams span').forEach((e,i)=>setText(e,i?'ALBERT + KIKE':'YOU + CESAR'));try{sessionStorage.removeItem('padelmaster-room');}catch{}this.paintLobby();},
 ended(reason){this.cleanup();state='intro';$('#intro').classList.remove('hidden');$('#point-result').classList.add('hidden');$('#paused').classList.add('hidden');resetPlayers();this.error(reason);if(!$('#multiplayer').open)$('#multiplayer').show();}
};
$('#online-play').onclick=()=>network.open();$('#room-menu').onclick=()=>network.open();$('#host-room').onclick=()=>network.enter(true);$('#join-room').onclick=()=>network.enter(false);$('#start-online').onclick=()=>network.start();$('#ready-online').onclick=()=>network.ready();$('#leave-room').onclick=()=>network.leave();$('#room-close').onclick=()=>{$('#multiplayer').close();if(!network.active&&network.entryState==='intro'){if(!globalThis.menuBrowserBack?.())globalThis.openMainMenu?.();globalThis.syncPointerLock?.();}else if(!network.active&&state==='paused')$('#resume').focus();};
$('#multiplayer').addEventListener('cancel',e=>{if(network.active&&!network.started)e.preventDefault();});
$('#copy-invite').onclick=async()=>{
 const code=network.session?.code;if(!code)return;
 try{await navigator.clipboard.writeText(code);}
 catch{const field=document.createElement('textarea');field.value=code;field.style.cssText='position:fixed;opacity:0';document.body.appendChild(field);field.select();const copied=document.execCommand('copy');field.remove();if(!copied){network.error(language==='es'?'Copia el código: '+code:'Copy this code: '+code);return;}}
 setText($('#copy-invite'),'COPIED');setTimeout(()=>setText($('#copy-invite'),'COPY CODE'),1800);
};
$('#room-code').addEventListener('input',e=>e.target.value=e.target.value.toUpperCase().replace(/[^A-Z2-9]/g,'').slice(0,6));
setInterval(()=>{if(!network.active)return;const now=performance.now();if(network.isHost){if(network.started&&[...network.peers.values()].some(p=>p.channel?.readyState==='open')){const packet=networkJSON({type:'snapshot',snapshot:network.snapshot()});for(const peer of network.peers.values())network.send(peer,packet);}if(now-(network.lastRoster||0)>250){network.lastRoster=now;network.applyRoster();}}},33);
// Input and acknowledgements take the fastest path; snapshots stay at 30 Hz.
setInterval(()=>{if(network.active&&!network.isHost)network.sendInput();},16);
setInterval(()=>{if(network.active&&!network.isHost)network.send(network.peers.get('host'),{type:'ping',at:performance.now()});},1000);
setInterval(()=>{if(!network.active||network.polling)return;const allDirect=network.allDirect();const delay=network.failures?Math.min(3000,250*network.failures):network.signals.length?0:network.started&&!allDirect?50:500;if(performance.now()-network.lastPoll>=delay)network.sync();if(!network.isHost&&network.started&&performance.now()-network.lastReceived>3000)setText($('#net-status'),'RECONNECTING…');},16);
addEventListener('visibilitychange',()=>{if(document.hidden&&network.active){cancelShot();for(const k in keys)keys[k]=false;if(network.isHost&&!network.menu&&network.started)network.toggleMenu();}});
const invite=new URL(location.href).searchParams.get('room');if(invite){$('#room-code').value=invite.toUpperCase().replace(/[^A-Z2-9]/g,'').slice(0,6);network.open();}
// Guests may rejoin their existing position after a reload. Host reload ends the old simulation.
try{const saved=JSON.parse(sessionStorage.getItem('padelmaster-room')||'null');if(saved&&!saved.host){network.attach(saved);network.open();network.sync();}else if(saved?.host){network.request('leave',{},saved).catch(()=>{});sessionStorage.removeItem('padelmaster-room');}}catch{}

// Online is a full-frame screen; Escape uses the same visible back action.
addEventListener('keydown',e=>{if(e.code==='Escape'&&$('#multiplayer').open&&(!network.active||network.started)){e.preventDefault();$('#room-close').click();}});

try{const name=localStorage.getItem('padelmaster-online-name');if(name)$('#player-name').value=name;}catch{}
