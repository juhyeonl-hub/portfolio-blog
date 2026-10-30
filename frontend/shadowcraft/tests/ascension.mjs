import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planner,classes,recommendBuild} from './modules.mjs';
const index=JSON.parse(readFileSync('../public/shadowcraft/data/client-index.json'));
const rules=JSON.parse(readFileSync('lib/data/ascension-rules.json'));
const expected=Object.fromEntries(index.skills.flatMap(s=>{const rows=s.learning.filter(r=>r.ascensionRequirement!=='None');return rows.length?[[s.id,Math.min(...rows.map(r=>r.level))]]:[]}));
assert.deepEqual(rules.requiredFromLevel,expected);
assert.equal(Object.keys(expected).length,104);
for(const profile of classes.CLASSES){
 const c=JSON.parse(readFileSync(`lib/data/catalogs/${profile.key}.json`));
 const p={...planner.emptyPlan(c),level:44,pointBudget:{sp:9999,stigma:9999,crystal:0,battle:0}};
 const gated=c.skills.filter(s=>expected[s.id]);assert.equal(gated.length,13);
 for(const s of gated){
  assert.equal(planner.maxBase(s,44),0,'first-level condition must gate every later level');
  assert.equal(planner.maxBase(s,45,true),Math.max(...s.learning.map(r=>r.level)));
  assert.equal(planner.finalLevel(c,{...p,base:{...p.base,[s.id]:0},bonus:{[s.id]:30}},s),0,'equipment cannot bypass acquisition');
 }
 const assumed={...p,level:45,ascensionGrade3Confirmed:false};
 const assumedBefore=JSON.stringify(assumed),complete=recommendBuild(c,assumed),confirmed=recommendBuild(c,{...assumed,ascensionGrade3Confirmed:true});
 assert.equal(JSON.stringify(assumed),assumedBefore);
 assert.equal(complete.ascensionGrade3Confirmed,false,'assumption must never be stored as actual verification');
 for(const key of ['base','specs','nodes'])assert.deepEqual(complete[key],confirmed[key],key+' matches the existing completed-ascension rule');
 assert(planner.totals(c,complete).stigma>0,'45 recommendation must actually spend eligible stigma points');
 assert.deepEqual(planner.unmetAscensionSkills(c,complete),[]);
 for(const s of gated){assert.equal(planner.maxBase(s,45),planner.maxBase(s,45,true));assert.equal(planner.maxBase(s,46),0,'do not extend the assumption to unknown future caps');}
 const before=JSON.stringify(p),locked=recommendBuild(c,p),open=recommendBuild(c,{...p,ascensionGrade3Confirmed:true});
 assert.equal(JSON.stringify(p),before);
 for(const s of gated)assert.equal(locked.base[s.id],0);
 assert(gated.some(s=>open.base[s.id]>0),'confirmed conditions allow recommendation');
 const old={...p,base:{...p.base,[gated[0].id]:10}};
 const edited=planner.updatePlan(c,old,{ascensionGrade3Confirmed:false});
 assert.equal(edited.base[gated[0].id],10,'never silently remove legacy allocations');
 assert(planner.unmetAscensionSkills(c,edited).some(s=>s.id===gated[0].id));
 assert.deepEqual(planner.unmetAscensionSkills(c,{...edited,ascensionGrade3Confirmed:true}),[]);
}
console.log('Ascension: all 8 classes, 104 gates, first-level prerequisites, recommendation, gear bypass and legacy preservation PASS');
