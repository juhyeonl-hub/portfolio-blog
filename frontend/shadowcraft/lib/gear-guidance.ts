import {equipmentBonus,finalLevel,maxBase,skillCost,totals,equipped,updatePlan,type Catalog,type Plan,type GearItem} from './planner';
import type {BuildLibrary} from './build-library';
export function gearKeepReason(item:GearItem,libraries:BuildLibrary[]|null){
 const names=libraries?.flatMap(l=>[...l.entries,...(l.recovery?[l.recovery]:[])]).filter(b=>b.plan.gear?.items.some(x=>x.id===item.id&&(x.current||x.target))).map(b=>b.name)||[];
 return {kind:!item.owned?'wanted':item.current?'current':item.target?'target':names.length?'saved':'review',names:[...new Set(names)],checked:libraries!==null};
}
// Preserve each affected skill's current final level, subject to real learning gates.
// This is a point-cost comparison, not a combat-performance recommendation.
export function gearReinvestment(c:Catalog,p:Plan){
 const gear=p.gear;if(gear?.mode==='target')return null;if(!gear?.items.some(x=>x.current&&x.owned)||!gear.items.some(x=>x.target))return null;
 const current={...p,gear:{...gear,mode:'current' as const}},target={...p,gear:{...gear,mode:'target' as const}},base={...p.base};
 const rows=c.skills.filter(s=>(!s.stigma||equipped(p).includes(s.id))&&equipmentBonus(current,s.id)!==equipmentBonus(target,s.id)).map(s=>{
  const goal=finalLevel(c,current,s),before=p.base[s.id]??(s.stigma?0:1),cap=maxBase(s,p.level,p.ascensionGrade3Confirmed);
  const allowed=[0,...s.learning.map(l=>Number(l.level)).filter(n=>n<=cap)].filter(n=>s.stigma||cap===0||n>=1);
  const after=[...new Set(allowed)].sort((a,b)=>a-b).find(n=>finalLevel(c,{...target,base:{...base,[s.id]:n}},s)>=goal);
  if(after!==undefined)base[s.id]=after;
  return {skill:s,goal,before,after:after??null,delta:after===undefined?null:skillCost(s,after)-skillCost(s,before)};
 });
 const next=updatePlan(c,p,{base,gear:target.gear}),before=totals(c,current),after=totals(c,next);
 const blocked=rows.some(r=>r.after===null),spShort=Math.max(0,after.sp-after.spMax),stigmaShort=Math.max(0,after.stigma-after.stigmaMax);
 return {rows,next,before,after,blocked,spShort,stigmaShort,canApply:rows.length>0&&!blocked&&!spShort&&!stigmaShort};
}
