import {useEffect,useState} from 'react';

/** Keep a blank editing draft, but publish valid numbers immediately without losing focus. */
export default function PointNumber({label,value,min=0,max=9999,disabled=false,placeholder,onValue}:{label:string;value:number|undefined;min?:number;max?:number;disabled?:boolean;placeholder?:string;onValue:(value:number)=>void}){
 const [draft,setDraft]=useState(value===undefined?'':String(value));
 useEffect(()=>setDraft(value===undefined?'':String(value)),[value]);
 return <input aria-label={label} type="number" inputMode="numeric" min={min} max={max} step="1" disabled={disabled} placeholder={placeholder} value={draft} onChange={e=>{
  const text=e.target.value;setDraft(text);const n=Number(text);
  if(!disabled&&text!==''&&Number.isInteger(n)&&n>=min&&n<=max)onValue(n);
 }} onBlur={()=>setDraft(value===undefined?'':String(value))} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur()}}/>;
}
