import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import messages from '../lib/data/ui-translations.json';
import {localizedValue} from '../lib/localization';
import {localizeSpecialization,localizeSkillName,localizeSkillReferences,localizeNodeName} from '../lib/specialization-localization';
export type Locale='ko'|'en'|'ja'|'fi';
const supported=['ko','en','ja','fi'];
const Context=createContext({locale:'ko' as Locale,setLocale:(_value:Locale)=>{},t:<T,>(key:T,values?:unknown[]):T=>localizedValue(key,{},values),specialization:(source:string,_id?:string)=>source,skill:(name:string)=>name,skillRefs:(text:string)=>text,node:(name:string)=>name});
export function LocaleProvider({children}:{children:ReactNode}){
 const [locale,setLocale]=useState<Locale>(()=>{try{const saved=localStorage.getItem('asbc-locale');return supported.includes(saved||'')?saved as Locale:'ko';}catch{return 'ko';}});
 useEffect(()=>{document.documentElement.lang=locale;document.title='ASBC · Aion2 Steam Build Craft';try{localStorage.setItem('asbc-locale',locale);}catch{}},[locale]);
 const dictionary=Object.fromEntries(Object.entries(messages).map(([key,values])=>[key,(values as Record<string,string>)[locale]||key]));
 const t=<T,>(key:T,values?:unknown[]):T=>localizedValue(key,dictionary,values);
 const node=(name:string):string=>localizeNodeName(name,locale,(key,values)=>localizedValue(key,dictionary,values));
 return <Context.Provider value={{locale,setLocale,t,specialization:(source:string,id?:string)=>localizeSpecialization(source,locale,id),skill:(name:string)=>localizeSkillName(name,locale),skillRefs:(text:string)=>localizeSkillReferences(text,locale),node}}>{children}</Context.Provider>;
}
export const useLocale=()=>useContext(Context);
export function LanguageSelect(){const {locale,setLocale,t}=useLocale();return <select className="asbc-language" aria-label={t('언어')} value={locale} onChange={e=>setLocale(e.target.value as Locale)}><option value="ko">{'한국어'}</option><option value="en">{'English'}</option><option value="ja">{'日本語'}</option><option value="fi">{'Suomi'}</option></select>;}
