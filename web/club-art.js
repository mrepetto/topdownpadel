/* Presentation only: all clubs retain the same 1000 x 500 physics bounds. */
(()=>{
 let hudKey='';
 // Turf tint only. Original glass, net, markings and framing are shared.
 const blue=Object.freeze(['#1478c4','#096ab4','#075797']);
 const palettes=[['#278b69','#197955','#106347'],blue,['#7662ad','#645197','#51417c'],['#b96e49','#a25b38','#884a2e'],['#66727c','#525e68','#414b55'],['#985166','#833e53','#6c3044']].map(Object.freeze);
 globalThis.ClubArt={
  palette(venue){return Number.isInteger(venue?.id)&&palettes[venue.id]||blue;},
  updateHUD(venue,lang){
   const key=venue?`${venue.id}:${lang}`:'';if(key===hudKey)return;hudKey=key;
   const el=document.getElementById('club-hud');if(!el)return;
   el.hidden=!venue;document.body.classList.toggle('club-match',!!venue);
   if(venue){const img=el.querySelector('img');img.src=`club-badge-${venue.id}.webp`;img.alt=lang==='es'?venue.es:venue.en;el.querySelector('span').textContent=img.alt;}
  }
 };
})();
