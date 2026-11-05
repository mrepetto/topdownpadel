import {DatabaseSync} from 'node:sqlite';import fs from 'node:fs';import assert from 'node:assert/strict';import {adapter} from '../scripts/sqlite-adapter.mjs';import worker from '../dist/server/index.js';
const sql=new DatabaseSync(':memory:');sql.exec(fs.readFileSync('drizzle/0000_multiplayer.sql','utf8'));const base=adapter(sql);let trips=0;
const DB={prepare(text){const stmt=base.prepare(text);const wrapper={bind(...args){stmt.bind(...args);return wrapper;},first(){trips++;return stmt.first();},all(){trips++;return stmt.all();},run(){trips++;return stmt.run();},raw:stmt};return wrapper;},batch(stmts){trips++;return base.batch(stmts.map(s=>s.raw));}};
async function call(path,body={},token){const r=await worker.fetch(new Request('https://test/api/rooms/'+path,{method:'POST',headers:token?{Authorization:'Bearer '+token}:{},body:JSON.stringify(body)}),{DB});assert.equal(r.status,200);return r.json();}
const host=await call('create',{name:'H'}),guest=await call(host.code+'/join',{name:'G'});
trips=0;await call(host.code+'/sync',{snapshot:{seq:1,score:[0,0]}},host.token);assert.equal(trips,2);console.log('PASS host relay: 2 database round trips (previously 5)');
trips=0;const state=await call(host.code+'/sync',{input:{seq:1,x:1}},guest.token);assert.equal(trips,2);assert.equal(state.snapshot.seq,1);console.log('PASS guest relay: 2 database round trips (previously 5)');
const direct=await call(host.code+'/sync',{direct:true},guest.token);assert.equal(direct.snapshot,null);console.log('PASS direct clients skip redundant relay snapshot downloads');
