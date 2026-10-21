import type {ReactNode} from 'react';
import {useLocale} from './locale';
import skillDescriptions from '@/lib/data/skill-descriptions.json';

// Official Global client skill text (English), one entry per playable skill; shown in the hover card.
const SKILL_DESCRIPTIONS=skillDescriptions as Record<string,{en:string;traits?:string}>;
type TipSkill={id:string;name:string;kind:string;stigma:boolean;maxLevel:number;specializations:{id:string;description:string;requiredParentLevel:number}[]};

/** Hover/focus card for a skill: type, role memo, current/max level, specializations and the official client text. */
export function SkillTip({skill,level,role}:{skill:TipSkill;level?:number;role?:string}){
 const {t,skill:localSkill,specialization}=useLocale();
 const official=SKILL_DESCRIPTIONS[skill.id];
 return <div className="skill-tip" role="tooltip">
  <b>{localSkill(skill.name)}</b>
  <span>{t(skill.stigma?'스티그마':skill.kind==='passive'?'패시브':'액티브')}{role?' · '+t(role):''}</span>
  {level!==undefined&&<span>{t('현재 Lv.{0} · 최대 Lv.{1}',[level,skill.maxLevel])}</span>}
  {skill.specializations.length>0&&<ul className="skill-tip-specs">{skill.specializations.map((x,i)=><li key={x.id}><span>{t('특화 {0} · Lv.{1}부터',[i+1,x.requiredParentLevel])}</span>{specialization(x.description,x.id)}</li>)}</ul>}
  {official&&<p className="skill-tip-official"><span>{t('공식 설명 (영문)')}</span>{official.en.replace(/\[unresolved value\]/g,'?')}</p>}
 </div>;
}

/** Wraps any inline skill mention so the card shows on hover or keyboard focus. Without a catalog skill it renders the children alone. */
export function SkillHover({skill,level,role,children}:{skill?:TipSkill;level?:number;role?:string;children:ReactNode}){
 if(!skill)return <>{children}</>;
 return <span className="skill-hover" tabIndex={0}>{children}<SkillTip skill={skill} level={level} role={role}/></span>;
}
