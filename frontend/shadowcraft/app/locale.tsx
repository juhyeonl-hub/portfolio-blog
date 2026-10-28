import './locale-layout.css';
import {initialLocale} from '../lib/initial-locale';
import {useSettingsRefresh} from './use-settings-refresh';
import {settingsStorage} from '../lib/account-settings';
import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {localizedValue} from '../lib/localization';
export type Locale='ko'|'en'|'ja'|'fi'|'fr'|'de'|'es'|'pt-BR'|'ru';

// Korean is the source language: its screens need neither a dictionary nor the specialization/skill-name data, so
// those are loaded only for the other languages, each language in its own chunk (see asbc-vite-plugins.js).
type Helpers=typeof import('../lib/specialization-localization');
type Bundle={messages:Record<string,string>;helpers:Helpers};
const loaders:Record<Exclude<Locale,'ko'>,()=>Promise<{default:{messages:Record<string,string>}}>>={
 en:()=>import('virtual:asbc-locale/en'),ja:()=>import('virtual:asbc-locale/ja'),fi:()=>import('virtual:asbc-locale/fi'),
 fr:()=>import('virtual:asbc-locale/fr'),de:()=>import('virtual:asbc-locale/de'),es:()=>import('virtual:asbc-locale/es'),
 'pt-BR':()=>import('virtual:asbc-locale/pt-BR'),ru:()=>import('virtual:asbc-locale/ru')};
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
function savedLocale():Locale{const languages=typeof navigator==='undefined'?[]:navigator.languages;try{return initialLocale(settingsStorage.getItem('asbc-locale'),languages);}catch{return initialLocale(null,languages);}}
// Start fetching the saved language's bundle right away, in parallel with the rest of the app.
void load(savedLocale()).catch(()=>{/* Retried when the provider mounts or the language changes. */});

const Context=createContext({locale:'ko' as Locale,setLocale:(_value:Locale)=>{},t:<T,>(key:T,values?:unknown[]):T=>localizedValue(key,{},values),specialization:(source:string,_id?:string)=>source,skill:(name:string)=>name,skillRefs:(text:string)=>text,node:(name:string)=>name});
export function LocaleProvider({children}:{children:ReactNode}){
 const [locale,setLocale]=useState<Locale>(savedLocale);
 useSettingsRefresh('asbc-locale',()=>setLocale(savedLocale()));
 // Keep the mounted editor and previous dictionary during a language switch.
 const [bundle,setBundle]=useState<Bundle|null>(()=>loaded[locale]||null);
 const [failedLocale,setFailedLocale]=useState<Locale|null>(null);
 const [retry,setRetry]=useState(0);
 useEffect(()=>{document.documentElement.lang=locale;document.title='AION 2 Global Tools: Build Planner & Trade Calculator | ASBC';try{settingsStorage.setItem('asbc-locale',locale);}catch{}},[locale]);
 useEffect(()=>{let current=true;setFailedLocale(null);
  if(locale==='ko')setBundle(null);else if(loaded[locale])setBundle(loaded[locale]!);
  load(locale).then(next=>{if(current)setBundle(next);}).catch(()=>{if(current)setFailedLocale(locale);});
  return()=>{current=false;};},[locale,retry]);
 const ready=locale==='ko'||bundle!==null;
 const failed=failedLocale===locale;
 const status=languageStatus[locale];
 const messages=locale==='ko'?{}:bundle?.messages||{};
 const t=<T,>(key:T,values?:unknown[]):T=>localizedValue(key,messages,values);
 const helpers=locale==='ko'?undefined:bundle?.helpers;
 const value={locale,setLocale,t,
  specialization:(source:string,id?:string)=>helpers?helpers.localizeSpecialization(source,locale,id):source,
  skill:(name:string)=>helpers?helpers.localizeSkillName(name,locale):name,
  skillRefs:(text:string)=>helpers?helpers.localizeSkillReferences(text,locale):text,
  node:(name:string):string=>helpers?helpers.localizeNodeName(name,locale,(key,values)=>localizedValue(key,messages,values)):name};
 return <Context.Provider value={value}>
  <div className="locale-stage" hidden={!ready} aria-busy={!ready}>{children}</div>
  {(!ready||failed)&&<section className="locale-loading" role="status">
   <p>{failed?status.error:status.loading}</p>
   {!ready&&<LanguageSelect/>}
   {failed&&<button type="button" onClick={()=>setRetry(value=>value+1)}>{status.retry}</button>}
  </section>}
 </Context.Provider>;
}

// These short messages remain available when a language chunk cannot be fetched.
const languageStatus:Record<Locale,{loading:string;error:string;retry:string}>={
 ko:{loading:'언어를 불러오는 중입니다…',error:'언어를 불러오지 못했습니다. 다시 시도하거나 다른 언어를 선택해 주세요.',retry:'다시 시도'},
 en:{loading:'Loading language…',error:'Could not load this language. Retry or choose another language.',retry:'Retry'},
 ja:{loading:'言語を読み込み中…',error:'言語を読み込めませんでした。再試行するか、別の言語を選択してください。',retry:'再試行'},
 fi:{loading:'Ladataan kieltä…',error:'Kielen lataaminen epäonnistui. Yritä uudelleen tai valitse toinen kieli.',retry:'Yritä uudelleen'},
 fr:{loading:'Chargement de la langue…',error:'Impossible de charger cette langue. Réessayez ou choisissez une autre langue.',retry:'Réessayer'},
 de:{loading:'Sprache wird geladen…',error:'Die Sprache konnte nicht geladen werden. Versuche es erneut oder wähle eine andere Sprache.',retry:'Erneut versuchen'},
 es:{loading:'Cargando idioma…',error:'No se pudo cargar este idioma. Vuelve a intentarlo o elige otro idioma.',retry:'Reintentar'},
 'pt-BR':{loading:'Carregando idioma…',error:'Não foi possível carregar este idioma. Tente novamente ou escolha outro idioma.',retry:'Tentar novamente'},
 ru:{loading:'Загрузка языка…',error:'Не удалось загрузить язык. Повторите попытку или выберите другой язык.',retry:'Повторить'}
};

export const useLocale=()=>useContext(Context);
export function LanguageSelect(){const {locale,setLocale,t}=useLocale();return <select className="asbc-language" aria-label={locale!=='ko'&&t('언어')==='언어'?'Language':t('언어')} value={locale} onChange={e=>setLocale(e.target.value as Locale)}><option value="ko">{'한국어'}</option><option value="en">{'English'}</option><option value="ja">{'日本語'}</option><option value="fi">{'Suomi'}</option><option value="fr">{'Français'}</option><option value="de">{'Deutsch'}</option><option value="es">{'Español'}</option><option value="pt-BR">{'Português (Brasil)'}</option><option value="ru">{'Русский'}</option></select>;}
