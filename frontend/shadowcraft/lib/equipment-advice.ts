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
export type Investment='unknown'|'replace'|'keep';
export type Advice='unknown'|'replace'|'low'|'budget'|'plan'|'unsupported'|'tune'|'review'|'engrave';
export function equipmentAdvice(input:{detail:EquippedDetail|null;referenceLevel:number|null;investment:Investment;budget:boolean;unwanted:number;reviewed:boolean}):Advice{
 const {detail,referenceLevel,investment,budget,unwanted,reviewed}=input;
 if(investment==='replace')return 'replace';
 if(!detail||!detail.optionsKnown||!referenceLevel||!Number.isFinite(referenceLevel)||referenceLevel<=0)return 'unknown';
 if(detail.level<referenceLevel)return 'low';
 if(!budget)return 'budget';
 if(investment!=='keep')return 'plan';
 if(!detail.subStatRandom||!detail.subStats.length&&!detail.subSkills.length)return 'unsupported';
 if(unwanted>0)return 'tune';
 if(!reviewed)return 'review';
 // This is a conditional review suggestion, never a claim about remaining rolls/costs or soulBindRate.
 return 'engrave';
}
