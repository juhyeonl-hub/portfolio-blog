import {useEffect,useRef,useState} from 'react';
import {settingsStorage} from '../lib/account-settings';
import {useSettingsRefresh} from './use-settings-refresh';
// Check the latest stored bytes for every action, including two clicks before React renders.
export function useTradeStore<T>(key:string,parse:(raw:string|null)=>T,empty:()=>T){
 const read=()=>{try{const raw=settingsStorage.getItem(key);return {raw,value:parse(raw),error:false};}catch{return {raw:null,value:empty(),error:true};}};
 const [state,setState]=useState(read),current=useRef(state);current.current=state;
 const reload=()=>{const next=read();current.current=next;setState(next);};
 useSettingsRefresh(key,reload);
 useEffect(()=>{const listener=(event:StorageEvent)=>{if(event.key===key)reload();};window.addEventListener('storage',listener);return()=>window.removeEventListener('storage',listener);},[key]);
 const save=(value:T)=>{try{
  settingsStorage.reload();
  if(current.current.error||settingsStorage.getItem(key)!==current.current.raw)throw Error('changed');
  const clean=parse(JSON.stringify(value)),raw=JSON.stringify(clean);settingsStorage.setItem(key,raw);const next={raw,value:clean,error:false};current.current=next;setState(next);return true;
 }catch{const next={...current.current,error:true};current.current=next;setState(next);return false;}};
 return {value:state.value,raw:state.raw,error:state.error,save,reload};
}
