import {classProfile,type PvePreset} from '@/lib/classes';
import type {Catalog,Plan} from '@/lib/planner';
import {pveText} from '@/lib/pve-direction-text';
import {useLocale} from './locale';
import './pve-direction.css';
const choices:readonly PvePreset[]=['group','single','farm'];
export default function PveDirection({plan,onChange}:{plan:Plan;onChange:(patch:Partial<Plan>)=>void}){
 const {locale}=useLocale(),profile=classProfile(plan.classKey),selected=profile.pvePresets?(plan.pvePreset||'group'):'group';
 return <section className="pve-direction-tree" aria-label={pveText(locale,'title')}>
 <h3>{pveText(locale,'title')}</h3><div className="pve-direction-branches" role="group" aria-label={pveText(locale,'title')}>
 {choices.map(choice=><button type="button" key={choice} disabled={choice!=='group'&&!profile.pvePresets?.[choice]} aria-pressed={choice===selected} onClick={()=>onChange({pvePreset:choice,mode:choice==='group'?'safe':'damage',specs:plan.specs})}><strong>{pveText(locale,choice)}</strong><span>{pveText(locale,choice==='group'?'groupHelp':choice==='single'?'singleHelp':'farmHelp')}</span></button>)}</div>
 {!profile.pvePresets&&<p>{pveText(locale,'pending')}</p>}
 {profile.pvePresetSource&&<p className="subtle"><a href={profile.pvePresetSource.url} target="_blank" rel="noreferrer">{pveText(locale,'reference')}</a> · {profile.pvePresetSource.checkedAt}</p>}
 <p className="subtle">{pveText(locale,'shared')}</p></section>;
}
export function PveActivityGuide({catalog,plan}:{catalog:Catalog;plan:Plan}){
 const {locale,skill}=useLocale(),profile=classProfile(plan.classKey);
 if(plan.level<45||plan.mode==='pvp'||!profile.pvePresets||!plan.pvePreset||plan.pvePreset==='group')return null;
 const key=profile.key==='templar'?(plan.pvePreset==='farm'?'templarFarm':'templarSingle'):(plan.pvePreset==='farm'?'rangerFarm':'rangerSingle');
 const ids=key==='templarFarm'?['12040000','12350000']:key==='templarSingle'?['12240000','12090000']:key==='rangerFarm'?['14170000','14020000']:['14090000','14010000'];
 return <section className="pve-activity-guide panel"><h3>{pveText(locale,'guide')} · {pveText(locale,plan.pvePreset)}</h3><p>{pveText(locale,key,ids.map(id=>skill(catalog.skills.find(s=>s.id===id)?.name||id)))}</p><p className="subtle">{pveText(locale,'shared')}</p></section>;
}
