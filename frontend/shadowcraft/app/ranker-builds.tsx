import OfficialLink from './official-link';
import {useEffect,useMemo,useRef,useState} from 'react';
import {loadRankingAvailability,rankingAvailabilityText,type RankingAvailability} from '../lib/ranking-availability';
import type {Catalog,Plan} from '../lib/planner';
import {totals} from '../lib/planner';
import {groupRankers,compareRankerSkills,previewRankerBoards,rankerObservationTime,rankerDisplaySkills,ROSTER_TEXT,rosterKind,type Ranker} from '../lib/ranker-builds';
import {queryArmory} from '../lib/armory-client';
import snapshot from '../lib/data/rankers.json';
import abyssSnapshot from '../lib/data/rankers-abyss.json';
import solitudeSnapshot from '../lib/data/rankers-arenaOfSolitude.json';
import cooperationSnapshot from '../lib/data/rankers-arenaOfCooperation.json';
// Official Abyss/Arena rosters are empty placeholders until NCSOFT publishes them (import_official_rankers.py fills them).
const SNAPSHOTS=[snapshot,abyssSnapshot,solitudeSnapshot,cooperationSnapshot].map(data=>({key:rosterKind(data.metric),data})).filter(s=>Array.isArray(s.data.entries)&&s.data.entries.length>0);
import skillGuides from '../lib/data/ranker-skill-guides.json';
import RankerBoards from './ranker-boards';
import MyRankerComparison from './my-ranker-comparison';
import RankerEquipmentComparison from './ranker-equipment';
import CharacterComparison from './character-comparison';
import {useLocale} from './locale';
import RankerSkillOverview from './ranker-skill-overview';
import {rankerText} from '../lib/ranker-comparison-text';
import './ranker-visual.css';

function RankerSwitcher({rows,selected,onSelect}:{rows:Ranker[];selected:Ranker;onSelect:(row:Ranker)=>void}){
 const {locale}=useLocale();
 const [navHeight,setNavHeight]=useState(0);
 useEffect(()=>{const nav=document.querySelector('.build-pills');if(!nav)return;const measure=()=>setNavHeight(nav.getBoundingClientRect().height);measure();const observer=new ResizeObserver(measure);observer.observe(nav);return()=>observer.disconnect();},[]);
 const position=rows.findIndex(row=>row.characterId===selected.characterId);
 return <div className="ranker-switcher" style={{top:`calc(var(--a2bc-timer-height,0px) + ${navHeight}px)`}}>
  <button type="button" className="button secondary" aria-label={rankerText(locale,'previous')} title={rankerText(locale,'previous')} disabled={position<=0} onClick={()=>onSelect(rows[position-1])}>‹</button>
  <label><span>{rankerText(locale,'changeRanker')}</span><select value={selected.characterId} onChange={e=>{const row=rows.find(row=>row.characterId===e.target.value);if(row)onSelect(row);}}>{rows.map(row=><option key={row.characterId} value={row.characterId}>{row.rank}. {row.name} · {row.region.toUpperCase()} / {row.serverName}</option>)}</select></label>
  <button type="button" className="button secondary" aria-label={rankerText(locale,'next')} title={rankerText(locale,'next')} disabled={position<0||position>=rows.length-1} onClick={()=>onSelect(rows[position+1])}>›</button>
 </div>;
}

