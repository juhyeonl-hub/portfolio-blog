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
