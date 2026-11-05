// Isolated physical invariants; match-flow coverage lives in match.cjs.
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const el={value:'1',classList:{add(){},remove(){},toggle(){}},style:{},firstChild:{style:{}},getBoundingClientRect:()=>({width:1280,height:720}),getContext:()=>({setTransform(){}}),focus(){},showModal(){},close(){}};
const box={document:{querySelector:()=>el,querySelectorAll:()=>[]},window:{},devicePixelRatio:1,addEventListener(){},requestAnimationFrame(){},console,Math,assert};vm.createContext(box);vm.runInContext(fs.readFileSync('web/i18n.js','utf8'),box);vm.runInContext(fs.readFileSync('web/game.js','utf8'),box);
vm.runInContext(`
let b={x:990,y:250,z:20,vx:300,vy:0,vz:0,last:0,bounces:1,legalBounce:true};physics(b,.05,false);assert(b.vx<0);assert.equal(b.x,995);
b={x:850,y:3,z:20,vx:0,vy:-100,vz:0,last:0,bounces:1,legalBounce:true};physics(b,.05,false);assert(b.vy>0);
b={x:600,y:250,z:1,vx:100,vy:0,vz:-100,last:0,bounces:0};physics(b,.02,false);assert.equal(b.bounces,1);assert(b.vz>0);assert(b.legalBounce);
b={x:499,y:250,z:10,vx:100,vy:0,vz:0,last:0,bounces:0};assert.equal(physics(b,.02,false),'NET');
resetPlayers();for(const p of players){p.y=p.lane===0?450:50;constrainPlayer(p);if(!p.human)assert(p.lane===0?p.y<=232:p.y>=268);}players[0].y=100;constrainPlayer(players[0]);assert.equal(players[0].y,100);
newMatch();state='play';beginCharge('Mouse1',false);charge.power=.6;keys.KeyA=true;updateSwipe(charge.origin.x-80,charge.origin.y);releaseCharge('Mouse1');assert(Number.isFinite(pendingShot.aim.x));keys.KeyA=false;togglePause();assert.equal(charge,null);assert.equal(pendingShot,null);
`,box);
console.log('PASS: wall restitution, ground bounce, net, AI bounds, human movement, charge release and pause cancellation');
vm.runInContext(`
newMatch();state='play';gestureStrokes=[];const inkPlayer=players[localSlot()];inkPlayer.x=200;inkPlayer.y=220;inkPlayer.angle=0;ball.z=40;mouse={x:900,y:100};beginCharge('Mouse1',false);updateSwipe(950,110,gestureNow()+50);updateSwipe(990,145,gestureNow()+100);
const ink=activeStroke,raw=JSON.stringify(ink.points),powerBefore=charge.power,aimBefore={...charge.aim},r={left:20,top:30};
let d=gestureTrailOffset(ink,r),origin=gestureRacketOrigin(inkPlayer);assert(Math.abs(ink.points[0].x+d.x-(20+ox+(origin.x+shakeX)*scale))<1e-8);assert(Math.abs(ink.points[0].y+d.y-(30+oy+(origin.y-origin.z*.28+shakeY)*scale))<1e-8);
inkPlayer.x+=30;let moved=gestureTrailOffset(ink,r);assert(Math.abs(moved.x-d.x-30*scale)<1e-8);assert.equal(JSON.stringify(ink.points),raw);assert.equal(charge.power,powerBefore);assert.deepEqual(charge.aim,aimBefore);
releaseCharge('Mouse1');assert(Number.isFinite(pendingShot.aim.x));assert.equal(pendingShot.power,powerBefore);const released=gestureTrailOffset(ink,r);inkPlayer.x+=100;assert.deepEqual(gestureTrailOffset(ink,r),released);
anchorGestureImpact(inkPlayer,280,230,80);assert.deepEqual(ink.anchor,{x:280,y:230,z:80});assert.equal(ink.impactAnchored,true);assert.equal(JSON.stringify(ink.points),raw);anchorGestureImpact(inkPlayer,400,100,0);assert.equal(ink.anchor.x,280);
mouse={x:20,y:500};beginCharge('Mouse2',true);const cancelled=activeStroke;cancelShot();anchorGestureImpact(inkPlayer,1,2,3);assert(!cancelled.impactAnchored);
`,box);
console.log('PASS: racket-anchored ink follows during drag, freezes after release, binds once to impact, leaves raw gesture/aim/power unchanged and ignores cancellation');
vm.runInContext(`{
 const arc=(depth,reverse=false)=>Array.from({length:25},(_,i)=>({x:(reverse?24-i:i)*5,y:depth*Math.sin(Math.PI*i/24)}));
 for(const reverse of [false,true]){assert(gestureShape(arc(35,reverse)).spin<-.3);assert(gestureShape(arc(-35,reverse)).spin>.3);assert.equal(gestureShape(arc(2,reverse)).spin,0);}
 assert(gestureShape(arc(5)).spin<0,'shallow lower arc should slice');assert(gestureShape(arc(-5)).spin>0,'shallow upper arc should topspin');
 assert(Math.abs(gestureShape(arc(45)).spin)>Math.abs(gestureShape(arc(15)).spin));
 assert.equal(gestureShape(Array.from({length:25},(_,i)=>({x:i*5,y:30*Math.sin(2*Math.PI*i/24)}))).spin,0);
 const origin={x:250,y:200,z:45},base=trajectory(250,200,45,800,240,160),slice=applyGestureSpin({...base},-1,.7,origin),top=applyGestureSpin({...base},1,.7,origin);
 assert(slice.spinGravity<1&&top.spinGravity>1);assert(slice.vz>base.vz&&top.vz<base.vz);
 for(const shot of [slice,top]){const t=(shot.vz+Math.sqrt(shot.vz**2+2*G*shot.spinGravity*45))/(G*shot.spinGravity);assert(Math.abs(250+shot.vx*t-800)<.001);}
 const wall={legalBounce:true,power:.7};assert(wallRetention({...wall,gestureSpin:-1})<wallRetention(wall));assert(wallRetention({...wall,gestureSpin:1})>wallRetention(wall));
 const high={bounces:0,z:140};assert.equal(shotFamily(false,.5,high,null,-1),'BANDEJA');assert.equal(shotFamily(false,.5,high,null,1),'VÍBORA');assert.equal(shotFamily(false,.95,high,null,-1),'SMASH');
 const smash=applyGestureSpin({...base,smash:true,paceBoost:1.28,smashBounce:.72},-1,.95,origin);assert(smash.paceBoost<1.28&&smash.smashBounce<.72);
 assert.equal(spinShotLabel('DRIVE',-1),'SLICED DRIVE');assert.equal(spinShotLabel('BACKHAND',0),'STRAIGHT BACKHAND');
 assert.equal(showMouseCursor,false);
 newMatch();state='play';mouse={x:0,y:0};beginCharge('Mouse1',false);for(const p of arc(35).slice(1))updateSwipe(p.x,p.y,gestureNow()+p.x*4);releaseCharge('Mouse1');assert(pendingShot.aim.spin<0);assert(Math.abs(pendingShot.aim.y)<.001);
}`,box);
console.log('PASS arc direction/reversal/deadzone, strength, curved release aim, spin flight/landing/walls, overhead naming and sliced-smash penalty; cursor hidden by default');
vm.runInContext(`{
 const lob={shotKind:'LOB',x:100,y:140,z:30,vx:120,vy:42,vz:260,last:0,bounces:0};
 let peak=0,descending=false;
 for(let i=0;i<240;i++){
  physics(lob,1/240,false);if(lob.bounces)break;
  peak=Math.max(peak,lob.z);descending ||= lob.vz<0;
  assert(Math.abs(ballDrawY(lob)-(140+(lob.x-100)*42/120))<1e-6);
 }
 assert(peak>60&&descending);
}`,box);
console.log('PASS diagonal lob stays on its projected line through ascent and descent');
