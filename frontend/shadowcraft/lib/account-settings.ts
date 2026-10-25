import {isTradeCollection,parseTradeCollection,mergeTradeCollection,tradeBackup,TradeSyncConflict} from './trade-collections';
import {validStoredPlan} from './plan-memory';
import {parseSettings} from './event-timers';
import {parseFavorites} from './home-favorites';

export const SETTINGS_VERSION=1;
export const MAX_SETTINGS_BYTES=1_000_000;
export const SAVE_DELAY_MS=800;
export class SettingsSizeLimit extends Error{}
const classes=['assassin','gladiator','templar','ranger','sorcerer','elementalist','cleric','chanter'];
const planFields=['classKey','level','mode','base','bonus','specs','nodes','checked','extraSP','extraStigma','extraCrystal','extraBattle','pointBudget','confirmedRemaining','confirmedRemainingContext','ascensionGrade3Confirmed','stigmaSkills','macroExtra'] as const;
export type Entries=Record<string,string>;
export type SettingsDocument={version:number;revision:number;entries:Entries;updatedAt?:string};
type Cache={values:Entries;dirty:string[];revision?:number;base?:Entries;conflict?:boolean;tradeConflict?:{key:string;remote:string|null}};
type Port=Pick<Storage,'getItem'|'setItem'|'removeItem'|'key'|'length'>;
export function settingKey(key:string):boolean {
 return isTradeCollection(key)||['asbc-locale','shadowcraft-selected-class','a2bc-event-timers-v1','favorites'].includes(key)
  || /^a2bc-map-progress-v1:[a-f0-9]{64}$/.test(key)
  || key==='shadowcraft-plan-v1'||classes.some(c=>key==='shadowcraft-plan-v1:'+c);
}
function planClass(key:string){return key.split(':')[1]||'assassin';}
/** Explicit projection: no tokens, character/search history, gear labels or personal notes leave the browser. */
export function projectSetting(key:string,raw:string):string {
 if(!settingKey(key))throw Error('Unknown setting');
 if(isTradeCollection(key))return JSON.stringify(parseTradeCollection(key,raw));
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
 if(new TextEncoder().encode(JSON.stringify(d)).length>MAX_SETTINGS_BYTES)throw new SettingsSizeLimit('Settings too large');
 const entries:Entries={};
 for(const [key,raw] of Object.entries(d.entries)){if(typeof raw!=='string')throw Error('Invalid setting');entries[key]=projectSetting(key,raw);}
 const updatedAt=typeof d.updatedAt==='string'&&/^\d{4}-\d{2}-\d{2}T.*Z$/.test(d.updatedAt)&&Number.isFinite(Date.parse(d.updatedAt))?d.updatedAt:undefined;
 return {version:d.version,revision:d.revision,entries,...(updatedAt?{updatedAt}:{})};
}

