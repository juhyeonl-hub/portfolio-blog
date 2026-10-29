import {type Skill,type Plan,slots,recommendSpecs} from '@/lib/planner';
import {useLocale} from './locale';
import './skill-specialization-summary.css';

/** Compare eligible manual selections only; never change either the plan or recommendation. */
export function specializationDifference(skill:Skill,plan:Plan,level:number){
 const empty={current:[] as number[],recommended:[] as number[],remove:[] as number[],add:[] as number[],different:false};
 if(skill.stigma||skill.kind==='passive'||slots(skill,level)===0)return empty;
 const recommendedIds=new Set(recommendSpecs(skill,level,plan.mode));
 if(!recommendedIds.size)return empty;
 const currentIds=new Set(plan.specs[skill.id]||[]);
 const options=skill.specializations.map((sp,index)=>({...sp,number:index+1})).filter(sp=>sp.requiredParentLevel<=level);
 const current=options.filter(sp=>currentIds.has(sp.id)).map(sp=>sp.number);
 const recommended=options.filter(sp=>recommendedIds.has(sp.id)).map(sp=>sp.number);
 const remove=current.filter(n=>!recommended.includes(n)),add=recommended.filter(n=>!current.includes(n));
 return {current,recommended,remove,add,different:remove.length>0||add.length>0};
}

/** Display saved choices without replacing them with the current recommendation. */
export default function SkillSpecializationSummary({skill,plan,level,expanded,onToggle}:{skill:Skill;plan:Plan;level:number;expanded:boolean;onToggle:()=>void}){
 const {t,skill:localSkill,specialization}=useLocale();
 if(!skill.specializations.length)return skill.kind==='passive'?<p className="skill-spec-passive">{t('패시브는 별도 특화 선택 없이 레벨에 따라 적용됩니다.')}</p>:null;
 const effects=skill.specializations.map((sp,index)=>({...sp,number:index+1}));
 const selected=effects.filter(sp=>skill.stigma?sp.requiredParentLevel<=level:(plan.specs[skill.id]||[]).includes(sp.id));
 const count=slots(skill,level),difference=specializationDifference(skill,plan,level);
 const numbers=(values:number[])=>values.map(n=>t('특화 {0}',[n])).join(' · ')||t('없음');
 return <div className="skill-spec-summary" data-skill-spec={skill.id}>
  <div className="skill-spec-heading"><strong>{t(skill.stigma?'레벨에 따라 자동 적용':'내 계획의 특화 ({0}/{1}칸)',[selected.length,count])}</strong><button type="button" className="button ghost small" aria-label={skill.stigma?localSkill(skill.name)+' · '+t('자동 적용 효과'):t('{0} 특화 선택·변경',[localSkill(skill.name)])} aria-expanded={expanded} aria-controls={'skill-spec-'+skill.id} onClick={onToggle}>{t(skill.stigma?'자동 적용 효과':'특화 선택')}</button></div>
  {!expanded&&(selected.length?<ul>{selected.map(sp=><li key={sp.id} data-selected-spec={sp.id}><b>{t('특화 {0}',[sp.number])}</b><span>{specialization(sp.description,sp.id)}</span></li>)}</ul>:<p>{t(skill.stigma?'아직 자동 적용 효과가 없습니다.':count===0?'아직 특화 선택 칸이 열리지 않았습니다.':'선택한 특화 없음')}</p>)}
  {difference.different&&<div className="skill-spec-difference"><strong>{t('추천과 다른 선택')}</strong><p>{t('내 선택 {0} → 추천 {1}',[numbers(difference.current),numbers(difference.recommended)])}</p><p>{difference.remove.length&&difference.add.length?t('추천을 따르려면: {0} 해제 → {1} 선택',[numbers(difference.remove),numbers(difference.add)]):difference.add.length?t('추천을 따르려면: {0} 선택',[numbers(difference.add)]):t('추천을 따르려면: {0} 해제',[numbers(difference.remove)])}</p></div>}
 </div>;
}

export function SpecializationOptionLabel({option,number,selected,locked,recommended,automatic}:{option:Skill['specializations'][number];number:number;selected:boolean;locked:boolean;recommended:boolean;automatic:boolean}){
 const {t,specialization}=useLocale();
 return <span className="editor-spec-content"><span className="editor-spec-labels"><b>{t('특화 {0}',[number])}</b>{selected&&<small className="spec-state selected-state">{t(automatic?'자동 적용 효과':'선택됨')}</small>}{!locked&&recommended&&!automatic&&<small className="spec-state recommended-state">{t('추천 특화')}</small>}{locked&&<small className="spec-state locked-state">{t('잠긴 특화')}</small>}</span><span className="editor-spec-effect">{specialization(option.description,option.id)}</span></span>;
}
