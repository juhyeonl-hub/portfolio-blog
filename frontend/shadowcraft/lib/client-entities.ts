import {CLIENT_CULTURES} from './client-locales';
export const ENTITY_KINDS=['npcs','quests','dungeons','pets','maps'] as const;
export type EntityKind=typeof ENTITY_KINDS[number];
type Entry={name:string;summary?:string};
export type ClientEntities={schema:'asbc-client-entities-v1';locale:string;culture:string;buildId:string;textBuildId:string;source:{kind:'installed-steam-client'}}&Record<EntityKind,Record<string,Entry>>;
const object=(v:unknown):v is Record<string,any>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const id=(v:unknown)=>typeof v==='string'&&/^[1-9][0-9]{0,14}$/.test(v);
const plain=(v:unknown,max:number)=>typeof v==='string'&&v.trim().length>0&&v.length<=max&&!/[\x00-\x1f\x7f<{}]/.test(v);
export function validClientEntities(v:unknown,locale:string):v is ClientEntities{
 if(!Object.hasOwn(CLIENT_CULTURES,locale)||!object(v)||v.schema!=='asbc-client-entities-v1'||v.locale!==locale||v.culture!==CLIENT_CULTURES[locale]||!id(v.buildId)||!id(v.textBuildId)||!object(v.source)||v.source.kind!=='installed-steam-client')return false;
 return ENTITY_KINDS.every(kind=>object(v[kind])&&Object.keys(v[kind]).length>0&&Object.keys(v[kind]).length<=100000&&Object.entries(v[kind]).every(([key,entry])=>id(key)&&object(entry)&&plain(entry.name,500)&&(entry.summary===undefined||(kind==='quests'&&plain(entry.summary,2000)))));
}
const cache=new Map<string,ClientEntities>(),pending=new Map<string,Promise<ClientEntities|null>>();
export function cachedClientEntities(locale:string){return cache.get(locale)||null;}
// Loaded only when the NPC/journal panels open, never while hovering equipment.
export function loadClientEntities(locale:string):Promise<ClientEntities|null>{
 if(!Object.hasOwn(CLIENT_CULTURES,locale))return Promise.resolve(null);
 if(cache.has(locale))return Promise.resolve(cache.get(locale)!);
 if(pending.has(locale))return pending.get(locale)!;
 const request=fetch('/shadowcraft/data/client-entities/'+locale+'.json').then(async response=>{
  if(!response.ok)throw Error('Entity names unavailable');const raw=await response.text();if(raw.length>8000000)throw Error('Entity names too large');
  const next=JSON.parse(raw);if(!validClientEntities(next,locale))throw Error('Invalid entity names');cache.set(locale,next);return next;
 }).catch(()=>null).finally(()=>pending.delete(locale));pending.set(locale,request);return request;
}
export function resolveEntityName(bundle:ClientEntities|null,english:ClientEntities|null,locale:string,kind:EntityKind,id:string,fallback:string,buildId?:string){
 const current=bundle?.locale===locale&&(!buildId||bundle.buildId===buildId)?Object.hasOwn(bundle[kind],id)?bundle[kind][id]:undefined:undefined;
 const en=english&&(!buildId||english.buildId===buildId)?Object.hasOwn(english[kind],id)?english[kind][id]:undefined:undefined;
 return {name:current?.name||en?.name||fallback,summary:current?.summary,language:current?locale:en?'en':null,fallback:locale!=='en'&&!current};
}
export function entitySearchText(bundles:Array<ClientEntities|null>,kind:EntityKind,id:string,original:string,buildId?:string){
 return [id,original,...bundles.filter(bundle=>bundle&&(!buildId||bundle.buildId===buildId)).map(bundle=>bundle&&Object.hasOwn(bundle[kind],id)?bundle[kind][id].name:'')].join(' ').normalize('NFKC').toLowerCase();
}