export default function RankerBuilds({catalog,plan,onApply,onConnect,rankingOnly=false,onChoose,initialSelection}:{rankingOnly?:boolean;onChoose?:(id:string,kind:string)=>void;initialSelection?:{id:string;kind:string}|null;catalog:Catalog;plan:Plan;onApply:(next:Plan)=>void;onConnect?:()=>void}){
 const {t,locale,skill:localSkill}=useLocale();
 const [kind,setKind]=useState(()=>SNAPSHOTS.find(s=>s.key===initialSelection?.kind)?.key||SNAPSHOTS[0].key);
 const current=SNAPSHOTS.find(s=>s.key===kind)||SNAPSHOTS[0];
 const rows=(current.data.entries as Ranker[]).filter(r=>r.classKey===catalog.classKey);
 const [availability,setAvailability]=useState<RankingAvailability|null|undefined>(undefined);
 useEffect(()=>{let live=true;loadRankingAvailability().then(value=>{if(live)setAvailability(value);});return()=>{live=false;};},[]);
 const [selectedId,setSelectedId]=useState('');
 const [compareLeft,setCompareLeft]=useState<string|null>(null),[compareRight,setCompareRight]=useState<string|null>(null);
 const selected=rows.find(r=>r.characterId===selectedId);
 const [live,setLive]=useState<any>(null),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const [preview,setPreview]=useState(false),[applied,setApplied]=useState(false);
 const [boardMode,setBoardMode]=useState<'actual'|'guide'>('actual');
 const [view,setView]=useState<'equipment'|'skills'|'daevanion'>('equipment');
 const [previewBoard,setPreviewBoard]=useState(catalog.boards[0]?.id);
 const request=useRef(0),profileController=useRef<AbortController|null>(null);useEffect(()=>()=>{request.current++;profileController.current?.abort();},[]);
 useEffect(()=>{request.current++;profileController.current?.abort();setSelectedId('');setLive(null);setLoading(false);setError('');setPreview(false);setApplied(false);setBoardMode('actual');setPreviewBoard(catalog.boards[0]?.id);},[catalog.classKey,kind]);
 const itemUsage=new Map<number,{name:string;count:number}>();
 for(const row of rows)for(const item of new Map(row.equipment.map(item=>[item.id,item])).values()){const entry=itemUsage.get(item.id)||{name:item.name,count:0};entry.count++;itemUsage.set(item.id,entry)}
 const commonItems=[...itemUsage.values()].sort((a,b)=>b.count-a.count).slice(0,6);
 const groups=groupRankers(rows);
 const result=useMemo(()=>{if(!selected||!live)return {candidate:null,error:''};try{return {candidate:previewRankerBoards(catalog,plan,selected,live,{allowUnavailable:true}),error:''}}catch(e){return {candidate:null,error:e instanceof Error?e.message:'복사할 수 없습니다.'}}},[catalog,plan,selected,live]);
 const candidate=result.candidate;
 const candidateTotals=candidate?totals(catalog,candidate):null;
 const overLevel=!!candidate&&catalog.boards.some(b=>b.nodes.some(n=>!n.autoLearn&&candidate.nodes.includes(n.id)&&Math.max(b.requiredLevel,n.requiredLevel)>plan.level));
 const canApply=!!candidate&&!!candidateTotals&&candidateTotals.crystal<=candidateTotals.crystalMax&&candidateTotals.battle<=candidateTotals.battleMax&&!overLevel;
 const budgetResult=useMemo(()=>{if(!candidate||!selected||!live||view!=='daevanion'||(!preview&&boardMode!=='guide'))return {candidate:null,error:''};try{return {candidate:previewRankerBoards(catalog,plan,selected,live,{fitToBudget:true}),error:''}}catch(e){return {candidate:null,error:e instanceof Error?e.message:'복사할 수 없습니다.'}}},[catalog,plan,selected,live,candidate,view,preview,boardMode]);
 const budgetCandidate=budgetResult.candidate,budgetTotals=budgetCandidate?totals(catalog,budgetCandidate):null;
 const canApplyBudget=!!budgetCandidate&&!!budgetTotals&&budgetTotals.crystal<=budgetTotals.crystalMax&&budgetTotals.battle<=budgetTotals.battleMax&&catalog.boards.some(b=>b.nodes.some(n=>!n.autoLearn&&budgetCandidate.nodes.includes(n.id)));
 const sameAllocation=!!candidate&&!!budgetCandidate&&candidate.nodes.length===budgetCandidate.nodes.length&&candidate.nodes.every(id=>budgetCandidate.nodes.includes(id));
 const apply=(next:Plan,mode:'actual'|'guide'='guide')=>{onApply(next);setPreview(false);setBoardMode(mode);setApplied(true);};
 const left=groups.find(g=>g.ids.join(',')===compareLeft)||groups[0];
 const right=groups.find(g=>g.ids.join(',')===compareRight)||groups[1]||groups[0];
 const difference=compareRankerSkills(left?.ids||[],right?.ids||[]);
 const displaySkills=rankerDisplaySkills(live?live.skills:selected?.skills);
 const skillName=(id:string)=>localSkill(catalog.skills.find(s=>s.id===id)?.name||'')||displaySkills?.find(s=>String(s.id)===id)?.name||rows.flatMap(r=>r.skills).find(s=>String(s.id)===id)?.name||id;
 const time=(value:unknown)=>{const text=rankerObservationTime(value);return text==='시각 미확인'?t(text):locale==='ko'?text:new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value as string));};
 const guidance=(ids:string[])=>{
  const notes=skillGuides.skills.filter(s=>s.classKey===catalog.classKey&&ids.includes(s.id));
  return <details className="ranker-guidance"><summary>{t('장점과 활용 상황 · {0}/{1}개 기술 분석',[notes.length,ids.length])}</summary>
   <p className="subtle">{t('글로벌 클라이언트 빌드 {0}의 기본 효과 설명을 해석했습니다. 활용 상황은 선택을 돕는 제안이며, 이 캐릭터의 실제 운용·콘텐츠 성적을 뜻하지 않습니다.',[skillGuides.source.buildId])}</p>
   {notes.map(note=><div key={note.id}><h4>{skillName(note.id)} · {note.title}</h4><p>{note.advantage}</p><p><b>{t('활용 제안:')}</b> {note.situation}</p><p><b>{t('주의점:')}</b> {note.caution}</p><details><summary>{t('효과 설명 근거')}</summary><p>{note.evidence.replaceAll('[unresolved value]',t('[수치 미확인]'))}</p><small>{t('글로벌 Steam 기본 설명 · 기술 ID {0} · 특화 및 현재 장비 효과 제외',[note.id])}</small></details></div>)}
   {ids.some(id=>!notes.some(n=>n.id===id))&&<p className="subtle">{t('추가 분석 전: {0}. 설명이 없는 기술의 효과나 우열은 추정하지 않았습니다.',[ids.filter(id=>!notes.some(n=>n.id===id)).map(skillName).join(' · ')])}</p>}
  </details>;
 };
 async function inspect(row:Ranker){
  const token=++request.current;profileController.current?.abort();const controller=new AbortController();profileController.current=controller;
  setSelectedId(row.characterId);setPreview(false);setApplied(false);setLive(null);setError('');setLoading(true);
  try{const result=await queryArmory({action:'profile',class:row.classKey,region:row.region,server:String(row.serverId),id:row.characterId},controller.signal);if(request.current===token&&!controller.signal.aborted)setLive(result)}
  catch(e){if(request.current===token&&!controller.signal.aborted)setError(e instanceof Error?e.message:'공식 조회 실패')}
  finally{if(request.current===token)setLoading(false)}
 }
 useEffect(()=>{const row=rows.find(r=>r.characterId===initialSelection?.id);if(!rankingOnly&&row)void inspect(row);
 // The selection is consumed when this page mounts; later selections are made in its own list.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[initialSelection,catalog.classKey]);
 if(rankingOnly)return <section className="panel ranking-list" aria-label={t('랭킹')}><h2>{t('랭킹')}</h2><p>{t(ROSTER_TEXT[current.key].subtitle)}</p><p>{t(ROSTER_TEXT[current.key].note,[time(current.data.fetchedAt)])}</p><p>{(()=>{const note=rankingAvailabilityText(availability,t);return t(note.text,note.values);})()}</p><nav className="preview-tabs" aria-label={t('랭킹 종류')}>{SNAPSHOTS.map(s=><button key={s.key} aria-pressed={kind===s.key} onClick={()=>setKind(s.key)}>{t(ROSTER_TEXT[s.key].name)}</button>)}</nav><ol className="ranking-rows">{rows.map(row=><li key={row.characterId}><strong>{row.rank}. {row.name}</strong><span>{row.region.toUpperCase()} · {row.serverName} · {t(row.race===1?'천족':'마족')}</span><span>{t(ROSTER_TEXT[current.key].score,[row.combatPower.toLocaleString(),row.sampleRank])}</span><button className="button secondary" onClick={()=>onChoose?.(row.characterId,current.key)}>{t('빌드에서 비교')}</button></li>)}</ol></section>;
 return <section className="panel ranker-builds" aria-label={t('랭커 빌드 분석')}>
  <a className="button ghost" href="#/rankers">{t('랭킹 목록으로 돌아가기')}</a>
  <div className="section-heading"><div><span className="eyebrow">{t('실제 세팅')}</span><h2>{selected?t('{0}와 비교',[selected.name]):t('상위 캐릭터 세팅 살펴보기')}</h2><p>{t(ROSTER_TEXT[current.key].subtitle)}</p></div><OfficialLink href={current.data.source} target="_blank" rel="noreferrer">{t('순위 출처 ↗')}</OfficialLink></div>
  {SNAPSHOTS.length>1&&<div className="segmented ranker-kinds" role="group" aria-label={t('랭킹 종류')}>{SNAPSHOTS.map(s=><button key={s.key} aria-pressed={kind===s.key} className={kind===s.key?'selected':''} onClick={()=>setKind(s.key)}>{t(ROSTER_TEXT[s.key].name)}</button>)}</div>}
  <p className="subtle ranking-availability">{(()=>{const note=rankingAvailabilityText(availability,t);return t(note.text,note.values);})()}</p>
  <p className="subtle">{t(ROSTER_TEXT[current.key].note,[time(current.data.fetchedAt)])}</p>
  <details className="more-info"><summary>{t('자세히')}</summary><p className="subtle">{t('명단·구성·장비 비교는 저장된 자료입니다. 캐릭터 선택 또는 ‘공식 세팅 다시 조회’는 선택한 캐릭터의 상세 정보만 갱신하며 명단 순위와 비교 자료는 바꾸지 않습니다.')}</p></details>
  <details className="ranker-analysis"><summary>{t('10명의 공통 구성과 빌드 분기 ({0}가지)',[groups.length])}</summary><p>{t('공개된 장착 Dp 스킬 조합으로 묶었습니다. 특화·스킬 운용은 공개되지 않아 조합만으로 성능이나 콘텐츠 적합성을 단정하지 않습니다.')}</p>{left&&right&&<section className="ranker-compare" aria-label={t('빌드 구성 비교')}><h3>{t('두 구성 비교')}</h3><p>{t('사용자 수는 이 표본의 선택 빈도입니다. 성능 순위가 아닙니다. 비교해도 내 빌드는 바뀌지 않습니다.')}</p><div className="ranker-compare-grid">{([{label:'기준 구성',value:left,set:setCompareLeft},{label:'비교 구성',value:right,set:setCompareRight}]).map(choice=><label key={choice.label}>{t(choice.label)}<select aria-label={t(choice.label)} value={choice.value.ids.join(',')} onChange={e=>choice.set(e.target.value)}>{groups.map((g,i)=><option key={g.ids.join(',')} value={g.ids.join(',')}>{t('구성 {0} · {1}명 · {2}개 기술',[i+1,g.members.length,g.ids.length])}</option>)}</select></label>)}</div><details className="ranker-shared"><summary>{t('공통 기술 {0}개',[difference.shared.length])}</summary><p>{difference.shared.map(skillName).join(' · ')||t('없음')}</p></details><div className="ranker-compare-grid">{([{label:'기준 구성에만 있는 기술',ids:difference.leftOnly},{label:'비교 구성에만 있는 기술',ids:difference.rightOnly}]).map(side=><div className="ranker-difference" key={side.label}><h4>{t('{0} · {1}개',[t(side.label),side.ids.length])}</h4><p>{side.ids.map(skillName).join(' · ')||t('없음')}</p>{side.ids.length>0&&guidance(side.ids)}</div>)}</div>{!difference.leftOnly.length&&!difference.rightOnly.length&&<p role="status">{t('두 구성의 공개 장착 기술이 같습니다.')}</p>}</section>}<h3>{t('자주 사용하는 장비')}</h3><ul>{commonItems.map(item=><li key={item.name}>{item.name} · {t('{0}/10명',[item.count])}</li>)}</ul>{groups.map((g,i)=><article key={g.ids.join(',')}><h3>{t('구성 {0} · {1}/10명',[i+1,g.members.length])}</h3><p>{g.ids.map(skillName).join(' · ')||t('공개된 장착 Dp 스킬 없음')}</p><p>{t('사용 캐릭터: {0}',[g.members.map(r=>r.name).join(', ')])}</p>{guidance(g.ids)}</article>)}</details>
  <RankerEquipmentComparison key={catalog.classKey} rows={rows}/>
  <details key={selectedId||'choose'} className="comparison-picker" open={!selected}><summary>{selected?t('비교 대상: {0} · 다른 랭커 선택',[selected.name]):t('비교할 랭커 선택')}</summary><div className="ranker-list">{rows.map(row=><button className={'button secondary '+(selected===row?'selected':'')} key={row.characterId} aria-pressed={selected===row} onClick={()=>inspect(row)}><b>{row.rank}. {row.name}</b><span>{row.region.toUpperCase()} · {row.serverName} · {t(row.race===1?'천족':'마족')}</span><small>{t(ROSTER_TEXT[current.key].score,[row.combatPower.toLocaleString(),row.sampleRank])}</small></button>)}</div></details>
  {selected&&<div className="ranker-detail"><RankerSwitcher rows={rows} selected={selected} onSelect={inspect}/><h3>{t('{0} 세팅',[selected.name])}</h3><OfficialLink href={selected.sourceProfile} target="_blank" rel="noreferrer">{t('명단 원본 캐릭터 ↗')}</OfficialLink><p>{t('장비·스킬 확인 {0} · 당시 공식 전투력 {1}',[time(selected.verifiedAt),selected.currentCombatPower.toLocaleString()])}</p>
   <div className="ranker-lookup-state" data-state={loading?'loading':error?'error':live?'ready':'stored'}>
    <p className="ranker-observation" role="status">{loading?selected.name+' · '+rankerText(locale,'loading'):live?t('공식 상세 조회: {0} · 아래 장비·스킬·데바니온은 이번 응답 기준',[time(live.importedAt)]):rankerText(locale,'lookupFailed')}</p>
    {!live&&<small>{t('저장 자료 표시: {0} · 공식 조회 성공 전까지 저장된 장비·스킬을 표시합니다.',[time(selected.verifiedAt)])}</small>}
    {error&&<div role="alert"><details><summary>{t('조회 오류 자세히 보기')}</summary><p>{t(error)}</p></details><button className="button secondary" onClick={()=>inspect(selected)}>{t('공식 세팅 다시 조회')}</button></div>}
   </div>
   <nav className="ranker-view-tabs ranker-primary-tabs" aria-label={rankerText(locale,'tabs')}>{([{key:'equipment',label:'장비'},{key:'skills',label:'스킬'},{key:'daevanion',label:'데바니온'}] as const).map(tab=><button type="button" key={tab.key} aria-pressed={view===tab.key} onClick={()=>setView(tab.key)}>{t(tab.label)}</button>)}</nav>
   {view==='equipment'&&<MyRankerComparison key={JSON.stringify([selected.characterId,plan.character?.profile,plan.character?.importedAt])} catalog={catalog} plan={plan} ranker={selected} live={live} onConnect={onConnect} onRefreshRanker={()=>inspect(selected)}/>}
   {view==='skills'&&<RankerSkillOverview catalog={catalog} plan={plan} skills={live?live.skills:selected.skills}/>}
   {view==='daevanion'&&<>
    {result.error&&<p role="alert">{t(result.error)}</p>}
    {!candidate&&<p className="ranker-board-wait">{rankerText(locale,loading?'boardLoading':error?'boardRetry':'boardMissing')}</p>}
    {candidate&&<><RankerBoards key={selected.characterId+String(preview)} catalog={catalog} plan={plan} target={candidate} boardId={previewBoard} onBoardChange={setPreviewBoard} guideOnly={preview} mode={boardMode} onModeChange={setBoardMode} priorityNodes={budgetCandidate?.nodes}/>
     {!preview&&<button className="button secondary" onClick={()=>{setPreview(true);setApplied(false);setError('')}}>{rankerText(locale,'planReview')}</button>}
     {preview&&<div className="quick-preview ranker-apply-preview">
      <h4>{rankerText(locale,'budgetTitle')}</h4>
      <p>{t('따라하기는 공개된 데바니온 배치만 적용합니다. 내 장비·기본 스킬 투자·연결 캐릭터는 유지합니다. 배치 변경으로 잠기는 기존 특화는 해제됩니다.')}</p>
      {budgetResult.error&&<p role="alert">{t(budgetResult.error)}</p>}
      {budgetCandidate&&budgetTotals&&<><p>{t('노드 {0} → {1} · 결정 {2} / {3}',[plan.nodes.length,budgetCandidate.nodes.length,budgetTotals.crystal,budgetTotals.crystalMax])} · {t('아스펠')} {budgetTotals.battle} / {budgetTotals.battleMax}</p>
       {!canApplyBudget&&<p role="status">{rankerText(locale,'emptyGuide')}</p>}
       {canApplyBudget&&!canApply&&<p>{rankerText(locale,overLevel?'fullLevel':'fullBudget')}</p>}
       <div className="ranker-apply-actions"><button className="button primary" disabled={!canApplyBudget} onClick={()=>{if(canApplyBudget)apply(budgetCandidate)}}>{rankerText(locale,'applyBudget')}</button>
        {!sameAllocation&&<button className="button secondary" disabled={!canApply} onClick={()=>{if(canApply)apply(candidate,'actual')}}>{rankerText(locale,'applyFull')}</button>}
       </div>
      </>}
      <button className="button ghost" onClick={()=>setPreview(false)}>{t('취소')}</button>
     </div>}
     {applied&&<div className="ranker-apply-success"><p role="status"><strong>{rankerText(locale,'applied')}</strong></p><p>{rankerText(locale,'appliedHelp')}</p><div className="ranker-apply-actions"><a className="button primary" href="#/build/daevanion">{rankerText(locale,'editNodes')}</a><a className="button secondary" href="#/builds">{rankerText(locale,'saveCopy')}</a></div></div>}
    </>}
   </>}
   {live&&<details><summary>{t('능력치·스킬·노드 상세 비교')}</summary><CharacterComparison current={plan.character} saved={live} ranker/></details>}
   <details className="ranker-preparation"><summary>{t('따라하기 전 준비 항목')}</summary><ol>
    <li><b>{t('장비:')}</b> {t('위 목록에서 부위·강화·초월을 확인하세요. 보유 여부는 자동 확인하지 않으며 내 장비 계획에 복사하지 않습니다.')}</li>
    <li><b>{t('스킬:')}</b> {t('목표 레벨에는 장비·데바니온 보너스가 포함됩니다. 기본 투자 포인트와 특화는 공개되지 않아 직접 맞춰야 합니다.')}</li>
    <li><b>{t('데바니온:')}</b> {rankerText(locale,'boardPrep')}</li>
    <li><b>{t('적용 확인:')}</b> {t('미리보기에서 변경을 확인한 뒤 적용하세요. 데바니온 배치만 바꾸며 잠기는 기존 특화는 해제될 수 있습니다. 적용 전으로 되돌릴 수 있습니다.')}</li>
   </ol><p className="subtle">{t('장비 획득 비용·소요 시간과 미공개 옵션은 추정하지 않습니다.')}</p></details>
   {!loading&&!error&&<button className="button ghost" onClick={()=>inspect(selected)}>{t('공식 세팅 다시 조회')}</button>}

  </div>}
 </section>;
}
