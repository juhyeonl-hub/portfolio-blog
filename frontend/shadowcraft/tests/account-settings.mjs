import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl,planner} from './modules.mjs';
let source=readFileSync('lib/account-settings.ts','utf8');
for(const name of ['plan-memory','event-timers','home-favorites'])source=source.replace(`'./${name}'`,JSON.stringify(moduleUrl(readFileSync(`lib/${name}.ts`,'utf8'))));
const {AccountSettingsStore,SettingsSync,projectSetting,validateDocument,SAVE_DELAY_MS,activateSettingsStore,settingsStorage}=await import(moduleUrl(source));
class Storage {
 data=new Map(); fail=false;
 get length(){return this.data.size;}
 key(i){return [...this.data.keys()][i]??null;}
 getItem(k){return this.data.get(k)??null;}
 setItem(k,v){if(this.fail)throw Error('Quota');this.data.set(k,String(v));}
 removeItem(k){this.data.delete(k);}
}
const port=new Storage();globalThis.localStorage=port;
let now=0,id=0;const timers=new Map();
const originalSet=globalThis.setTimeout,originalClear=globalThis.clearTimeout;
globalThis.setTimeout=(fn,delay)=>{const key=++id;timers.set(key,{at:now+delay,fn});return key;};
globalThis.clearTimeout=key=>timers.delete(key);
async function tick(ms){now+=ms;for(const [key,t]of [...timers])if(t.at<=now){timers.delete(key);t.fn();}for(let i=0;i<10;i++)await Promise.resolve();}
const doc=(revision,entries)=>({version:1,revision,entries});
try{
 // The storage adapter preserves anonymous keys and isolates signed-in members.
 port.setItem('asbc-locale','ko');port.setItem('a2bc-home-favorites-v1:alice','["map"]');
 const guest=new AccountSettingsStore(()=>port,null);activateSettingsStore(guest);settingsStorage.setItem('asbc-locale','ja');
 assert.equal(port.getItem('asbc-locale'),'ja');
 const alice=new AccountSettingsStore(()=>port,'alice');activateSettingsStore(alice);
 let remote=doc(4,{'asbc-locale':'en',favorites:'["quick"]'}),puts=[],applied=0,status='';
 const request=async(method,input)=>{if(method==='GET')return remote;puts.push(input);assert.equal(input.revision,remote.revision);remote=doc(remote.revision+1,input.entries);return remote;};
 const sync=new SettingsSync(alice,request,()=>applied++,s=>status=s);
 await sync.start();assert.equal(settingsStorage.getItem('asbc-locale'),'en');assert.equal(alice.getItem('a2bc-home-favorites-v1:alice'),'["quick"]');assert.equal(applied,1);
 assert.equal(port.getItem('asbc-locale'),'ja');assert.ok(port.getItem(alice.cacheKey+':backup'));
 assert.equal(puts.length,0); // server wins first login, no gratuitous upload
 settingsStorage.setItem('asbc-locale','fi');await tick(400);settingsStorage.setItem('asbc-locale','ko');await tick(799);assert.equal(puts.length,0);
 await tick(1);assert.equal(puts.length,1);assert.equal(puts[0].entries['asbc-locale'],'ko');assert.deepEqual(alice.dirty(),[]);
 sync.stop();
 const bob=new AccountSettingsStore(()=>port,'bob');assert.equal(bob.getItem('asbc-locale'),'ja');assert.equal(bob.getItem('a2bc-home-favorites-v1:bob'),null);
 // No server record -> upload the local snapshot, after the debounce.
 let seeded;const seed=new SettingsSync(bob,async(method,value)=>method==='GET'?doc(0,{}):(seeded=value,doc(1,value.entries)),()=>{},()=>{});
 await seed.start();await tick(SAVE_DELAY_MS);assert.equal(seeded.entries['asbc-locale'],'ja');seed.stop();
 // Offline edits survive reload and retry, and unrelated server fields are kept.
 const offline=new AccountSettingsStore(()=>port,'alice');let fail=true;remote=doc(8,{'asbc-locale':'fi',favorites:'["database"]'});
 const offlineSync=new SettingsSync(offline,async(method,value)=>{if(fail)throw Error('offline');return request(method,value);},()=>{},s=>status=s);
 await offlineSync.start();offline.setItem('asbc-locale','en');await tick(SAVE_DELAY_MS);assert.equal(status,'offline');offlineSync.stop();
 const restored=new AccountSettingsStore(()=>port,'alice');assert.equal(restored.getItem('asbc-locale'),'en');assert.deepEqual(restored.dirty(),['asbc-locale']);
 fail=false;const resumed=new SettingsSync(restored,request,()=>{},()=>{});await resumed.start();assert.equal(restored.getItem('asbc-locale'),'en');assert.equal(restored.getItem('a2bc-home-favorites-v1:alice'),'["database"]');await tick(SAVE_DELAY_MS);assert.equal(remote.entries['asbc-locale'],'en');resumed.stop();
 // A response arriving after logout cannot apply or save to the next account.
 let release;let lateApplied=0;const late=new SettingsSync(restored,()=>new Promise(resolve=>release=resolve),()=>lateApplied++,()=>{});
 const pending=late.start();late.stop();activateSettingsStore(bob);release(doc(99,{'asbc-locale':'ko'}));await pending;assert.equal(lateApplied,0);assert.equal(settingsStorage.getItem('asbc-locale'),'ja');
 // Edits made while PUT is in flight stay dirty and are saved in a second PUT.
 let finish;remote=doc(10,{'asbc-locale':'en'});const during=new AccountSettingsStore(()=>port,'during');let writes=0;
 const flight=new SettingsSync(during,async(method,input)=>{if(method==='GET')return remote;writes++;if(writes===1)return new Promise(resolve=>finish=()=>resolve(doc(11,input.entries)));return doc(12,input.entries);},()=>{},()=>{});
 await flight.start();during.setItem('asbc-locale','fi');await tick(SAVE_DELAY_MS);during.setItem('asbc-locale','ja');finish();await tick(0);assert.deepEqual(during.dirty(),['asbc-locale']);await tick(SAVE_DELAY_MS);assert.equal(writes,2);assert.deepEqual(during.dirty(),[]);flight.stop();
 // Backup/quota failure preserves old local values and does not upload a partial snapshot.
 const quota=new AccountSettingsStore(()=>port,'quota');port.fail=true;
 assert.throws(()=>quota.apply({'asbc-locale':'en'}));assert.equal(quota.getItem('asbc-locale'),'ja');assert.throws(()=>quota.setItem('asbc-locale','fi'));assert.equal(quota.getItem('asbc-locale'),'ja');port.fail=false;
 // Sensitive fields are projected out while confirmed remaining points are retained.
 const plan={classKey:'templar',level:39,mode:'safe',base:{},bonus:{},specs:{},nodes:[],checked:[],character:{profile:{name:'private'}},searchPrefs:{region:'eu',server:'1001',name:'private'},recentCharacters:[],confirmedRemaining:{sp:17},gear:{mode:'current',items:[{id:'private-id',slot:'weapon',name:'private-name',note:'secret',owned:true,current:true,target:false,bonuses:{'100':2}}]}};
 const projected=projectSetting('shadowcraft-plan-v1:templar',JSON.stringify(plan));assert.ok(!projected.includes('private'));assert.ok(!projected.includes('secret'));assert.deepEqual(JSON.parse(projected).confirmedRemaining,{sp:17});
 // Confirmed balances remain visible in storage without uploading a character response, and
 // reconnect only to the original public character identity AND level on another device.
 const bound={...plan,character:{region:'eu',profile:{characterId:'char-1',serverId:1001,characterLevel:39,characterName:'private-name'}},pointBudget:{sp:120,stigma:20,crystal:100,battle:0}};
 const synced=JSON.parse(projectSetting('shadowcraft-plan-v1:templar',JSON.stringify(bound)));
 assert.equal(synced.character,null);assert.deepEqual(synced.confirmedRemainingContext,{region:'eu',serverId:'1001',characterId:'char-1',level:39});
 const catalog=JSON.parse(readFileSync('lib/data/catalogs/templar.json','utf8'));
 const reconnected=planner.updatePlan(catalog,synced,{character:bound.character});
 assert.deepEqual(reconnected.confirmedRemaining,{sp:17});assert.deepEqual(reconnected.pointBudget,bound.pointBudget);
 assert.equal(planner.updatePlan(catalog,synced,{character:{...bound.character,profile:{...bound.character.profile,characterId:'char-2'}}}).confirmedRemaining,undefined);
 assert.equal(planner.updatePlan(catalog,synced,{character:{...bound.character,profile:{...bound.character.profile,characterLevel:40}}}).confirmedRemaining,undefined);
 // Old GET responses must not replace a newer revision acknowledged by another tab.
 assert.throws(()=>restored.apply({'asbc-locale':'ko'},1),/Stale/);
 // Unknown server schema leaves local values untouched and does not upload.
 let futurePuts=0;const future=new SettingsSync(restored,async method=>{if(method==='PUT')futurePuts++;return {version:2,revision:20,entries:{}};},()=>assert.fail('unsupported schema applied'),s=>status=s);
 const previous=restored.getItem('asbc-locale');await future.start();await tick(SAVE_DELAY_MS);assert.equal(status,'offline');assert.equal(restored.getItem('asbc-locale'),previous);assert.equal(futurePuts,0);future.stop();
 for(const invalid of [doc(0,{token:'secret'}),{version:2,revision:0,entries:{}},doc(-1,{}),doc(0,{'asbc-locale':'xx'}),doc(0,{favorites:'["unknown"]'}),doc(0,{['a2bc-map-progress-v1:'+'a'.repeat(64)]:'{}'})])assert.throws(()=>validateDocument(invalid));
 assert.throws(()=>validateDocument(doc(0,{favorites:' '.repeat(1_000_001)})));
 console.log('PASS account settings: load/apply, debounce, first-login rules, offline reload/retry, account isolation, logout race, in-flight edits, quota, schema, size and privacy projection');
}finally{activateSettingsStore(null);globalThis.setTimeout=originalSet;globalThis.clearTimeout=originalClear;}
