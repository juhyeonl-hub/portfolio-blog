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

const learning={level:1,autoLearn:true,requiredCharacterLevel:1,skillPoints:0,stigmaPoints:0,ascensionRequirement:'AscensionGrade_3'};
const withLearning=structuredClone(fixture);withLearning.skills[0].learning=[learning];
assert.equal(parse(withLearning).skills[0].learning[0].ascensionRequirement,'AscensionGrade_3');
for(const patch of [{level:2},{level:true},{skillPoints:-1},{stigmaPoints:1.5},{autoLearn:1},{ascensionRequirement:'unknown'}]){
 const bad=structuredClone(withLearning);Object.assign(bad.skills[0].learning[0],patch);assert.throws(()=>parse(bad));
}
assert.equal(actual.skills.reduce((n,s)=>n+s.learning.length,0),3840);
assert.equal(actual.skills.flatMap(s=>s.learning).filter(r=>r.ascensionRequirement!=='None').length,104);
console.log('Official skill learning conditions and backward-compatible v1 exports PASS');
const enriched=structuredClone(fixture);
enriched.skills[0].description={text:'Deals [unresolved value] damage. Restores 100 MP.',unresolvedValues:1};
enriched.recipes.push({...structuredClone(enriched.recipes[0]),id:'4'});
enriched.recipes[0].hasCombo=true;enriched.recipes[0].comboRecipeId='4';
assert.equal(parse(enriched).recipes[0].comboRecipeId,'4');
for(const mutate of [d=>d.skills[0].description.text='{se:123:value}',d=>d.skills[0].description.unresolvedValues=0,d=>d.skills[0].description.text='<img src=x>',d=>d.recipes[0].comboRecipeId='99',d=>d.recipes[0].comboRecipeId=null,d=>d.recipes[0].hasCombo=false]){
 const bad=structuredClone(enriched);mutate(bad);assert.throws(()=>parse(bad));
}
assert.equal(actual.recipes.filter(r=>r.comboRecipeId).length,296);
const quick=actual.skills.find(s=>s.id==='13010000');
assert.ok(quick.description.text.includes('restores 100 MP'));
assert.equal(quick.description.unresolvedValues,2);
assert.ok(actual.skills.every(s=>s.description));
console.log('Official descriptions and 296 resolved combo recipe references PASS');
