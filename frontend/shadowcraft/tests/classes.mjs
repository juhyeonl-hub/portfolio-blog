import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {classes,planner,recommendBuild,moduleUrl} from './modules.mjs';
assert.equal(classes.CLASSES.length,8);
for(const profile of classes.CLASSES){
 const c=JSON.parse(readFileSync(`lib/data/catalogs/${profile.key}.json`));
 assert.equal(c.classKey,profile.key);assert.equal(c.skills.length,35);assert.equal(c.boards.length,6);
 assert.deepEqual(c.boards.map(b=>Number(b.id)),profile.boardIds);
 const byId=new Map(c.skills.map(s=>[s.id,s]));
 for(const id of [...profile.core,...profile.activePriority,...profile.passivePriority,...profile.manual,...profile.movement])assert(byId.has(id),`${profile.key}: missing ${id}`);
 for(const id of [...profile.safeStigmas,...profile.damageStigmas])assert(byId.get(id)?.stigma,`${profile.key}: invalid stigma ${id}`);
 for(const [id,indices] of Object.entries(profile.specPriority))for(const i of indices)assert(byId.get(id)?.specializations[i]);
 for(const col of profile.macroColumns||[])for(const id of col.skills){assert(byId.has(id));assert(!profile.manual.includes(id)&&!profile.movement.includes(id),'manual skill in macro')}
 for(const s of c.skills)assert(existsSync('../public/shadowcraft/game'+s.iconPath),`${profile.key} icon ${s.iconPath}`);
 for(const level of [22,45])for(const mode of ['safe','damage','pvp']){
  const p={...planner.emptyPlan(c),level,mode,pointBudget:level===22?{sp:30,stigma:3,crystal:10,battle:0}:{sp:200,stigma:60,crystal:136,battle:20}};
  const original=JSON.stringify(p),n=recommendBuild(c,p),totals=planner.totals(c,n);
  assert.equal(JSON.stringify(p),original);
  for(const key of ['sp','stigma','crystal','battle'])assert(totals[key]<=totals[key+'Max'],`${profile.key} overspent ${key}`);
  for(const b of c.boards){const connected=new Set(planner.connected(b,n.nodes));for(const node of b.nodes.filter(n2=>n.nodes.includes(n2.id))){assert(connected.has(node.id));assert(node.requiredLevel<=level&&b.requiredLevel<=level)}}
  for(const s of c.skills){assert(n.base[s.id]<=planner.maxBase(s,level));if(s.stigma&&!planner.equipped(n).includes(s.id))assert.equal(n.base[s.id],0);const lv=planner.finalLevel(c,n,s);assert(n.specs[s.id].length<=planner.slots(s,lv));for(const id of n.specs[s.id])assert(s.specializations.find(x=>x.id===id).requiredParentLevel<=lv)}
 }
 console.log(`PASS ${profile.name}: own skills, icons, stigmas, connected boards, safe macros and budgets`);
}
