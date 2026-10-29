import {type Catalog,type Plan,finalLevel,equipped,slots,equipmentBonus,boardBonus} from '@/lib/planner';
import {useLocale} from './locale';
import './allocation-specializations.css';

/** Read-only view of the exact candidate passed to the existing whole-plan apply action. */
export default function AllocationSpecializations({catalog,plan}:{catalog:Catalog;plan:Plan}){
 const {t,skill:localSkill,specialization}=useLocale();
 const visible=catalog.skills.filter(s=>(plan.base[s.id]||0)>0&&(!s.stigma||equipped(plan).includes(s.id)));
 const groups=[{key:'active',label:'액티브'},{key:'passive',label:'패시브'},{key:'stigma',label:'스티그마'}];
 return <div className="allocation-guide">
  <p className="allocation-guide-help">{t('아래 특화도 전체 계획에 함께 적용됩니다. 번호는 사이트 특화 목록 순서이며, 게임에서는 효과 설명을 확인하세요.')}</p>
  {groups.map(group=>{const skills=visible.filter(s=>(s.stigma?'stigma':s.kind==='passive'?'passive':'active')===group.key);return skills.length>0&&<section key={group.key} className="allocation-group" aria-label={t(group.label)}>
   <h4>{t(group.label)}</h4>
   {skills.map(s=>{
    const level=finalLevel(catalog,plan,s),count=slots(s,level),ids=new Set(plan.specs[s.id]||[]);
    const effects=s.specializations.map((sp,index)=>({...sp,number:index+1}));
    const selected=s.stigma?effects.filter(sp=>sp.requiredParentLevel<=level):effects.filter(sp=>ids.has(sp.id));
    const nextEffectLevel=Math.min(...effects.filter(sp=>sp.requiredParentLevel>level).map(sp=>sp.requiredParentLevel));
    const upcoming=effects.filter(sp=>sp.requiredParentLevel===nextEffectLevel);
    const nextSlot=Math.min(...s.specializationSlots.filter(x=>x.editable&&x.requiredSkillLevel>level).map(x=>x.requiredSkillLevel));
    const passive=s.kind==='passive'&&!s.stigma&&effects.length===0;
    return <article key={s.id} className="allocation-skill-row" data-skill-id={s.id}>
     <header><img src={'/shadowcraft/game'+s.iconPath} alt=""/><div><h5>{localSkill(s.name)}</h5><p>{t('기본 {0}',[plan.base[s.id]])} · <strong>{t('최종 {0}',[level])}</strong></p><small>{t('장비 +{0} · 데바니온 +{1}',[equipmentBonus(plan,s.id),boardBonus(catalog,plan,s.id)])}</small></div></header>
     <div className="allocation-skill-specs">
      {passive?<p className="allocation-no-spec">{t('패시브는 별도 특화 선택 없이 레벨에 따라 적용됩니다.')}</p>:<>
       <p className="allocation-spec-title">{t(s.stigma?'레벨에 따라 자동 적용':'지금 선택할 특화 ({0}/{1}칸)',[selected.length,count])}</p>
       {selected.length>0?<ul className="allocation-selected" data-effect-kind={s.stigma?'automatic':'selected'}>{selected.map(sp=><li key={sp.id} data-spec-id={sp.id}><b>{t('특화 {0}',[sp.number])}</b><span>{specialization(sp.description,sp.id)}</span></li>)}</ul>:<p className="allocation-no-spec">{t(s.stigma?'아직 자동 적용 효과가 없습니다.':count===0?'아직 특화 선택 칸이 열리지 않았습니다.':'이 추천에는 선택된 특화가 없습니다.')}</p>}
       {Number.isFinite(nextSlot)&&<p className="allocation-next-slot">{t('다음 특화 칸: 최종 Lv.{0}',[nextSlot])}</p>}
       {upcoming.length>0&&<div className="allocation-upcoming"><p>{t(s.stigma?'최종 Lv.{0}에 자동 적용':'나중에 확인 · 최종 Lv.{0}에 새 효과 개방',[nextEffectLevel])}</p><ul>{upcoming.map(sp=><li key={sp.id}><b>{t('특화 {0}',[sp.number])}</b><span>{specialization(sp.description,sp.id)}</span></li>)}</ul></div>}
      </>}
     </div>
    </article>;
   })}
  </section>})}
 </div>;
}
