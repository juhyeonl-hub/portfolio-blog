import {useEffect,useRef} from 'react';
import {settingsStorage,subscribeSettingsChanges} from '../lib/account-settings';

/** Only replace a consumer's saved state when that setting changed; preserve its transient UI. */
export function useSettingsRefresh(key:string|null,refresh:()=>void){
 const callback=useRef(refresh);callback.current=refresh;
 useEffect(()=>{
  if(!key)return;
  let previous:string|null;try{previous=settingsStorage.getItem(key);}catch{return;}
  return subscribeSettingsChanges(()=>{
   try{const next=settingsStorage.getItem(key);if(next===previous)return;previous=next;callback.current();}catch{/* Keep the current view when storage fails. */}
  });
 },[key]);
}
