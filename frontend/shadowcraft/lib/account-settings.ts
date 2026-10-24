import {validStoredPlan} from './plan-memory';
import {parseSettings} from './event-timers';
import {parseFavorites} from './home-favorites';

export const SETTINGS_VERSION=1;
export const MAX_SETTINGS_BYTES=1_000_000;
export const SAVE_DELAY_MS=800;
const classes=['assassin','gladiator','templar','ranger','sorcerer','elementalist','cleric','chanter'];
const planFields=['classKey','level','mode','base','bonus','specs','nodes','checked','extraSP','extraStigma','extraCrystal','extraBattle','pointBudget','confirmedRemaining','confirmedRemainingContext','ascensionGrade3Confirmed','macroExtra'] as const;
export type Entries=Record<string,string>;
export type SettingsDocument={version:number;revision:number;entries:Entries};
type Cache={values:Entries;dirty:string[];revision?:number};
type Port=Pick<Storage,'getItem'|'setItem'|'removeItem'|'key'|'length'>;
export function settingKey(key:string):boolean {
 return ['asbc-locale','shadowcraft-selected-class','a2bc-event-timers-v1','favorites'].includes(key)
  || /^a2bc-map-progress-v1:[a-f0-9]{64}$/.test(key)
  || key==='shadowcraft-plan-v1'||classes.some(c=>key==='shadowcraft-plan-v1:'+c);
}
function planClass(key:string){return key.split(':')[1]||'assassin';}
/** Explicit projection: no tokens, character/search history, gear labels or personal notes leave the browser. */
export function projectSetting(key:string,raw:string):string {
 if(!settingKey(key))throw Error('Unknown setting');
 if(key==='asbc-locale'){if(!['ko','en','ja','fi'].includes(raw))throw Error('Invalid language');return raw;}
 if(key==='shadowcraft-selected-class'){if(!classes.includes(raw))throw Error('Invalid class');return raw;}
 if(key==='favorites')return JSON.stringify(parseFavorites(raw));
 const value=JSON.parse(raw);
 if(key==='a2bc-event-timers-v1'){
  const timer=parseSettings(raw);
  return JSON.stringify({version:timer.version,region:timer.region,server:timer.server,pinned:timer.pinned,pinnedBosses:timer.pinnedBosses,pinnedSchedules:timer.pinnedSchedules,
   profiles:Object.fromEntries(Object.entries(timer.profiles).map(([id,p])=>[id,{offset:p.offset,timeZone:p.timeZone,hidden:p.hidden,times:p.times}]))});
 }
 if(key.startsWith('shadowcraft-plan-v1')){
  if(!validStoredPlan(value,planClass(key)))throw Error('Invalid plan');
  const out:Record<string,unknown>={character:null};
  for(const field of planFields)if(value[field]!==undefined)out[field]=value[field];
  // Bind game-confirmed balances to the selected public character, not its full fetched response/history.
  const c=value.character;
  if(value.confirmedRemaining&&c?.profile&&['eu','nae','naw','la','as'].includes(c.region)&&/^\d{1,8}$/.test(String(c.profile.serverId))&&typeof c.profile.characterId==='string'&&c.profile.characterId.length>0&&c.profile.characterId.length<=160&&Number.isInteger(c.profile.characterLevel)&&c.profile.characterLevel>=1&&c.profile.characterLevel<=45)
   out.confirmedRemainingContext={region:c.region,serverId:String(c.profile.serverId),characterId:c.profile.characterId,level:c.profile.characterLevel};
  // Keep functional equipment choices/bonuses, but not user-written names or notes.
  if(value.gear)out.gear={mode:value.gear.mode,items:value.gear.items.map((i:Record<string,unknown>,n:number)=>({id:String(n),name:'',note:'',slot:i.slot,owned:i.owned,current:i.current,target:i.target,bonuses:i.bonuses}))};
  return JSON.stringify(out);
 }
 if(value?.schema!=='a2bc-map-progress-v1'||!Array.isArray(value.completed)||value.completed.length>20000||value.completed.some((x:unknown)=>typeof x!=='string'||x.length>160))throw Error('Invalid map progress');
 return JSON.stringify({schema:value.schema,completed:[...new Set(value.completed)]});
}
export function validateDocument(value:unknown):SettingsDocument {
 const d=value as SettingsDocument;
 if(!d||d.version!==SETTINGS_VERSION||!Number.isSafeInteger(d.revision)||d.revision<0||!d.entries||typeof d.entries!=='object'||Array.isArray(d.entries)||Object.keys(d.entries).length>256)throw Error('Unsupported settings');
 if(new TextEncoder().encode(JSON.stringify(d)).length>MAX_SETTINGS_BYTES)throw Error('Settings too large');
 const entries:Entries={};
 for(const [key,raw] of Object.entries(d.entries)){if(typeof raw!=='string')throw Error('Invalid setting');entries[key]=projectSetting(key,raw);}
 return {...d,entries};
}

