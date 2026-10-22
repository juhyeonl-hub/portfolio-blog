import {connected,totals,slots,finalLevel,type Catalog,type Plan} from './planner';
import {classProfile} from './classes';
export type Ranker={classKey:string;rank:number;sampleRank:number;name:string;region:string;serverId:number;serverName:string;race:number;combatPower:number;currentCombatPower:number;level:number;characterId:string;verifiedAt:string;sourceProfile:string;equipment:{id:number;name:string;slotPos:number;slotPosName:string;enchantLevel:number;exceedLevel:number}[];skills:{id:number;name:string;category:string;skillLevel:number;equip:number}[]};
export function groupRankers(rows:Ranker[]){
 const groups=new Map<string,{ids:string[];members:Ranker[]}>();
 for(const row of rows){const ids=[...new Set(row.skills.filter(s=>s.category==='Dp'&&s.equip===1).map(s=>String(s.id)))].sort();const key=ids.join(',');const group=groups.get(key)||{ids,members:[]};group.members.push(row);groups.set(key,group)}
 return [...groups.values()].sort((a,b)=>b.members.length-a.members.length);
}
export function compareRankerSkills(left:readonly string[],right:readonly string[]){
 const a=new Set(left),b=new Set(right);
 return {shared:[...a].filter(id=>b.has(id)).sort(),leftOnly:[...a].filter(id=>!b.has(id)).sort(),rightOnly:[...b].filter(id=>!a.has(id)).sort()};
}
// Public final skill levels include unknown equipment bonuses; never infer base investment.
export function previewRankerBoards(catalog:Catalog,plan:Plan,ranker:Ranker,profile:any,options:{allowUnavailable?:boolean}={}):Plan{
 const p=profile?.profile;
 if(ranker.classKey!==catalog.classKey||ranker.classKey!==plan.classKey||profile?.classKey!==ranker.classKey||profile.region!==ranker.region||p?.characterId!==ranker.characterId||String(p?.serverId)!==String(ranker.serverId)||!classProfile(ranker.classKey).pcIds.includes(p?.pcId))throw Error('직업 또는 캐릭터 조회 정보가 일치하지 않습니다.');
 if(!Array.isArray(profile.failedBoards)||profile.failedBoards.length||!Array.isArray(profile.nodes)||!profile.nodes.every((n:unknown)=>typeof n==='string')||!Array.isArray(profile.boards))throw Error('일부 데바니온 조회가 누락되어 복사할 수 없습니다.');
 const nodes=[...new Set<string>(profile.nodes)];const known=new Set(catalog.boards.flatMap(b=>b.nodes.map(n=>n.id)));
 if(nodes.some(id=>!known.has(id)))throw Error('현재 카탈로그에 없는 노드가 있어 복사할 수 없습니다.');
 if(!nodes.length)throw Error('공개된 데바니온 배치가 없습니다.');
 for(const board of catalog.boards){const selected=board.nodes.filter(n=>nodes.includes(n.id)&&!n.autoLearn);
  if(selected.length&&!profile.boards.some((b:any)=>String(b.id)===board.id&&b.open))throw Error('보드 공개 상태를 확인할 수 없습니다.');
  if(!options.allowUnavailable&&selected.length&&board.requiredLevel>plan.level)throw Error('내 캐릭터 레벨에서 열리지 않은 보드가 포함되어 있습니다.');
  if(selected.some(n=>!connected(board,nodes).includes(n.id)))throw Error('연결을 확인할 수 없는 노드가 포함되어 있습니다.');
 }
 const next={...plan,nodes:[...new Set([...nodes,...catalog.boards.flatMap(b=>b.nodes.filter(n=>n.autoLearn).map(n=>n.id))])],specs:{...plan.specs}};
 const used=totals(catalog,next);
 if(!options.allowUnavailable&&(used.crystal>used.crystalMax||used.battle>used.battleMax))throw Error(`내 데바니온 총량이 부족합니다. 필요한 결정 ${used.crystal}, 아스펠 ${used.battle}. 포인트 설정에서 실제 총량을 확인하세요.`);
 // Only remove unavailable existing choices; never manufacture a ranker's hidden specializations.
 for(const skill of catalog.skills){const level=finalLevel(catalog,next,skill);next.specs[skill.id]=(plan.specs[skill.id]||[]).filter(id=>skill.specializations.some(s=>s.id===id&&s.requiredParentLevel<=level)).slice(0,slots(skill,level))}
 return next;
}

