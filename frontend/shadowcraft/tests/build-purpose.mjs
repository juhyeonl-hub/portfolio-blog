import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classes,classesUrl,planner,plannerUrl,moduleUrl} from './modules.mjs';
const recommendationUrl=moduleUrl(readFileSync('lib/recommendation.ts','utf8').replace("'./planner'",JSON.stringify(plannerUrl)).replace("'./classes'",JSON.stringify(classesUrl)));
const purpose=await import(moduleUrl(readFileSync('lib/build-purpose.ts','utf8').replace("'./planner'",JSON.stringify(plannerUrl)).replace("'./recommendation'",JSON.stringify(recommendationUrl))));
for(const profile of classes.CLASSES){
 const c=JSON.parse(readFileSync(`lib/data/catalogs/${profile.key}.json`));
 const empty=planner.emptyPlan(c);
 // The boundary follows level for either legacy non-PvP preference; PvP remains explicit.
 for(const mode of ['safe','damage']){
  assert.equal(purpose.buildPurpose({...empty,level:44,mode}),'leveling');
  assert.equal(purpose.buildPurpose({...empty,level:45,mode}),'pve');
 }
 assert.equal(purpose.buildPurpose({...empty,level:20,mode:'pvp'}),'pvp');
 // Purpose selection changes the target, not the imported character or manually edited allocations.
 const input={...empty,mode:'safe',level:45,pointBudget:{sp:411,stigma:37,crystal:370,battle:63},extraSP:20,ascensionGrade3Confirmed:false,character:{profile:{characterName:'GreenOrc',characterLevel:45}},confirmedRemaining:{stigma:5},specs:{manual:['choice']}};
 const snapshot=JSON.stringify(input),leveling=purpose.changeBuildPurpose(c,input,'leveling');
 assert.equal(leveling.level,44);assert.equal(purpose.buildPurpose(leveling),'leveling');
 assert.equal(leveling.pointBudget,undefined);assert.equal(leveling.extraSP,0);
 for(const key of ['base','specs','nodes','character','confirmedRemaining'])assert.equal(leveling[key],input[key],key+' preserved');
 assert.equal(leveling.ascensionGrade3Confirmed,false,'planning never fabricates actual confirmation');
 assert.equal(JSON.stringify(input),snapshot,'undo source remains byte-equivalent');
 const expedition=purpose.changeBuildPurpose(c,leveling,'pve');assert.equal(expedition.level,45);assert.equal(purpose.buildPurpose(expedition),'pve');
 const pvp=purpose.changeBuildPurpose(c,input,'pvp');assert.equal(pvp.level,45);assert.deepEqual(pvp.pointBudget,input.pointBudget);
 assert.equal(purpose.changeBuildPurpose(c,input,'pve'),input,'selected purpose is a no-op');
 const low=purpose.changeBuildPurpose(c,{...input,level:20,mode:'pvp'},'leveling');assert.equal(low.level,20);assert.deepEqual(low.pointBudget,input.pointBudget);
 for(const [level,mode,expected] of [[20,'safe','damage'],[45,'damage','damage'],[45,'pvp','pvp']]){
  const input={...empty,level,mode,pointBudget:{sp:90,stigma:8,crystal:40,battle:20}};
  const snapshot=JSON.stringify(input),output=purpose.recommendPurposeBuild(c,input);
  assert.equal(JSON.stringify(input),snapshot,'source plan must not mutate');
  assert.equal(output.level,level);assert.deepEqual(output.pointBudget,input.pointBudget);
  assert.equal(output.mode,expected);
  const totals=planner.totals(c,output);
  for(const key of ['sp','stigma','crystal','battle'])assert.ok(totals[key]<=totals[key+'Max'],profile.key+' '+key+' within budget');
  for(const b of c.boards){
   const connected=new Set(planner.connected(b,output.nodes));
   for(const n of b.nodes.filter(n=>output.nodes.includes(n.id))){
    assert.ok(connected.has(n.id),profile.key+' connected path');
    assert.ok(b.requiredLevel<=level&&n.requiredLevel<=level,profile.key+' unlocked nodes');
    if(expected!=='pvp'&&!n.autoLearn)assert.ok(!/^PVP(?:\s|$)/i.test(n.stat?.name||''),profile.key+' no PvP-only stats in PvE/leveling');
   }
  }
  for(const s of c.skills)assert.ok(output.base[s.id]<=planner.maxBase(s,level),profile.key+' skill level gate');
 }
}
console.log('Build purposes: eight classes, level 44/45 boundary, legacy modes, PvP persistence, budgets, connected paths, and PvE stat filtering PASS');
