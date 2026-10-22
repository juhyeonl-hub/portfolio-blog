// Actual equipped-item rolls only. Static item-index pools must never enter this parser.
export type RolledStat={id:string;name:string;value:string};
export type RolledSkill={id:number;name:string;level:number};
export type EquippedDetail={id:number;name:string;level:number;enchantLevel:number;subStatRandom:boolean;subStats:RolledStat[];subSkills:RolledSkill[];optionsKnown:boolean};
const object=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
export function parseEquippedDetail(value:unknown,expected:{itemId:number;enchant:number;slot:number;id:string;server:string;region:string}):EquippedDetail|null{
 if(!object(value)||value.characterId!==expected.id||String(value.serverId)!==expected.server||value.region!==expected.region||value.slotPos!==expected.slot||!object(value.item))return null;
 const item=value.item;
 if(item.id!==expected.itemId||item.enchantLevel!==expected.enchant||typeof item.name!=='string'||!Number.isInteger(item.level)||(item.level as number)<=0||(item.level as number)>10000)return null;
 const stats=item.subStats??[],skills=item.subSkills??[];
 if(!Array.isArray(stats)||stats.length>64||!stats.every(s=>object(s)&&typeof s.id==='string'&&typeof s.name==='string'&&typeof s.value==='string'))return null;
 if(!Array.isArray(skills)||skills.length>64||!skills.every(s=>object(s)&&Number.isSafeInteger(s.id)&&typeof s.name==='string'&&Number.isSafeInteger(s.level)&&(s.level as number)>0))return null;
 return {id:item.id as number,name:item.name,level:item.level as number,enchantLevel:item.enchantLevel as number,subStatRandom:item.subStatRandom===true,subStats:stats,subSkills:skills,optionsKnown:Array.isArray(item.subStats)||Array.isArray(item.subSkills)};
}
export type Fit='mismatch'|'priority'|'review';
export function statFit(id:string,mode:string):Fit{
 if(mode==='pvp'&&['PvEAmplifyDamage','PvEDecreaseDamage'].includes(id)||mode!=='pvp'&&id==='PvPAmplifyDamage')return 'mismatch';
 if(mode==='damage'&&['AmplifyAllDamage','AmplifyWeaponDamage','CombatSpeed','Critical','AmplifyCriticalDamage'].includes(id))return 'priority';
 return 'review';
}
export function skillFit(id:string,knownIds:readonly string[],usedIds:readonly string[],inactiveStigmas:readonly string[]):Fit{
 if(!knownIds.includes(id))return 'review';
 if(inactiveStigmas.includes(id))return 'mismatch';
 return usedIds.includes(id)?'priority':'review';
}
export type Investment='unknown'|'replace'|'progress'|'keep';
export type Advice='unknown'|'replace'|'low'|'budget'|'plan'|'unsupported'|'tune'|'review'|'engrave'|'progress';
export function equipmentAdvice(input:{detail:EquippedDetail|null;referenceLevel:number|null;investment:Investment;budget:boolean;unwanted:number;reviewed:boolean}):Advice{
 const {detail,investment,budget,unwanted,reviewed}=input;
 if(investment==='replace')return 'replace';
 if(!detail||!detail.optionsKnown)return 'unknown';
 if(!budget)return 'budget';
 if(investment!=='keep'&&investment!=='progress')return 'plan';
 if(!detail.subStatRandom||!detail.subStats.length&&!detail.subSkills.length)return 'unsupported';
 if(unwanted>0)return 'tune';
 if(!reviewed)return 'review';
 // This is a conditional review suggestion, never a claim about remaining rolls/costs or soulBindRate.
 return investment==='progress'?'progress':'engrave';
}

// These labels explain the limited matching evidence, not calculated combat efficiency.
export function optionReason(kind:'stat'|'skill',fit:Fit):string{
 if(fit==='mismatch')return kind==='skill'?'현재 빌드에서 장착하지 않은 스티그마입니다. 사용할 예정이라면 유지할 수 있습니다.':'선택한 전투와 다른 PvE·PvP 전용 옵션입니다. 다른 전투에서도 쓸 장비라면 유지할 수 있습니다.';
 if(fit==='priority')return kind==='skill'?'현재 빌드에 포함된 스킬입니다. 실제 사용 빈도와 효과를 확인해 주세요.':'공격 중심 안내에서 검토하는 옵션입니다. 다른 옵션보다 얼마나 좋은지는 계산하지 않았습니다.';
 return '이 옵션의 효과나 내 조합과의 관계를 충분히 확인하지 못했습니다. 나쁜 옵션이라는 뜻은 아닙니다.';
}
