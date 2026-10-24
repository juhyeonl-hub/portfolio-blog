import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl,plannerUrl,planner,recommendBuild,classes} from './modules.mjs';
const {boardGuidance}=await import(moduleUrl(readFileSync('lib/growth-guide.ts','utf8').replace("'./planner'",JSON.stringify(plannerUrl))));
for(const profile of classes.CLASSES){
 const c=JSON.parse(readFileSync(`lib/data/catalogs/${profile.key}.json`));
 const input={...planner.emptyPlan(c),level:30,pointBudget:{sp:110,stigma:8,crystal:80,battle:10}};
 const target=recommendBuild(c,input);
 for(const board of c.boards){
  const empty=boardGuidance(board,target.nodes,[],30);
  assert.equal(empty.locked,board.requiredLevel>30);
  if(empty.locked){assert.equal(empty.cost,0);assert.equal(empty.next.length,0);continue;}
  const selected=board.nodes.filter(n=>target.nodes.includes(n.id)&&!n.autoLearn);
  assert.equal(empty.cost,selected.reduce((sum,n)=>sum+n.pointCost,0));
  let owned=[];
  for(let step=0;step<=selected.length;step++){
   const guide=boardGuidance(board,target.nodes,owned,30);
   assert.equal(guide.kept+guide.missing,selected.length);
   if(!guide.missing){assert.equal(guide.next.length,0);break;}
   assert.ok(guide.next.length>0,'connected target must offer a reachable next node');
   for(const n of guide.next){assert(!owned.includes(n.id));assert(target.nodes.includes(n.id));assert(planner.cheapestPath(board,owned,n.id).filter(id=>!owned.includes(id)&&!board.nodes.find(x=>x.id===id).autoLearn).length<=1);}
   owned.push(guide.next[0].id);
  }
  assert.equal(owned.length,selected.length);
  const lower=boardGuidance(board,target.nodes,owned,board.requiredLevel-1);assert.equal(lower.next.length,0);assert.equal(lower.cost,0);
 }
}
console.log('Growth guide: all eight classes, connection ordering, counters, complete targets and locked boards PASS');

const b={requiredLevel:1,nodes:[{id:'root',autoLearn:true,row:1,column:1,pointCost:0},{id:'bridge',row:1,column:2,pointCost:1},{id:'goal',row:1,column:3,pointCost:2},{id:'island',row:1,column:5,pointCost:1},{id:'far',row:1,column:6,pointCost:1}]};
assert.deepEqual(boardGuidance(b,['goal'],['bridge'],10).next.map(n=>n.id),['goal'],'actual owned bridge counts even outside target');
assert.deepEqual(boardGuidance(b,['far'],['island'],10).next,[],'disconnected actual island cannot be used as a starting point');
