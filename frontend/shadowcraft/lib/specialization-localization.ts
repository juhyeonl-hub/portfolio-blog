import templates from './data/specialization-translations.json';
import skillNames from './data/skill-names.json';
import official from './data/official-specializations.json';
import type {Locale} from './localization';
const escape=(value:string)=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const patterns=templates.map(row=>({row,pattern:new RegExp('^'+row.source.split(/\{\d+\}/).map(escape).join('(\\d+(?:\\.\\d+)?)')+'$')}));
const names=skillNames as Record<string,{en:string;ja?:string}>;
const officialText=official as Record<string,{ko:string;en?:string;ja?:string}>;
const own=(object:object,key:string)=>Object.prototype.hasOwnProperty.call(object,key);
/** Official client name: Japanese for ja when known, otherwise the global English name (en, fi). */
const lookup=(name:string,locale:Locale)=>own(names,name)?(locale==='ja'&&names[name].ja)||names[name].en:undefined;
/** Official global-client (en-US) skill name for a catalog skill name; Korean stays Korean. */
export function localizeSkillName(name:string,locale:Locale):string{
 if(locale==='ko'||typeof name!=='string')return name;
 return lookup(name,locale)||name;
}
/** Replace [Korean skill name] references with the official global-client names. */
export function localizeSkillReferences(text:string,locale:Locale):string{
 if(locale==='ko')return text;
 return text.replace(/\[([^\]]+)\]/g,(whole,name)=>{const mapped=lookup(name,locale);return mapped?'['+mapped+']':whole;});
}
/** Daevanion node names: skill-level nodes, board start nodes, skill names and (comma-joined) stat names. */
export function localizeNodeName(name:string,locale:Locale,translate:(key:string,values?:unknown[])=>string):string{
 if(locale==='ko'||typeof name!=='string')return name;
 const level=name.match(/^스킬 레벨 상승 - (.+)$/);if(level)return translate('스킬 레벨 상승 - {0}',[localizeSkillName(level[1],locale)]);
 const start=name.match(/^(.+) - 시작$/);if(start)return translate('{0} - 시작',[translate(start[1])]);
 const skillName=localizeSkillName(name,locale);if(skillName!==name)return skillName;
 return name.split(', ').map(part=>translate(part)).join(', ');
}
/** Full-phrase matching only. Unreviewed compound effects retain their source text. */
export function localizeSpecialization(source:string,locale:Locale,id?:string):string{
 if(locale==='ko')return source;
 // Official client text (metabot.gg mirror), checked against this exact Korean source. If the server catalog
 // later changes the description, the official text no longer applies and the current source is translated instead.
 if(id&&(locale==='en'||locale==='ja')&&own(officialText,id)&&officialText[id].ko===source){const text=officialText[id][locale];if(text)return text;}
 for(const {row,pattern} of patterns){const match=source.match(pattern);if(match)return localizeSkillReferences(row[locale].replace(/\{(\d+)\}/g,(_,index)=>match[Number(index)+1]),locale);}
 return source;
}
