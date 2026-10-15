import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planner,recommendBuild} from './modules.mjs';
const c=JSON.parse(readFileSync('lib/data/catalog.json','utf8'));
const original=planner.emptyPlan(c);
const limits={sp:120,stigma:40,crystal:80,battle:15};
assert.deepEqual(planner.pointLimits(c,{...original,extraSP:999,extraStigma:999,pointBudget:limits}),limits,'manual total must not add level rewards');
assert.equal(planner.pointLimits(c,original).sp,203,'legacy plan retains its budget');
for(const [level,sp,stigma,crystal,battle] of [[1,0,0,0,0],[12,1,0,1,0],[22,50,3,20,0],[27,80,5,30,0],[37,160,30,80,0],[45,0,0,0,0],[45,1,1,1,1],[45,200,60,136,20],[45,9999,9999,9999,9999]]){
 for(const mode of ['safe','damage']){
  const input={...original,level,mode,pointBudget:{sp,stigma,crystal,battle},bonus:{'13350000':6,'13130000':4},nodes:c.boards.flatMap(b=>b.nodes.map(n=>n.id))};
  const before=JSON.stringify(input),start=performance.now(),p=recommendBuild(c,input),t=planner.totals(c,p);
  assert.equal(JSON.stringify(input),before,'recommendation may not mutate the current plan');
  for(const key of ['sp','stigma','crystal','battle'])assert(t[key]<=t[key+'Max'],`${level}/${mode} overspent ${key}`);
  for(const b of c.boards){
   const ids=b.nodes.filter(n=>p.nodes.includes(n.id));
   if(b.requiredLevel>level)assert.equal(ids.length,0,'locked board');
   const connected=new Set(planner.connected(b,p.nodes));
   for(const n of ids){assert(connected.has(n.id),'disconnected node');assert(n.requiredLevel<=level)}
  }
  for(const s of c.skills){
   assert(p.base[s.id]<=planner.maxBase(s,level),'skill level gate');
   if(s.stigma&&!planner.equipped(p).includes(s.id))assert.equal(p.base[s.id],0,'inactive stigma');
   const final=planner.finalLevel(c,p,s);assert(p.specs[s.id].length<=planner.slots(s,final),'specialization slots');
   assert(p.specs[s.id].every(id=>s.specializations.find(x=>x.id===id).requiredParentLevel<=final));
  }
  assert.deepEqual(p.bonus,input.bonus,'preserve equipment bonuses');
  if(level===45&&crystal===136)assert(t.crystal>100,'actually allocate daevanion, not just skills');
  console.log(`PASS Lv.${level} ${mode}: SP ${t.sp}/${sp}, stigma ${t.stigma}/${stigma}, boards ${t.crystal}/${crystal}, PvP ${t.battle}/${battle} (${Math.round(performance.now()-start)}ms)`);
 }
}
const sample={...original,pointBudget:limits};
assert.deepEqual(recommendBuild(c,sample),recommendBuild(c,sample),'stable recommendation');
