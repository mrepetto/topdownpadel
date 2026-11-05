import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';
const req=(p,o={})=>worker.fetch(new Request('https://topdownpadel.com'+p,o),{});
let r=await req('/');assert.equal(r.status,200);let html=await r.text();assert.match(html,/OWN THE NET/);assert.match(html,/navigator.standalone/);
r=await req('/game?internal=1');assert.equal(r.status,308);assert.equal(r.headers.get('Location'),'https://topdownpadel.com/game/?internal=1');
r=await req('/game/');assert.equal(r.status,200);html=await r.text();assert.match(html,/<base href="\/">/);assert.match(html,/id="game"/);assert.match(html,/telemetry.js/);
for(const path of ['/desktop','/mobile','/generaladmin','/privacy','/support','/game.js','/website.js','/admin.js'])assert.equal((await req(path)).status,200,path);
r=await req('/manifest.webmanifest');assert.equal((await r.json()).start_url,'/game/');
r=await req('/gameplay.mp4',{headers:{Range:'bytes=0-99'}});assert.equal(r.status,206);assert.equal((await r.arrayBuffer()).byteLength,100);assert.match(r.headers.get('Content-Range'),/^bytes 0-99\//);
r=await req('/gameplay.mp4',{headers:{Range:'bytes=-50'}});assert.equal(r.status,206);assert.equal((await r.arrayBuffer()).byteLength,50);
r=await req('/gameplay.mp4',{headers:{Range:'bytes=999999999-'}});assert.equal(r.status,416);
assert.equal((await req('/api/admin/metrics')).status,503); // No environment is a closed failure.
console.log('Website routes, stable game assets, standalone launch, video byte ranges and closed admin checked');
