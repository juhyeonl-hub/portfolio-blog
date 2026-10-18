import {connected,totals,slots,finalLevel,type Catalog,type Plan} from './planner';
import {classProfile} from './classes';
export type Ranker={classKey:string;rank:number;sampleRank:number;name:string;region:string;serverId:number;serverName:string;race:number;combatPower:number;currentCombatPower:number;level:number;characterId:string;verifiedAt:string;sourceProfile:string;equipment:{id:number;name:string;slotPos:number;slotPosName:string;enchantLevel:number;exceedLevel:number}[];skills:{id:number;name:string;category:string;skillLevel:number;equip:number}[]};
export function groupRankers(rows:Ranker[]){
 const groups=new Map<string,{ids:string[];members:Ranker[]}>();
 for(const row of rows){const ids=[...new Set(row.skills.filter(s=>s.category==='Dp'&&s.equip===1).map(s=>String(s.id)))].sort();const key=ids.join(',');const group=groups.get(key)||{ids,members:[]};group.members.push(row);groups.set(key,group)}
 return [...groups.values()].sort((a,b)=>b.members.length-a.members.length);
}
// Public final skill levels include unknown equipment bonuses; never infer base investment.
export function previewRankerBoards(catalog:Catalog,plan:Plan,ranker:Ranker,profile:any):Plan{
 const p=profile?.profile;
 if(ranker.classKey!==catalog.classKey||ranker.classKey!==plan.classKey||profile?.classKey!==ranker.classKey||profile.region!==ranker.region||p?.characterId!==ranker.characterId||String(p?.serverId)!==String(ranker.serverId)||!classProfile(ranker.classKey).pcIds.includes(p?.pcId))throw Error('직업 또는 캐릭터 조회 정보가 일치하지 않습니다.');
 if(!Array.isArray(profile.failedBoards)||profile.failedBoards.length||!Array.isArray(profile.nodes)||!profile.nodes.every((n:unknown)=>typeof n==='string')||!Array.isArray(profile.boards))throw Error('일부 데바니온 조회가 누락되어 복사할 수 없습니다.');
 const nodes=[...new Set<string>(profile.nodes)];const known=new Set(catalog.boards.flatMap(b=>b.nodes.map(n=>n.id)));
 if(nodes.some(id=>!known.has(id)))throw Error('현재 카탈로그에 없는 노드가 있어 복사할 수 없습니다.');
 if(!nodes.length)throw Error('공개된 데바니온 배치가 없습니다.');
 for(const board of catalog.boards){const selected=board.nodes.filter(n=>nodes.includes(n.id)&&!n.autoLearn);
  if(selected.length&&!profile.boards.some((b:any)=>String(b.id)===board.id&&b.open))throw Error('보드 공개 상태를 확인할 수 없습니다.');
  if(selected.length&&board.requiredLevel>plan.level)throw Error('내 캐릭터 레벨에서 열리지 않은 보드가 포함되어 있습니다.');
  if(selected.some(n=>!connected(board,nodes).includes(n.id)))throw Error('연결을 확인할 수 없는 노드가 포함되어 있습니다.');
 }
 const next={...plan,nodes:[...new Set([...nodes,...catalog.boards.flatMap(b=>b.nodes.filter(n=>n.autoLearn).map(n=>n.id))])],specs:{...plan.specs}};
 const used=totals(catalog,next);
 if(used.crystal>used.crystalMax||used.battle>used.battleMax)throw Error(`내 데바니온 총량이 부족합니다. 필요한 결정 ${used.crystal}, 아스펠 ${used.battle}. 포인트 설정에서 실제 총량을 확인하세요.`);
 // Only remove unavailable existing choices; never manufacture a ranker's hidden specializations.
 for(const skill of catalog.skills){const level=finalLevel(catalog,next,skill);next.specs[skill.id]=(plan.specs[skill.id]||[]).filter(id=>skill.specializations.some(s=>s.id===id&&s.requiredParentLevel<=level)).slice(0,slots(skill,level))}
 return next;
}