/** Local account caches are separate from anonymous data and from other members. */
export class AccountSettingsStore {
 private cache:Cache={values:{},dirty:[]};
 private listeners=new Set<()=>void>();
 readonly cacheKey:string;
 constructor(private storage:()=>Port,readonly memberId:string|null){
  this.cacheKey='asbc-account-cache-v1:'+memberId;
  if(memberId){
   const raw=storage().getItem(this.cacheKey);
   if(raw!==null){const c=JSON.parse(raw);if(!c||!c.values||!Array.isArray(c.dirty))throw Error('Invalid account cache');this.cache=c;}
   else {
    const port=storage();
    for(let i=0;i<port.length;i++){const key=port.key(i);if(key&&settingKey(key)&&key!=='favorites'){const raw=port.getItem(key);if(raw!==null)this.cache.values[key]=raw;}}
    const favorites=port.getItem('a2bc-home-favorites-v1:'+memberId);if(favorites!==null)this.cache.values.favorites=favorites;
    this.persist();
   }
  }
 }
 reload(){if(!this.memberId)return;const raw=this.storage().getItem(this.cacheKey);if(raw!==null){const cache=JSON.parse(raw);if(!cache||!cache.values||!Array.isArray(cache.dirty))throw Error('Invalid account cache');this.cache=cache;}}
 private canonical(key:string){return key==='a2bc-home-favorites-v1:'+this.memberId?'favorites':key;}
 getItem(key:string):string|null {const k=this.canonical(key);return this.memberId&&settingKey(k)?this.cache.values[k]??null:this.storage().getItem(key);}
 setItem(key:string,value:string){
  this.reload();
  const k=this.canonical(key);
  if(!this.memberId||!settingKey(k)){this.storage().setItem(key,value);return;}
  if(this.cache.values[k]===value)return;
  const old=this.cache;this.cache={...old,values:{...old.values,[k]:value},dirty:[...new Set([...old.dirty,k])]};
  try{this.persist();}catch(e){this.cache=old;throw e;}
  this.listeners.forEach(fn=>fn());
 }
 subscribe(fn:()=>void){this.listeners.add(fn);return()=>{this.listeners.delete(fn);};}
 private persist(){this.storage().setItem(this.cacheKey,JSON.stringify(this.cache));}
 snapshot():Entries {this.reload();const entries:Entries={};for(const [key,raw] of Object.entries(this.cache.values))entries[key]=projectSetting(key,raw);return entries;}
 dirty(){return [...this.cache.dirty];}
 /** Backup must succeed before a server snapshot replaces any local bytes. */
 apply(remote:Entries,revision=0):boolean {
  this.reload();
  if(revision<(this.cache.revision||0))throw Error('Stale server response');
  const before=JSON.stringify(this.cache.values),values:Entries={...remote};
  for(const key of this.cache.dirty)if(this.cache.values[key]!==undefined)values[key]=this.cache.values[key];
  // Local-only fields survive synchronization on this device.
  for(const key of Object.keys(values))if(key.startsWith('shadowcraft-plan-v1')&&!this.cache.dirty.includes(key)&&this.cache.values[key]){
   const local=JSON.parse(this.cache.values[key]),plan=JSON.parse(values[key]);
   for(const field of ['character','searchPrefs','recentCharacters'])if(local[field]!==undefined)plan[field]=local[field];
   const context=plan.confirmedRemainingContext,c=local.character;
   if(context&&c&&(context.region!==c.region||context.serverId!==String(c.profile?.serverId)||context.characterId!==String(c.profile?.characterId)||context.level!==c.profile?.characterLevel))plan.character=null;
   // Preserve this device's labels/notes only when the same functional item is still present.
   if(plan.gear&&local.gear)for(const item of plan.gear.items){const old=local.gear.items[Number(item.id)];if(old&&old.slot===item.slot&&JSON.stringify(old.bonuses)===JSON.stringify(item.bonuses)){item.id=old.id;item.name=old.name;item.note=old.note;}}
   values[key]=JSON.stringify(plan);
  }
  if(before===JSON.stringify(values)){this.cache.revision=revision;this.persist();return false;}
  this.storage().setItem(this.cacheKey+':backup',JSON.stringify(this.cache));
  const old=this.cache;this.cache={values,dirty:old.dirty,revision};
  try{this.persist();}catch(e){this.cache=old;throw e;}
  return true;
 }
 acknowledge(sent:Entries,revision:number){
  this.reload();
  const old=this.cache;
  this.cache={...old,revision:Math.max(old.revision||0,revision),dirty:old.dirty.filter(k=>projectSetting(k,old.values[k])!==sent[k])};
  try{this.persist();}catch(e){this.cache=old;throw e;}
 }
}

