const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const img={},label={},hud={hidden:true,querySelector:s=>s==='img'?img:label};
const box={document:{getElementById:()=>hud,body:{classList:{toggle(){}}}}};vm.createContext(box);vm.runInContext(fs.readFileSync('web/club-art.js','utf8'),box);
const palettes=new Set();
for(let id=0;id<6;id++){const venue={id,en:'Club '+id,es:'Club ES '+id},p=box.ClubArt.palette(venue);assert.equal(p.length,3);p.forEach(c=>assert(/^#[0-9a-f]{6}$/.test(c)));palettes.add(p.join(','));box.ClubArt.updateHUD(venue,'es');assert.equal(img.src,`club-badge-${id}.webp`);assert.equal(img.alt,venue.es);assert.equal(hud.hidden,false);assert(fs.statSync(`web/club-badge-${id}.webp`).size>1000);}
assert.equal(palettes.size,6);assert.equal(box.ClubArt.palette(null).join(','),'#1478c4,#096ab4,#075797');assert.equal(box.ClubArt.palette({id:99}),box.ClubArt.palette(null));box.ClubArt.updateHUD(null,'en');assert.equal(hud.hidden,true);
console.log('PASS six turf palettes, original blue default, badge mappings and localized HUD reset');
