// Official installed-client text, keyed by stable IDs. Never overwrite API or user-authored names.
export const CLIENT_CULTURES:Record<string,string>={ko:'ko-KR',en:'en-US',ja:'ja-JP',fr:'fr-FR',de:'de-DE',es:'es-ES','pt-BR':'pt-BR',ru:'ru-RU'};
type Description={text:string;unresolvedValues:number;valueScope?:'base-client-values'|'unresolved-client-values'};
export type ClientLocale={schema:'asbc-client-locale-v1';locale:string;culture:string;buildId:string;textBuildId:string;source:{kind:'installed-steam-client'};items:Record<string,string>;skills:Record<string,{name:string;description?:Description;traits?:Description}>;stats:Record<string,string>};
const object=(v:unknown):v is Record<string,any>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const name=(v:unknown)=>typeof v==='string'&&v.trim().length>0&&v.length<=500&&!/[\x00-\x1f\x7f<{}]/.test(v);
const id=(v:string)=>typeof v==='string'&&/^[1-9][0-9]{0,14}$/.test(v);
function description(v:unknown):boolean{
 return object(v)&&typeof v.text==='string'&&v.text.trim().length>0&&v.text.length<=2000&&!/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f<{}]/.test(v.text)&&
  Number.isSafeInteger(v.unresolvedValues)&&v.unresolvedValues>=0&&v.unresolvedValues<=1000&&(v.text.match(/\[unresolved value\]/g)||[]).length===v.unresolvedValues&&['base-client-values','unresolved-client-values'].includes(v.valueScope);
}
export function validClientLocale(value:unknown,locale:string):value is ClientLocale{
 if(!Object.hasOwn(CLIENT_CULTURES,locale)||!object(value)||value.schema!=='asbc-client-locale-v1'||value.locale!==locale||value.culture!==CLIENT_CULTURES[locale]||!id(value.buildId)||!id(value.textBuildId)||!object(value.source)||value.source.kind!=='installed-steam-client')return false;
 const {items,skills,stats}=value;
 if(!object(items)||!object(skills)||!object(stats)||!Object.keys(items).length||Object.keys(items).length>50000||Object.keys(skills).length>10000||Object.keys(stats).length>1000)return false;
 return Object.entries(items).every(([k,v])=>id(k)&&name(v))&&Object.entries(stats).every(([k,v])=>/^[A-Za-z][A-Za-z0-9]{0,79}$/.test(k)&&name(v))&&
  Object.entries(skills).every(([k,v])=>id(k)&&object(v)&&name(v.name)&&(v.description===undefined||description(v.description))&&(v.traits===undefined||description(v.traits)));
}
const cache=new Map<string,ClientLocale>(),pending=new Map<string,Promise<ClientLocale|null>>();
export function cachedClientLocale(locale:string){return cache.get(locale)||null;}
export function loadClientLocale(locale:string):Promise<ClientLocale|null>{
 if(!Object.hasOwn(CLIENT_CULTURES,locale))return Promise.resolve(null);
 if(cache.has(locale))return Promise.resolve(cache.get(locale)!);
 if(pending.has(locale))return pending.get(locale)!;
 const request=fetch('/shadowcraft/data/client-locales/'+locale+'.json').then(async response=>{
  if(!response.ok)throw Error('Client language unavailable');const value=await response.json();
  if(!validClientLocale(value,locale))throw Error('Invalid client language');cache.set(locale,value);return value;
 }).catch(()=>null).finally(()=>{pending.delete(locale);});
 pending.set(locale,request);return request;
}
export function resolveClientName(bundle:ClientLocale|null,english:ClientLocale|null,locale:string,kind:'items'|'skills',id:string|number,fallback:string){
 const entry=bundle?.locale===locale?bundle[kind][String(id)]:undefined;
 const translated=typeof entry==='string'?entry:entry?.name;
 const original=english?.[kind][String(id)];const en=typeof original==='string'?original:original?.name;
 return {name:translated||en||fallback,language:translated?locale:en?'en':null,fallback:locale!=='en'&&!translated};
}

export function resolveClientStat(bundle:ClientLocale|null,id:string,fallback:string):string {
 return bundle&&Object.hasOwn(bundle.stats,id)?bundle.stats[id]:fallback;
}
