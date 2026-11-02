import {EquipmentOptions,equipmentKey,type EquipmentTask} from './equipment-options';
export type GearBonus=Record<string,number>;
export type PointGearFailure={key:string;name:string;slot:number;reason:'missing'|'changed'|'invalid'|'network'|'busy'};
const fail=(reason:string):never=>{throw Error(reason)};
/** Official armory omits subSkills when all soul-bind properties are ordinary stats.
 * subSkillCountMax is a possible maximum, not the number of equipped skill rolls.
 * Only a complete, valid actual-stat list proves zero; partial payloads remain unknown.
 */
function hasCompleteStatOnlyRolls(d:any):boolean{
 const count=d.subStatCount,stats=d.subStats;
 return Number.isSafeInteger(count)&&count>0&&count<=64&&Array.isArray(stats)&&stats.length===count
  &&stats.every((s:any)=>typeof s?.id==='string'&&s.id.length>0&&typeof s.value==='string'&&s.value.trim()!==''&&Number.isFinite(Number(s.value)))
  &&new Set(stats.map((s:any)=>s.id)).size===count;
}
/** Strict actual-roll parser: possible bonuses and incomplete rolls are never zero. */
export function readPointGear(value:any,task:EquipmentTask):GearBonus{
 const {identity,item}=task,d=value?.item;
 if(value?.characterId!==identity.id||String(value?.serverId)!==identity.server||value?.region!==identity.region||value?.slotPos!==item.slotPos||d?.id!==item.id||d?.enchantLevel!==item.enchantLevel)fail('changed');
 if(d.subSkills!=null&&!Array.isArray(d.subSkills))fail('invalid');
 if(!Array.isArray(d.subSkills)&&d.subSkillCountMax!==0&&!hasCompleteStatOnlyRolls(d))fail('missing');
 const skills=d.subSkills??[];
 if(skills.length>64)fail('invalid');
 const bonus:GearBonus={},seen=new Set<string>();
 for(const skill of skills){
  if(!Number.isSafeInteger(skill?.id)||skill.id<=0||!Number.isSafeInteger(skill.level)||skill.level<0||seen.has(String(skill.id)))fail('invalid');
  const id=String(skill.id);seen.add(id);bonus[id]=skill.level;
 }
 return bonus;
}
export function createPointGear(character:any,classKey:string,query:(params:Record<string,string>,signal:AbortSignal)=>Promise<any>){
 const profile=character?.profile;
 if(!profile||typeof profile.characterId!=='string'||!profile.characterId||!/^\d+$/.test(String(profile.serverId))||!['eu','nae','naw','la','as'].includes(character.region)||!Array.isArray(character.equipment))return null;
 const identity={id:profile.characterId,server:String(profile.serverId),region:character.region};
 const slots=new Set<number>(),tasks:EquipmentTask[]=[],names=new Map<string,string>();
 for(const item of character.equipment){
  if(!Number.isSafeInteger(item?.id)||item.id<=0||!Number.isInteger(item.slotPos)||item.slotPos<1||item.slotPos>99||!Number.isInteger(item.enchantLevel)||item.enchantLevel<0||item.enchantLevel>99||slots.has(item.slotPos))return null;
  slots.add(item.slotPos);const key=equipmentKey(identity,item);tasks.push({key,identity,item});names.set(key,typeof item.name==='string'?item.name:'');
 }
 const store=new EquipmentOptions<GearBonus>(tasks,async(task,signal)=>{
  let result:any;
  try{result=await query({action:'item',class:classKey,...identity,itemId:String(task.item.id),slot:String(task.item.slotPos),enchant:String(task.item.enchantLevel)},signal)}
  catch(error){throw Object.assign(Error((error as any)?.status===429?'busy':(error as any)?.status===400?'changed':'network'),{status:(error as any)?.status,retryAfterMs:(error as any)?.retryAfterMs});}
  return readPointGear(result,task);
 },2);
 return {store,names};
}
export function pointGearState(lookup:NonNullable<ReturnType<typeof createPointGear>>){
 const bonus:GearBonus={},errors:PointGearFailure[]=[];let completed=0,loading=false;
 for(const [key,entry] of lookup.store.entries){
  if(entry.status==='ready'){
   completed++;for(const [id,level] of Object.entries(entry.detail!))bonus[id]=(bonus[id]||0)+level;
  }else if(entry.status==='error'){
   const reason=['missing','changed','invalid','busy'].includes(entry.error||'')?entry.error as PointGearFailure['reason']:'network';
   errors.push({key,name:lookup.names.get(key)||'',slot:lookup.store.tasks.get(key)!.item.slotPos,reason});
  }else loading=true;
 }
 return {bonus:completed===lookup.store.entries.size?bonus:null,completed,total:lookup.store.entries.size,loading,errors,failure:errors.length>0,retryAt:lookup.store.retryAt};
}
