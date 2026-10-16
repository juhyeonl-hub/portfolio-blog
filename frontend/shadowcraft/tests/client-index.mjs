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
assert.equal(actual.recipes.filter(r=>r.craftType==='Succession').length,342);
assert.equal(actual.recipes.filter(r=>r.baseRateCurve).length,622);
const bowCurve=actual.recipes.find(r=>r.id==='211043001').baseRateCurve;
assert.equal(bowCurve.rawRates[0]/bowCurve.percentDivisor,67.506212);
assert.equal(bowCurve.rawRates[44]/bowCurve.percentDivisor,94.008885);
assert.equal(bowCurve.rawRates[65]/bowCurve.percentDivisor,94.639789);
for(const patch of [{rawRates:[]},{rawRates:[NaN]},{rawRates:[-1]},{rawRates:[100000001]},{rawRates:[true]},{rawRates:Array(129).fill(1)},{percentDivisor:100},{scope:'live-verified'},{group:null}]){
 const bad=structuredClone(fixture);bad.recipes[0].baseRateCurve={...bowCurve,...patch};assert.throws(()=>parse(bad));
}
assert.equal(actual.recipes.filter(r=>r.successionCandidateItemIds.length).length,190);
const succession=structuredClone(fixture);
Object.assign(succession.recipes[0],{craftType:'Succession',successionCandidateItemIds:['1']});
assert.equal(parse(succession).recipes[0].ingredients.length,1);
for(const patch of [{craftType:'unknown'},{craftType:'Common'},{successionCandidateItemIds:['99']},{successionCandidateItemIds:['1','1']},{successionCandidateItemIds:null},{craftType:undefined}]){
 const bad=structuredClone(succession);Object.assign(bad.recipes[0],patch);assert.throws(()=>parse(bad));
}
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
const shadowblade=actual.skills.find(s=>s.id==='13020000').description;
assert.ok(shadowblade.text.includes('reduces Move Speed by 40% for 5s'));
assert.equal(shadowblade.valueScope,'base-client-values');
assert.equal(shadowblade.unresolvedValues,2);
assert.equal(actual.skills.reduce((n,s)=>n+(s.description?.resolvedReferences.length??0)+(s.traits?.resolvedReferences.length??0),0),592);
for(const patch of [{valueScope:'final-damage'},{resolvedReferences:null},{resolvedReferences:[{reference:'bad',value:'40'}]},{resolvedReferences:[{reference:'se:1:effect_value01',value:'NaN'}]}]){
 const bad=structuredClone(fixture);bad.skills[0].description={...structuredClone(shadowblade),...patch};assert.throws(()=>parse(bad));
}
console.log('592 base-effect substitutions, provenance and unresolved damage formulas PASS');

assert.deepEqual(actual.craftMasteryGrades.map(g=>[g.min,g.max]),[[1,50],[51,100]]);
for(const grades of [[],null,[{key:'x',name:'X',min:2,max:50}],[{key:'x',name:'X',min:1,max:0}], [{key:'x',name:'X',min:1,max:50},{key:'x',name:'X',min:51,max:100}]]){
 const bad=structuredClone(fixture);bad.craftMasteryGrades=grades;assert.throws(()=>parse(bad));
}
console.log('Mastery grade continuity, duplicates, bounds and legacy compatibility PASS');