// Three-way merge independent fields; a true collision keeps this device's edit and is disclosed.
function mergeValue(base:unknown,local:unknown,remote:unknown,conflict:()=>void):unknown {
 const equal=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
 if(equal(local,base))return remote;
 if(equal(remote,base)||equal(local,remote))return local;
 const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
 if(object(base)&&object(local)&&object(remote)){
  const merged:Record<string,unknown>={};
  for(const key of new Set([...Object.keys(base),...Object.keys(local),...Object.keys(remote)])){
   const value=mergeValue(base[key],local[key],remote[key],conflict);if(value!==undefined)merged[key]=value;
  }
  return merged;
 }
 conflict();return local;
}
function mergeSetting(key:string,base:string|undefined,local:string,remote:string|undefined,conflict:()=>void):string {
 if(isTradeCollection(key))return mergeTradeCollection(key,base,local,remote);
 if(local===base)return remote??local;
 if(remote===base||local===remote)return local;
 if(base!==undefined&&remote!==undefined&&key.startsWith('a2bc-map-progress-v1:')){
  const before=new Set<string>(JSON.parse(base).completed),mine=new Set<string>(JSON.parse(local).completed),theirs=new Set<string>(JSON.parse(remote).completed);
  // Each marker is an independent boolean, so checking different locations never drops either change.
  const completed=[...new Set([...before,...mine,...theirs])].filter(id=>mine.has(id)!==before.has(id)?mine.has(id):theirs.has(id)).sort();
  return JSON.stringify({schema:'a2bc-map-progress-v1',completed});
 }
 if(base!==undefined&&remote!==undefined&&(key.startsWith('shadowcraft-plan-v1')||key==='a2bc-event-timers-v1'))
  return projectSetting(key,JSON.stringify(mergeValue(JSON.parse(base),JSON.parse(local),JSON.parse(remote),conflict)));
 conflict();return local;
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
    for(let i=0;i<port.length;i++){const key=port.key(i);if(key&&settingKey(key)&&!isTradeCollection(key)&&key!=='favorites'){const raw=port.getItem(key);if(raw!==null)this.cache.values[key]=raw;}}
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
 snapshot():Entries {this.reload();if(this.cache.tradeConflict)throw new TradeSyncConflict(this.cache.tradeConflict!.key);const entries:Entries={};for(const [key,raw] of Object.entries(this.cache.values))entries[key]=projectSetting(key,raw);return entries;}
 dirty(){return [...this.cache.dirty];}
 conflicted(){return this.cache.conflict===true;}
 tradeConflict(){this.reload();const c=this.cache.tradeConflict;return c?{...c,local:this.cache.values[c.key]??null}:null;}
 resolveTradeConflict(choice:'local'|'remote'){
  this.reload();const c=this.cache.tradeConflict;if(!c)return;
  this.storage().setItem(this.cacheKey+':trade-resolution-backup',JSON.stringify(this.cache));
  this.storage().setItem('asbc-trade-restore-backup-v1:'+this.memberId+':'+c.key,tradeBackup(c.key,parseTradeCollection(c.key,this.cache.values[c.key]??null)));
  const old=this.cache,values={...old.values},base={...old.base};
  if(c.remote===null)delete base[c.key];else base[c.key]=c.remote;
  if(choice==='remote')values[c.key]=c.remote??JSON.stringify(parseTradeCollection(c.key,null));
  this.cache={...old,values,base,tradeConflict:undefined,dirty:[...new Set([...old.dirty,c.key])]};
  try{this.persist();}catch(e){this.cache=old;throw e;}this.listeners.forEach(fn=>fn());
 }

 /** Backup must succeed before a server snapshot replaces any local bytes. */
 apply(remote:Entries,revision=0):boolean {
  this.reload();
  if(revision<(this.cache.revision||0))throw Error('Stale server response');
  if(this.cache.tradeConflict){
   this.cache={...this.cache,tradeConflict:{...this.cache.tradeConflict,remote:remote[this.cache.tradeConflict.key]??null}};this.persist();
   throw new TradeSyncConflict(this.cache.tradeConflict!.key);
  }
  const before=JSON.stringify(this.cache.values),values:Entries={...remote};
  let conflict=this.cache.conflict||false;
  try{for(const key of this.cache.dirty)if(this.cache.values[key]!==undefined)values[key]=mergeSetting(key,this.cache.base?.[key],projectSetting(key,this.cache.values[key]),remote[key],()=>{conflict=true;});}
  catch(error){if(error instanceof TradeSyncConflict){this.cache={...this.cache,tradeConflict:{key:error.key,remote:remote[error.key]??null}};this.persist();}throw error;}
  // Local-only fields survive synchronization on this device.
  for(const key of Object.keys(values))if(key.startsWith('shadowcraft-plan-v1')&&this.cache.values[key]){
   const local=JSON.parse(this.cache.values[key]),plan=JSON.parse(values[key]);
   for(const field of ['character','searchPrefs','recentCharacters'])if(local[field]!==undefined)plan[field]=local[field];
   const context=plan.confirmedRemainingContext,c=local.character;
   if(context&&c&&(context.region!==c.region||context.serverId!==String(c.profile?.serverId)||context.characterId!==String(c.profile?.characterId)||context.level!==c.profile?.characterLevel))plan.character=null;
   // Preserve this device's labels/notes only when the same functional item is still present.
   if(plan.gear&&local.gear)for(const item of plan.gear.items){const old=local.gear.items[Number(item.id)];if(old&&old.slot===item.slot&&JSON.stringify(old.bonuses)===JSON.stringify(item.bonuses)){item.id=old.id;item.name=old.name;item.note=old.note;}}
   values[key]=JSON.stringify(plan);
  }
  if(before===JSON.stringify(values)){this.cache={...this.cache,revision,base:remote,conflict};this.persist();return false;}
  this.storage().setItem(this.cacheKey+':backup',JSON.stringify(this.cache));
  const old=this.cache;this.cache={values,dirty:old.dirty,revision,base:remote,conflict};
  try{this.persist();}catch(e){this.cache=old;throw e;}
  return true;
 }
 acknowledge(sent:Entries,revision:number){
  this.reload();
  const old=this.cache;
  this.cache={...old,base:sent,revision:Math.max(old.revision||0,revision),dirty:old.dirty.filter(k=>projectSetting(k,old.values[k])!==sent[k])};
  try{this.persist();}catch(e){this.cache=old;throw e;}
 }
}

