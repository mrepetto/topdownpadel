import fs from 'node:fs';
import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';
const files=fs.readdirSync('web').filter(f=>/^(athlete-v[23]-|portrait-thumb-).*\.webp$/.test(f));
assert.equal(files.length,52,'All 18 athletes need portrait sources and light thumbnails');
let total=0;
for(const file of files){
 const bytes=fs.readFileSync('web/'+file);total+=bytes.length;
 assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
 const url='https://padel.test/'+file;
 const result=await worker.fetch(new Request(url),{});
 assert.equal(result.status,200);assert.equal(result.headers.get('Content-Type'),'image/webp');
 assert.deepEqual(Buffer.from(await result.arrayBuffer()),bytes,'Binary asset was corrupted');
 const head=await worker.fetch(new Request(url,{method:'HEAD'}),{});assert.equal(head.status,200);assert.equal((await head.arrayBuffer()).byteLength,0);
 const cached=await worker.fetch(new Request(url,{headers:{'If-None-Match':result.headers.get('ETag')}}),{});assert.equal(cached.status,304);
}
assert(total<5_000_000,'All portrait generations and thumbnails must stay under 5 MB');
const thumbs=files.filter(f=>f.startsWith('portrait-thumb-'));assert.equal(thumbs.length,18);assert(thumbs.reduce((n,f)=>n+fs.statSync('web/'+f).size,0)<300_000,'Collection thumbnails must load in under 300 KB');
assert.equal((await worker.fetch(new Request('https://padel.test/missing.webp'),{})).status,404);
console.log(`PASS 52 WebP art assets, exact binary delivery, MIME types, HEAD/cache/404 behavior; ${(total/1024).toFixed(0)} KB total`);
