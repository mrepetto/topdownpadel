const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const nodes=new Map(),storage=new Map();let serial=0;
function el(id){if(nodes.has(id))return nodes.get(id);const classes=new Set(),listeners={};const e={id:id.slice(1),value:'',dataset:{},innerHTML:'',textContent:'',children:[],listeners,style:{setProperty(){}},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)},setAttribute(){},getAttribute(){return null},focus(){},click(){this.onclick?.()},getBoundingClientRect:()=>({width:1280,height:720}),getContext:()=>({setTransform(){}}),addEventListener:(n,f)=>listeners[n]=f,querySelectorAll:()=>[],querySelector:sel=>el(sel),append(child){this.appendChild(child)},appendChild(child){this.children.push(child);nodes.set('#'+child.id,child)},showModal(){this.open=true},close(){this.open=false}};nodes.set(id,e);return e;}
const box={assert,console,Math,Date,devicePixelRatio:1,setInterval(){},setTimeout(){},document:{querySelector:el,querySelectorAll:()=>[],getElementById:id=>el('#'+id),createElement:()=>el('#created'+serial++),body:el('body'),addEventListener(){}},window:{},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},addEventListener(){},requestAnimationFrame(){return 1},MutationObserver:class{observe(){}}};vm.createContext(box);
for(const f of ['i18n.js','game.js','practice.js'])vm.runInContext(fs.readFileSync('web/'+f,'utf8'),box);
vm.runInContext(`sfx=()=>{};unlockAudio=()=>{};function act(value){$('#practice-screen').listeners.click({target:{closest:()=>({dataset:{practice:value}})}});}function choose(id,value){$(id).listeners.change({target:{value}});}function begin(mode='free',side=0,kind='ground',step=0){Practice.open(mode,null);act('end:'+side);if(mode==='free')choose('#practice-feed',kind);else choose('#practice-lesson',String(step));act('start');if(mode==='tutorial')act('try');for(let i=0;i<160;i++)tick(1/120);}function run(name,fn){fn();console.log('PASS',name);}`,box);
vm.runInContext(`
run('machine feeds mirror on both ends and never award points',()=>{for(const end of [0,1]){begin('free',end);assert.equal(players.length,1);assert.equal(side(players[0].x),0);assert.equal(ball.last,1);let serial=shotSerial;for(let i=0;i<2000;i++)tick(1/120);assert(shotSerial>serial);assert.equal(score[0]+score[1],0);assert.equal(games[0]+games[1],0);assert.equal(hits,0);}});
run('glass feeds actually hit the requested glass before second bounce',()=>{for(const end of [0,1])for(const kind of ['backglass','sideglass']){begin('free',end,kind);let seen=false;for(let i=0;i<900;i++){tick(1/120);if(kind==='backglass'?ball.practiceBack:ball.practiceSide)seen=true;}assert(seen,kind+' end '+end);}});
run('one movement success saves progress and opens next explanation',()=>{begin('tutorial',0,'ground',0);players[0].x=260;players[0].y=250;tick(.01);assert(JSON.parse(localStorage.getItem('topdownpadel-campaign-tutorial-v1')).completed.includes(0));for(let i=0;i<200;i++)tick(1/120);assert(!Practice.isMenu());assert(Practice.demonstrating);assert($('#practice-hud').innerHTML.includes('YOUR FIRST DRIVE'));});
run('tutorial rejects wrong shot then accepts legal requested shot',()=>{begin('tutorial',0,'ground',10);Practice.onHit({bounces:0,z:140},{kind:'VOLLEY',power:.5,timing:'PERFECT'});Practice.onFloor({last:0,x:800,y:250});assert(!JSON.parse(localStorage.getItem('topdownpadel-campaign-tutorial-v1')).completed.includes(10));begin('tutorial',0,'ground',10);Practice.onHit({bounces:0,z:140},{kind:'BANDEJA',power:.5,timing:'PERFECT',spin:-.65});Practice.onFloor({last:0,x:800,y:250});assert(JSON.parse(localStorage.getItem('topdownpadel-campaign-tutorial-v1')).completed.includes(10));assert.equal(score[0]+score[1],0);});
run('practice pause freezes time and normal matches restore four players',()=>{begin();Practice.menu();const snapshot=JSON.stringify(ball);tick(.1);assert.equal(JSON.stringify(ball),snapshot);act('resume');tick(.1);assert.notEqual(JSON.stringify(ball),snapshot);newMatch();assert(!Practice.active);assert.equal(players.length,4);assert.equal(state,'serve');});
`,box);
vm.runInContext(`
run('each shot lesson can be completed from a real machine feed on either end',()=>{
const kinds={1:'DRIVE',2:'BACKHAND',3:'DRIVE',4:'DRIVE',5:'LOB',6:'DRIVE',7:'DRIVE',8:'VOLLEY',9:'VOLLEY',10:'BANDEJA',11:'VÍBORA',12:'SMASH'};
for(const end of [0,1])for(let index=1;index<=12;index++){
begin('tutorial',end,'ground',index);const p=players[0],q=index===9?.2:index===11?.72:index===12?.9:.6;let struck=false,passed=false;
for(let i=0;i<900;i++){
 if(!struck&&ball.last===1&&racketContact(p,ball)&&ball.z<=205&&([6,7].includes(index)?['DRIVE','BACKHAND'].includes(shotFamily(false,q,ball,p)):shotFamily(index===5,q,ball,p)===kinds[index])&&(index!==6||ball.practiceBack)&&(index!==7||ball.practiceSide)&&(index!==3||releaseTiming(p)==='PERFECT')){
 const aim={x:end?-1:1,y:0,mouse:true,targetX:end?180:820,targetY:250,spin:index===10?-.65:index===11?.65:0};struck=hit(p,index===5,q,aim,'PERFECT');
 }
 tick(1/120);if($('#practice-feedback').textContent.includes('COMPLETE')){passed=true;break;}
}
assert(struck,'contact lesson '+index+' end '+end);assert(passed,'legal completion lesson '+index+' end '+end);
}
});
`,box);
vm.runInContext(`
run('manual tutorial serve uses real service rules and finishes on both ends',()=>{for(const end of [0,1]){begin('tutorial',end,'ground',13);assert.equal(state,'serve');const p=players[0];const dx=end?-600:600,dy=-220,n=Math.hypot(dx,dy);queueServe(p,.5,{x:dx/n,y:dy/n,mouse:true});let complete=false;for(let i=0;i<900;i++){tick(1/120);if($('#practice-feedback').textContent.includes('COMPLETE')){complete=true;break;}}assert(complete,'serve end '+end);assert.equal(score[0]+score[1],0);}});
run('unhit feeds, nets and outside shots automatically retry without career rewards',()=>{begin();const points=stats.points;Practice.onHit({bounces:1},{kind:'DRIVE',power:.5,timing:'PERFECT'});Practice.resolve('NET');assert.equal(state,'play');assert.equal(stats.points,points);assert.equal(score[0]+score[1],0);const serial=shotSerial;for(let i=0;i<400;i++)tick(1/120);assert(shotSerial>serial);Practice.stop();});
`,box);
vm.runInContext(`
run('beginner feeds leave time to react, show a real second bounce and ignore match speed',()=>{
 for(const end of [0,1]){gameSpeed=200;begin('tutorial',end,'ground',1);assert.equal(ballPace(ball),.4);const expected1=nextFloorBounce(ball);assert(expected1);let first=null,second=null,window=0;
 for(let i=0;i<1000;i++){const n=ball.bounces;tick(1/120);if(ball.bounces===1&&racketContact(players[0],ball))window+=1/120;if(ball.bounces>n){if(!first){first={t:i/120,x:ball.x,y:ball.y};assert(Math.hypot(first.x-expected1.x,first.y-expected1.y)<3);}else{second={t:i/120};break;}}}
 assert(first&&second);assert(first.t>1.3,'pre-bounce reaction time');assert(second.t-first.t>1.5,'visible playable rebound');assert(window>.2,'human contact window');console.log('  end',end,'first bounce',first.t.toFixed(2),'rebound window',(second.t-first.t).toFixed(2),'contact',window.toFixed(2));
 }gameSpeed=100;
});
run('feed pace changes actual flight speed, and returned shots regain normal physics',()=>{
 for(const [pace,speed] of [['relaxed',.45],['normal',.65],['fast',.85]]){begin();Practice.menu();choose('#practice-pace',pace);act('start');for(let i=0;i<160;i++)tick(1/120);assert.equal(ballPace(ball),speed);}
 begin('tutorial',0,'ground',1);let struck=false;for(let i=0;i<900;i++){if(ball.bounces===1&&racketContact(players[0],ball)){struck=hit(players[0],false,.5,{x:1,y:0,mouse:true,targetX:820,targetY:250},'PERFECT');if(struck)break;}tick(1/120);}assert(struck);assert.equal(ball.practiceFeedSpeed,undefined);assert(Math.abs(ballPace(ball)-.7)<.01);Practice.stop();
});
`,box);
vm.runInContext(`
run('all practice feeds show two accurate match-style bounce targets on either end and at every pace',()=>{
 for(const end of [0,1])for(const kind of ['ground','volley','overhead','backglass','sideglass'])for(const pace of ['relaxed','normal','fast']){
  begin('free',end,kind);Practice.menu();choose('#practice-pace',pace);act('start');for(let i=0;i<160;i++)tick(1/120);
  const targets=Practice.bounceMarkers();assert.equal(targets.length,2,kind+' '+pace);assert.deepEqual(targets.map(b=>b.n),[1,2]);
  let seen=0,glass=0;
  for(let i=0;i<1000;i++){
   const before=ball.bounces;tick(1/120);glass=Math.max(glass,ball.glassTouches||0);
   if(ball.bounces>before){const target=targets[seen++];assert(target);assert(Math.hypot(target.x-ball.x,target.y-ball.y)<4,kind+' prediction drift');
    if(seen===1)assert.deepEqual(Practice.bounceMarkers().map(b=>b.n),[2]);
    else{assert.equal(Practice.bounceMarkers().length,0);break;}
   }
  }
  assert.equal(seen,2,kind+' second bounce missing');if(kind==='sideglass')assert(glass>=2,'double-wall feed must touch both walls');
 }
});
run('practice targets clear on hit, retry, pause and exit; regular matches retain their marker',()=>{
 begin();assert.equal(Practice.bounceMarkers().length,2);Practice.menu();assert.equal(Practice.bounceMarkers().length,0);act('resume');assert.equal(Practice.bounceMarkers().length,2);
 Practice.onHit({...ball},{kind:'DRIVE',power:.5,timing:'PERFECT'});assert.equal(Practice.bounceMarkers().length,0);bounceTarget={x:100,y:100};drawBounceTarget();assert.equal(bounceTarget,null);
 Practice.resolve('NET');assert.equal(Practice.bounceMarkers().length,0);Practice.stop();assert.equal(Practice.bounceMarkers().length,0);
 assert.equal(typeof drawFloorBounceMarker,'function');
});
`,box);
vm.runInContext(`
run('real human returns carry gesture spin and predictions use the same flight',()=>{
 for(const spin of [-1,0,1]){begin('tutorial',0,'ground',1);let struck=false;
 for(let i=0;i<900;i++){if(ball.bounces===1&&racketContact(players[0],ball)){struck=hit(players[0],false,.5,{x:1,y:0,mouse:true,targetX:820,targetY:250,spin},'PERFECT');if(struck)break;}tick(1/120);}
 assert(struck);assert.equal(ball.gestureSpin,spin);assert.equal(players[0].shotSpin,spin);assert.equal(ball.shotKind,'DRIVE');const target=nextFloorBounce(ball);assert(target);assert(target.x>500&&target.x<995);
 }Practice.stop();
});
run('mouse cursor preference defaults hidden and toggles persistently',()=>{assert.equal(showMouseCursor,false);$('#mouse-cursor').onclick();assert.equal(showMouseCursor,true);assert.equal(localStorage.getItem('padelmaster-mouse-cursor'),'on');$('#mouse-cursor').onclick();assert.equal(showMouseCursor,false);assert.equal(localStorage.getItem('padelmaster-mouse-cursor'),'off');});
`,box);

