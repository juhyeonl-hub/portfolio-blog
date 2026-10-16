import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
const {parseNpcIndex} = await import(moduleUrl(readFileSync('lib/npc-index.ts','utf8')));
const data = JSON.parse(readFileSync('../public/shadowcraft/data/npc-index.json','utf8'));
assert.equal(parseNpcIndex(data).npcs.length,13495);
assert.equal(data.npcs.filter(n=>n.name===null).length,895);
for (const change of [d=>d.source.region='kr', d=>d.source.appId='1', d=>d.source.liveAvailabilityVerified=true, d=>d.npcs.push(d.npcs[0]), d=>d.npcs[0].name='', d=>d.npcs[0].kind='Unknown', d=>d.npcs[0].id='-1', d=>d.npcs=[]]) {
  const bad=structuredClone(data); change(bad); assert.throws(()=>parseNpcIndex(bad));
}
for(const bad of [null,{},[],{schema:'a2bc-npc-index-v1'}]) assert.throws(()=>parseNpcIndex(bad));
console.log('NPC index: official coverage, missing names and invalid source/records PASS');
