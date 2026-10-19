import {useLocale} from './locale';
export default function FactionPicker({value,onChange,disabled=false}:{value:number;onChange:(race:number)=>void;disabled?:boolean}){
 const {t}=useLocale();
 return <div className="faction-picker" role="group" aria-label={t("종족 선택")}>{[[1,'천족'],[2,'마족']].map(([id,name])=><button type="button" key={id} disabled={disabled} aria-pressed={value===id} className={'button secondary '+(value===id?'selected':'')} onClick={()=>onChange(Number(id))}>{t(name)}</button>)}</div>;
}
