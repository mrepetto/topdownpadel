'use strict';
let padButtons=[],padConnected=false,padNavAt=0,hadPointerLock=false,requestedUnlock=false;
const playControls=()=>!globalThis.Practice?.demonstrating&&['play','serve','point','fault','let'].includes(state)&&!network?.menu&&!document.querySelector('dialog[open]');
// Touch browsers can expose Pointer Lock without a usable mouse. Never capture touch play.
let lastPointerType=null;
document.addEventListener('pointerdown',event=>{
 lastPointerType=event.pointerType;
 if(event.pointerType==='touch'&&document.pointerLockElement===canvas){requestedUnlock=true;document.exitPointerLock?.();}
},true);
const mouseCaptureAllowed=()=>lastPointerType==='mouse'||(lastPointerType!=='touch'&&!(globalThis.navigator?.maxTouchPoints>0)&&globalThis.matchMedia?.('(pointer: fine) and (hover: hover)')?.matches!==false);
function deadzone(v){return Math.abs(v)<.18?0:Math.sign(v)*(Math.abs(v)-.18)/.82;}
globalThis.captureMouse=()=>{if(!mouseCaptureAllowed()||!playControls()||padConnected||!canvas.requestPointerLock||document.pointerLockElement===canvas)return;requestedUnlock=false;try{const promise=canvas.requestPointerLock();promise?.catch(()=>message('CLICK COURT TO CAPTURE MOUSE'));}catch{message('CLICK COURT TO CAPTURE MOUSE');}};
globalThis.syncPointerLock=()=>{if(document.pointerLockElement===canvas&&!playControls()){requestedUnlock=true;document.exitPointerLock?.();}};
document.addEventListener('pointerlockchange',()=>{const locked=document.pointerLockElement===canvas;if(locked){hadPointerLock=true;requestedUnlock=false;const p=players[localSlot()],r=canvas.getBoundingClientRect();if(!charge?.gesture){const v=viewPoint(p.x+Math.cos(p.angle)*130,p.y+Math.sin(p.angle)*130);mouse={x:r.left+ox+v.x*scale,y:r.top+oy+v.y*scale};}}else if(hadPointerLock){hadPointerLock=false;cancelShot();if(!requestedUnlock&&mouseCaptureAllowed()&&['play','serve','point','fault','let'].includes(state)&&!network?.menu)togglePause();requestedUnlock=false;}});
// Pointer capture needs a browser-approved click; resume is such a gesture.
$('#resume').addEventListener('click',()=>globalThis.captureMouse());
function menuBack(){if(globalThis.Practice?.demonstrating&&!Practice.isMenu()){Practice.menu();return;}if(globalThis.Practice?.isMenu()){Practice.back();return;}if(state==='intro'&&globalThis.progressionBack?.())return;const dialog=document.querySelector('dialog[open]');if(dialog){dialog.close();return;}if(state==='paused'||network?.menu){togglePause();return;}if(state==='intro'){if(menuStep==='difficulty')showMenuStep('characters');else if(menuStep==='characters'||menuStep==='gallery')showMenuStep('home');}}
function menuControls(pad,pressed,t){
 const scope=globalThis.Practice?.demonstrating&&!Practice.isMenu()?document.querySelector('#practice-hud'):globalThis.Practice?.isMenu()?document.querySelector('#practice-screen'):document.querySelector('dialog[open]')||(!$('#paused').classList.contains('hidden')?$('#paused'):$('#intro'));
 const buttons=[...scope.querySelectorAll('button,input,select')].filter(e=>!e.disabled&&e.getClientRects().length&&!e.closest('.hidden'));
 if(!buttons.length)return;let index=buttons.indexOf(document.activeElement);
 const axis=pad.axes||[],dir=pressed(13)||pressed(15)||((axis[1]>.55||axis[0]>.55)&&t>padNavAt)?1:pressed(12)||pressed(14)||((axis[1]<-.55||axis[0]<-.55)&&t>padNavAt)?-1:0;
 if(dir){index=(index+dir+buttons.length)%buttons.length;buttons[index].focus();padNavAt=t+220;}
 if(pressed(0)){const el=index>=0?buttons[index]:buttons[0];el.focus();if(el.tagName==='BUTTON')el.click();}
 if(pressed(1)||pressed(9))menuBack();
}
globalThis.pollController=t=>{
 const pad=Array.from(navigator.getGamepads?.()||[]).find(p=>p?.connected);if(!pad){if(padConnected){joy={x:0,y:0};keys.ShiftRight=false;globalThis.controlAim=null;if(charge?.source?.startsWith('Pad'))cancelShot();}padConnected=false;padButtons=[];return;}
 padConnected=true;const current=pad.buttons.map(b=>b.pressed),pressed=i=>current[i]&&!padButtons[i],released=i=>!current[i]&&padButtons[i];
 if(playControls()){
  if(pressed(9)){togglePause();joy={x:0,y:0};keys.ShiftRight=false;}
  else {joy=courtVector(deadzone(pad.axes[0]||0),deadzone(pad.axes[1]||0));const x=deadzone(pad.axes[2]||0),y=deadzone(pad.axes[3]||0),n=Math.hypot(x,y);if(n>.1)globalThis.controlAim=courtVector(x/n,y/n);else if(!globalThis.controlAim){const p=players[localSlot()];if(p)globalThis.controlAim={x:Math.cos(p.angle),y:Math.sin(p.angle)};}keys.ShiftRight=!!(current[4]||current[5]||current[10]);if(pressed(0))beginCharge('PadA',false);if(pressed(1))beginCharge('PadB',true);if(released(0))releaseCharge('PadA');if(released(1))releaseCharge('PadB');}
 }else{joy={x:0,y:0};keys.ShiftRight=false;menuControls(pad,pressed,t);}
 padButtons=current;
};
