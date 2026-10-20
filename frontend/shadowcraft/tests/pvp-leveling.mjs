import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classes,planner,recommendBuild} from './modules.mjs';

// PvP mode: a valid plan mode that steers the Azphel (battle) board to PvP-only nodes and keeps the crystal
// boards' survival nodes; levelling previews use only what is open at the chosen level.
assert.deepEqual(Object.keys(planner.MODE_NAMES),['safe','damage','pvp']);
const pvpNode=(catalog,id)=>{for(const b of catalog.boards){const n=b.nodes.find(n=>n.id===id);if(n)return /^PVP /.test(n.stat?.name||'');}return false;};
for(const profile of classes.CLASSES){
 const c=JSON.parse(readFileSync(`lib/data/catalogs/${profile.key}.json`));
 // Battle (Azphel) points are earned past 45, so an empty plan estimates 0; give the budget the game would show.
 const empty=planner.emptyPlan(c),limits=planner.pointLimits(c,{...empty,level:45});
 const base={...empty,level:45,pointBudget:{...limits,battle:60}};
 const pvp=recommendBuild(c,{...base,mode:'pvp'}),damage=recommendBuild(c,{...base,mode:'damage'}),safe=recommendBuild(c,{...base,mode:'safe'});
 assert.equal(pvp.mode,'pvp');
 const count=plan=>plan.nodes.filter(id=>pvpNode(c,id)).length;
 assert.ok(count(pvp)>count(damage)&&count(pvp)>count(safe),`${profile.key}: pvp mode must pick more PvP nodes (${count(pvp)} vs ${count(damage)}/${count(safe)})`);
 assert.ok(count(pvp)>=6,`${profile.key}: at least six PvP nodes, got ${count(pvp)}`);
 // Budgets are respected exactly like the other modes.
 const t=planner.totals(c,pvp);
 assert.ok(t.battle<=t.battleMax&&t.crystal<=t.crystalMax&&t.sp<=t.spMax&&t.stigma<=t.stigmaMax,profile.key+' pvp within budget');
 // Levelling: at Lv.20 only boards open by then are used, and the plan carries the level.
 for(const level of [10,20,30,40]){
  const plan=recommendBuild(c,{...empty,level,mode:'damage'});
  assert.equal(plan.level,level);
  const openBoards=new Set(c.boards.filter(b=>b.requiredLevel<=level).flatMap(b=>b.nodes.map(n=>n.id)));
  assert.ok(plan.nodes.every(id=>openBoards.has(id)),`${profile.key} Lv.${level}: node from a locked board`);
  const skills=c.skills.filter(s=>planner.finalLevel(c,plan,s)>0||plan.base[s.id]);
  assert.ok(skills.every(s=>(s.requiredLevel||1)<=level||!(plan.base[s.id]>0)),`${profile.key} Lv.${level}: skill above level`);
 }
 const lv10=recommendBuild(c,{...empty,level:10,mode:'damage'}),lv45=recommendBuild(c,{...empty,level:45,mode:'damage'});
 assert.ok(lv10.nodes.length<lv45.nodes.length,profile.key+': higher level opens more nodes');
}
console.log('PvP mode and levelling previews: PvP nodes preferred, budgets kept, locked boards/skills excluded for all eight classes PASS');
