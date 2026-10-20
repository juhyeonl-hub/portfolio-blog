import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl,planner} from './modules.mjs';
const {PlanMemory,rememberCharacter}=await import(moduleUrl(readFileSync('lib/plan-memory.ts','utf8')));
const catalog=JSON.parse(readFileSync('lib/data/catalogs/assassin.json','utf8'));
const base=planner.emptyPlan(catalog);
const previous={...base,level:44,character:{profile:{characterName:'기억할 캐릭터'}},gear:{mode:'current',items:[{id:'a',name:'단도',slot:'주무기',owned:true,current:true,target:false,bonuses:{'13350000':2},note:''}]},pointBudget:{sp:123},searchPrefs:{region:'eu',server:'1001',name:'기억할 캐릭터'},macroExtra:true,checked:['이동기 분리']};
const entries=new Map([['plan',JSON.stringify(previous)]]);
const storage={getItem:k=>entries.get(k)||null,setItem:(k,v)=>entries.set(k,v)};
const create=()=>new PlanMemory('plan','assassin',base,()=>storage);
let memory=create();assert.deepEqual(memory.restore(),previous);assert.equal(memory.acceptRemote({...base,level:1}),false);assert.deepEqual(JSON.parse(entries.get('plan')),previous,'late or stale account response must not replace saved browser data');
memory.update({...memory.value,level:43});memory=create();assert.equal(memory.restore().level,43);assert.deepEqual(memory.value.gear,previous.gear);assert.deepEqual(memory.value.searchPrefs,previous.searchPrefs);assert.equal(memory.value.macroExtra,true);
entries.clear();memory=create();memory.restore();memory.update({...base,level:30});assert.equal(memory.acceptRemote(previous),false,'an edit before account loading completes wins');assert.equal(memory.value.level,30);
entries.clear();memory=create();memory.restore();assert.equal(memory.acceptRemote(previous),true);assert.deepEqual(create().restore(),previous);
entries.set('plan','broken');memory=create();memory.restore();assert.equal(memory.readFailed,true);assert.equal(memory.hasData,false);assert.equal(entries.get('plan'),'broken','do not overwrite unreadable data automatically');
const blocked=new PlanMemory('plan','assassin',base,()=>{throw Error('Storage blocked')});blocked.restore();blocked.update(previous);assert.equal(blocked.localSaved,false);assert.equal(blocked.value.level,44,'storage failure should not break editing');
entries.set('plan',JSON.stringify({...previous,classKey:'sorcerer'}));memory=create();memory.restore();assert.equal(memory.hasData,false,'never hydrate another class');
let recents=[];for(let i=0;i<12;i++)recents=rememberCharacter(recents,{characterId:String(i),serverId:'1',region:'eu',name:'캐릭터'+i,serverName:'서버'});assert.equal(recents.length,8);recents=rememberCharacter(recents,recents[4]);assert.equal(recents.length,8);assert.equal(recents[0].characterId,'7');
console.log('Persistence: offline restoration, stale responses, immediate writes, remote fallback, blocked/corrupt storage, class isolation and recent history passed.');

for(const invalid of [{...base,mode:'arena'},{...base,gear:{mode:'current',items:[{}]}},{...base,specs:{x:7}},{...base,base:{x:'bad'}},{...base,checked:undefined}]){entries.set('plan',JSON.stringify(invalid));memory=create();memory.restore();assert.equal(memory.readFailed,true);assert.equal(memory.hasData,false)}
console.log('Malformed imported/stored plans rejected without overwriting stored bytes');

for(const character of [{profile:{},skills:{}},{profile:{},nodes:123}]){entries.set('plan',JSON.stringify({...base,character}));memory=create();memory.restore();assert.equal(memory.readFailed,true)}
console.log('Malformed public character skills/nodes cannot poison saved plans');

for(const invalid of ['true',1,null,{},[]]){entries.set('plan',JSON.stringify({...base,ascensionGrade3Confirmed:invalid}));memory=create();memory.restore();assert.equal(memory.readFailed,true)}
for(const confirmed of [false,true]){entries.set('plan',JSON.stringify({...previous,ascensionGrade3Confirmed:confirmed}));memory=create();assert.equal(memory.restore().ascensionGrade3Confirmed,confirmed)}
console.log('Ascension confirmation: optional legacy field, strict boolean validation and persistence PASS');
