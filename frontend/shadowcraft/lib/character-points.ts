import {type Catalog,type Plan,type PointBudget,skillCost} from './planner';
// Count the public character snapshot, never the editable target plan.
export function characterPoints(c:Catalog,character:any,gearBonus:Record<string,number>|null=null){
 const owned=new Set<string>(Array.isArray(character?.nodes)?character.nodes.map(String):[]);
 const all=c.boards.flatMap(b=>b.nodes),known=new Set(all.map(n=>n.id));
 const countsMatch=!Array.isArray(character?.boards)||character.boards.every((b:any)=>{
  if(!b.open||!Number.isInteger(b.openNodeCount))return true;
  const board=c.boards.find(x=>String(x.id)===String(b.id));
  return !!board&&board.nodes.filter(n=>!n.autoLearn&&owned.has(n.id)).length===b.openNodeCount;
 });
 const boardsKnown=Array.isArray(character?.nodes)&&!character?.failedBoards?.length&&countsMatch&&[...owned].every(id=>known.has(id));
 const bonus:Record<string,number>={};let crystal=0,battle=0,ariel=0;
 for(const b of c.boards)for(const n of b.nodes)if(owned.has(n.id)){
  if(!n.autoLearn){if(b.pointKind.code==='battlecrystal')battle+=n.pointCost;else if(b.pointKind.code==='conquestcrystal')ariel+=n.pointCost;else if(b.pointKind.code==='daevanioncrystal')crystal+=n.pointCost;}
  if(n.skill)bonus[n.skill.id]=(bonus[n.skill.id]||0)+(n.skillLevels||0);
 }
 let sp=0,stigma=0,skillsKnown=boardsKnown&&gearBonus!==null&&Array.isArray(character?.skills)&&character.skills.length>0;
 for(const s of c.skills){
  const actual=character?.skills?.find((x:any)=>String(x.id)===s.id);
  if(!actual){if(s.learning.some(l=>l.requiredCharacterLevel<=character?.profile?.characterLevel))skillsKnown=false;continue;}
  const raw=actual.skillLevel;
  if(!Number.isInteger(raw)||raw<0){skillsKnown=false;continue;}
  const base=raw===0?0:raw-(bonus[s.id]||0)-(gearBonus?.[s.id]||0);
  if(base<0||!s.learning.some(l=>l.level===base)&&base!==0){skillsKnown=false;continue;}
  const cost=skillCost(s,base);if(s.stigma)stigma+=cost;else sp+=cost;
 }
 return {sp:skillsKnown?sp:null,stigma:skillsKnown?stigma:null,crystal:boardsKnown?crystal:null,battle:boardsKnown?battle:null,ariel:boardsKnown?ariel:null};
}
export function pointBalance(total:number|undefined,spent:number|null){return spent===null?null:(total??0)<spent?null:(total??0)-spent;}

// A confirmed game balance is independent of estimated/configured totals.
export function confirmRemaining(plan:Plan,points:PointBudget,key:keyof PointBudget,remaining:number,spent:number|null):Partial<Plan>|null {
 if(!plan.character||plan.level!==plan.character.profile?.characterLevel||!Number.isInteger(remaining)||remaining<0||remaining>9999)return null;
 const patch:Partial<Plan>={confirmedRemaining:{...plan.confirmedRemaining,[key]:remaining}};
 // Unknown or out-of-range totals must not destroy a valid confirmation.
 if(spent!==null&&spent+remaining<=9999)patch.pointBudget={...points,[key]:spent+remaining};
 return patch;
}
