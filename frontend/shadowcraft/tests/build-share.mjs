import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl,planner,plannerUrl,classesUrl} from './modules.mjs';
const memory=moduleUrl(readFileSync('lib/plan-memory.ts','utf8'));
const share=await import(moduleUrl(readFileSync('lib/build-share.ts','utf8').replace("'./plan-memory'",JSON.stringify(memory)).replace("'./planner'",JSON.stringify(plannerUrl)).replace("'./classes'",JSON.stringify(classesUrl))));
for(const key of ['assassin','gladiator','templar','ranger','elementalist','sorcerer','cleric','chanter']) {
 const catalog=JSON.parse(readFileSync(`lib/data/catalogs/${key}.json`,'utf8'));
 for(const mode of ['manual','current','target']) {
  const plan=planner.emptyPlan(catalog);const id=catalog.skills[0].id;
  plan.character={profile:{characterName:'PRIVATE_CHARACTER'}};plan.searchPrefs={region:'eu',server:'1',name:'PRIVATE_SEARCH'};
  plan.recentCharacters=[{region:'eu',serverId:'1',characterId:'PRIVATE_ID',name:'PRIVATE_NAME',serverName:'PRIVATE_SERVER'}];
  plan.gear={mode,items:[{id:'a',name:'PRIVATE_GEAR',note:'PRIVATE_NOTE',slot:'weapon',owned:true,current:true,target:false,bonuses:{[id]:2}},{id:'b',name:'PRIVATE_TARGET',note:'PRIVATE_NOTE',slot:'weapon',owned:false,current:false,target:true,bonuses:{[id]:4}}]};
  plan.bonus[id]=1;plan.pointBudget={sp:300,stigma:40,crystal:70,battle:20};
  plan.unknown='PRIVATE_UNKNOWN';const before=JSON.stringify(plan);
  const projected=share.publicBuild(catalog,plan);const encoded=share.encodeShare(projected);const decoded=share.decodeShare(encoded);
  assert.deepEqual(decoded,projected);assert.equal(JSON.stringify(plan),before);
  assert.ok(!JSON.stringify(decoded).includes('PRIVATE'));assert.equal(decoded.plan.character,null);assert.equal(decoded.plan.gear,undefined);
  assert.deepEqual(planner.totals(catalog,plan),planner.totals(catalog,decoded.plan));
  for(const skill of catalog.skills)assert.equal(planner.finalLevel(catalog,plan,skill),planner.finalLevel(catalog,decoded.plan,skill));
  assert.equal(decoded.plan.bonus[id],mode==='manual'?1:mode==='current'?2:4);
  share.validateReferences(decoded,catalog);
  for(const mutate of [v=>v.plan.character={profile:{}},v=>v.plan.searchPrefs={},v=>v.plan.extraSP=-1,v=>v.plan.extraBattle=0.5,v=>v.plan.pointBudget.sp='5',v=>v.plan.nodes.push(v.plan.nodes[0]),v=>v.plan.base.bad=1,v=>v.schema='other',v=>v.plan.classKey='other',v=>v.plan.specs[id]=['not-id'],v=>v.extra='private']) {
   const invalid=structuredClone(decoded);mutate(invalid);assert.throws(()=>share.encodeShare(invalid));
  }
  const missing=structuredClone(decoded);missing.plan.nodes.push('999999999999999999');assert.throws(()=>share.validateReferences(missing,catalog));
  const wrong=structuredClone(catalog);wrong.classKey='other';assert.throws(()=>share.validateReferences(decoded,wrong));
 }
}
for(const value of ['','#build=','#build=!','#build=abc','#build='+('A'.repeat(24001)),'#else=abc','#build='+btoa('{"schema":"bad"}')])assert.throws(()=>share.decodeShare(value));
console.log('Build sharing: 8 classes × 3 gear modes preserve calculations, exclude private fields, reject invalid/oversized links and references PASS');