vm.runInContext(`
run('every court demo uses real contacts on both ends without saving progress',()=>{
 for(const end of [0,1])for(let index=0;index<Practice.lessons.length;index++){
  Practice.open('tutorial',null);act('end:'+end);choose('#practice-lesson',String(index));act('start');assert(Practice.demonstrating);assert(!Practice.isMenu());
  const saved=localStorage.getItem('topdownpadel-campaign-tutorial-v1');let hitSeen=index===0;
  for(let i=0;i<1500;i++){tick(1/120);if(ball.last===0&&ball.vx)hitSeen=true;}
  assert(hitSeen,'demo contact '+index+' end '+end);assert.equal(localStorage.getItem('topdownpadel-campaign-tutorial-v1'),saved,'demo saved progress');
  assert(Practice.demonstrating);Practice.menu();assert(Practice.isMenu());act('exit');assert(!Practice.isMenu());assert(Practice.demonstrating);
 }
});
run('space and legacy keyboard lob cannot shoot; actual gestures remain enabled',()=>{
 begin();beginCharge('Space',false);assert.equal(charge,null);beginCharge('KeyL',true);assert.equal(charge,null);beginCharge('Mouse1',false);assert(charge?.gesture);cancelShot();Practice.stop();
});
run('spin and finisher lessons require their actual mechanic',()=>{
 for(const [index,spin] of [[14,-.65],[15,.65]]){begin('tutorial',0,'ground',index);Practice.onHit({bounces:1},{kind:'DRIVE',power:.5,timing:'PERFECT',spin:0});Practice.onFloor({last:0,x:800,y:250});assert(!JSON.parse(localStorage.getItem('topdownpadel-campaign-tutorial-v1')).completed.includes(index));begin('tutorial',0,'ground',index);Practice.onHit({bounces:1},{kind:'DRIVE',power:.5,timing:'PERFECT',spin});Practice.onFloor({last:0,x:800,y:250});assert(JSON.parse(localStorage.getItem('topdownpadel-campaign-tutorial-v1')).completed.includes(index));}
 begin('tutorial',0,'ground',16);assert.equal(players[0].finisherCharge,5);assert.equal(chargeFinisher(players[0],'EARLY'),false);assert.equal(players[0].finisherCharge,5);assert.equal(chargeFinisher(players[0],'PERFECT'),true);Practice.stop();
});
`,box);

