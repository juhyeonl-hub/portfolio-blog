import assert from 'node:assert/strict';
import {localModuleUrl} from './modules.mjs';
const {readPointGear,createPointGear,pointGearState}=await import(localModuleUrl('point-gear'));
const character={region:'eu',profile:{characterId:'fixture',serverId:2311},equipment:[1,2,3].map(slotPos=>({id:100+slotPos,slotPos,enchantLevel:5,name:'Item '+slotPos}))};
const response=(p,skills=[])=>({characterId:p.id,serverId:p.server,region:p.region,slotPos:+p.slot,item:{id:+p.itemId,enchantLevel:+p.enchant,subSkills:skills}});
const counts={};let recover=false,active=0,max=0;
const lookup=createPointGear(character,'templar',async(p)=>{
 counts[p.slot]=(counts[p.slot]||0)+1;active++;max=Math.max(max,active);await new Promise(r=>setImmediate(r));active--;
 if(p.slot==='2'&&!recover){const d=response(p);delete d.item.subSkills;d.item.subSkillCountMax=4;return d;}
 return response(p,[{id:12010000,level:1}]);
});
const settle=async l=>{for(let n=0;n<100&&pointGearState(l).loading;n++)await new Promise(r=>setImmediate(r));assert.equal(pointGearState(l).loading,false);};
lookup.store.start();await settle(lookup);
let state=pointGearState(lookup);assert.equal(max,2);assert.equal(state.bonus,null);assert.equal(state.completed,2);assert.equal(state.errors[0].name,'Item 2');assert.equal(state.errors[0].reason,'missing');
recover=true;lookup.store.retry(state.errors[0].key);await settle(lookup);state=pointGearState(lookup);assert.deepEqual(state.bonus,{'12010000':3});assert.deepEqual(counts,{'1':1,'2':2,'3':1});
const task=[...lookup.store.tasks.values()][0],p={id:'fixture',server:'2311',region:'eu',slot:'1',itemId:'101',enchant:'5'};
for(const [field,value] of [['characterId','other'],['serverId','other'],['region','nae'],['slotPos',2]])assert.throws(()=>readPointGear({...response(p),[field]:value},task),/changed/);
for(const skills of [[{id:12010000,level:-1}],[{id:12010000,level:NaN}],[{id:'12010000',level:1}],[{id:12010000,level:1},{id:12010000,level:1}],null]){
 const d=response(p,skills);assert.throws(()=>readPointGear(d,task));
}
const zero=response(p);delete zero.item.subSkills;zero.item.subSkillCountMax=0;assert.deepEqual(readPointGear(zero,task),{});
zero.item.subSkills='invalid';for(const max of [0,4]){zero.item.subSkillCountMax=max;assert.throws(()=>readPointGear(zero,task),/invalid/);}
for(const equipment of [null,[character.equipment[0],character.equipment[0]],[{id:1,slotPos:0,enchantLevel:1}]])assert.equal(createPointGear({...character,equipment},'templar',()=>{}),null);
let calls=0;const busy=createPointGear(character,'templar',async()=>{calls++;throw Object.assign(Error('busy'),{status:429});});busy.store.start();await settle(busy);assert.equal(calls,2);assert.equal(pointGearState(busy).errors.length,3);assert.equal(pointGearState(busy).bonus,null);
let finish;const cancelled=createPointGear({...character,equipment:[character.equipment[0]]},'templar',p=>new Promise(r=>{finish=()=>r(response(p));}));cancelled.store.start();await new Promise(r=>setImmediate(r));cancelled.store.dispose();finish();await new Promise(r=>setImmediate(r));assert.equal(pointGearState(cancelled).bonus,null);
const fresh=createPointGear(character,'templar',async p=>response(p));assert.equal(pointGearState(fresh).bonus,null);fresh.store.start();await settle(fresh);assert.deepEqual(pointGearState(fresh).bonus,{},'new snapshot discards previous bonuses');
console.log('PASS point gear: omissions, strict identity/roll validation, two workers, named failures, retry only failed items, rate limit, cancellation and fresh snapshots');

// Regression: official stat-only soul binds omit subSkills although up to4 skills are possible.
const statOnly=response(p);delete statOnly.item.subSkills;
Object.assign(statOnly.item,{subStatCount:4,subSkillCountMax:4,subStats:[{id:'Block',value:'26'},{id:'HPMax',value:'194'},{id:'BackAttackDefense',value:'250'},{id:'WeaponFixingDamage',value:'20'}]});
assert.deepEqual(readPointGear(statOnly,task),{});
for(const patch of [{subStats:statOnly.item.subStats.slice(1)},{subStatCount:0},{subStatCount:'4'},{subStats:[...statOnly.item.subStats.slice(0,3),statOnly.item.subStats[0]]},{subStats:[...statOnly.item.subStats.slice(0,3),{id:'bad',value:'unknown'}]}]){
 assert.throws(()=>readPointGear({...statOnly,item:{...statOnly.item,...patch}},task),/missing/);
}
assert.throws(()=>readPointGear({...statOnly,item:{...statOnly.item,subSkills:'bad'}},task),/invalid/);
assert.deepEqual(readPointGear({...statOnly,item:{...statOnly.item,subSkills:[{id:12010000,level:2}]}},task),{'12010000':2});
console.log('PASS stat-only soul bind regression: complete versus partial, invalid and duplicate properties');
