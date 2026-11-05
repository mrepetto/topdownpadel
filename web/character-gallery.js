'use strict';
// The club and pre-match challenge share one four-player comparison screen.
let galleryId=10;
function selectGalleryCharacter(id){galleryId=(id+roster.length)%roster.length;renderCharacterGallery();}
globalThis.renderCharacterGallery=function(){
 $('#gallery-screen').innerHTML=`<div class="gallery-heading"><div class="eyebrow">${tx('THE CLUB / YOUR FOUR','EL CLUB / TU EQUIPO')}</div><button id="gallery-language" class="text-button">${language==='es'?'ES / EN':'EN / ES'}</button></div>
 <div class="gallery-title-row"><h1 id="gallery-title">${tx('MEET YOUR MATCH.','CONOCE AL EQUIPO.')}</h1><p>${tx('Balanced attributes. Individual AI difficulty.','Atributos equilibrados. Dificultad individual de IA.')}</p></div>
 ${matchCards()}
 <div class="club-bottom"><p>${tx('Five steps. Four attributes. Small differences for humans; personality for AI.','Cinco segmentos. Cuatro atributos. Diferencias leves para humanos; personalidad para la IA.')}</p><div class="menu-navigation"><button id="gallery-back" class="nav-back">${tx('‹ BACK','‹ VOLVER')}</button><button id="gallery-play" class="primary">${tx('CHANGE LINEUP','CAMBIAR EQUIPO')}</button></div></div>`;
 bindMatchCardControls();
 $('#gallery-back').onclick=()=>{showMenuStep('home');$('#home-characters').focus();};
 $('#gallery-language').onclick=()=>setLanguage(language==='es'?'en':'es');
 $('#gallery-play').onclick=()=>{selectionMode='custom';beginMatchSetup('solo');};
};
$('#home-characters').onclick=()=>{showMenuStep('gallery');$('#gallery-back').focus();};
addEventListener('keydown',e=>{if(menuStep!=='gallery'||$('#intro').classList.contains('hidden')||document.querySelector('dialog[open]'))return;if(e.code==='Escape'){e.preventDefault();showMenuStep('home');$('#home-characters').focus();}});