vm.runInContext(`run('training speed scales incoming feeds without changing swipe sensitivity',()=>{begin();const before=swipeSensitivity,baseline=ballPace(ball);gameSpeed=35;assert(Math.abs(ballPace(ball)-baseline*.5)<.001);gameSpeed=140;assert(Math.abs(ballPace(ball)-baseline*2)<.001);assert.equal(swipeSensitivity,before);Practice.stop();assert.equal(gameSpeed,100);});`,box);
vm.runInContext(`
run('machine contracts score actual returns on the legal first bounce; resume or exit',()=>{
 for(const [kind,seed,targetX,targetY,family] of [
  ['cones','B',705,150,'DRIVE'],['zones','B',705,150,'DRIVE'],['calls','B',835,250,'BANDEJA'],['calls','C',835,345,'VOLLEY']
 ]){
  let count=0,left=false,attempted=false;
  globalThis.challengeMachineHit=id=>{assert.equal(id,'test');return ++count;};
  globalThis.openChallenges=()=>{left=true;};
  Practice.openChallenge({id:'test',kind,goal:1,seed,weekly:false,expires:Date.now()+300000},null,0);
  Practice.menu();const before=clock;tick(.1);assert.equal(clock,before);act('challenge-resume');
  for(let i=0;i<1500&&!Practice.isMenu();i++){
   const p=players[0],spin=family==='BANDEJA'?-.65:0;
   if(!attempted&&ball.last===1&&racketContact(p,ball)&&ball.z<=205&&shotFamily(false,.6,ball,p,spin)===family){
    attempted=hit(p,false,.6,{x:1,y:(targetY-ball.y)/220,targetX,targetY,mouse:true,spin},'PERFECT');
   }
   tick(1/120);
  }
  assert(attempted,kind+' real contact '+family);assert.equal(count,1,kind+' physical target '+family);
  assert(Practice.isMenu());assert($('#practice-screen').innerHTML.includes('CHALLENGE COMPLETE'));
  act('challenge-exit');assert(left);assert(!Practice.active);
 }
});
run('return rally accepts two actual legal returns and offers another free run or the ladder',()=>{
 const recovery={id:'return-rally',kind:'returns',goal:2,repeatable:true,returnToLadder:true,reward:25,seed:0,expires:Infinity};
 let count=0,retried=false,left=false;
 globalThis.challengeMachineHit=()=>++count;
 globalThis.retrySkillChallenge=()=>{retried=true;Practice.openChallenge(recovery,null);};
 globalThis.openChallenges=()=>{left=true;};
 Practice.openChallenge(recovery,null);
 for(let i=0;i<5000&&!Practice.isMenu();i++){
  const p=players[0];
  if(ball.last===1&&ball.bounces===1&&racketContact(p,ball))hit(p,false,.5,{targetX:670,targetY:count?90:375,mouse:true},'PERFECT');
  tick(1/120);
 }
 assert.equal(count,2);const out=$('#practice-screen').innerHTML;
 assert(out.includes('25 coins added'));assert(out.includes('CAMPAIGN'));assert(out.includes('PLAY AGAIN'));
 act('challenge-retry');assert(retried);assert(!Practice.isMenu());act('challenge-pause');act('challenge-exit');assert(left);assert(!Practice.active);
});
run('called shot with placement rejects wrong shots, wrong location, and unplayed feeds',()=>{
 let count=0;globalThis.challengeMachineHit=()=>++count;
 const def={id:'combo',kind:'calls',goal:3,seed:'C',weekly:false,expires:Date.now()+300000};
 for(const [kind,y,last,bounces] of [['DRIVE',345,0,1],['VOLLEY',85,0,1],['VOLLEY',345,1,1],['VOLLEY',345,0,2]]){
  Practice.openChallenge(def,null,0);for(let i=0;i<160;i++)tick(1/120);
  Practice.onHit({bounces:0},{kind});Practice.onFloor({legalBounce:true,x:835,y,last,bounces});assert.equal(count,0);Practice.stop();
 }
 Practice.openChallenge(def,null,0);for(let i=0;i<160;i++)tick(1/120);
 Practice.onFloor({legalBounce:true,x:835,y:345,last:0,bounces:1});assert.equal(count,0);
 Practice.stop();
});
`,box);
