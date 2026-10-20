import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {localizedValue} from '../lib/localization';
export type Locale='ko'|'en'|'ja'|'fi';
const supported=['ko','en','ja','fi'];

// Korean is the source language: its screens need neither a dictionary nor the specialization/skill-name data, so
// those are loaded only for the other languages, each language in its own chunk (see asbc-vite-plugins.js).
type Helpers=typeof import('../lib/specialization-localization');
type Bundle={messages:Record<string,string>;helpers:Helpers};
const loaders:Record<Exclude<Locale,'ko'>,()=>Promise<{default:{messages:Record<string,string>}}>>={
 en:()=>import('virtual:asbc-locale/en'),ja:()=>import('virtual:asbc-locale/ja'),fi:()=>import('virtual:asbc-locale/fi')};
const loaded:Partial<Record<Locale,Bundle>>={};
const loading:Partial<Record<Locale,Promise<Bundle>>>={};
function load(locale:Locale):Promise<Bundle|null>{
 if(locale==='ko')return Promise.resolve(null);
 if(loaded[locale])return Promise.resolve(loaded[locale]!);
 loading[locale]??=Promise.all([loaders[locale](),import('../lib/specialization-localization')])
  .then(([dictionary,helpers])=>loaded[locale]={messages:dictionary.default.messages,helpers})
  .finally(()=>{delete loading[locale];});
 return loading[locale]!;
}
function savedLocale():Locale{try{const saved=localStorage.getItem('asbc-locale');return supported.includes(saved||'')?saved as Locale:'ko';}catch{return 'ko';}}
// Start fetching the saved language's bundle right away, in parallel with the rest of the app.
void load(savedLocale()).catch(()=>{/* Retried when the provider mounts or the language changes. */});

const Context=createContext({locale:'ko' as Locale,setLocale:(_value:Locale)=>{},t:<T,>(key:T,values?:unknown[]):T=>localizedValue(key,{},values),specialization:(source:string,_id?:string)=>source,skill:(name:string)=>name,skillRefs:(text:string)=>text,node:(name:string)=>name});
export function LocaleProvider({children}:{children:ReactNode}){
 const [locale,setLocale]=useState<Locale>(savedLocale);
 // Until the bundle arrives the screens show the Korean source text; every helper is a pass-through for Korean.
 const [bundle,setBundle]=useState<Bundle|null>(()=>loaded[locale]||null);
 useEffect(()=>{document.documentElement.lang=locale;document.title='ASBC · Aion2 Steam Build Craft';try{localStorage.setItem('asbc-locale',locale);}catch{}},[locale]);
 useEffect(()=>{let current=true;setBundle(loaded[locale]||null);
  load(locale).then(next=>{if(current)setBundle(next);}).catch(()=>{/* Keep the fallback text; the next change retries. */});
  return()=>{current=false;};},[locale]);
 const messages=bundle?.messages||{};
 const t=<T,>(key:T,values?:unknown[]):T=>localizedValue(key,messages,values);
 const helpers=bundle?.helpers;
 const value={locale,setLocale,t,
  specialization:(source:string,id?:string)=>helpers?helpers.localizeSpecialization(source,locale,id):source,
  skill:(name:string)=>helpers?helpers.localizeSkillName(name,locale):name,
  skillRefs:(text:string)=>helpers?helpers.localizeSkillReferences(text,locale):text,
  node:(name:string):string=>helpers?helpers.localizeNodeName(name,locale,(key,values)=>localizedValue(key,messages,values)):name};
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useLocale=()=>useContext(Context);
export function LanguageSelect(){const {locale,setLocale,t}=useLocale();return <select className="asbc-language" aria-label={t('언어')} value={locale} onChange={e=>setLocale(e.target.value as Locale)}><option value="ko">{'한국어'}</option><option value="en">{'English'}</option><option value="ja">{'日本語'}</option><option value="fi">{'Suomi'}</option></select>;}
