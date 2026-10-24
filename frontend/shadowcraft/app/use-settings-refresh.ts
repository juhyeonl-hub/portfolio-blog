import {useEffect,useRef} from 'react';
import {settingsStorage,subscribeSettingsChanges} from '../lib/account-settings';

/** Track local renders too: a remote return to the initial value must undo a local edit on screen. */
export function useSettingsRefresh(key:string|null,refresh:()=>void){
 const callback=useRef(refresh);callback.current=refresh;
 const previous=useRef<string|null>(null);
 try{previous.current=key?settingsStorage.getItem(key):null;}catch{/* Keep the last readable snapshot. */}
 useEffect(()=>{
  if(!key)return;
  return subscribeSettingsChanges(()=>{
   try{const next=settingsStorage.getItem(key);if(next===previous.current)return;previous.current=next;callback.current();}catch{/* Keep the current view when storage fails. */}
  });
 },[key]);
}
