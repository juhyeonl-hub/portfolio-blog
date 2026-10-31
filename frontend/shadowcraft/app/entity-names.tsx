import {useEffect,useState} from 'react';
import {useLocale} from './locale';
import {cachedClientEntities,loadClientEntities,resolveEntityName,entitySearchText,type ClientEntities,type EntityKind} from '../lib/client-entities';
export function useEntityNames(active:boolean,buildId?:string){
 const {locale,t}=useLocale();const [loaded,setLoaded]=useState<{locale:string;bundles:Array<ClientEntities|null>}|null>(null);
 useEffect(()=>{if(!active)return;let live=true;Promise.all([loadClientEntities(locale),loadClientEntities('en'),loadClientEntities('ko')]).then(bundles=>{if(live)setLoaded({locale,bundles});});return()=>{live=false;};},[active,locale]);
 const bundles=loaded?.locale===locale?loaded.bundles:[cachedClientEntities(locale),cachedClientEntities('en'),cachedClientEntities('ko')];
 const resolve=(kind:EntityKind,id:string,fallback:string)=>resolveEntityName(bundles[0],bundles[1],locale,kind,id,fallback,buildId);
 return {locale,resolve,loading:active&&loaded?.locale!==locale&&!bundles[0],missing:active&&loaded?.locale===locale&&!bundles[0],
  text:(kind:EntityKind,id:string,fallback:string)=>resolve(kind,id,fallback).name,
  matches:(kind:EntityKind,id:string,original:string,query:string)=>entitySearchText(bundles,kind,id,original,buildId).includes(query.trim().normalize('NFKC').toLowerCase()),
  fallbackLabel:t('이 항목의 번역을 확인할 수 없어 원문으로 표시합니다.')};
}
export function EntityName({names,kind,id,name}:{names:ReturnType<typeof useEntityNames>;kind:EntityKind;id:string;name:string}){
 const value=names.resolve(kind,id,name);
 return <span lang={value.language||undefined}>{value.name}{value.fallback&&!names.loading&&<small className="client-name-fallback" title={names.fallbackLabel} aria-label={names.fallbackLabel}> · EN</small>}</span>;
}
