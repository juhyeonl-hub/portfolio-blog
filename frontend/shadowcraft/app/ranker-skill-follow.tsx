import {useEffect,useMemo,useRef,useState} from 'react';
import type {Catalog,Plan} from '../lib/planner';
import type {Ranker} from '../lib/ranker-builds';
import {previewRankerSkills} from '../lib/ranker-skills';
import {rankerText} from '../lib/ranker-comparison-text';
import {useLocale} from './locale';
import RankerSkillOverview from './ranker-skill-overview';
const signature=(p:Plan)=>JSON.stringify([p.base,p.specs,p.stigmaSkills,p.level,p.mode,p.pointBudget,p.extraSP,p.extraStigma,p.nodes,p.gear,p.bonus,p.ascensionGrade3Confirmed]);
export default function RankerSkillFollow({catalog,plan,ranker,profile,onApply}:{catalog:Catalog;plan:Plan;ranker:Ranker;profile:any;onApply:(next:Plan)=>void}){
 const {locale,t}=useLocale(),copy=(key:Parameters<typeof rankerText>[1])=>rankerText(locale,key);
 const [mode,setMode]=useState<'actual'|'guide'>('guide'),[specMode,setSpecMode]=useState<'suggest'|'keep'>('suggest');
 const [applied,setApplied]=useState('');const success=!!applied&&applied===signature(plan);const successRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(success){successRef.current?.scrollIntoView({block:'center'});successRef.current?.focus({preventScroll:true});}},[success,applied]);
 const result=useMemo(()=>{if(!profile)return {guide:null,error:'skillLive' as const};try{return {guide:previewRankerSkills(catalog,plan,ranker,profile,specMode),error:null}}catch(e){return {guide:null,error:e instanceof Error&&e.message==='skillIdentity'?'skillIdentity' as const:'skillIncomplete' as const}}},[catalog,plan,ranker,profile,specMode]);
 const guide=result.guide;const canApply=!!guide&&(guide.used.sp>0||guide.used.stigma>0);
 return <section className="ranker-skill-follow">
  <nav className="ranker-view-tabs" aria-label={copy('skillMode')}><button aria-pressed={mode==='actual'} onClick={()=>setMode('actual')}>{copy('skillActual')}</button><button aria-pressed={mode==='guide'} onClick={()=>setMode('guide')}>{copy('guide')}</button></nav>
  {mode==='guide'&&<div className="ranker-skill-plan">
   <h3>{copy('skillFollow')}</h3><p>{copy('skillHonesty')}</p>
   <details><summary>{copy('skillMethod')}</summary><p>{copy('skillMethodHelp')}</p><p>{copy('skillBonusHelp')} {t('장비')}: {t(!plan.gear||plan.gear.mode==='manual'?'기존 보너스 직접 입력':plan.gear.mode==='current'?'현재 장비로 계산':'목표 장비로 계산')}</p><p>{copy('skillOrderHelp')}</p></details>
   {result.error&&<p role="status">{copy(result.error)}</p>}
   {guide&&<>
    <div className="ranker-skill-budget" aria-live="polite">{([{name:'스킬 포인트',used:guide.used.sp,max:guide.used.spMax},{name:'스티그마 포인트',used:guide.used.stigma,max:guide.used.stigmaMax}]).map(row=><div key={row.name}><strong>{t(row.name)}</strong><span>{copy('skillSpend')}: {row.used} · {copy('skillRemaining')}: {row.max-row.used} · {copy('skillTotal')}: {row.max}</span></div>)}</div>
    <label className="ranker-spec-choice"><span>{copy('skillSpecChoice')}</span><select value={specMode} onChange={e=>{setSpecMode(e.target.value as 'suggest'|'keep');setApplied('');}}><option value="suggest">{copy('skillSpecSuggest')}</option><option value="keep">{copy('skillSpecKeep')}</option></select></label>
    {!!guide.unreached&&<p>{copy('skillUnreached')} ({guide.unreached})</p>}
    {!!guide.gated&&<p>{copy('skillGated')}</p>}
    {!!guide.omittedStigma&&<p>{copy('skillOmitted')}</p>}
    {!canApply&&<p role="status">{copy('skillEmpty')}</p>}
    <p>{copy('skillApplyHelp')}</p><button className="button primary" disabled={!canApply} onClick={()=>{if(guide&&canApply){onApply(guide.plan);setApplied(signature(guide.plan));}}}>{copy('skillApply')}</button>
   </>}
  </div>}
  {success&&<div className="ranker-apply-success" ref={successRef} tabIndex={-1}><p role="status"><strong>{copy('skillApplied')}</strong></p><p>{copy('skillAppliedHelp')}</p><div className="ranker-apply-actions"><a className="button primary" href="#/build/skills">{copy('skillEdit')}</a><a className="button secondary" href="#/builds">{copy('saveCopy')}</a></div></div>}
  <RankerSkillOverview catalog={catalog} plan={plan} skills={profile?profile.skills:ranker.skills} proposal={mode==='guide'?guide?.plan:undefined}/>
 </section>;
}
