import {classProfile} from './classes';
import {type Catalog,type Plan,type Board,type Node,CORE,equipped,pointLimits,applyRecommended,finalLevel,recommendSpecs} from './planner';

function nodeValue(c:Catalog,p:Plan,n:Node,battle:boolean):number {
 const profile=classProfile(c.classKey||p.classKey);if(n.autoLearn)return 0;
 if(n.skill){
  const s=c.skills.find(s=>s.id===n.skill!.id);
  if(!s||s.stigma&&!equipped(p).includes(s.id))return 0;
  const level=finalLevel(c,p,s);if(level>=s.maxLevel)return 0;
  const milestone=[8,12,16,20].some(v=>level<v&&level+(n.skillLevels||1)>=v);
  if(profile.sourceBoardWeights?.[s.id]!==undefined)return profile.sourceBoardWeights[s.id]+(milestone?30:0);
  if(profile.core.includes(s.id))return milestone?65:28;
  if(profile.passivePriority.slice(0,4).includes(s.id))return 15;
  if(profile.activePriority.slice(3,6).includes(s.id))return 10;
  return s.kind==='passive'?6:2;
 }
 const name=n.stat?.name||'';
 if(battle){
  // PvP: the Azphel board's PvP-only nodes first (offence, then survival); other nodes are filler.
  if(p.mode==='pvp'){if(/^PVP (공격력|피해 증폭|치명타|명중)$/.test(name))return 14;if(/^PVP /.test(name))return 10;return 2;}
  if(p.mode==='safe'&&/피해 내성|상태이상 저항|생명력/.test(name))return 8;
  return /공격력|피해 증폭|명중|치명타$/.test(name)?8:2;
 }
 if(/전투 속도|재시전 시간 감소/.test(name))return 14;
 if(/피해 증폭|다단 히트 적중/.test(name))return 11;
 if(name==='치명타'||name==='추가 공격력')return 6;
 if(p.mode==='pvp'&&/상태이상 저항|치명타 저항|상태이상 적중/.test(name))return 9;
 if(/생명력|피해 내성|추가 방어력/.test(name))return p.mode==='safe'?5:p.mode==='pvp'?4:1;
 return 1;
}

// Shortest incremental paths from the connected selected set, once per board.
function paths(board:Board,selected:Set<string>){
 const byId=new Map(board.nodes.map(n=>[n.id,n]));
 const byPosition=new Map(board.nodes.map(n=>[`${n.row},${n.column}`,n]));
 const pending=new Set(byId.keys()),dist=new Map<string,number>(),prev=new Map<string,string>();
 for(const n of board.nodes)dist.set(n.id,selected.has(n.id)?0:Infinity);
 while(pending.size){
  let id='',best=Infinity;for(const next of pending){const d=dist.get(next)!;if(d<best){best=d;id=next}}
  if(!id)break;pending.delete(id);const n=byId.get(id)!;
  for(const [r,col] of [[n.row-1,n.column],[n.row+1,n.column],[n.row,n.column-1],[n.row,n.column+1]]){
   const m=byPosition.get(`${r},${col}`);if(!m||!pending.has(m.id))continue;
   const d=best+(selected.has(m.id)?0:m.pointCost);
   if(d<dist.get(m.id)!){dist.set(m.id,d);prev.set(m.id,id)}
  }
 }
 return {dist,path:(target:string)=>{const out:string[]=[];let id:string|undefined=target;while(id){if(!selected.has(id))out.push(id);id=prev.get(id)}return out.reverse()}};
}

export function recommendBuild(c:Catalog,p:Plan):Plan {
 const allowed=c.boards.filter(b=>b.requiredLevel<=p.level).map(b=>({...b,nodes:b.nodes.filter(n=>n.requiredLevel<=p.level)}));
 let next=applyRecommended(c,{...p,nodes:allowed.flatMap(b=>b.nodes.filter(n=>n.autoLearn).map(n=>n.id))});
 const selected=new Set(next.nodes),limits=pointLimits(c,p);
 for(const battle of [false,true]){
  let remaining=battle?limits.battle:limits.crystal;
  const boards=allowed.filter(b=>(b.pointKind.code==='battlecrystal')===battle);
  for(let iteration=0;iteration<c.boards.reduce((sum,b)=>sum+b.nodes.length,0);iteration++){
   let best:{ids:string[];cost:number;score:number}|undefined;
   for(const board of boards){
    const routes=paths(board,selected);const byId=new Map(board.nodes.map(n=>[n.id,n]));
    for(const n of board.nodes){
     const cost=routes.dist.get(n.id)!;
     if(selected.has(n.id)||!Number.isFinite(cost)||cost>remaining)continue;
     const ids=routes.path(n.id);if(!ids.length)continue;
     const value=ids.reduce((sum,id)=>sum+nodeValue(c,next,byId.get(id)!,battle),0);
     if(value<=0)continue;
     const score=value/Math.max(1,cost);
     if(!best||score>best.score||(score===best.score&&cost<best.cost))best={ids,cost,score};
    }
   }
   if(!best)break;
   best.ids.forEach(id=>selected.add(id));remaining-=best.cost;next={...next,nodes:[...selected]};
  }
 }
 // Board levels can hit the cap; reallocate any redundant basic investment.
 next=applyRecommended(c,next);
 next.specs=Object.fromEntries(c.skills.map(s=>[s.id,recommendSpecs(s,finalLevel(c,next,s),next.mode)]));
 return next;
}

/** Read-only target subset; separate currencies and prerequisite paths use the existing planner rules. */
export function recommendTargetNodes(c:Catalog,p:Plan,target:Plan):string[]{
 const goal=new Set(target.nodes);
 const restricted={...c,boards:c.boards.map(b=>({...b,nodes:b.nodes.filter(n=>n.autoLearn||goal.has(n.id))}))};
 return recommendBuild(restricted,{...p,nodes:[]}).nodes;
}
