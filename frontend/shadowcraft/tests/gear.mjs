import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planner,recommendBuild} from './modules.mjs';
for(const key of ['assassin','gladiator','templar','ranger','elementalist','sorcerer','cleric','chanter']){
 const c=JSON.parse(readFileSync(`lib/data/catalogs/${key}.json`));
 const original=planner.emptyPlan(c),s=c.skills.find(s=>s.id==='13350000')||c.skills.find(s=>!s.stigma&&s.specializations.length);
 const item=(id,extra={})=>({id,name:id,slot:'반지 1',owned:true,current:false,target:false,bonuses:{[s.id]:2},note:'test',...extra});
 const p={...original,bonus:{[s.id]:9},gear:{mode:'current',items:[item('current',{current:true}),item('new',{owned:false,target:true,bonuses:{[s.id]:3}}),item('second',{slot:'반지 2',current:true,bonuses:{[s.id]:1}})]}};
 assert.equal(planner.equipmentBonus(p,s.id),3,'current items sum; legacy bonus excluded');
 assert.equal(planner.equipmentBonus({...p,gear:{...p.gear,mode:'target'}},s.id),4,'replacement, not stacking');
 assert.equal(planner.equipmentBonus({...p,gear:{...p.gear,mode:'manual'}},s.id),9,'legacy retained');
 const before=JSON.stringify(p),result=recommendBuild(c,p);assert.equal(JSON.stringify(p),before);assert.deepEqual(result.gear,p.gear);assert.deepEqual(result.bonus,p.bonus);
 const t=planner.totals(c,result);assert(t.sp<=t.spMax);assert(t.stigma<=t.stigmaMax);assert(t.crystal<=t.crystalMax);
 for(const sk of c.skills)for(const id of result.specs[sk.id])assert(sk.specializations.find(x=>x.id===id).requiredParentLevel<=planner.finalLevel(c,result,sk));
 assert.deepEqual(JSON.parse(JSON.stringify(result)).gear,result.gear);
 if(key==='assassin'){
  const nodes=c.boards.flatMap(b=>b.nodes.filter(n=>n.autoLearn||n.skill?.id===s.id).map(n=>n.id));
  const start={...p,base:{...p.base,[s.id]:10},nodes,gear:{mode:'current',items:[item('ring',{current:true,bonuses:{[s.id]:1}})]}};
  start.specs={...start.specs,[s.id]:planner.recommendSpecs(s,15,'safe')};assert.equal(planner.finalLevel(c,start,s),15);
  const end=planner.updatePlan(c,start,{gear:{...start.gear,items:[item('ring',{current:true})]}});
  assert.equal(planner.finalLevel(c,end,s),16);assert.deepEqual(end.specs[s.id],['13350050','13350040']);assert.deepEqual(end.base,start.base);assert.deepEqual(end.nodes,start.nodes);
  const down=planner.updatePlan(c,end,{gear:start.gear});assert(!down.specs[s.id].includes('13350050'));
  const manual={...start,gear:{...start.gear,mode:'manual'},bonus:{[s.id]:1}};
  assert(planner.updatePlan(c,manual,{bonus:{[s.id]:2}}).specs[s.id].includes('13350050'));
 }
 console.log(key+': gear sum, replacement, legacy isolation, recommendation budget and persistence PASS');
}
console.log('Assassin equipment +1 → +2 at level 15 → 16 selects reset + multihit, reverse relocks PASS');
