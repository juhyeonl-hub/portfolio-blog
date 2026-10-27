import {boardBonus,equipmentBonus,finalLevel,maxBase,pointLimits,recommendSpecs,skillCost,slots,totals,type Catalog,type Plan} from './planner';
import {classProfile} from './classes';
import {rankerDisplaySkills,type Ranker} from './ranker-builds';

// A personal reference allocation. Never reconstruct the ranker's unknown base investment/specs.
export function previewRankerSkills(c:Catalog,p:Plan,r:Ranker,profile:any,specMode:'suggest'|'keep'='suggest'){
 const identity=profile?.profile;
 if(r.classKey!==c.classKey||r.classKey!==p.classKey||profile?.classKey!==r.classKey||profile.region!==r.region||identity?.characterId!==r.characterId||String(identity?.serverId)!==String(r.serverId)||!classProfile(r.classKey).pcIds.includes(identity?.pcId))throw Error('skillIdentity');
 const observed=rankerDisplaySkills(profile.skills);
 if(!observed||observed.length!==c.skills.length)throw Error('skillIncomplete');
 const byId=new Map(observed.map(s=>[String(s.id),s]));
 if(c.skills.some(s=>{const o=byId.get(s.id);return !o||o.skillLevel>s.maxLevel||o.category!==(s.stigma?'Dp':s.kind==='passive'?'Passive':'Active')}))throw Error('skillIncomplete');
 const caps=pointLimits(c,p),capacity=[22,27,32,37].filter(l=>p.level>=l).length;
 const eligible=c.skills.filter(s=>s.stigma&&byId.get(s.id)!.equip===1&&byId.get(s.id)!.skillLevel>0&&maxBase(s,p.level,p.ascensionGrade3Confirmed)>0);
 // Choosing among excess observed Stigma is a site rule, not a claim about the ranker's priority.
 const selected=[...eligible].sort((a,b)=>byId.get(b.id)!.skillLevel-byId.get(a.id)!.skillLevel).slice(0,capacity).map(s=>s.id);
 const next:Plan={...p,base:{...p.base},specs:{...p.specs},stigmaSkills:selected};
 const goals=new Map<string,number>();
 for(const s of c.skills){
  const cap=maxBase(s,p.level,p.ascensionGrade3Confirmed),floor=!s.stigma&&cap>0?1:0;
  next.base[s.id]=floor;
  const desired=Math.max(floor,byId.get(s.id)!.skillLevel-equipmentBonus(p,s.id)-boardBonus(c,p,s.id));
  goals.set(s.id,s.stigma&&!selected.includes(s.id)?0:Math.max(floor,...s.learning.filter(l=>l.level<=Math.min(cap,desired)).map(l=>l.level)));
 }
 const full:Plan={...next,base:{...next.base}};for(const [id,goal] of goals)full.base[id]=goal;
 for(const stigma of [false,true]){
  let remaining=stigma?caps.stigma:caps.sp;
  // Progressively fill each paid goal; larger public targets break ties. Costs come from learning data.
  while(true){
   const choices=c.skills.filter(s=>s.stigma===stigma&&next.base[s.id]<goals.get(s.id)!).map(s=>{
    const current=next.base[s.id],level=s.learning.find(l=>l.level>current&&l.level<=goals.get(s.id)!);
    const cost=level?skillCost(s,level.level)-skillCost(s,current):Infinity;
    return {s,level:level?.level,cost,progress:skillCost(s,current)/Math.max(1,skillCost(s,goals.get(s.id)!))};
   }).filter(x=>x.level!==undefined&&Number.isFinite(x.cost)&&x.cost>=0&&x.cost<=remaining)
    .sort((a,b)=>a.progress-b.progress||byId.get(b.s.id)!.skillLevel-byId.get(a.s.id)!.skillLevel);
   if(!choices.length)break;
   const choice=choices[0];next.base[choice.s.id]=choice.level!;remaining-=choice.cost;
  }
 }
 for(const s of c.skills){const level=finalLevel(c,next,s);next.specs[s.id]=specMode==='suggest'?recommendSpecs(s,level,p.mode):[...new Set(p.specs[s.id]||[])].filter(id=>s.specializations.some(x=>x.id===id&&x.requiredParentLevel<=level)).slice(0,slots(s,level));}
 const used=totals(c,next),required=totals(c,full);
 if(used.sp>used.spMax||used.stigma>used.stigmaMax)throw Error('skillIncomplete');
 return {plan:next,used,required,unreached:c.skills.filter(s=>(!s.stigma||byId.get(s.id)!.equip===1)&&finalLevel(c,next,s)<byId.get(s.id)!.skillLevel).length,
  gated:c.skills.filter(s=>byId.get(s.id)!.skillLevel>0&&maxBase(s,p.level,p.ascensionGrade3Confirmed)===0).length,
  omittedStigma:observed.filter(s=>s.category==='Dp'&&s.equip===1&&!selected.includes(String(s.id))).length};
}