type Transport=(method:'GET'|'PUT',document?:SettingsDocument)=>Promise<unknown>;
/** Serial requests + revisions prevent stale tabs from silently replacing newer account data. */
export class SettingsSync {
 private revision:number|null=null;
 private stopped=false;
 private running=false;
 private timer:ReturnType<typeof setTimeout>|undefined;
 private unsubscribe:()=>void;
 constructor(private store:AccountSettingsStore,private request:Transport,private applied:()=>void,private status:(state:'saved'|'pending'|'offline')=>void){
  this.unsubscribe=store.subscribe(()=>this.schedule());
 }
 async start(){await this.refresh();}
 private schedule(){if(this.stopped)return;this.status('pending');clearTimeout(this.timer);this.timer=setTimeout(()=>void this.save(),SAVE_DELAY_MS);}
 async retry(){if(this.running||this.stopped)return;await this.refresh();}
 private async refresh(){
  if(this.running||this.stopped)return;this.running=true;
  try{
   const remote=validateDocument(await this.request('GET'));if(this.stopped)return;
   this.revision=remote.revision;
   // Revision zero means no server record. Seed it from this account's local cache.
   if(remote.revision>0&&this.store.apply(remote.entries,remote.revision))this.applied();
   this.status('saved');
   if(remote.revision===0||this.store.dirty().length)this.schedule();
  }catch{if(!this.stopped){this.revision=null;this.status('offline');}}
  finally{this.running=false;}
 }
 private async save(){
  if(this.stopped)return;
  if(this.running){this.schedule();return;}
  if(this.revision===null){await this.refresh();return;}
  this.running=true;
  try{
   const entries=this.store.snapshot(),sent=validateDocument({version:SETTINGS_VERSION,revision:this.revision,entries});
   const result=validateDocument(await this.request('PUT',sent));if(this.stopped)return;
   this.revision=result.revision;this.store.acknowledge(entries,result.revision);this.status('saved');
   if(this.store.dirty().length)this.schedule();
  }catch{if(!this.stopped){this.revision=null;this.status('offline');}}
  finally{this.running=false;}
 }
 stop(){this.stopped=true;clearTimeout(this.timer);this.unsubscribe();}
}

let active:AccountSettingsStore|null=null;
export function activateSettingsStore(store:AccountSettingsStore|null){active=store;}
/** Explicit adapter, never a global Storage prototype patch. Anonymous calls retain their original keys. */
export const settingsStorage={
 getItem:(key:string)=>active?active.getItem(key):localStorage.getItem(key),
 setItem:(key:string,value:string)=>active?active.setItem(key,value):localStorage.setItem(key,value),
};
