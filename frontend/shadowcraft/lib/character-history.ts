import type {Catalog} from './planner';
import {characterPoints} from './character-points';
export type GrowthItem={slot:number;slotName:string;id:number;name:string;enchant:number;exceed:number};
export type GrowthSnapshot={identity:string;name:string;at:string;version:string;level:number;gear:GrowthItem[]|null;skills:{id:string;level:number}[]|null;nodes:string[]|null};
const int=(v:unknown,max:number)=>Number.isSafeInteger(v)&&Number(v)>=0&&Number(v)<=max;
const text=(v:unknown,max:number)=>typeof v==='string'&&v.length>0&&v.length<=max;
export function growthSnapshot(c:Catalog,character:any):GrowthSnapshot|null{
 const p=character?.profile;
 if(!p||!['eu','nae','naw','la','as'].includes(character.region)||!text(String(p.serverId||''),8)||!/^\d+$/.test(String(p.serverId))||!text(p.characterId,160)||!text(p.characterName,100)||!int(p.characterLevel,45)||p.characterLevel<1||!text(character.importedAt,40)||!Number.isFinite(Date.parse(character.importedAt)))return null;
 const validGear=Array.isArray(character.equipment)&&character.equipment.length>0&&character.equipment.length<=80&&character.equipment.every((x:any)=>x&&int(x.id,Number.MAX_SAFE_INTEGER)&&x.id>0&&int(x.slotPos,1000)&&text(x.slotPosName,80)&&text(x.name,200)&&int(x.enchantLevel,999)&&int(x.exceedLevel,999))&&new Set(character.equipment.map((x:any)=>x.slotPos)).size===character.equipment.length;
 const gear=validGear?character.equipment.map((x:any)=>({slot:x.slotPos,slotName:x.slotPosName,id:x.id,name:x.name,enchant:x.enchantLevel,exceed:x.exceedLevel})).sort((a:GrowthItem,b:GrowthItem)=>a.slot-b.slot):null;
 const validSkills=Array.isArray(character.skills)&&character.skills.length>0&&character.skills.length<=200&&character.skills.every((x:any)=>x&&c.skills.some(s=>s.id===String(x.id))&&int(x.skillLevel,100))&&new Set(character.skills.map((x:any)=>String(x.id))).size===character.skills.length;
 const skills=validSkills?character.skills.map((x:any)=>({id:String(x.id),level:x.skillLevel})).sort((a:{id:string},b:{id:string})=>a.id.localeCompare(b.id)):null;
 let nodes:string[]|null=null;try{if(Array.isArray(character.nodes)&&character.nodes.length<=3000&&character.nodes.every((id:unknown)=>typeof id==='string')&&characterPoints(c,character).crystal!==null)nodes=[...new Set<string>(character.nodes)].sort();}catch{/* Incomplete public response: do not infer removed nodes. */}
 return {identity:[c.classKey,character.region,String(p.serverId),p.characterId].map(encodeURIComponent).join(':'),name:p.characterName,at:character.importedAt,version:c.version||'unknown',level:p.characterLevel,gear,skills,nodes};
}
export const growthKey=(identity:string)=>'asbc-growth-history-v1:'+identity;
export function parseGrowthHistory(raw:string|null,identity:string):GrowthSnapshot[]{
 if(raw===null)return [];
 if(raw.length>2000000)throw Error('history size');
 const list=JSON.parse(raw);if(!Array.isArray(list)||list.length>20)throw Error('history format');
 for(const x of list){
  if(!x||x.identity!==identity||!text(x.name,100)||!text(x.at,40)||!Number.isFinite(Date.parse(x.at))||!text(x.version,100)||!int(x.level,45)||x.level<1)throw Error('history snapshot');
  if(x.gear!==null&&(!Array.isArray(x.gear)||x.gear.length>80||!x.gear.every((i:any)=>i&&int(i.slot,1000)&&int(i.id,Number.MAX_SAFE_INTEGER)&&i.id>0&&text(i.slotName,80)&&text(i.name,200)&&int(i.enchant,999)&&int(i.exceed,999))||new Set(x.gear.map((i:GrowthItem)=>i.slot)).size!==x.gear.length))throw Error('history gear');
  if(x.skills!==null&&(!Array.isArray(x.skills)||x.skills.length>200||!x.skills.every((s:any)=>s&&text(s.id,80)&&int(s.level,100))||new Set(x.skills.map((s:{id:string})=>s.id)).size!==x.skills.length))throw Error('history skills');
  if(x.nodes!==null&&(!Array.isArray(x.nodes)||x.nodes.length>3000||!x.nodes.every((n:unknown)=>text(n,80))||new Set(x.nodes).size!==x.nodes.length))throw Error('history nodes');
 }
 if(list.some((x:any,i:number)=>i>0&&Date.parse(list[i-1].at)<=Date.parse(x.at)))throw Error('history ordering');
 return list.map(x=>({identity:x.identity,name:x.name,at:x.at,version:x.version,level:x.level,gear:x.gear?.map((i:GrowthItem)=>({slot:i.slot,slotName:i.slotName,id:i.id,name:i.name,enchant:i.enchant,exceed:i.exceed}))??null,skills:x.skills?.map((s:{id:string;level:number})=>({id:s.id,level:s.level}))??null,nodes:x.nodes}));
}
const content=(s:GrowthSnapshot)=>JSON.stringify({...s,at:''});
export function appendGrowth(list:GrowthSnapshot[],next:GrowthSnapshot){
 if(list.some(s=>s.identity!==next.identity))throw Error('different character');
 if(list.length&&(Date.parse(next.at)<=Date.parse(list[0].at)||content(list[0])===content(next)))return list;
 return [next,...list].slice(0,20);
}
export function growthChanges(before:GrowthSnapshot,after:GrowthSnapshot){
 if(before.identity!==after.identity)throw Error('different character');
 const sameVersion=before.version===after.version;
 const gear=before.gear&&after.gear?[...new Set([...before.gear,...after.gear].map(x=>x.slot))].map(slot=>({slot,before:before.gear!.find(x=>x.slot===slot),after:after.gear!.find(x=>x.slot===slot)})).filter(x=>JSON.stringify(x.before)!==JSON.stringify(x.after)):null;
 const skills=sameVersion&&before.skills&&after.skills?[...new Set([...before.skills,...after.skills].map(x=>x.id))].map(id=>({id,before:before.skills!.find(x=>x.id===id)?.level,after:after.skills!.find(x=>x.id===id)?.level})).filter(x=>x.before!==x.after):null;
 const nodes=sameVersion&&before.nodes&&after.nodes?{added:after.nodes.filter(id=>!before.nodes!.includes(id)),removed:before.nodes.filter(id=>!after.nodes!.includes(id))}:null;
 return {sameVersion,gear,skills,nodes};
}
