import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
const lib=await import(moduleUrl(readFileSync('lib/origin-transfer.ts','utf8')));
class MemoryStorage{constructor(o={}){this.m=new Map(Object.entries(o));}get length(){return this.m.size;}key(i){return [...this.m.keys()][i]??null;}getItem(k){return this.m.has(k)?this.m.get(k):null;}setItem(k,v){this.m.set(k,String(v));}removeItem(k){this.m.delete(k);}}
// Defaults: old origin is the blog; new origin empty until the domain is live (banner/import hidden).
assert.equal(lib.OLD_ORIGIN,'https://juhyeonl.dev');assert.equal(lib.NEW_ORIGIN,'');
// Only planner keys are collected; unrelated site keys (e.g. the blog admin token) never leave the old origin.
const old=new MemoryStorage({'shadowcraft-plan-v1':'{"a":1}','shadowcraft-plan-v1:templar':'{"b":2}','a2bc-build-library-v1:assassin':'[]','a2bc-map-progress-v1:x':'{}','asbc-locale':'en','token':'admin-jwt','other':'x'});
const entries=lib.collectEntries(old);
assert.deepEqual(Object.keys(entries).sort(),['a2bc-build-library-v1:assassin','a2bc-map-progress-v1:x','asbc-locale','shadowcraft-plan-v1','shadowcraft-plan-v1:templar']);
assert.deepEqual(lib.summarize(entries),{total:5,plans:2,library:1,maps:1});
// Validation rejects foreign keys, non-strings, arrays and oversize payloads.
assert.deepEqual(lib.validEntries(entries),entries);
for(const bad of [null,[],'x',{'token':'jwt'},{'shadowcraft-plan-v1':1},{['a2bc-'+'k'.repeat(600)]:'v'},{'a2bc-big':'x'.repeat(lib.MAX_TRANSFER_CHARS+1)}])assert.equal(lib.validEntries(bad),null,JSON.stringify(bad).slice(0,60));
const many={};for(let i=0;i<2001;i++)many['a2bc-k'+i]='v';assert.equal(lib.validEntries(many),null);
// Import keeps different existing data unless overwrite is chosen; identical values are not conflicts.
const fresh=new MemoryStorage({'shadowcraft-plan-v1':'{"new":true}','asbc-locale':'en'});
assert.deepEqual(lib.conflicts(fresh,entries),['shadowcraft-plan-v1']);
assert.deepEqual(lib.applyEntries(fresh,entries,false),{written:4,kept:1});assert.equal(fresh.getItem('shadowcraft-plan-v1'),'{"new":true}');
assert.deepEqual(lib.applyEntries(fresh,entries,true),{written:5,kept:0});assert.equal(fresh.getItem('shadowcraft-plan-v1'),'{"a":1}');
// Requests need the expected type and a well-formed nonce.
assert.ok(lib.isTransferRequest({type:'asbc-transfer-request',nonce:'A'.repeat(32)}));
for(const bad of [{type:'asbc-transfer-request',nonce:'short'},{type:'x',nonce:'A'.repeat(32)},{type:'asbc-transfer-request',nonce:'<script>'.repeat(4)},null])assert.equal(lib.isTransferRequest(bad),false);
console.log('Origin transfer: planner-only collection, validation limits, conflict-preserving import and request checks PASS');
