// Rendering contract: all real roster identities, poses and grip targets stay valid.
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const nodes=new Map(),events={};let depth=0,draws=0;
const finite=args=>{for(const n of args)if(typeof n==='number')assert(Number.isFinite(n),'non-finite drawing coordinate');};
const context=new Proxy({save(){depth++;},restore(){assert(depth>0);depth--;},createLinearGradient(...args){finite(args);return {addColorStop(offset,color){assert(offset>=0&&offset<=1);assert(color);}};},createRadialGradient(...args){return this.createLinearGradient(...args);},measureText(){return {width:20};}}, {get(target,key){if(key in target)return target[key];return (...args)=>{finite(args);draws++;};},set(target,key,value){if(typeof value==='number')assert(Number.isFinite(value));target[key]=value;return true;}});
function element(id){if(!nodes.has(id)){const classes=new Set();nodes.set(id,{id:id.slice(1),value:'',innerHTML:'',textContent:'',classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x)},style:{setProperty(){}},firstChild:{style:{}},getBoundingClientRect:()=>({width:1280,height:720}),getContext:()=>context,focus(){},setAttribute(){},getAttribute:()=>null,addEventListener(){},showModal(){},close(){}});}return nodes.get(id);}
const box={assert,console,Math,devicePixelRatio:1,document:{createElement:()=>({getContext:()=>context}),querySelector:element,querySelectorAll:()=>[],getElementById:id=>element('#'+id),body:element('body'),activeElement:null},window:{},addEventListener:(name,fn)=>(events[name]||=[]).push(fn),requestAnimationFrame:()=>1,MutationObserver:class{observe(){}}};vm.createContext(box);
for(const file of ['i18n.js','character-renderer.js','game.js','character-portraits.js'])vm.runInContext(fs.readFileSync('web/'+file,'utf8'),box);
vm.runInContext('network={enter(){},open(){}};',box);
vm.runInContext(fs.readFileSync('web/selection.js','utf8'),box);
vm.runInContext(fs.readFileSync('web/character-gallery.js','utf8'),box);
vm.runInContext(`
 assert.equal(roster.length,18);const ids=new Set();
 for(const r of roster){
  for(const svg of [CharacterPortraits.head(r),CharacterPortraits.side(r)]){
   assert(svg.startsWith('<svg'));assert(!svg.includes('undefined'));assert(!svg.includes('NaN'));
   for(const m of svg.matchAll(/id="([^"]+)"/g)){assert(!ids.has(m[1]),'duplicate SVG id');ids.add(m[1]);}
   for(const m of svg.matchAll(/url\\(#([^)]+)\\)/g))assert(svg.includes('id="'+m[1]+'"'),'unresolved gradient/clip');
  }
  assignCourtPlayer(0,r.id);resetPlayers();const expected=characterBaseStats(r);
  assert.deepEqual(players[0].rosterStats,expected,'gallery stats must match simulation');
  for(let i=0;i<8;i++)for(const mode of ['ready','run','charge','swing','lob']){
   const p={...players[0],human:false,x:260,y:240,angle:i*Math.PI/4,gait:1.7,vx:mode==='run'?160:0,vy:mode==='run'?90:0,swing:['swing','lob'].includes(mode)?.11:0,impactAngle:.9,contactZ:mode==='lob'?150:0,lobSwing:mode==='lob',netCharge:mode==='charge'?{power:.8}:null};
   const snapshot=JSON.stringify(p),pose=displayRacketPose(p),progress=p.swing?1-p.swing/.22:0;
   const result=CharacterRenderer.draw(ctx,p,{pose,loading:p.netCharge?.power||0,progress});
   assert.equal(JSON.stringify(p),snapshot,'art mutated player');
   const x=p.x+result.hand.x*Math.cos(result.bodyAngle)-result.hand.y*Math.sin(result.bodyAngle);
   const y=p.y+result.hand.x*Math.sin(result.bodyAngle)+result.hand.y*Math.cos(result.bodyAngle);
   assert(Math.abs(x-(pose.gripX-Math.cos(pose.angle)*2))<1e-8,'hand missed grip X');
   assert(Math.abs(y-(pose.gripY-Math.sin(pose.angle)*2-pose.z*.28))<1e-8,'hand missed grip Y');
   drawRacket(p.team,ctx);
  }
 }
 assert.equal(racketFaceWidth(0,0,0),.18,'idle paddle should remain edge-on');
 const lineupBefore=courtPlayers().map(p=>p.id).join();
 showMenuStep('gallery');
 assert.equal(courtPlayers().map(p=>p.id).join(),lineupBefore,'comparison changed lineup');
 assert.equal(($('#gallery-screen').innerHTML.match(/class="match-player/g)||[]).length,4);
 assert.equal(($('#gallery-screen').innerHTML.match(/data-slot-level=/g)||[]).length,3);
 setLanguage('es');assert($('#gallery-screen').innerHTML.includes('CONOCE AL EQUIPO.'));
 assert($('#gallery-screen').innerHTML.includes('TÉCNICA'));assert($('#gallery-screen').innerHTML.includes('RESISTENCIA'));
 globalThis.humanPosition=3;$('#gallery-play').onclick();assert.equal(menuStep,'characters');assert.equal(new Set(courtPlayers().map(p=>p.id)).size,4);
 showMenuStep('home');assert($('#gallery-screen').classList.contains('hidden'));assert(!$('#home-screen').classList.contains('hidden'));
`,box);
vm.runInContext(`newMatch();state='play';for(const h of [0,10,20,30,40,50,100]){hits=h;for(const age of [0,.3,.8,1.4,3]){clock+=age;const before=JSON.stringify({ball,players,hits});drawRallyDrama();assert.equal(JSON.stringify({ball,players,hits}),before,'drama mutated gameplay');}for(const power of [.15,.5,1]){charge={power,lob:false};drawTimingMeter(players[0]);drawBallTexture({x:300,y:200,vx:250,vy:-30,spin:h},180,8);}}charge=null;state='point';afterPointAge=2;drawRallyDrama();hits=0;state='serve';drawRallyDrama();assert.equal(dramaStage,0);`,box);
vm.runInContext(`for(const r of roster){const a=characterAttributes(r);assert.equal(Object.values(a).reduce((x,y)=>x+y),12);assert(Object.values(a).every(v=>v>=2&&v<=4));const stats=characterBaseStats(r);assert(stats.speed>=164&&stats.speed<=176);}globalThis.slotDifficulties=['club','beginner','advanced','club'];resetPlayers();assert(levelOf(players[1]).speed<levelOf(players[2]).speed);assert(levelOf(players[1]).reaction>levelOf(players[2]).reaction);assert.equal(players[3].aiLevel,'club');`,box);
for(let i=0;i<18;i++){const source=vm.runInContext('CharacterPortraits.source(roster['+i+'])',box);assert(fs.existsSync('web'+source.split('?')[0]),'missing illustrated portrait '+source);}
assert.equal(depth,0,'unbalanced Canvas save/restore');assert(draws>1000);
console.log('PASS all 18 portrait definitions, unique SVG references, 720 animated poses, finite coordinates, zero player mutation, shared grip alignment, actual stats, gallery wrap/language/lineup preservation');
vm.runInContext(`
 for(const r of roster)for(let tier=1;tier<=3;tier++){
  const skin={primary:'#264864',accent:'#ffc318'};
  for(const swing of [0,.12]){const p={...players[0],appearance:r,skinTier:tier,swing,angle:Math.PI/3},before=JSON.stringify(p);
   const pose=displayRacketPose(p);
   CharacterRenderer.draw(ctx,p,{pose,loading:0,progress:swing?.55:0,skin});drawRacket(p.team,ctx,skin);
   CharacterRenderer.strike(ctx,{x:250,y:240,angle:1},.1,tier,skin,r.id);
   assert.equal(JSON.stringify(p),before);
  }
 }
`,box);
assert.equal(depth,0,'cosmetic effects leaked a canvas transform');
console.log('PASS match rig and perfect-contact effects for 54 cosmetics in ready and swing poses');
vm.runInContext(`newMatch();state='play';const striker=players[localSlot()];striker.timingUntil=clock+1;for(const vertical of [true,false]){portraitMode=vertical;for(const [grade,pos] of [['EARLY',.1],['PERFECT',.5],['LATE',.9]]){striker.timingMark=pos;striker.timingFeedback=grade;drawTimingMeter(striker);}}`,box);
assert.equal(depth,0);
for(const phase of ['serve','play','fault','let','point','over']){
 const before=draws;
 vm.runInContext(`state='${phase}';drawTimingMeter({team:ball.last});`,box);
 assert(draws>before,'idle timing rail missing during '+phase);
}