export type SyncState='saved'|'pending'|'loading'|'offline'|'conflict'|'full';
export type SyncMetadata={savedAt:string|null;checkedAt:number;conflict?:boolean};
type Transport=(method:'GET'|'PUT',document?:SettingsDocument)=>Promise<unknown>;
/** Serial requests + revisions prevent stale tabs from silently replacing newer account data. */
export class SettingsSync {
 private revision:number|null=null;
 private stopped=false;
 private conflictRetries=0;
 private running=false;
 private timer:ReturnType<typeof setTimeout>|undefined;
 private unsubscribe:()=>void;
 constructor(private store:AccountSettingsStore,private request:Transport,private applied:()=>void,private status:(state:SyncState,metadata?:SyncMetadata)=>void,private canApply:()=>boolean=()=>true){
  this.unsubscribe=store.subscribe(()=>this.schedule());
 }
 async start(){await this.refresh();}
 private schedule(){if(this.stopped)return;this.status(this.store.tradeConflict()?'conflict':'pending');clearTimeout(this.timer);this.timer=setTimeout(()=>void this.save(),SAVE_DELAY_MS);}
 async retry(){return this.refresh();}
 async poll(){return this.refresh(true);}
 private async refresh(quiet=false):Promise<boolean>{
  if(this.running||this.stopped)return true;this.running=true;if(!quiet)this.status('loading');
  try{
   const remote=validateDocument(await this.request('GET'));if(this.stopped||(quiet&&!this.canApply()))return true;
   this.revision=remote.revision;
   // Revision zero means no server record. Seed it from this account's local cache.
   if(remote.revision>0&&this.store.apply(remote.entries,remote.revision))this.applied();
   this.status(this.store.dirty().length?'pending':'saved',{savedAt:remote.updatedAt||null,checkedAt:Date.now(),conflict:this.store.conflicted()});
   if(remote.revision===0||this.store.dirty().length)this.schedule();
   return true;
  }catch(error){if(!this.stopped){this.revision=null;this.status(error instanceof TradeSyncConflict?'conflict':error instanceof SettingsSizeLimit?'full':'offline',error instanceof TradeSyncConflict?{savedAt:null,checkedAt:Date.now()}:undefined);}return false;}
  finally{this.running=false;}
 }
 private async save(){
  if(this.stopped)return;
  if(this.running){this.schedule();return;}
  if(this.revision===null){await this.refresh();return;}
  this.running=true;let retryConflict=false;
  try{
   const entries=this.store.snapshot(),sent=validateDocument({version:SETTINGS_VERSION,revision:this.revision,entries});
   const result=validateDocument(await this.request('PUT',sent));if(this.stopped)return;
   this.revision=result.revision;this.conflictRetries=0;this.store.acknowledge(entries,result.revision);this.status('saved',{savedAt:result.updatedAt||null,checkedAt:Date.now(),conflict:this.store.conflicted()});
   if(this.store.dirty().length)this.schedule();
  }catch(error){if(!this.stopped){this.revision=null;retryConflict=(error as {status?:number}).status===409&&this.conflictRetries++<2;this.status(error instanceof TradeSyncConflict?'conflict':error instanceof SettingsSizeLimit?'full':retryConflict?'pending':'offline');}}
  finally{this.running=false;}
  if(retryConflict)await this.refresh(true);
 }
 stop(){this.stopped=true;clearTimeout(this.timer);this.unsubscribe();}
}

