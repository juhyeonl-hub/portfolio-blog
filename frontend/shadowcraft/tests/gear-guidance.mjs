import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl,plannerUrl,planner} from './modules.mjs';
const {gearKeepReason,gearReinvestment}=await import(moduleUrl(readFileSync('lib/gear-guidance.ts','utf8').replace("'./planner'",JSON.stringify(plannerUrl))));
const item=(id,bonus,flags={})=>({id,name:id,slot:'주무기',owned:true,current:false,target:false,bonuses:bonus,note:'',...flags});
assert.equal(gearKeepReason(item('a',{}, {current:true}),null).kind,'current');
assert.equal(gearKeepReason(item('a',{}, {target:true}),[]).kind,'target');
assert.equal(gearKeepReason(item('a',{}, {owned:false}),[]).kind,'wanted');
assert.equal(gearKeepReason(item('a',{}),[]).kind,'review');
assert.equal(gearKeepReason(item('a',{}),null).checked,false);
const library=[{entries:[{name:'PvP',plan:{gear:{items:[item('a',{}, {target:true})]}}}],recovery:null}];
assert.deepEqual(gearKeepReason(item('a',{}),library).names,['PvP']);
for(const key of ['assassin','gladiator','templar','ranger','elementalist','sorcerer','cleric','chanter']){
 const c=JSON.parse(readFileSync(`lib/data/catalogs/${key}.json`)),original=planner.emptyPlan(c),skill=c.skills.find(s=>!s.stigma&&planner.maxBase(s,45)>=8);
 const p={...original,base:{...original.base,[skill.id]:8},pointBudget:{sp:9999,stigma:9999,crystal:9999,battle:9999},gear:{mode:'current',items:[item('a',{[skill.id]:2},{current:true}),item('b',{[skill.id]:4},{target:true})]}};
 const saved=JSON.stringify(p),r=gearReinvestment(c,p);assert(r.canApply,key);assert.equal(JSON.stringify(p),saved);
 assert.equal(r.rows[0].after,6,key);assert(r.after.sp<r.before.sp);assert.equal(planner.finalLevel(c,r.next,skill),planner.finalLevel(c,p,skill));assert.deepEqual(r.next.nodes,p.nodes);assert.equal(gearReinvestment(c,r.next),null,'applied target cannot repeatedly reduce base levels');
 const poor=gearReinvestment(c,{...p,pointBudget:{...p.pointBudget,sp:0}});assert(!poor.canApply);assert(poor.spShort>0);
 const reverse={...p,gear:{...p.gear,items:[item('a',{[skill.id]:4},{current:true}),item('b',{[skill.id]:2},{target:true})]}};
 const up=gearReinvestment(c,reverse);if(!up.blocked){assert(up.rows[0].after>=8);assert.equal(planner.finalLevel(c,up.next,skill),planner.finalLevel(c,reverse,skill));}
 const capped=gearReinvestment(c,{...p,base:{...p.base,[skill.id]:planner.maxBase(skill,45)},gear:{mode:'current',items:[item('a',{[skill.id]:20},{current:true}),item('b',{[skill.id]:0},{target:true})]}});assert(capped.blocked);assert(!capped.canApply);
 assert.equal(gearReinvestment(c,{...p,gear:{...p.gear,items:[]}}),null);
 console.log(key+': final skill levels, point costs, gates, budgets, immutable plan PASS');
}
console.log('Keep reasons and saved-build references PASS');
