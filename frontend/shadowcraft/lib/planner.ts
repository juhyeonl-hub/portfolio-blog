import {CLASSES,classProfile} from './classes';
import ascensionRules from './data/ascension-rules.json';
export type Skill = {id:string;name:string;iconPath:string;kind:string;stigma:boolean;maxLevel:number;learning:any[];specializationSlots:any[];specializations:any[]};
export type Node = {id:string;row:number;column:number;kind:string;name:string;grade?:string;iconPath:string;autoLearn:boolean;requiredLevel:number;pointCost:number;skill?:{id:string;name:string;iconPath:string};skillLevels?:number;stat?:{name:string;value:number;format:string};};
export type Board={id:string;name:string;requiredLevel:number;rows:number;columns:number;pointKind:{code:string;name:string};nodes:Node[]};
export type Catalog={reviewRequired?:boolean;baselineVersion?:string;origin?:string;classKey?:string;className?:string;version:string|null;checkedAt:string;source:string;skills:Skill[];boards:Board[];characterLevels:any[]};
export type PointBudget={sp:number;stigma:number;crystal:number;battle:number};
export type GearItem={id:string;name:string;slot:string;owned:boolean;current:boolean;target:boolean;bonuses:Record<string,number>;note:string};
export type Gear={mode:"manual"|"current"|"target";items:GearItem[]};
export type Plan={ascensionGrade3Confirmed?:boolean;searchPrefs?:{region:string;server:string;name:string};recentCharacters?:import('./plan-memory').RecentCharacter[];macroExtra?:boolean;gear?:Gear;classKey?:string;pointBudget?:PointBudget;level:number;extraSP:number;extraStigma:number;extraCrystal:number;extraBattle:number;mode:'safe'|'damage'|'pvp';base:Record<string,number>;bonus:Record<string,number>;specs:Record<string,string[]>;nodes:string[];checked:string[];character:any|null;};
export const CORE=['13350000','13130000','13010000'];
export const MOVEMENT=['13070000','13360000','13050000','13220000','13280000','13700000','13140000'];
export const MANUAL=['13070000','13360000','13050000','13220000','13260000','13340000'];
export const ORDER=['13350000','13130000','13010000','13100000','13060000','13070000','13360000','13050000','13260000','13340000','13210000','13220000'];
export const ROLES:Record<string,string>={'13350000':'주력 연속 공격','13130000':'문양 소모 · 핵심 피해','13010000':'정신력 회복 · 문폭 쿨 감소','13100000':'문양 보충','13060000':'후방 공격 · 수동','13070000':'뒤편으로 이동','13360000':'뒤편으로 이동','13050000':'반대편으로 이동','13220000':'대상에게 이동','13260000':'상태 이상 해제','13340000':'그로기 구간용','13210000':'보조 공격','13310000':'폭딜 버프','13390000':'전투 속도 버프','13300000':'버프 사용 후 쿨 감소','13080000':'타이밍을 맞추는 생존기','13270000':'문양 5중첩 생성'};
export function skillCost(s:Skill,lv:number){return s.learning.filter(l=>l.level<=lv).reduce((n,l)=>n+(s.stigma?l.stigmaPoints:l.skillPoints),0)}
export function ascensionGate(s:Skill){return (ascensionRules.requiredFromLevel as Record<string,number>)[s.id]}
export function maxBase(s:Skill,lv:number,ascensionGrade3Confirmed=false){
 const gate=ascensionGate(s);const limit=gate&&!ascensionGrade3Confirmed?gate-1:Infinity;
 return Math.max(0,...s.learning.filter(l=>l.requiredCharacterLevel<=lv&&l.level<=limit).map(l=>l.level));
}
export function unmetAscensionSkills(c:Catalog,p:Plan){return p.ascensionGrade3Confirmed?[]:c.skills.filter(s=>ascensionGate(s)&&(p.base[s.id]??(s.stigma?0:1))>=ascensionGate(s));}
export function boardBonus(c:Catalog,p:Plan,id:string){
 // Most board nodes do not affect this skill; avoid allocating/scanning a selected-node list for them.
 let bonus=0;
 for(const board of c.boards)if(board.requiredLevel<=p.level){
  for(const node of board.nodes)if(node.skill?.id===id&&p.nodes.includes(node.id))bonus+=node.skillLevels||0;
 }
 return bonus;
}
export function equipmentBonus(p:Plan,id:string):number {
 if(!p.gear||p.gear.mode==='manual')return p.bonus[id]||0;
 const items=p.gear.items||[],chosen=new Map<string,GearItem>();
 for(const item of items)if(item.current&&item.owned)chosen.set(item.slot,item);
 if(p.gear.mode==='target')for(const item of items)if(item.target)chosen.set(item.slot,item);
 return [...chosen.values()].reduce((sum,item)=>sum+Math.max(0,Math.min(30,Math.floor(Number(item.bonuses?.[id])||0))),0);
}
export function updatePlan(c:Catalog,p:Plan,patch:Partial<Plan>):Plan {
 const next={...p,...patch};
 // A budget entered for another level/character must not fund this growth plan.
 const switched=patch.character && ['characterId','serverId'].some(k=>String(patch.character.profile?.[k])!==String(p.character?.profile?.[k]));
 if((patch.level!==undefined&&patch.level!==p.level)||switched){
  if(!Object.prototype.hasOwnProperty.call(patch,'pointBudget'))next.pointBudget=undefined;
  for(const key of ['extraSP','extraStigma','extraCrystal','extraBattle'] as const)if(patch[key]===undefined)next[key]=0;
 }
 // Recompute only when the effective level or recommendation mode changes.
 if(!patch.specs){next.specs={...p.specs};for(const s of c.skills)if(finalLevel(c,p,s)!==finalLevel(c,next,s)||p.mode!==next.mode)next.specs[s.id]=recommendSpecs(s,finalLevel(c,next,s),next.mode);}
 return next;
}
export function finalLevel(c:Catalog,p:Plan,s:Skill){if(ascensionGate(s)&&!p.ascensionGrade3Confirmed&&p.base[s.id]===0)return 0;return Math.min(s.maxLevel,(p.base[s.id]??(s.stigma?0:1))+equipmentBonus(p,s.id)+boardBonus(c,p,s.id))}
export function slots(s:Skill,level:number){return s.specializationSlots.filter(x=>x.editable&&x.requiredSkillLevel<=level).length}
// Korean labels of the recommendation modes; screens translate them.
export const MODE_NAMES:Record<Plan['mode'],string>={safe:'안정형',damage:'공격형',pvp:'PvP형'};
export function equipped(p:Plan){const profile=classProfile(p.classKey);return (p.mode==='safe'?profile.safeStigmas:profile.damageStigmas).slice(0,[22,27,32,37].filter(l=>p.level>=l).length)}
const cleanPoints=(n:number)=>Number.isFinite(n)?Math.max(0,Math.min(9999,Math.floor(n))):0;
// Legacy extras are user-entered additions to level rewards; preserve that meaning.
export function hasCustomPointBudget(p:Plan):boolean {
 return p.pointBudget!==undefined||[p.extraSP,p.extraStigma,p.extraCrystal,p.extraBattle].some(n=>Number.isFinite(n)&&n>0);
}
// Global 2.0.7.0 level cap. Do not extend this reward bundle to future caps.
export const ENDGAME_POINTS={level:45,regionalQuests:58,sealedDungeons:61,pointsPerDungeon:2} as const;
export function isEndgamePointLevel(p:Plan){return p.level===ENDGAME_POINTS.level}
export function pointBudgetSourceLabel(p:Plan){return hasCustomPointBudget(p)?'총량: 직접 입력한 값':isEndgamePointLevel(p)?'총량: 45레벨 콘텐츠 완료 기준':'총량: 레벨별 최소 기준'}
export function pointLimits(c:Catalog,p:Plan):PointBudget {
 const level=c.characterLevels.filter(l=>Number.isFinite(l.level)&&l.level<=p.level).sort((a,b)=>b.level-a.level)[0]||{skillPoints:0,stigmaPoints:0,daevanionPoints:[]};
 // 58 regional rewards + (60 home sealed + 1 Lv45 sealed) × 2, per faction.
 // Verified against installed Global quest/dungeon data; evidence in tasks/asbc-point-baseline-release-20261023.md.
 // Strongholds are part of the completion assumption, with no separate point grant added.
 // Shops, events, ascension extras and Azphel are not included. Never add these to a personal/legacy budget.
 const completion=isEndgamePointLevel(p)&&!hasCustomPointBudget(p)?ENDGAME_POINTS.regionalQuests+ENDGAME_POINTS.sealedDungeons*ENDGAME_POINTS.pointsPerDungeon:0;
 const fallback={sp:level.skillPoints+completion+(p.extraSP||0),stigma:level.stigmaPoints+(p.extraStigma||0),crystal:(level.daevanionPoints.find((d:any)=>d.kind==='daevanioncrystal')?.amount||0)+completion+(p.extraCrystal||0),battle:p.extraBattle||0};
 return Object.fromEntries((['sp','stigma','crystal','battle'] as const).map(k=>[k,cleanPoints(p.pointBudget?.[k]??fallback[k])])) as PointBudget;
}
export function totals(c:Catalog,p:Plan){const cap=pointLimits(c,p);const all=c.boards.flatMap(b=>b.nodes.map(n=>({...n,battle:b.pointKind.code==='battlecrystal'})));return {sp:c.skills.filter(s=>!s.stigma).reduce((a,s)=>a+skillCost(s,p.base[s.id]??1),0),spMax:cap.sp,stigma:c.skills.filter(s=>s.stigma&&equipped(p).includes(s.id)).reduce((a,s)=>a+skillCost(s,p.base[s.id]??0),0),stigmaMax:cap.stigma,crystal:all.filter(n=>!n.battle&&p.nodes.includes(n.id)).reduce((a,n)=>a+n.pointCost,0),crystalMax:cap.crystal,battle:all.filter(n=>n.battle&&p.nodes.includes(n.id)).reduce((a,n)=>a+n.pointCost,0),battleMax:cap.battle}}
export function recommendSpecs(s:Skill,lv:number,mode:string){const n=slots(s,lv);let order:number[]=[];if(s.id==='13350000')order=lv>=16?[4,3,mode==='safe'?0:2]:[3,mode==='safe'?0:2,1];else if(s.id==='13130000')order=[lv>=16?4:2,2,1];else if(s.id==='13010000')order=[4,3,2,0];else if(s.id==='13100000')order=[1,3,2];else if(s.id==='13060000')order=[4,0,1];else if(s.id==='13070000')order=[1];else if(s.id==='13360000')order=[0,1];else if(s.id==='13050000')order=[1,3];else if(s.id==='13260000')order=[4,2,3];else if(s.id==='13340000')order=[4,3,1];else order=CLASSES.map(p=>p.specPriority[s.id]).find(Boolean)||[0,1,2,3,4];return [...new Set(order)].map(i=>s.specializations[i]).filter(x=>x&&x.requiredParentLevel<=lv).slice(0,n).map(x=>x.id)}
// A transparent priority recommendation, not a combat/DPS simulation.
export function applyRecommended(c:Catalog,p:Plan){
 const next={...p,base:{...p.base},specs:{...p.specs}};
 c.skills.forEach(s=>next.base[s.id]=s.stigma?0:(maxBase(s,p.level,p.ascensionGrade3Confirmed)>0?1:0));
 const profile=classProfile(c.classKey||p.classKey);const caps=pointLimits(c,p);let sp=0,stigma=0;
 function raise(id:string,goal:number){
  const s=c.skills.find(s=>s.id===id);if(!s||s.stigma&&!equipped(p).includes(id))return;
  const max=Math.min(goal,maxBase(s,p.level,p.ascensionGrade3Confirmed),Math.max(0,s.maxLevel-equipmentBonus(p,id)-boardBonus(c,p,id)));
  for(let lv=(next.base[id]||0)+1;lv<=max;lv++){
   const cost=skillCost(s,lv)-skillCost(s,lv-1);
   if(s.stigma?stigma+cost>caps.stigma:sp+cost>caps.sp)break;
   next.base[id]=lv;if(s.stigma)stigma+=cost;else sp+=cost;
  }
 }
 if(profile.key==='assassin'){
  for(const id of profile.core)raise(id,8);
  for(const id of profile.core)raise(id,10);
  for(const id of ['13740000','13720000','13750000','13100000'])raise(id,8);
  for(const id of p.mode==='safe'?['13710000','13800000','13260000','13070000','13060000']:['13060000','13100000','13260000','13070000'])raise(id,8);
 }else{
  for(const step of profile.skillSteps||[])for(const id of step.skills)raise(id,step.learned);
 }
 const rest=[...profile.passivePriority,...profile.activePriority,...c.skills.filter(s=>!s.stigma).map(s=>s.id)];
 for(const id of [...new Set(rest)])raise(id,10);
 for(const id of equipped(p))raise(id,1);
 if(profile.key==='assassin'){
  if(p.mode==='safe')raise('13080000',5);
  for(const goal of [5,10,15,20])for(const id of equipped(p))raise(id,goal);
 }else for(const step of profile.stigmaSteps||[])raise(step.skill,step.level);
 c.skills.forEach(s=>next.specs[s.id]=recommendSpecs(s,finalLevel(c,next,s),p.mode));
 return next;
}
export function emptyPlan(c:Catalog):Plan{return applyRecommended(c,{classKey:c.classKey||'assassin',level:45,extraSP:0,extraStigma:0,extraCrystal:0,extraBattle:0,mode:'safe',base:{},bonus:{},specs:{},nodes:c.boards.flatMap(b=>b.nodes.filter(n=>n.autoLearn).map(n=>n.id)),checked:[],character:null})}
export function adjacent(a:Node,b:Node){return Math.abs(a.row-b.row)+Math.abs(a.column-b.column)===1}
export function connected(b:Board,ids:string[]){const selected=new Set(ids), seen=new Set(b.nodes.filter(n=>n.autoLearn).map(n=>n.id));let changed=true;while(changed){changed=false;for(const n of b.nodes)if(selected.has(n.id)&&!seen.has(n.id)&&b.nodes.some(m=>seen.has(m.id)&&adjacent(m,n))){seen.add(n.id);changed=true}}return [...seen]}
export function cheapestPath(b:Board,ids:string[],target:string){const dist:Record<string,number>={},prev:Record<string,string>={},pending=new Set(b.nodes.map(n=>n.id));for(const n of b.nodes)dist[n.id]=ids.includes(n.id)||n.autoLearn?0:Infinity;while(pending.size){const id=[...pending].sort((a,b)=>dist[a]-dist[b])[0];if(!Number.isFinite(dist[id]))break;pending.delete(id);if(id===target)break;const n=b.nodes.find(n=>n.id===id)!;for(const m of b.nodes.filter(m=>pending.has(m.id)&&adjacent(n,m))){const d=dist[id]+(ids.includes(m.id)?0:m.pointCost);if(d<dist[m.id]){dist[m.id]=d;prev[m.id]=id}}}if(!Number.isFinite(dist[target]))return [];const path=[target];let cursor=target;while(prev[cursor]){cursor=prev[cursor];path.unshift(cursor)}return path}