let active:AccountSettingsStore|null=null;
export function activateSettingsStore(store:AccountSettingsStore|null){active=store;}
export function activeTradeConflict(){return active?.tradeConflict()??null;}
export function resolveActiveTradeConflict(choice:'local'|'remote',expected:ReturnType<typeof activeTradeConflict>){if(JSON.stringify(activeTradeConflict())!==JSON.stringify(expected))throw Error('changed');active?.resolveTradeConflict(choice);publishSettingsChanges();}
export function tradeAccountId(){return active?.memberId??null;}
export function previousTradeBackup(key:string){return localStorage.getItem('asbc-trade-restore-backup-v1:'+(active?.memberId||'guest')+':'+key);}
export function preserveTradeBackup(key:string,raw:string){localStorage.setItem('asbc-trade-restore-backup-v1:'+ (active?.memberId||'guest')+':'+key,raw);}

/** Explicit adapter, never a global Storage prototype patch. Anonymous calls retain their original keys. */
export const settingsStorage={
 reload:()=>active?.reload(),
 getItem:(key:string)=>active?active.getItem(key):localStorage.getItem(key),
 setItem:(key:string,value:string)=>active?active.setItem(key,value):localStorage.setItem(key,value),
};

// Remote updates notify consumers without unmounting forms, map views, routing or scroll containers.
const settingsListeners=new Set<()=>void>();
export function subscribeSettingsChanges(listener:()=>void){settingsListeners.add(listener);return()=>{settingsListeners.delete(listener);};}
export function publishSettingsChanges(){settingsListeners.forEach(listener=>listener());}

export const AUTO_SYNC_INTERVAL_MS=10_000;
export class AutomaticSettingsSync {
 private timer:ReturnType<typeof setTimeout>|undefined;
 private stopped=false;
 private running=false;
 private lastWake=0;
 private delay=AUTO_SYNC_INTERVAL_MS;
 constructor(private sync:Pick<SettingsSync,'poll'>,private eligible:()=>boolean){}
 start(){this.schedule();}
 private schedule(){clearTimeout(this.timer);if(!this.stopped)this.timer=setTimeout(()=>void this.check(),this.delay);}
 // Focus, visibility, reconnect and edit completion can arrive together; coalesce them.
 wake(){if(this.stopped||Date.now()-this.lastWake<1500)return;this.lastWake=Date.now();void this.check();}
 private async check(){
  if(this.stopped||this.running)return;
  clearTimeout(this.timer);
  if(!this.eligible()){this.schedule();return;}
  this.running=true;
  try{const ok=await this.sync.poll();this.delay=ok?AUTO_SYNC_INTERVAL_MS:Math.min(this.delay*2,60_000);}
  finally{this.running=false;this.schedule();}
 }
 stop(){this.stopped=true;clearTimeout(this.timer);}
}
