import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classes,classesUrl,planner,plannerUrl,moduleUrl} from './modules.mjs';
const recommendationUrl=moduleUrl(readFileSync('lib/recommendation.ts','utf8').replace("'./planner'",JSON.stringify(plannerUrl)).replace("'./classes'",JSON.stringify(classesUrl)));
const purpose=await import(moduleUrl(readFileSync('lib/build-purpose.ts','utf8').replace("'./planner'",JSON.stringify(plannerUrl)).replace("'./recommendation'",JSON.stringify(recommendationUrl)).replace("'./classes'",JSON.stringify(classesUrl))));
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

for(const key of classes.CLASSES.map(p=>p.key)){
 const c=JSON.parse(readFileSync(`lib/data/catalogs/${key}.json`)),p=planner.emptyPlan(c),outputs={};
 for(const choice of ['group','single','farm']){
  const input={...p,pvePreset:choice,pointBudget:{sp:90,stigma:10,crystal:104,battle:0,ariel:0}};
  const snapshot=JSON.stringify(input),out=purpose.recommendPurposeBuild(c,input);outputs[choice]=out;
  assert.equal(JSON.stringify(input),snapshot);
  assert.equal(out.pvePreset,choice);
  const sum=planner.totals(c,out);for(const currency of ['sp','stigma','crystal','battle','ariel'])assert.ok(sum[currency]<=sum[currency+'Max']);
  for(const skill of c.skills){const level=planner.finalLevel(c,out,skill);assert.ok(out.specs[skill.id].length<=planner.slots(skill,level));for(const id of out.specs[skill.id])assert.ok(skill.specializations.some(x=>x.id===id&&x.requiredParentLevel<=level));}
  const changed=planner.updatePlan(c,out,{pvePreset:choice==='farm'?'group':'farm',specs:out.specs});
  for(const field of ['nodes','base','specs'])assert.deepEqual(changed[field],out[field],'selection keeps manual allocation');
 }
 assert.notDeepEqual(outputs.farm.base,outputs.group.base,key+' field investment actually differs under a limited budget');
 if(key==='templar'){assert.ok(planner.equipped(outputs.farm).includes('12070000'));assert.ok(!planner.equipped(outputs.farm).includes('12110000'));}
 for(const context of [{level:44,mode:'safe'},{level:45,mode:'pvp'}])assert.equal(classes.recommendationProfile(key,{...context,pvePreset:'farm'}),classes.classProfile(key),'endgame field data cannot leak into leveling/PvP');
}
console.log('PvE branches: distinct allocations, all currencies, legal specialties, Templar solo stigma, manual preservation, and purpose gating PASS');

const guideText=await import(moduleUrl(readFileSync('lib/pve-direction-text.ts','utf8')));
const farmSpecs={gladiator:['11170000','11170020'],assassin:['13210000','13210020'],elementalist:['16300000','16300010'],sorcerer:['15280000','15280030'],cleric:['17150000','17150020'],chanter:['18060000','18060010']};
const singleSpecs={gladiator:['11290000','11290010'],assassin:['13340000','13340010'],elementalist:['16040000','16040020'],sorcerer:['15050000','15050010'],cleric:['17150000','17150030'],chanter:['18290000','18290030']};
for(const profile of classes.CLASSES){
 const c=JSON.parse(readFileSync(`lib/data/catalogs/${profile.key}.json`));
 for(const choice of ['farm','single']){
  const selected=classes.recommendationProfile(profile.key,{level:45,mode:'damage',pvePreset:choice});
  const expected=(choice==='farm'?farmSpecs:singleSpecs)[profile.key];
  if(expected){const s=c.skills.find(s=>s.id===expected[0]),specs=planner.recommendSpecs(s,20,'damage',selected);assert.ok(specs.includes(expected[1]),`${profile.key} ${choice} source-checked specialization`);}
  for(const points of [0,30,383]){
   const input={...planner.emptyPlan(c),pvePreset:choice,pointBudget:{sp:points,stigma:points?30:0,crystal:points?316:0,battle:0,ariel:0}};
   const output=purpose.recommendPurposeBuild(c,input),totals=planner.totals(c,output);
   for(const currency of ['sp','stigma','crystal','battle','ariel'])assert.ok(totals[currency]<=totals[currency+'Max'],`${profile.key}/${choice}/${points}/${currency}`);
   assert.ok(planner.equipped(output).length<=4);
   for(const s of c.skills){const lv=planner.finalLevel(c,output,s);assert.ok(output.specs[s.id].length<=planner.slots(s,lv));for(const id of output.specs[s.id])assert.ok(s.specializations.some(x=>x.id===id&&x.requiredParentLevel<=lv));}
   const restored=planner.updatePlan(c,JSON.parse(JSON.stringify(output)),{});
   for(const field of ['base','nodes','specs','pvePreset'])assert.deepEqual(restored[field],output[field],'saved plan remains valid');
  }
  const guide=guideText.pveActivityGuides[profile.key][choice];assert.ok(guide);
  for(const id of guide.ids)assert.ok(c.skills.some(s=>s.id===id),'guide belongs to the chosen class');
  for(const locale of ['ko','en','ja','fi','fr','de','es','pt-BR','ru']){const text=guideText.pveText(locale,guide.key,guide.ids);assert.ok(text&&!/\{\d+\}/.test(text),'guide translation placeholders resolved');}
 }
}
const cleric=classes.recommendationProfile('cleric',{level:45,mode:'damage',pvePreset:'single'});
assert.ok(cleric.damageStigmas.includes('17430000'));assert.ok(!cleric.damageStigmas.includes('17390000'),'solo excludes resurrection stigma');
assert.ok(classes.recommendationProfile('chanter',{level:45,mode:'damage',pvePreset:'farm'}).damageStigmas.includes('18330000'));
assert.deepEqual(JSON.parse(readFileSync('lib/data/class-profiles.json')),JSON.parse(readFileSync('../../backend/src/main/resources/shadowcraft/class-profiles.json')),'server profile mirror');
console.log('Eight classes: zero/low/endgame budgets, source-checked variant specialties, class-specific guides in nine languages, saved plan validity and backend mirror PASS');
