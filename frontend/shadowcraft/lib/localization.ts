export type Locale='ko'|'en'|'ja'|'fi'|'fr'|'de'|'es'|'pt-BR'|'ru';
export type Translations=Record<string,string>;
export function localizedValue<T>(value:T,translations:Translations,parameters?:unknown[]):T{
 if(typeof value!=='string')return value;
 const key=value.trim();
 const lookup=(source:string)=>Object.prototype.hasOwnProperty.call(translations,source)?translations[source]:undefined;
 const translated=lookup(value)||lookup(key);
 // Keep layout whitespace and fall back when a translation loses placeholders.
 const placeholders=(s:string)=>[...s.matchAll(/\{(\d+)\}/g)].map(m=>m[1]).sort().join(',');
 const valid=translated&&placeholders(translated)===placeholders(value);
 let result=valid?value.slice(0,value.indexOf(key))+translated+value.slice(value.indexOf(key)+key.length):value;
 if(parameters)result=result.replace(/\{(\d+)\}/g,(match,index)=>Number(index)<parameters.length?String(parameters[Number(index)]??''):match);
 return result as T;
}
