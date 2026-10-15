import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
const {parseClientIndex: parse} = await import(moduleUrl(readFileSync('lib/client-index.ts', 'utf8')));
const source = {kind:'installed-steam-client',region:'global',appId:3393110,language:'en-US',buildId:'123'};
const fixture = {schema:'a2bc-client-index-v1',source,items:[{id:'1',name:'Sample',kind:'Material',grade:'Common',level:1}],skills:[{id:'2',name:'Skill',classKey:'assassin'}],recipes:[{id:'3',itemId:'1',outputQuantity:1,category:'Craft',race:'All',masteryLevel:1,ingredients:[{itemId:'1',quantity:2,enchant:0}],hasCombo:false,successRate:null,feePerAttempt:null}]};
assert.equal(parse(fixture),fixture);
for (const mutate of [d=>d.source.region='kr',d=>d.source.appId=0,d=>d.items.push(d.items[0]),d=>d.items[0].name=null,d=>d.skills[0].classKey='unknown',d=>d.recipes[0].itemId='99',d=>d.recipes[0].ingredients[0].itemId='99',d=>d.recipes[0].ingredients[0].quantity=-1,d=>d.recipes[0].successRate=100,d=>d.recipes[0].feePerAttempt=0,d=>d.recipes[0].ingredients=[null]]) {
 const data=structuredClone(fixture);mutate(data);assert.throws(()=>parse(data));
}
const actual=parse(JSON.parse(readFileSync('../public/shadowcraft/data/client-index.json','utf8')));
assert.equal(actual.skills.length,280);
assert.equal(new Set(actual.skills.map(s=>s.classKey)).size,8);
console.log('Client index validation passed: malformed records and shipped Global references');
