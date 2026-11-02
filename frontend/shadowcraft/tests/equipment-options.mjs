import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const moduleOf=async source=>import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const {EquipmentOptions,equipmentKey}=await moduleOf(readFileSync('lib/equipment-options.ts','utf8'));
const client=await moduleOf(readFileSync('lib/armory-client.ts','utf8'));
const owner={id:'character',server:'1',region:'eu'};
const tasks=Array.from({length:6},(_,n)=>{const item={id:100+n,slotPos:n+1,enchantLevel:10};return {key:equipmentKey(owner,item),identity:owner,item};});
const tick=()=>new Promise(r=>setImmediate(r));
const pending=[];let calls=0,active=0,max=0,version=1;
const fetcher=(task,signal)=>new Promise((resolve,reject)=>{calls++;active++;max=Math.max(max,active);pending.push(()=>{active--;resolve({id:task.item.id,value:version});});signal.addEventListener('abort',()=>{active--;reject(new DOMException('Aborted','AbortError'));},{once:true});});
const store=new EquipmentOptions([...tasks,tasks[0]],fetcher);
store.prioritize([tasks[4].key,tasks[0].key]);store.start();store.start();await tick();
assert.equal(calls,2);assert.equal(store.entries.get(tasks[4].key).status,'loading');assert.equal(store.entries.size,6);
while(pending.length){pending.splice(0).forEach(resolve=>resolve());await tick();}
assert.equal(calls,6);assert.equal(max,2);assert([...store.entries.values()].every(e=>e.status==='ready'));
for(let n=0;n<50;n++){store.prioritize([tasks[n%6].key]);assert.equal(store.entries.get(tasks[n%6].key).status,'ready');}
await tick();assert.equal(calls,6,'hover and revisit do not fetch');
store.retry(tasks[0].key);await tick();assert.equal(calls,6,'successful entries are not retried');
version=2;const refreshed=new EquipmentOptions(tasks,fetcher);refreshed.start();await tick();
while(pending.length){pending.splice(0).forEach(resolve=>resolve());await tick();}
assert.equal(calls,12);assert.equal(refreshed.entries.get(tasks[0].key).detail.value,2,'same item/enchant refreshes changed options');
const aborted=new EquipmentOptions(tasks,fetcher);aborted.start();await tick();const atAbort=calls;aborted.dispose();pending.splice(0).forEach(resolve=>resolve());await tick();
assert.equal(calls,atAbort);assert(![...aborted.entries.values()].some(e=>e.status==='ready'),'late results cannot populate disposed comparison');
let failures=0;const retry=new EquipmentOptions([tasks[0]],async()=>{if(++failures===1)throw Error('offline');return {value:3};});retry.start();await tick();
assert.equal(retry.entries.get(tasks[0].key).status,'error');retry.prioritize([tasks[0].key]);await tick();assert.equal(failures,1);retry.retry(tasks[0].key);await tick();assert.equal(failures,2);assert.equal(retry.entries.get(tasks[0].key).status,'ready');
let busyCalls=0;const busy=new EquipmentOptions(tasks,async()=>{busyCalls++;throw Object.assign(Error('busy'),{status:429});});busy.start();await tick();await tick();assert.equal(busyCalls,2);assert([...busy.entries.values()].every(e=>e.status==='error'));
let never=0;globalThis.fetch=async()=>{never++;return Response.json({});};const cancel=new AbortController();cancel.abort();await assert.rejects(client.queryArmory({},cancel.signal),{name:'AbortError'});assert.equal(never,0);
globalThis.fetch=async()=>Response.json({error:'busy'},{status:429});await assert.rejects(client.queryArmory({}),e=>e.status===429);
assert.notEqual(equipmentKey({...owner,id:'other'},tasks[0].item),tasks[0].key);assert.notEqual(equipmentKey(owner,{...tasks[0].item,slotPos:99}),tasks[0].key);
console.log('PASS: bounded prefetch, dedupe, hover/revisit reuse, new-snapshot freshness, cancellation, per-item retry, rate-limit stop, identity separation');

// Point queues preserve successes, group simultaneous429s and honor the server cooldown.
const {mock}=await import('node:test');mock.timers.enable({apis:['setTimeout','Date'],now:1000});
const counts=new Map();let blocked=true;
const resumable=new EquipmentOptions(tasks,async task=>{counts.set(task.key,(counts.get(task.key)||0)+1);if(blocked&&task.key!==tasks[0].key)throw Object.assign(Error('busy'),{status:429,retryAfterMs:60000});return {value:7};},2);
const flush=async()=>{for(let i=0;i<12;i++)await tick();};
resumable.start();await flush();assert.equal(resumable.entries.get(tasks[0].key).status,'ready');assert.equal(resumable.retryAt,61000);assert(![...resumable.entries.values()].some(e=>e.status==='error'));const callsBefore=[...counts.values()].reduce((a,b)=>a+b,0);
mock.timers.tick(59999);await flush();assert.equal([...counts.values()].reduce((a,b)=>a+b,0),callsBefore);
blocked=false;mock.timers.tick(1);await flush();assert([...resumable.entries.values()].every(e=>e.status==='ready'));assert.equal(counts.get(tasks[0].key),1);assert.equal(resumable.retryAt,null);
let stopCalls=0;const stop=new EquipmentOptions(tasks,async()=>{stopCalls++;throw Object.assign(Error('busy'),{status:429,retryAfterMs:60000});},2);stop.start();await flush();stop.dispose();mock.timers.tick(60000);await flush();assert.equal(stopCalls,2);assert.equal(stop.retryAt,null);
const huge=new EquipmentOptions(tasks,async()=>{throw Object.assign(Error('busy'),{status:429,retryAfterMs:2147483648});},2);huge.start();await flush();assert.equal(huge.retryAt,null);assert([...huge.entries.values()].every(e=>e.status==='error'));
globalThis.fetch=async()=>new Response('busy',{status:429,headers:{'Content-Type':'text/html','Retry-After':'90'}});await assert.rejects(client.queryArmory({}),e=>e.status===429&&e.retryAfterMs===90000);
globalThis.fetch=async()=>Response.json({error:'busy'},{status:429,headers:{'Retry-After':new Date(Date.now()+120000).toUTCString()}});await assert.rejects(client.queryArmory({}),e=>e.status===429&&e.retryAfterMs===120000);
mock.timers.reset();console.log('PASS rate-limit cooldown: preserved successes, deferred pending requests, exact deadline, cancellation, overflow guard, JSON/HTML Retry-After');