export type RankerEquipment=Ranker['equipment'][number];
function equipmentBySlot(value:unknown):Map<number,RankerEquipment>|null{
 if(!Array.isArray(value)||value.length>80)return null;
 const result=new Map<number,RankerEquipment>();
 for(const item of value){
  if(!item||!Number.isSafeInteger(item.id)||item.id<=0||typeof item.name!=='string'||!item.name.length||item.name.length>200||!Number.isSafeInteger(item.slotPos)||item.slotPos<=0||typeof item.slotPosName!=='string'||item.slotPosName.length>80||![item.enchantLevel,item.exceedLevel].every((n:number)=>Number.isSafeInteger(n)&&n>=0&&n<=999)||result.has(item.slotPos))return null;
  result.set(item.slotPos,item);
 }
 return result;
}
export function compareRankerEquipment(left:unknown,right:unknown){
 const a=equipmentBySlot(left),b=equipmentBySlot(right);
 const slots=[...new Set([...(a?.keys()||[]),...(b?.keys()||[])])].sort((x,y)=>x-y);
 return {leftValid:a!==null,rightValid:b!==null,rows:slots.map(slot=>{
  const left=a?.get(slot),right=b?.get(slot);
  const status=!left||!right?'unknown':left.id===right.id&&left.enchantLevel===right.enchantLevel&&left.exceedLevel===right.exceedLevel?'same':'different';
  return {slot,left,right,status};
 })};
}

export function rankerObservationTime(value:unknown){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)||!Number.isFinite(Date.parse(value)))return '시각 미확인';
 return new Intl.DateTimeFormat('ko-KR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
}
export function rankerDisplaySkills(value:unknown):Ranker['skills']|null{
 if(!Array.isArray(value)||value.length>100)return null;
 const ids=new Set<number>();
 for(const s of value){
  if(!s||!Number.isSafeInteger(s.id)||s.id<=0||ids.has(s.id)||typeof s.name!=='string'||!s.name.length||s.name.length>200||!['Active','Passive','Dp'].includes(s.category)||!Number.isSafeInteger(s.skillLevel)||s.skillLevel<0||s.skillLevel>999||![0,1].includes(s.equip))return null;
  ids.add(s.id);
 }
 return value;
}

// Roster kinds shown in the ranker section. The combat-power roster is the Tier List sample; the official kinds
// come from import_official_rankers.py, whose rows carry the ranking point in `combatPower` and the official rank
// in `sampleRank`, so the labels name the score and rank per kind.
export type RosterKind='combat'|'abyss'|'arenaOfSolitude'|'arenaOfCooperation';
export const ROSTER_TEXT:Record<RosterKind,{name:string;subtitle:string;note:string;score:string}>={
 combat:{name:'전투력',subtitle:'전투력 표본 상위 10명 · 선택한 직업',note:'AION2 Tier List의 글로벌 전투력 상위 500명 표본에서 직업별 10명을 골랐습니다. 공식 전체 순위·DPS 순위가 아닙니다. 명단 확인 {0} · 수동 갱신',score:'명단 전투력 {0} · 표본 전체 {1}위'},
 abyss:{name:'어비스',subtitle:'공식 어비스 랭킹 상위 10명 · 선택한 직업',note:'NCSOFT 공식 어비스 랭킹에서 직업별 10명을 골랐습니다. 명단 확인 {0} · 수동 갱신',score:'어비스 점수 {0} · 서버 순위 {1}위'},
 arenaOfSolitude:{name:'고독의 아레나',subtitle:'공식 고독의 아레나 랭킹 상위 10명 · 선택한 직업',note:'NCSOFT 공식 고독의 아레나 랭킹에서 직업별 10명을 골랐습니다. 명단 확인 {0} · 수동 갱신',score:'고독의 아레나 점수 {0} · 서버 순위 {1}위'},
 arenaOfCooperation:{name:'협력의 아레나',subtitle:'공식 협력의 아레나 랭킹 상위 10명 · 선택한 직업',note:'NCSOFT 공식 협력의 아레나 랭킹에서 직업별 10명을 골랐습니다. 명단 확인 {0} · 수동 갱신',score:'협력의 아레나 점수 {0} · 서버 순위 {1}위'}};
export const rosterKind=(metric:unknown):RosterKind=>metric==='abyss'||metric==='arenaOfSolitude'||metric==='arenaOfCooperation'?metric:'combat';
