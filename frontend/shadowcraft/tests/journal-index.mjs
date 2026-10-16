import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
const {parseJournalIndex}=await import(moduleUrl(readFileSync('lib/journal-index.ts','utf8')));
const data=JSON.parse(readFileSync('../public/shadowcraft/data/journal-index.json','utf8'));
assert.equal(parseJournalIndex(data).quests.length,1429);
assert.equal(data.dungeons.length,733);
assert.equal(data.quests.find(q=>q.id==='1100010').name,'Poeta');
assert.equal(data.quests.reduce((n,q)=>n+q.stepCount,0),2553);
assert.equal(data.dungeons.filter(d=>d.name===null).length,25);
for(const change of [d=>d.quests[0].acquireNpc={id:'0',name:'bad'},d=>d.source.region='kr',d=>d.source.liveAvailabilityVerified=true,d=>d.quests.push(d.quests[0]),d=>d.quests[0].nextId='999999999',d=>d.quests[0].stepCount=-1,d=>d.quests[0].race='Invalid',d=>d.quests[0].summary={},d=>d.dungeons[0].mapId='0',d=>d.pets.push(d.pets[0]),d=>d.pets[0].kind='bad value',d=>d.dungeons=[],d=>d.dungeons[0].name='']) {
 const bad=structuredClone(data);change(bad);assert.throws(()=>parseJournalIndex(bad));
}
for(const bad of [null,{},[]])assert.throws(()=>parseJournalIndex(bad));
console.log('Journal: shipped coverage, quest chain and malformed source/references PASS');
assert.equal(data.quests.filter(q=>q.acquireNpc).length,400);
assert.equal(data.quests.filter(q=>q.completeNpc).length,424);
assert.equal(data.pets.length,209);
assert.equal(data.pets.find(p=>p.id==='1001').name,'Black Dragon');

const reward=data.quests.find(q=>q.id==='1101010').rewards;
assert.equal(reward.experience,1133);
assert.equal(reward.items[0].count,1400);
assert.equal(reward.normalItems[0].count,50);
assert.equal(data.quests.filter(q=>q.rewards).length,1321);
assert.equal(data.quests.find(q=>q.id==='1102011').rewards.selectionItems.length,3);
assert.equal(data.quests.filter(q=>q.rewards?.randomGroup).length,340);
assert.equal(data.quests.find(q=>q.id==='1100010').rewards,null);
const legacy=structuredClone(data);for(const q of legacy.quests)delete q.rewards;
assert.equal(parseJournalIndex(legacy).quests.length,1429);
for(const mutate of [r=>r.experience=-1,r=>r.experience=true,r=>r.items[0].count=0,r=>r.items[0].enchantLevel=101,r=>r.items[0].id='0',r=>r.selectionItems={},r=>r.randomGroup='bad group',r=>r.items[0].name={}]){
 const bad=structuredClone(data);mutate(bad.quests.find(q=>q.id==='1101010').rewards);assert.throws(()=>parseJournalIndex(bad));
}
console.log('Quest rewards: 1321 links, quantities, selection/random separation, legacy and malformed rejection PASS');

assert.equal(data.quests.filter(q=>q.rewards?.classRewards?.length).length,14);
assert.equal(data.quests.reduce((n,q)=>n+(q.rewards?.classRewards?.length??0),0),112);
assert.equal(data.quests.find(q=>q.id==='1102010').rewards.classRewards.length,8);
assert.equal(data.quests.find(q=>q.id==='1100010').levels.unlock,1);
for(const mutate of [d=>d.quests[0].levels.unlock=-1,d=>d.quests[0].levels.additionalConditions=true,d=>d.dungeons[0].recommendation.minMembers=100,d=>d.dungeons[0].recommendation.difficulty='bad value',d=>{const r=d.quests.find(q=>q.id==='1102010').rewards;r.classRewards.push(r.classRewards[0])},d=>d.quests.find(q=>q.id==='1102010').rewards.classRewards[0].classKey='unknown']){
 const bad=structuredClone(data);mutate(bad);assert.throws(()=>parseJournalIndex(bad));
}
