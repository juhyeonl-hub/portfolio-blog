import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl,plannerUrl,classesUrl,planner,recommendBuild} from './modules.mjs';
const {recommendTargetNodes}=await import(moduleUrl(readFileSync('lib/recommendation.ts','utf8').replace("'./planner'",JSON.stringify(plannerUrl)).replace("'./classes'",JSON.stringify(classesUrl))));
for(const key of ['assassin','gladiator','templar','ranger','elementalist','sorcerer','cleric','chanter']){
 const c=JSON.parse(readFileSync(`lib/data/catalogs/${key}.json`));
 const p={...planner.emptyPlan(c),pointBudget:{sp:203,stigma:29,crystal:370,battle:0}};
 const target={...p,nodes:c.boards.flatMap(b=>b.nodes.map(n=>n.id))};
 const before=JSON.stringify([p,target]);
 for(const limit of [0,10,370,9999]){
  const own={...p,pointBudget:{...p.pointBudget,crystal:limit}};
  const ids=recommendTargetNodes(c,own,target),cost=planner.totals(c,{...own,nodes:ids});
  assert(cost.crystal<=limit);assert.equal(cost.battle,0);
  for(const b of c.boards){const connected=new Set(planner.connected(b,ids));assert(b.nodes.filter(n=>ids.includes(n.id)).every(n=>connected.has(n.id)));}
  assert(ids.every(id=>target.nodes.includes(id)));
  if(limit===370)assert(cost.crystal>0);
 }
 const low={...p,level:1};const ids=recommendTargetNodes(c,low,target);
 assert(c.boards.filter(b=>b.requiredLevel>1).every(b=>b.nodes.every(n=>!ids.includes(n.id))));
 const disconnected={...p,nodes:c.boards.flatMap(b=>b.nodes.filter(n=>!n.autoLearn&&n.row===0).map(n=>n.id))};
 const restricted=recommendTargetNodes(c,p,disconnected);
 assert(restricted.every(id=>disconnected.nodes.includes(id)||c.boards.some(b=>b.nodes.some(n=>n.id===id&&n.autoLearn))));
 for(const b of c.boards){const reachable=new Set(planner.connected(b,restricted));assert(b.nodes.filter(n=>restricted.includes(n.id)).every(n=>reachable.has(n.id)));}
 if(key==='assassin'){const goal416=recommendBuild(c,{...p,pointBudget:{...p.pointBudget,crystal:416,battle:63}});assert.equal(planner.totals(c,goal416).crystal,416);const now=recommendTargetNodes(c,p,goal416);assert.equal(planner.totals(c,{...p,nodes:now}).crystal,370);assert(now.every(id=>goal416.nodes.includes(id)));assert(now.length<goal416.nodes.length);}
 assert.equal(JSON.stringify([p,target]),before);
 console.log(key+': target-only paths, shared 370-point cap, zero Azphel, locked boards, nonmutation PASS');
}
