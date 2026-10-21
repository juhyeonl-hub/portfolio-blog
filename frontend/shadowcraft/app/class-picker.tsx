import {useEffect,useRef,useState} from 'react';
import {ChevronDown,Check} from 'lucide-react';
import {CLASSES,classProfile} from '../lib/classes';
import {useLocale} from './locale';

export default function ClassPicker({selected,onChange}:{selected:string;onChange:(key:string)=>void}){
 const {t}=useLocale(),[open,setOpen]=useState(false);
 const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  if(!open)return;
  const pointer=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};
  const keyboard=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpen(false);trigger.current?.focus();}};
  document.addEventListener('pointerdown',pointer);document.addEventListener('keydown',keyboard);
  return()=>{document.removeEventListener('pointerdown',pointer);document.removeEventListener('keydown',keyboard);};
 },[open]);
 const icon=(key:string)=>'/shadowcraft/game/images/ui/resource/texture/icon/ut_class_'+key+'_large.webp';
 return <div className="visual-class-picker" ref={root} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false);}}>
  <img className="selected-class-icon" src={icon(selected)} alt=""/>
  <select className="class-select" aria-label={t('직업 선택')} value={selected} onChange={event=>onChange(event.target.value)}>{CLASSES.map(c=><option key={c.key} value={c.key}>{t(c.name)}</option>)}</select>
  <button ref={trigger} type="button" className="class-grid-trigger" aria-expanded={open} aria-controls="asbc-class-options" onClick={()=>setOpen(v=>!v)}>{t('직업 둘러보기')}<ChevronDown size={14}/></button>
  {open&&<div id="asbc-class-options" className="class-options" role="group" aria-label={t('직업 선택')}>
   {CLASSES.map(c=><button type="button" key={c.key} aria-pressed={selected===c.key} onClick={()=>{setOpen(false);trigger.current?.focus();if(c.key!==selected)onChange(c.key);}}><img src={icon(c.key)} alt=""/><span>{t(c.name)}</span>{selected===c.key&&<Check size={14}/>}</button>)}
   <p>{t('{0} 선택됨',[t(classProfile(selected).name)])}</p>
  </div>}
 </div>;
}
