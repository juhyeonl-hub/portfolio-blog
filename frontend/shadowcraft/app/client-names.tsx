import {useEffect,useState} from 'react';
import {useLocale} from './locale';
import {cachedClientLocale,loadClientLocale,resolveClientName,resolveClientStat,type ClientLocale} from '../lib/client-locales';

export function useClientNames(){
 const {locale,t}=useLocale();
 const [loaded,setLoaded]=useState<{locale:string;bundle:ClientLocale|null;english:ClientLocale|null}|null>(null);
 useEffect(()=>{let live=true;Promise.all([loadClientLocale(locale),loadClientLocale('en')]).then(([bundle,english])=>{if(live)setLoaded({locale,bundle,english});});return()=>{live=false;};},[locale]);
 const bundle=loaded?.locale===locale?loaded.bundle:cachedClientLocale(locale),english=loaded?.english||cachedClientLocale('en');
 const resolve=(kind:'items'|'skills',id:string|number,fallback:string)=>resolveClientName(bundle,english,locale,kind,id,fallback);
 return {locale,bundle,english,loading:loaded?.locale!==locale&&!bundle,
  item:(id:string|number,fallback:string)=>resolve('items',id,fallback),
  skill:(id:string|number,fallback:string)=>resolve('skills',id,fallback),
  stat:(id:string,fallback:string)=>resolveClientStat(bundle,id,fallback),
  fallbackLabel:t('이 항목의 번역을 확인할 수 없어 원문으로 표시합니다.')};
}
export function ClientItemName({id,name}:{id:string|number;name:string}){
 const names=useClientNames(),result=names.item(id,name);
 return <span lang={result.language||undefined}>{result.name}{result.fallback&&!names.loading&&<small className="client-name-fallback" title={names.fallbackLabel} aria-label={names.fallbackLabel}> · {result.language==='en'?'EN':names.locale==='ko'?'원문':'Original'}</small>}</span>;
}
