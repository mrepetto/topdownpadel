'use strict';
// Presentation only. All joint targets and the paddle pose come from the game.
// No gameplay RNG, timers, hitboxes or player state are changed by this module.
globalThis.CharacterRenderer = (() => {
 const palettes=new Map();
 const mix=(hex,to,t)=>{const a=parseInt(hex.slice(1),16),b=parseInt(to.slice(1),16);return '#'+[16,8,0].map(s=>Math.round(((a>>s)&255)*(1-t)+((b>>s)&255)*t).toString(16).padStart(2,'0')).join('');};
 function palette(p,kit){
  const shirt=kit?.primary||p.shirt;
  const key=[shirt,p.skin,p.shade,p.hair].join();if(palettes.has(key))return palettes.get(key);
  const c={shirt,shirtDark:mix(shirt,'#071c36',.58),shirtLight:mix(shirt,'#e0f5ff',.34),skin:p.skin,skinDark:p.shade||mix(p.skin,'#3d211b',.4),skinLight:mix(p.skin,'#ffdfb1',.42),hair:p.hair,hairLight:mix(p.hair,'#c4a27c',.28),hairDark:mix(p.hair,'#07101c',.3)};
  palettes.set(key,c);return c;
 }
 // A few large panels survive the overhead camera better than portrait-scale detail.
 // Kit shapes use the same local coordinates as the animated shoulder/neck rig.
 // Order follows the stable roster IDs. These silhouettes match each skin's portrait.
 const patterns=[
  ['club','crest','mineral'],    // César
  ['race','crest','canine'],     // Quique
  ['gear','tanks','hammer'],     // Carlos
  ['wave','hammer','porthole'],  // Albert, powerhouse
  ['gear','antler','mineral'],   // Jordi
  ['check','check','rook'],      // Albert, thinker
  ['gear','antler','mineral'],   // Abel
  ['club','gear','mineral'],     // David
  ['wave','hammer','porthole'],  // Jon
  ['race','mech','canine'],      // Igor
  ['race','feline','mech'],      // Martín
  ['club','mech','space'],       // Cristian
  ['wave','marine','marine'],    // Xavi
  ['gear','mech','comet'],       // Jeni
  ['wave','avian','sun'],        // Laura
  ['club','avian','eclipse'],    // Rosalia
  ['groove','resonator','resonator'], // Trapiche
  ['race','feline','avian'] // Claudia
 ];
 const looks=new WeakMap();
 function kitFor(skin,id,tier){
  if(looks.has(skin))return looks.get(skin);
  const kind=patterns[id]?.[tier-1]||'club';
  const kit={kind,primary:skin.primary,accent:skin.accent,edge:mix(skin.primary,'#07101c',.55),light:mix(skin.primary,'#ffffff',.4)};
  looks.set(skin,kit);return kit;
 }
 function polygon(ctx,points,fill,edge){
  ctx.beginPath();ctx.moveTo(points[0],points[1]);for(let i=2;i<points.length;i+=2)ctx.lineTo(points[i],points[i+1]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();
  if(edge){ctx.lineWidth=.85;ctx.strokeStyle=edge;ctx.stroke();}
 }
 function shoulders(ctx,k,tier){
  const {kind,primary,accent,edge,light}=k;
  for(const d of [-1,1]){
   ctx.save();ctx.scale(1,d);
   if(tier===1){
    if(kind==='wave')polygon(ctx,[-9,5,-5,9,-2,8,5,14,7,12,-1,6,-4,7],accent);
    else if(kind==='check'){for(let i=0;i<4;i++){ctx.fillStyle=i%2?edge:accent;ctx.fillRect(-3+i*2,10+i*.5,2.1,2);}}
    else if(kind==='groove'){ctx.strokeStyle=accent;ctx.lineWidth=1;ctx.beginPath();ctx.arc(1,10,3,0,Math.PI*2);ctx.stroke();}
    else polygon(ctx,[-9,4,-7,8,7,14,8,11],accent);
    if(kind==='race'||kind==='gear')polygon(ctx,[0,11,2,14,4,13,2,10],edge);
   }else{
    if(kind==='feline'||kind==='canine'){
     polygon(ctx,[-6,8,-2,15,4,18,9,14,9,9],primary,edge);
     for(const [x,y] of [[-2,11],[2,15],[5,11]]){ctx.fillStyle=accent;ctx.fillRect(x,y,2.8,2.2);}
    }else if(kind==='antler'){
     polygon(ctx,[-5,8,-7,15,-3,17,6,15,8,10],primary,edge);
     ctx.strokeStyle=accent;ctx.lineWidth=2.7;ctx.beginPath();ctx.moveTo(4,12);ctx.bezierCurveTo(-1,20,-10,20,-9,13);ctx.stroke();
    }else if(kind==='tanks'||kind==='porthole'||kind==='space'||kind==='resonator'){
     polygon(ctx,[-8,10,-7,15,5,16,9,13,7,10],primary,edge);
     if(kind==='resonator'){ctx.strokeStyle=accent;ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(1,13,3,0,Math.PI*2);ctx.stroke();}
     else polygon(ctx,[-5,10,-6,14,-3,15,-2,11],accent);
    }else if(kind==='sun'||kind==='eclipse'){
     polygon(ctx,[-4,8,-6,14,3,17,8,13],primary,edge);
     ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.beginPath();ctx.arc(1,1,15,Math.PI*.23,Math.PI*.87);ctx.stroke();
    }else if(kind==='check'||kind==='rook'){
     polygon(ctx,[-7,8,-7,13,-4,13,-4,16,0,16,0,13,4,13,4,16,7,16,8,10],primary,edge);
     for(let i=0;i<3;i++){ctx.fillStyle=i%2?edge:accent;ctx.fillRect(-4+i*3,10,3,3);}
    }else if(kind==='marine'||kind==='hammer'||kind==='avian'){
     polygon(ctx,[-10,7,-8,tier===3?22:18,2,15,9,10],primary,edge);
     polygon(ctx,[-8,8,-7,tier===3?19:16,2,12],accent);
    }else if(kind==='mineral'){
     polygon(ctx,[-8,7,-5,16,1,19,8,15,10,10],primary,edge);
     polygon(ctx,[-5,15,1,18,1,13,6,10],light);
     polygon(ctx,[-6,11,-2,12,0,16,0,13,3,10],accent);
    }else if(kind==='mech'||tier===3){
     polygon(ctx,[-5,9,-3,17,3,19,9,16,11,10,7,8],d===-1?accent:primary,edge);
     polygon(ctx,[-3,10,-2,15,0,16,-1,11],light);
     polygon(ctx,[3,15,7,14,8,12,4,13],edge);
    }else{
     polygon(ctx,[-7,8,-4,14,4,16,9,12,6,10],primary,edge);
     polygon(ctx,[-4,10,-3,13,6,15,5,12],accent);
    }
   }
   ctx.restore();
  }
  if(kind==='gear'||kind==='race'||tier===2)polygon(ctx,[-9,-4,-9,-1,6,9,7,6],accent);
 }
 function crown(ctx,k,x){
  const {kind,primary,accent,edge,light}=k;ctx.save();ctx.translate(x,0);
  if(kind==='canine'||kind==='feline'||kind==='avian'||kind==='antler'){
   for(const d of [-1,1]){ctx.save();ctx.scale(1,d);
    polygon(ctx,kind==='antler'?[-3,4,-12,10,-9,11,-5,10,-4,8,0,6]:[-2,3,-8,10,-9,4,-6,1],primary,edge);
    ctx.restore();}
   polygon(ctx,[-7,-4,-2,-7,5,-5,10,0,5,5,-2,7,-7,4],primary,edge);
   polygon(ctx,[2,-4,6,-2,6,-1,2,-2],accent);polygon(ctx,[2,4,6,2,6,1,2,2],accent);
   polygon(ctx,[8,-1,11,0,8,1],edge);
  }else if(kind==='porthole'||kind==='space'){
   ctx.fillStyle=primary;ctx.strokeStyle=edge;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(-1,0,7.7,7.8,0,0,Math.PI*2);ctx.fill();ctx.stroke();
   ctx.fillStyle=edge;ctx.beginPath();ctx.ellipse(3,0,4.5,6.5,0,0,Math.PI*2);ctx.fill();
   ctx.fillStyle=accent;ctx.beginPath();ctx.ellipse(4,0,2.8,4.7,0,0,Math.PI*2);ctx.fill();
  }else if(kind==='hammer'){
   polygon(ctx,[-8,-3,0,-4,2,-10,7,-10,8,-5,7,0,8,5,7,10,2,10,0,4,-8,3],primary,edge);
   polygon(ctx,[2,-8,6,-8,6,-6,2,-6],accent);polygon(ctx,[2,8,6,8,6,6,2,6],accent);
  }else if(kind==='rook'){
   polygon(ctx,[-6,-6,-1,-7,-1,-5,2,-5,2,-7,6,-6,8,-2,8,2,6,6,2,7,2,5,-1,5,-1,7,-6,6],primary,edge);
   polygon(ctx,[4,-5,7,-3,7,3,4,5,5,0],accent);
  }else if(kind==='marine'){
   polygon(ctx,[-9,-4,0,-7,7,-4,10,0,7,4,0,7,-9,4],primary,edge);
   polygon(ctx,[-1,0,-11,-1,-5,-3,4,-1],light);
   polygon(ctx,[4,-5,7,-3,7,3,4,5,5,0],accent);
  }else if(kind==='mineral'){
   polygon(ctx,[-7,-4,-2,-8,6,-6,9,-1,7,5,0,7,-7,4],primary,edge);
   polygon(ctx,[-6,-3,0,-6,4,-4,-2,0],light);
   polygon(ctx,[3,-5,6,-3,6,3,3,4,4,0],accent);
  }else{
   polygon(ctx,[-8,-3,-5,-7,4,-7,8,-3,8,3,4,7,-5,7,-8,3],primary,edge);
   polygon(ctx,[-6,-3,-3,-6,3,-5,-1,-3],light);
   polygon(ctx,[3,-6,6,-4,7,0,6,4,3,6,4,0],edge);
   polygon(ctx,[4,-5,6,-3,6,3,4,5,5,0],accent);
  }
  if(kind==='comet'||kind==='crest')polygon(ctx,[-11,0,-2,-2,6,-1,6,1,-3,2],accent,edge);
  if(kind==='eclipse'){ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,8,Math.PI*.25,Math.PI*1.75);ctx.stroke();}
  if(kind==='resonator'){ctx.strokeStyle=accent;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-5,0);ctx.lineTo(-2,0);ctx.lineTo(-1,-3);ctx.lineTo(1,2);ctx.lineTo(3,0);ctx.lineTo(5,0);ctx.stroke();}
  ctx.restore();
 }
 // Local racket follow-through at perfect contact only. No ball tint or simulation RNG.
 function strike(ctx,flash,age,tier,skin,id){
  const t=age/.26,accent=skin.accent,{kind}=kitFor(skin,id,tier);ctx.save();ctx.translate(flash.x,flash.y);ctx.rotate(flash.angle||0);
  ctx.strokeStyle=accent;ctx.fillStyle=accent;ctx.globalAlpha=(1-t)*.92;ctx.lineCap='round';
  if(tier===1){for(let i=0;i<2;i++){const x=-12-13*t-i*4,y=(i?1:-1)*(4+7*t);ctx.fillRect(x,y,4*(1-t)+1,2);}}
  else if(tier===2){ctx.lineWidth=1.8;for(let i=0;i<3;i++){const y=(i-1)*4;ctx.beginPath();ctx.moveTo(-10-15*t,y-2);ctx.quadraticCurveTo(-18-16*t,y,-23-15*t,y+5);ctx.stroke();}}
  else if(kind==='mineral'||kind==='rook'){for(const d of [-1,1]){const x=-12-15*t,y=d*(6+10*t);polygon(ctx,[x-4,y,x,y-2,x+3,y,x,y+2],accent);}}
  else if(kind==='canine'||kind==='marine'||kind==='hammer'){ctx.lineWidth=1.7;for(const d of [-1,1]){ctx.beginPath();ctx.moveTo(-9-10*t,d*(2+4*t));ctx.lineTo(-24-10*t,d*(7+6*t));ctx.lineTo(-20-10*t,d*(2+5*t));ctx.stroke();}}
  else{ctx.lineWidth=2.3;ctx.beginPath();ctx.arc(-8,0,9+t*19,Math.PI*.66,Math.PI*1.34);ctx.stroke();}
  ctx.restore();
 }
 function draw(ctx,p,options){
  const {pose,loading=0,progress=0,celebration:win=null}=options;
  const fallback={id:0,rank:1,build:1,look:0,shirt:p.team?'#ec626d':'#40b8ef',skin:'#b47b56',shade:'#805034',hair:'#20242c'};
  const a=p.appearance||fallback,skin=options.skin,tier=p.skinTier||0,kit=skin?kitFor(skin,a.id,tier):null,c=palette(a,kit),build=a.build||1;
  const speed=Math.hypot(p.vx||0,p.vy||0),walk=Math.min(1,speed/180),step=Math.sin(p.gait||0),stride=step*8*walk;
  const twist=p.swing>0?-.42+Math.sin(progress*Math.PI)*.85:-loading*.36+step*walk*.1;
  const angle=p.angle+twist,cs=Math.cos(angle),sn=Math.sin(angle),bounce=Math.abs(Math.cos(p.gait||0))*walk*1.2;
  const mx=speed>1?(p.vx*cs+p.vy*sn)/speed:1,my=speed>1?(-p.vx*sn+p.vy*cs)/speed:0;
  const project=(x,y)=>({x:(x-p.x)*cs+(y-p.y)*sn,y:-(x-p.x)*sn+(y-p.y)*cs});
  const hand=project(pose.gripX-Math.cos(pose.angle)*2,pose.gripY-Math.sin(pose.angle)*2-pose.z*.28);
  const throat=project(pose.gripX+Math.cos(pose.angle)*4,pose.gripY+Math.sin(pose.angle)*4-pose.z*.28);
  const ellipse=(x,y,rx,ry,fill)=>{ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();};
  const line=(x,y,X,Y,fill,width)=>{ctx.strokeStyle=fill;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(X,Y);ctx.stroke();};
  const grad=(x,y,X,Y,light,base,dark)=>{const g=ctx.createLinearGradient(x,y,X,Y);g.addColorStop(0,light);g.addColorStop(.34,base);g.addColorStop(1,dark);return g;};
  const shape=(d,fill,stroke='#071c3050',w=.45)=>{ctx.beginPath();d();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke();}};
  // Asymmetric muscle volumes, rather than uniform tubes and bright outline stripes.
  // Keep the joint centres fixed so visual anatomy never changes the contact rig.
  const segment=(from,to,r1,r2,light,base,dark)=>{
   const dx=to.x-from.x,dy=to.y-from.y,len=Math.hypot(dx,dy),theta=Math.atan2(dy,dx);
   ctx.save();ctx.translate(from.x,from.y);ctx.rotate(theta);
   shape(()=>{ctx.moveTo(0,-r1*.88);ctx.bezierCurveTo(len*.23,-r1*1.12,len*.64,-r2*1.16,len,-r2);ctx.quadraticCurveTo(len+r2*.7,-r2*.15,len,r2*.85);ctx.bezierCurveTo(len*.65,r2*1.2,len*.3,r1,0,r1*.87);ctx.quadraticCurveTo(-r1*.7,0,0,-r1*.88);},grad(0,-r1,0,r1,light,base,dark));
   shape(()=>{ctx.moveTo(len*.05,-r1*.52);ctx.bezierCurveTo(len*.28,-r1*.8,len*.48,-r1*.68,len*.73,-r2*.45);ctx.bezierCurveTo(len*.5,-r2*.08,len*.25,-r1*.07,len*.05,-r1*.52);},light+'48',null);
   shape(()=>{ctx.moveTo(len*.2,r1*.64);ctx.quadraticCurveTo(len*.56,r2*.56,len*.93,r2*.7);ctx.lineTo(len*.8,r2*.92);ctx.quadraticCurveTo(len*.5,r1*.98,len*.2,r1*.64);},dark+'38',null);
   ctx.restore();
  };
  const limb=(from,to,r1,r2)=>tier===3&&kit?segment(from,to,r1+.3,r2,kit.light,kit.primary,kit.edge):segment(from,to,r1,r2,c.skinLight,c.skin,c.skinDark);
  ctx.save();
  ellipse(p.x+3,p.y+5,22*build,17,'#03182a18');ellipse(p.x+2,p.y+3,16,12,'#03182a28');
  ctx.translate(p.x,p.y);ctx.rotate(angle);ctx.lineCap='round';ctx.lineJoin='round';
  // Compact standing stance: the torso occludes most of the legs at rest.
  // The existing stride reveals each foot as it steps, without a wide squat.
  for(const side of [-1,1]){
   const hip={x:-6,y:side*7*build};
   const knee={x:4+stride*side*.45*mx,y:side*(8.5+walk)*build+stride*side*.3*my};
   const foot={x:stride*side*mx,y:side*(8.5+walk*1.5)*build+stride*side*.55*my};
   limb(hip,knee,4.8,3.5);limb(knee,foot,3.6,2.25);
   const hem={x:hip.x+(knee.x-hip.x)*.55,y:hip.y+(knee.y-hip.y)*.55};
   segment(hip,hem,5.7,4.8,'#3b5676','#172d49','#071329');
   const thighLength=Math.max(1,Math.hypot(hem.x-hip.x,hem.y-hip.y)),nx=-(hem.y-hip.y)/thighLength,ny=(hem.x-hip.x)/thighLength;
   line(hip.x+nx*3,hip.y+ny*3,hem.x+nx*3,hem.y+ny*3,'#627a9170',.6);
   line(hem.x-nx*4,hem.y-ny*4,hem.x+nx*4,hem.y+ny*4,'#07172b80',.6);
   if(a.longSocks)segment(knee,foot,3.65,2.9,mix(a.sockColor,'#ffffff',.2),a.sockColor,mix(a.sockColor,'#351222',.35));
   else segment({x:foot.x+1,y:foot.y},foot,2.7,2.9,'#fff','#e3eceb','#9db5c4');
   ctx.save();ctx.translate(foot.x+2,foot.y);ctx.rotate(side*.05+Math.atan2(my*.15,mx*.15+1));
   ellipse(.5,1.4,7.5,4,'#04172665');
   // A layered sole, reinforced heel, curved toe and tongue remain legible at match scale.
   shape(()=>{ctx.moveTo(-5.4,-2.5);ctx.quadraticCurveTo(-7.2,-.4,-5.6,3.2);ctx.quadraticCurveTo(1,4.7,6.4,3.3);ctx.quadraticCurveTo(10.2,2.4,8.8,-.8);ctx.quadraticCurveTo(5.7,-4.2,0,-3.9);ctx.closePath();},'#a8b9c6');
   shape(()=>{ctx.moveTo(-5,-2.6);ctx.quadraticCurveTo(-6.5,0,-4.8,2.4);ctx.quadraticCurveTo(1,3.5,6.4,2.4);ctx.quadraticCurveTo(9.5,1.5,8,-1.2);ctx.quadraticCurveTo(4.8,-4.2,0,-3.7);ctx.closePath();},grad(-2,-4,3,3,'#ffffff','#e4eff3','#a5bbc9'));
   shape(()=>{ctx.moveTo(-4.4,-2.2);ctx.lineTo(-2.8,-3.3);ctx.quadraticCurveTo(-1.9,-.4,-2.7,2.3);ctx.lineTo(-4.4,1.9);ctx.closePath();},c.shirt,null);
   shape(()=>{ctx.moveTo(-1.8,-3.4);ctx.quadraticCurveTo(1.5,-4,4.6,-2.3);ctx.lineTo(2,0);ctx.lineTo(-1.5,.2);ctx.closePath();},c.shirtDark,null);
   shape(()=>{ctx.moveTo(.8,1.2);ctx.quadraticCurveTo(3,-1.4,6.7,-1.4);ctx.lineTo(7.6,.2);ctx.lineTo(4.4,.4);ctx.lineTo(2.5,2.3);ctx.closePath();},c.shirt,null);
   line(-1.5,-2.2,1,-.6,'#fff',.7);line(.1,-2.6,2.2,-1,'#fff',.7);line(1.6,-2.6,3.3,-1.5,'#fff',.65);
   line(-4.3,2.9,5.5,2.9,'#fbffff',.85);ctx.restore();
  }
  // Free arm supports the throat in ready pose, then releases during the stroke.
  const release=p.swing>0?1-Math.max(0,Math.min(1,(progress-.6)/.4)):Math.min(1,loading*4);
  const runRelease=p.swing<=0&&!loading?walk*.8:0;
  const free={x:(throat.x*(1-release)+(8-loading*8)*release)*(1-runRelease)+(10-step*7)*runRelease,y:(throat.y*(1-release)-17*release)*(1-runRelease)+(-17+step*2)*runRelease};
  if(win){free.x+=(8-free.x)*win.lift;free.y+=(-31-6*win.pump-free.y)*win.lift;}
  // Far arm first; torso obscures the shoulder seam.
  const farShoulder={x:5,y:-11*build},farElbow={x:(5+free.x)/2-1,y:Math.min(-12*build,free.y-5)};
  limb(farShoulder,farElbow,3.8,3.1);limb(farElbow,free,3.1,2.3);
  // Jersey, shaped shoulders and short sleeves. Bounded gradients give volume at game scale.
  ctx.save();ctx.scale(1,build);
  shape(()=>{ctx.moveTo(-9,-7.5);ctx.bezierCurveTo(-6,-9,-2,-10,0,-13.8);ctx.bezierCurveTo(3,-17.5,8,-16,10.2,-11.5);ctx.quadraticCurveTo(13,0,10.2,11.5);ctx.bezierCurveTo(8,16,3,17.5,0,13.8);ctx.bezierCurveTo(-2,10,-6,9,-9,7.5);ctx.quadraticCurveTo(-10.5,0,-9,-7.5);},grad(-4,-15,6,15,c.shirtLight,c.shirt,c.shirtDark));
  // Broad shoulder light, rib-cage falloff and folds converging into the tucked hem.
  shape(()=>{ctx.moveTo(-4,-8);ctx.quadraticCurveTo(1,-13,6,-12);ctx.quadraticCurveTo(9,-9,8,-4);ctx.bezierCurveTo(4,-6,0,-4,-4,-8);},c.shirtLight+'65',null);
  shape(()=>{ctx.moveTo(-9,-7);ctx.quadraticCurveTo(-6,-6,-2,-3);ctx.quadraticCurveTo(-3,1,-1,4);ctx.quadraticCurveTo(2,6,6,9);ctx.quadraticCurveTo(2,11,-3,9);ctx.lineTo(-9,7);ctx.quadraticCurveTo(-10,0,-9,-7);},c.shirtDark+'80',null);
  shape(()=>{ctx.moveTo(-9,-4);ctx.lineTo(-3,-.7);ctx.lineTo(-7,-.1);ctx.lineTo(-9,1);ctx.closePath();},c.shirtLight+'75',null);
  shape(()=>{ctx.moveTo(-8,3);ctx.lineTo(-2,4.1);ctx.lineTo(1,6);ctx.lineTo(-5,5);ctx.closePath();},c.shirtLight+'48',null);
  shape(()=>{ctx.moveTo(-1,10);ctx.lineTo(4,8);ctx.lineTo(8,10);ctx.lineTo(3,10.2);ctx.closePath();},c.shirtDark+'65',null);
  // Sleeve seams and dark neck opening give the jersey real construction.
  line(2,-12,6,-11.4,c.shirtDark+'75',.55);line(2,12,6,11.4,c.shirtDark+'80',.6);
  shape(()=>{ctx.moveTo(8.2,-5);ctx.quadraticCurveTo(5.5,0,8.2,5);ctx.lineTo(10,4.2);ctx.quadraticCurveTo(8,0,10,-4.2);ctx.closePath();},'#142a40',null);
  line(-8.7,-5.3,-8.7,5.3,c.shirtLight+'90',.65);
  if(kit)shoulders(ctx,kit,tier);
  else if(a.look===8)polygon(ctx,[-7,-11,-4,-12,5,9,2,11],a.hairAccent);
  // Small jersey number, oriented towards the facing direction.
  ctx.save();ctx.translate(-2,0);ctx.rotate(Math.PI/2);ctx.fillStyle='#10273bcc';ctx.font='italic 900 5.5px sans-serif';ctx.textAlign='center';ctx.fillText(String(a.rank||1).padStart(2,'0'),0,1);ctx.restore();
  ctx.restore();
  segment(farShoulder,{x:farShoulder.x+(farElbow.x-farShoulder.x)*.35,y:farShoulder.y+(farElbow.y-farShoulder.y)*.35},4.4,4,c.shirtLight,c.shirt,c.shirtDark);
  ellipse(free.x,free.y,2.9,2.4,grad(free.x,free.y-2,free.x,free.y+2,c.skinLight,c.skin,c.skinDark));
  // Near elbow solves against the unchanged physical grip target.
  const shoulder={x:5,y:11*build},dx=hand.x-5,dy=hand.y-shoulder.y,d=Math.max(1,Math.hypot(dx,dy));
  const bend=Math.sqrt(Math.max(0,12*12-Math.min(d/2,12)**2));
  const elbow={x:(5+hand.x)/2-dy/d*bend,y:(shoulder.y+hand.y)/2+dx/d*bend};
  limb(shoulder,elbow,4.5,3.1);limb(elbow,hand,3.4,2.2);
  ellipse(elbow.x-.3,elbow.y-.6,2.1,1.5,c.skinLight+'45');
  segment(shoulder,{x:5+(elbow.x-5)*.35,y:shoulder.y+(elbow.y-shoulder.y)*.35},4.6,4.2,c.shirtLight,c.shirt,c.shirtDark);
  const wrist={x:hand.x+(elbow.x-hand.x)*.24,y:hand.y+(elbow.y-hand.y)*.24};
  segment(wrist,{x:hand.x+(elbow.x-hand.x)*.09,y:hand.y+(elbow.y-hand.y)*.09},2.8,2.6,'#fff','#e5efed','#9caeba');
  ctx.save();ctx.translate(hand.x,hand.y);ctx.rotate(pose.angle-angle);
  shape(()=>{ctx.moveTo(-2.2,-2.2);ctx.quadraticCurveTo(.5,-3.3,2.2,-1.5);ctx.lineTo(2.6,1.2);ctx.quadraticCurveTo(1.6,3.2,-.6,2.5);ctx.lineTo(-2.2,1.4);ctx.closePath();},grad(-1,-3,1,3,c.skinLight,c.skin,c.skinDark));
  line(.5,.4,2,.3,c.skinDark+'b0',.4);line(.4,1.3,1.8,1.3,c.skinDark+'b0',.4);
  ellipse(-1.2,-1.3,1.7,1,c.skinLight);ctx.restore();
  // Crown from overhead, not a front-facing portrait pasted onto the court.
  const headX=10+bounce;
  ellipse(headX-2,1.5,7.3,6.5,'#071b3260');
  ellipse(headX-3,0,4.4,4.2,c.skinDark);
  ellipse(headX,-5.6,1.4,1.9,c.skin);ellipse(headX,5.6,1.4,1.9,c.skin);
  ellipse(headX+.6,0,6.6,6.1,grad(headX-3,-5,headX+4,6,c.skinLight,c.skin,c.skinDark));
  if(a.look===7){
   // Short white hair around a bare crown and receding hairline.
   ellipse(headX-3,0,5.2,6.1,c.hair);
   ellipse(headX-.4,0,5.5,4.5,grad(headX-4,-4,headX+4,4,c.skinLight,c.skin,c.skinDark));
   for(const side of [-1,1])line(headX-5,side*3.5,headX,side*5,c.hairLight,1);
  }else if(a.look===4){
   ellipse(headX-1,-1.5,4.3,3.3,c.skinLight+'35');
   ellipse(headX-2,-2.3,2.8,1.7,c.skinLight+'35');
   line(headX+5.5,-2,headX+6,2,c.skinDark,.65);
  }else if(a.look===5){
   ellipse(headX-2,0,8.1,7.8,c.hairDark);
   for(let i=0;i<11;i++){const t=i*Math.PI*2/11;ellipse(headX-2+Math.cos(t)*6,Math.sin(t)*5.7,2.8,2.7,grad(headX-6,-7,headX+5,8,c.hairLight,c.hair,c.hairDark));}
   ellipse(headX-3,-2,4.5,4,c.hairLight+'25');
   for(let i=0;i<6;i++){const x=headX-5+(i%3)*3,y=-3+Math.floor(i/3)*4;line(x,y,x+1.2,y-.7,c.hairLight+'65',.65);}
  }else if(a.look===6){
   // Loose shoulder-length waves, with a lilac streak visible from above.
   const sway=step*walk*1.2;
   for(const side of [-1,1]){
    ellipse(headX-5+sway,side*4.8,6,3.5,grad(headX-10,-7,headX+3,7,c.hairLight,c.hair,c.hairDark));
   }
   ellipse(headX-2,0,6.4,6.5,grad(headX-5,-5,headX+5,6,c.hairLight,c.hair,c.hairDark));
   line(headX-7,-4,headX+1,-5,a.hairAccent||'#b990ee',1.6);
  }else if(a.look===8){
   const sway=step*walk*2.6;
   for(let i=4;i>=0;i--)ellipse(headX-7-i*2,sway*i/4+(i%2?.7:-.7),3-i*.28,2.5-i*.25,i%2?c.hair:c.hairDark);
   ellipse(headX-2,0,6.2,6.3,grad(headX-6,-5,headX+5,6,c.hairLight,c.hair,c.hairDark));
   line(headX-7,-2,headX-7,2,a.hairAccent,1.8);
  }else if(a.look===2){
   const sway=step*walk*2;
   shape(()=>{ctx.moveTo(headX-5,-2);ctx.bezierCurveTo(-6,-7+sway,-11,2+sway,-5,4+sway);ctx.quadraticCurveTo(2,7+sway,headX-5,2);ctx.closePath();},grad(-7,-4,-4,5,c.hairLight,c.hair,c.hairDark));
   ellipse(headX-2,0,6.2,6.3,grad(headX-5,-5,headX+5,6,c.hairLight,c.hair,c.hairDark));
   line(headX-7,-2,headX-7,2,c.shirtLight,1.8);
   line(headX-5,-2,headX+1,-4,c.hairLight,1);line(headX-4,1,headX+3,-1,c.hairLight+'70',.65);
  }else if(a.look===1){
   const cap=a.capColor||c.shirt,capDark=a.capColor?mix(cap,'#071c36',.58):c.shirtDark,capLight=a.capColor?mix(cap,'#e0f5ff',.34):c.shirtLight;
   ellipse(headX+6,0,3.7,5.3,capDark);
   ellipse(headX+5.5,-.5,3.3,5,cap);
   ellipse(headX-1,0,6.6,6.2,grad(headX-3,-5,headX+3,6,capLight,cap,capDark));
   line(headX-5,-1,headX+3,-1,c.shirtLight,.65);ellipse(headX-1,-.5,.8,.8,c.shirtLight);
  }else{
   shape(()=>{ctx.moveTo(headX+4,-4);ctx.bezierCurveTo(headX-1,-9,headX-9,-6,headX-8,0);ctx.quadraticCurveTo(headX-7,7,headX+4,5);ctx.lineTo(headX+5,2);ctx.quadraticCurveTo(headX,1,headX+4,-4);},grad(headX-5,-5,headX+3,6,c.hairLight,c.hair,c.hairDark));
   line(headX-5,-2,headX+1,-3,c.hairLight,1);line(headX-5,.5,headX+1,-.5,c.hairLight+'80',.75);
   if(a.look===3)line(headX+2.5,-5,headX+2.5,5,'#f5f4e6',2);
  }
  if(a.beard){
   const beard=a.beardColor||c.hairDark;
   if(a.beard==='chinstrap'){
    line(headX+1,-5.4,headX+5.8,-3.5,beard,1.1);
    line(headX+1,5.4,headX+5.8,3.5,beard,1.1);
   }
   ellipse(headX+5.8,0,1.7,3.4,beard);
   ellipse(headX+6.2,0,.85,1.6,c.skin);
   line(headX+6.3,-1.5,headX+6.3,1.5,beard,.65);
  }
  if(a.glasses){line(headX+6,-4.7,headX+6,4.7,'#192936',1.2);ellipse(headX+6.3,-2.8,1.1,1.8,'#d4f6ff99');ellipse(headX+6.3,2.8,1.1,1.8,'#d4f6ff99');}
  if(kit&&(tier===3||tier===2&&kit.kind==='mech')){
   // Faultline, Solar Flare and Ultraviolet retain their distinctive human hair.
   if((a.id===4||a.id===14)&&tier===3){line(headX+3,-5,headX+5,-3,kit.accent,1.2);line(headX+3,5,headX+5,3,kit.accent,1.2);}
   else if(a.id===16&&tier===3){polygon(ctx,[headX+3,-5,headX+6,-4,headX+7,0,headX+6,4,headX+3,5],kit.primary,kit.edge);line(headX+5,-3,headX+5,3,kit.accent,1.25);}
   else crown(ctx,kit,headX);
  }
  ctx.restore();
  return {hand,throat,bodyAngle:angle};
 }
 return {draw,palette,strike};
})();
