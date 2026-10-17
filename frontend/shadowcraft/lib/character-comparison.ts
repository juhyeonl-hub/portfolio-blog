export type ComparisonRow={label:string;current:string;saved:string;changed:boolean};
export type ComparisonSection={name:string;rows:ComparisonRow[];unavailable:boolean};
type Entry={label:string;value:string;identity?:number};
const object=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const integer=(x:unknown)=>Number.isSafeInteger(x)&&Number(x)>=0;
function equipment(x:unknown):Map<string,Entry>|null{
 if(!Array.isArray(x)||!x.length||x.length>80)return null;
 const result=new Map<string,Entry>();
 for(const item of x){
  if(!object(item)||!integer(item.id)||Number(item.id)<=0||!integer(item.slotPos)||Number(item.slotPos)<=0||typeof item.name!=='string'||!item.name||item.name.length>200||typeof item.slotPosName!=='string'||!integer(item.enchantLevel)||!integer(item.exceedLevel))return null;
  const key=String(item.slotPos);if(result.has(key))return null;
  result.set(key,{identity:Number(item.id),label:item.slotPosName,value:`${item.name} · 강화 +${item.enchantLevel} · 초월 +${item.exceedLevel}`});
 }
 return result;
}
function skills(x:unknown):Map<string,Entry>|null{
 if(!Array.isArray(x)||!x.length||x.length>300)return null;
 const result=new Map<string,Entry>();
 for(const skill of x){
  if(!object(skill)||!integer(skill.id)||typeof skill.name!=='string'||!skill.name||skill.name.length>200||!integer(skill.skillLevel)||![0,1,true,false].includes(skill.equip as number))return null;
  const key=String(skill.id);if(result.has(key))return null;
  result.set(key,{label:skill.name,value:`Lv.${skill.skillLevel} · ${skill.equip?'장착':'미장착'}`});
 }
 return result;
}
function section(name:string,current:Map<string,Entry>|null,saved:Map<string,Entry>|null):ComparisonSection{
 if(!current||!saved)return {name,rows:[],unavailable:true};
 const keys=[...new Set([...current.keys(),...saved.keys()])];
 return {name,unavailable:false,rows:keys.map(key=>{const a=current.get(key),b=saved.get(key);return {label:a?.label||b!.label,current:a?.value??'조회 정보 없음',saved:b?.value??'조회 정보 없음',changed:a?.value!==b?.value||a?.identity!==b?.identity}})};
}
function nodes(x:Record<string,unknown>|null):Set<string>|null{
 if(!x||!Array.isArray(x.nodes)||x.nodes.length>2000||!x.nodes.every(n=>typeof n==='string')||!Array.isArray(x.failedBoards)||x.failedBoards.length)return null;
 return new Set(x.nodes);
}
// Compare recorded observations only. Missing entries do not prove unequipped/unlearned state.
export function compareCharacters(a:unknown,b:unknown){
 const current=object(a)?a:null,saved=object(b)?b:null;
 const left=nodes(current),right=nodes(saved);
 return {sections:[section('장비',equipment(current?.equipment),equipment(saved?.equipment)),section('스킬',skills(current?.skills),skills(saved?.skills))],nodes:left&&right?{common:[...left].filter(n=>right.has(n)).length,currentOnly:[...left].filter(n=>!right.has(n)).length,savedOnly:[...right].filter(n=>!left.has(n)).length}:null};
}
