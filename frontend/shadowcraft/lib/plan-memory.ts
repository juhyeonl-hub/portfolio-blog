import type {Plan} from './planner';
type StoragePort={getItem:(key:string)=>string|null;setItem:(key:string,value:string)=>void};
const record=(v:any)=>!!v&&typeof v==='object'&&!Array.isArray(v);
const strings=(v:any)=>Array.isArray(v)&&v.every(x=>typeof x==='string');
const numbers=(v:any)=>record(v)&&Object.values(v).every(n=>Number.isFinite(n)&&Number.isInteger(n)&&Number(n)>=0&&Number(n)<=9999);
export function validStoredPlan(value:any,classKey:string):value is Plan {
 if(!record(value)||(value.classKey||'assassin')!==classKey||!Number.isInteger(value.level)||value.level<1||value.level>45||!['safe','damage','pvp'].includes(value.mode)||!numbers(value.base)||!numbers(value.bonus)||!record(value.specs)||!Object.values(value.specs).every(strings)||!strings(value.nodes)||!strings(value.checked))return false;
 if(value.stigmaSkills!==undefined&&(!strings(value.stigmaSkills)||value.stigmaSkills.length>4||new Set(value.stigmaSkills).size!==value.stigmaSkills.length||!value.stigmaSkills.every((id:string)=>/^\d{1,20}$/.test(id))))return false;
 if(value.ascensionGrade3Confirmed!==undefined&&typeof value.ascensionGrade3Confirmed!=='boolean')return false;
 if(value.confirmedRemaining!==undefined&&(!numbers(value.confirmedRemaining)||!Object.keys(value.confirmedRemaining).every(k=>['sp','stigma','crystal','battle','ariel'].includes(k))))return false;
 if(value.confirmedRemainingContext!==undefined){const c=value.confirmedRemainingContext;if(!record(c)||!['eu','nae','naw','la','as'].includes(c.region)||typeof c.serverId!=='string'||!/^\d{1,8}$/.test(c.serverId)||typeof c.characterId!=='string'||!c.characterId||c.characterId.length>160||!Number.isInteger(c.level)||c.level<1||c.level>45)return false;}
 if(value.pointBudget!==undefined&&!numbers(value.pointBudget))return false;
 if(value.gear!==undefined&&(!record(value.gear)||!['manual','current','target'].includes(value.gear.mode)||!Array.isArray(value.gear.items)||value.gear.items.length>80||!value.gear.items.every((i:any)=>record(i)&&['id','name','slot','note'].every(k=>typeof i[k]==='string')&&['owned','current','target'].every(k=>typeof i[k]==='boolean')&&numbers(i.bonuses))))return false;
 if(value.searchPrefs!==undefined&&(!record(value.searchPrefs)||!['region','server','name'].every(k=>typeof value.searchPrefs[k]==='string')))return false;
 if(value.recentCharacters!==undefined&&(!Array.isArray(value.recentCharacters)||value.recentCharacters.length>8||!value.recentCharacters.every((i:any)=>record(i)&&['characterId','serverId','region','name','serverName'].every(k=>typeof i[k]==='string'))))return false;
 if(value.character!==null&&value.character!==undefined&&(!record(value.character)||!record(value.character.profile)))return false;
 if(value.character?.skills!==undefined&&value.character.skills!==null&&!Array.isArray(value.character.skills))return false;
 if(value.character?.nodes!==undefined&&!strings(value.character.nodes))return false;
 return true;
}
/** Compare JSON plan content without treating account serialization key order as an edit. */
export function sameStoredPlan(a:Plan,b:Plan):boolean {
 const equal=(x:any,y:any):boolean=>{
  if(x===y)return true;
  if(!x||!y||typeof x!=='object'||typeof y!=='object')return false;
  if(Array.isArray(x)||Array.isArray(y))return Array.isArray(x)&&Array.isArray(y)&&x.length===y.length&&x.every((v,i)=>equal(v,y[i]));
  const keys=Object.keys(x).filter(k=>x[k]!==undefined),other=Object.keys(y).filter(k=>y[k]!==undefined);
  return keys.length===other.length&&keys.every(k=>Object.prototype.hasOwnProperty.call(y,k)&&equal(x[k],y[k]));
 };
 return equal(a,b);
}
// A device's saved plan is authoritative. A delayed account response must never replace local edits.
export class PlanMemory {
 value:Plan;hasData=false;edited=false;localSaved=false;readFailed=false;
 constructor(public key:string,public classKey:string,initial:Plan,private storage:()=>StoragePort){this.value=initial}
 restore(){try{const raw=this.storage().getItem(this.key);if(raw){const p=JSON.parse(raw);if(!validStoredPlan(p,this.classKey))throw Error('Invalid saved plan');this.value={...p,classKey:this.classKey};this.hasData=true;this.localSaved=true}}catch{this.readFailed=true}return this.value}
 persist(){try{this.storage().setItem(this.key,JSON.stringify(this.value));this.localSaved=true}catch{this.localSaved=false}return this.localSaved}
 update(next:Plan){this.value={...next,classKey:this.classKey};this.edited=true;this.hasData=true;this.persist();return this.value}
 acceptRemote(value:unknown){if(this.hasData||this.edited||!validStoredPlan(value,this.classKey))return false;this.value={...value,classKey:this.classKey};this.hasData=true;this.persist();return true}
}
export type RecentCharacter={characterId:string;serverId:string;region:string;name:string;serverName:string};
export function rememberCharacter(items:RecentCharacter[],item:RecentCharacter){return [item,...items.filter(x=>!(x.characterId===item.characterId&&x.serverId===item.serverId&&x.region===item.region))].slice(0,8)}
