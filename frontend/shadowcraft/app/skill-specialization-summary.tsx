import {type Skill,type Plan,slots} from '@/lib/planner';
import {useLocale} from './locale';
import './skill-specialization-summary.css';

/** Display saved choices without replacing them with the current recommendation. */
export default function SkillSpecializationSummary({skill,plan,level,expanded,onToggle}:{skill:Skill;plan:Plan;level:number;expanded:boolean;onToggle:()=>void}){
 const {t,skill:localSkill,specialization}=useLocale();
 if(!skill.specializations.length)return skill.kind==='passive'?<p className="skill-spec-passive">{t('패시브는 별도 특화 선택 없이 레벨에 따라 적용됩니다.')}</p>:null;
 const effects=skill.specializations.map((sp,index)=>({...sp,number:index+1}));
 const selected=effects.filter(sp=>skill.stigma?sp.requiredParentLevel<=level:(plan.specs[skill.id]||[]).includes(sp.id));
 const count=slots(skill,level);
 return <div className="skill-spec-summary" data-skill-spec={skill.id}>
  <div className="skill-spec-heading"><strong>{t(skill.stigma?'레벨에 따라 자동 적용':'내 계획의 특화 ({0}/{1}칸)',[selected.length,count])}</strong><button type="button" className="button ghost small" aria-label={skill.stigma?localSkill(skill.name)+' · '+t('자동 적용 효과'):t('{0} 특화 선택·변경',[localSkill(skill.name)])} aria-expanded={expanded} aria-controls={'skill-spec-'+skill.id} onClick={onToggle}>{t(skill.stigma?'자동 적용 효과':'특화 선택')}</button></div>
  {!expanded&&(selected.length?<ul>{selected.map(sp=><li key={sp.id} data-selected-spec={sp.id}><b>{t('특화 {0}',[sp.number])}</b><span>{specialization(sp.description,sp.id)}</span></li>)}</ul>:<p>{t(skill.stigma?'아직 자동 적용 효과가 없습니다.':count===0?'아직 특화 선택 칸이 열리지 않았습니다.':'선택한 특화 없음')}</p>)}
 </div>;
}

export function SpecializationOptionLabel({option,number,selected,locked,recommended,automatic}:{option:Skill['specializations'][number];number:number;selected:boolean;locked:boolean;recommended:boolean;automatic:boolean}){
 const {t,specialization}=useLocale();
 return <span className="editor-spec-content"><span className="editor-spec-labels"><b>{t('특화 {0}',[number])}</b>{selected&&<small className="spec-state selected-state">{t(automatic?'자동 적용 효과':'선택됨')}</small>}{!locked&&recommended&&!automatic&&<small className="spec-state recommended-state">{t('추천 특화')}</small>}{locked&&<small className="spec-state locked-state">{t('잠긴 특화')}</small>}</span><span className="editor-spec-effect">{specialization(option.description,option.id)}</span></span>;
}
