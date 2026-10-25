import {useState} from 'react';
// Save only explicit user actions. Corrupt or concurrently changed data is never replaced.
export function useTradeStore<T>(key:string,parse:(raw:string|null)=>T,empty:()=>T){
 const read=()=>{try{const raw=localStorage.getItem(key);return {raw,value:parse(raw),error:false};}catch{return {raw:null,value:empty(),error:true};}};
 const [state,setState]=useState(read);
 const save=(value:T)=>{try{
  if(state.error||localStorage.getItem(key)!==state.raw)throw Error('changed');
  const raw=JSON.stringify(value);parse(raw);localStorage.setItem(key,raw);setState({raw,value,error:false});return true;
 }catch{setState(old=>({...old,error:true}));return false;}};
 return {value:state.value,error:state.error,save,reload:()=>setState(read)};
}
