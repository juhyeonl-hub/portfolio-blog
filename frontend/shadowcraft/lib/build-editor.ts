import {connected,cheapestPath,equipped,finalLevel,maxBase,slots,totals,type Catalog,type Plan,type Board} from './planner';
/** Manual authoring never applies recommendations or writes the personal planner. */
export function editBuildDraft(c:Catalog,p:Plan,patch:Partial<Plan>):Plan {
 const next={...p,...patch,base:{...(patch.base||p.base)},specs:{...(patch.specs||p.specs)}};
 if(patch.level!==undefined&&patch.level!==p.level){next.pointBudget=undefined;next.extraSP=next.extraStigma=next.extraCrystal=next.extraBattle=0;next.stigmaSkills=equipped(next);}
 if(patch.level!==undefined||patch.ascensionGrade3Confirmed!==undefined){
  for(const s of c.skills)next.base[s.id]=Math.min(next.base[s.id]??(s.stigma?0:1),maxBase(s,next.level,next.ascensionGrade3Confirmed));
  next.nodes=c.boards.flatMap(b=>b.requiredLevel>next.level?[]:connected(b,next.nodes.filter(id=>b.nodes.some(n=>n.id===id&&n.requiredLevel<=next.level))));
 }
 for(const s of c.skills){const lv=finalLevel(c,next,s);next.specs[s.id]=(next.specs[s.id]||[]).filter(id=>s.specializations.some(x=>x.id===id&&x.requiredParentLevel<=lv)).slice(0,slots(s,lv));}
 return next;
}
export function changeDraftNode(c:Catalog,p:Plan,b:Board,id:string):Plan {
 const node=b.nodes.find(n=>n.id===id);if(!node||node.autoLearn||b.requiredLevel>p.level||node.requiredLevel>p.level)return p;
 let nodes:string[];
 if(p.nodes.includes(id))nodes=[...p.nodes.filter(x=>!b.nodes.some(n=>n.id===x)),...connected(b,p.nodes.filter(x=>x!==id))];
 else {const eligible={...b,nodes:b.nodes.filter(n=>n.requiredLevel<=p.level)};const path=cheapestPath(eligible,p.nodes,id);nodes=[...new Set([...p.nodes,...path])];}
 return editBuildDraft(c,p,{nodes});
}
export function draftProblems(c:Catalog,p:Plan):string[]{
 const result:string[]=[];const n=totals(c,p);
 if(n.sp>n.spMax||n.stigma>n.stigmaMax||n.crystal>n.crystalMax||n.battle>n.battleMax)result.push('사용 포인트가 총량을 넘습니다. 배분을 줄이거나 총량을 확인하세요.');
 if(c.skills.some(s=>(p.base[s.id]??(s.stigma?0:1))>maxBase(s,p.level,p.ascensionGrade3Confirmed)))result.push('현재 레벨·승급 조건에 맞지 않는 스킬이 있습니다.');
 if((p.stigmaSkills?.length||0)>[22,27,32,37].filter(l=>p.level>=l).length)result.push('사용 가능한 스티그마 칸을 초과했습니다.');
 if(c.boards.some(b=>{const chosen=b.nodes.filter(n=>p.nodes.includes(n.id)&&!n.autoLearn);const linked=connected(b,p.nodes);return chosen.some(n=>b.requiredLevel>p.level||n.requiredLevel>p.level||!linked.includes(n.id));}))result.push('데바니온의 레벨 조건이나 연결 경로를 확인하세요.');
 return result;
}
