import {characterPoints} from '../lib/character-points';
import {useEffect,useState} from 'react';
import {useLocale} from './locale';
import {isEndgamePointLevel,pointBudgetSourceLabel,type Catalog,type Plan,pointLimits,totals,finalLevel,equipmentBonus,boardBonus,maxBase} from '@/lib/planner';
import {BUILD_PURPOSES,PURPOSE_NAMES,PURPOSE_MODES,buildPurpose,purposeAvailable,recommendPurposeBuild} from '@/lib/build-purpose';
import './leveling-guide.css';
import './direct-build.css';
import CharacterPoints from './character-points';
import PointNumber from './point-number';
import {boardGuidance} from '@/lib/growth-guide';

// Keep catalog order: it matches the in-game row order, unlike investment priority.
export default function QuickBuild({catalog,plan,onApply,onEdit,onChange,applied=false,onUndo}:{catalog:Catalog;plan:Plan;onApply:(next:Plan)=>void;onEdit:(tab:string)=>void;onChange:(patch:Partial<Plan>)=>void;applied?:boolean;onUndo?:()=>void}){
 const {t,skill:localSkill,node:localNode,specialization}=useLocale();
 const [result,setResult]=useState<{source:Plan;catalog:Catalog;next:Plan}|null>(null);
 const [error,setError]=useState(''),[group,setGroup]=useState('active'),[selectedSkill,setSelectedSkill]=useState(''),[boardId,setBoardId]=useState(catalog.boards[0]?.id),[nodeId,setNodeId]=useState('');
 const purpose=buildPurpose(plan);
 const points=pointLimits(catalog,plan),candidate=result?.source===plan&&result.catalog===catalog?result.next:null;
 // Debounce input; stale results are hidden immediately, never labelled as current.
 useEffect(()=>{setError('');const timer=setTimeout(()=>{try{setResult({source:plan,catalog,next:recommendPurposeBuild(catalog,plan)})}catch{setResult(null);setError(t('추천 계산에 실패했습니다. 레벨과 포인트를 확인하세요.'))}},150);return()=>clearTimeout(timer)},[catalog,plan,t]);
 const board=catalog.boards.find(b=>b.id===boardId)||catalog.boards[0],node=board?.nodes.find(n=>n.id===nodeId);
 const firstRow=Math.min(...board.nodes.map(n=>n.row)),lastRow=Math.max(...board.nodes.map(n=>n.row)),firstCol=Math.min(...board.nodes.map(n=>n.column)),lastCol=Math.max(...board.nodes.map(n=>n.column));
 const skills=catalog.skills.filter(s=>group==='stigma'?s.stigma:!s.stigma&&s.kind===group);
 const chosen=catalog.skills.find(s=>s.id===selectedSkill);
 const boardKnown=characterPoints(catalog,plan.character).crystal!==null;
 const owned=new Set<string>(boardKnown?plan.character.nodes:[]);
 const used=candidate?totals(catalog,candidate):null;
 const guidance=candidate?boardGuidance(board,candidate.nodes,boardKnown?[...owned]:[],plan.level):null;
 const nextNodes=boardKnown&&board.requiredLevel<=plan.character.profile?.characterLevel?guidance?.next||[]:[];
 const nextIds=new Set(nextNodes.map(n=>n.id));
 const battle=board.pointKind.code==='battlecrystal';
 const actualLevel=plan.character?.profile?.characterLevel;
 const goalCount=candidate?skills.filter(s=>{const actual=plan.character?.skills?.find((x:any)=>String(x.id)===s.id)?.skillLevel;return typeof actual==='number'&&finalLevel(catalog,candidate,s)>actual}).length:0;
 return <section className="panel growth-guide direct-build" aria-label={t('내 성장 안내')}>
  <h1>{t('지금 올릴 스킬과 데바니온')}</h1>
  {typeof actualLevel==='number'&&<div className="growth-basis"><b>{t('조회한 캐릭터: {0} · Lv.{1}',[plan.character.profile.characterName,actualLevel])}</b><span>{t('계산할 목표: Lv.{0}',[plan.level])}</span>{actualLevel!==plan.level&&<p>{t('입력한 레벨의 가상 목표입니다. 아래 현재 스킬·노드는 마지막 조회 당시의 정보입니다.')}</p>}</div>}
  <div className="growth-inputs">
   <label>{t('캐릭터 레벨')}<PointNumber label={t('캐릭터 레벨')} min={1} max={45} value={plan.level} onValue={level=>onChange({level})}/></label>

  </div>
  <p className="subtle">{t('총 포인트 = 이미 쓴 양 + 남은 양. 캐릭터 조회로 총량은 확인되지 않습니다.')} {t(pointBudgetSourceLabel(plan))}</p>
  <details className="growth-basis-details"><summary>{t('포인트 계산 기준')}</summary>
  <p>{t(isEndgamePointLevel(plan)?'45레벨은 콘텐츠 완료 기준으로 안내합니다. 아직 완료하지 않았거나 총량이 다르면 아래 숫자를 수정하세요.':'레벨만 입력하면 최소 기준으로 안내합니다. 추가로 얻은 포인트까지 반영하려면 아래 총량을 수정하세요.')}</p>
  <p className="subtle">{t(isEndgamePointLevel(plan)?'45레벨 기본값은 서브 퀘스트·봉인던전·주둔지를 모두 완료했다고 가정합니다. 실제 완료 여부를 조회한 값은 아닙니다.':'레벨별 최소 기준은 레벨업 보상만 포함합니다. 봉인던전·서브 퀘스트 등에서 얻은 추가 포인트는 사람마다 달라 제외합니다.')}</p>
  {isEndgamePointLevel(plan)&&<p className="subtle">{t('서브 퀘스트 보상 58 + 내 종족 봉인던전 61곳 × 2를 더합니다. 주둔지의 별도 포인트는 추가하지 않습니다. 스티그마는 레벨 보상 29이며, 승급 추가 보상·상점 구매·이벤트는 별도입니다.')}</p>}
  <button className="button secondary small" onClick={()=>onChange({pointBudget:undefined,extraSP:0,extraStigma:0,extraCrystal:0,extraBattle:0})}>{t(isEndgamePointLevel(plan)?'콘텐츠 완료 기준으로 되돌리기':'레벨별 최소 기준으로 되돌리기')}</button>
  </details>
  <CharacterPoints catalog={catalog} plan={plan} points={points} onChange={onChange}/>
  <div className="direct-build-options">
  <label className="ascension-confirm"><input type="checkbox" checked={plan.ascensionGrade3Confirmed===true} onChange={e=>onChange({ascensionGrade3Confirmed:e.target.checked})}/>{t('게임에서 3차 승급을 완료했습니다')}</label>
  <div className="growth-purpose" role="group" aria-label={t('플레이 목적')}><span>{t('플레이 목적')}</span>{BUILD_PURPOSES.map(value=><button type="button" className={'button secondary '+(purpose===value?'selected':'')} aria-pressed={purpose===value} disabled={!purposeAvailable(plan,value)} key={value} onClick={()=>onChange({mode:PURPOSE_MODES[value]})}>{t(PURPOSE_NAMES[value])}</button>)}</div>
  </div>
  <p className="growth-purpose-note" role="status">{t(purpose==='leveling'?'레벨링: 현재 레벨에서 열리는 스킬과 데바니온으로 공격 위주 배분을 안내합니다.':purpose==='pve'?'PvE: 45레벨 원정을 위한 직업별 보스·파티 가이드에 생존을 고려해 배분합니다.':'PvP: 유저와의 전투용 능력치와 데바니온을 우선합니다. 스킬은 기존 직업 가이드를 참고합니다.')}</p>
  <p className="subtle">{t('레벨링·PvE는 입력한 레벨에 맞춰 선택됩니다. PvP는 직접 선택할 수 있습니다.')} {t('현재 포인트 안에서 계산한 참고 배분이며, 콘텐츠별 최적 세팅을 검증한 결과는 아닙니다.')}</p>
  {!candidate&&!error&&<p role="status">{t('현재 레벨·포인트로 계산 중…')}</p>}{error&&<p role="alert">{error}</p>}
  {candidate&&<>
   <div className="growth-section-heading"><h3>{t('1. 스킬')}</h3><div className="segmented">{[['active','액티브'],['passive','패시브'],['stigma','스티그마']].map(([key,label])=><button key={key} aria-pressed={group===key} className={group===key?'selected':''} onClick={()=>{setGroup(key);setSelectedSkill('')}}>{t(label)}</button>)}</div></div>
   <p className="growth-result-summary" role="status">{skills.some(s=>typeof plan.character?.skills?.find((x:any)=>String(x.id)===s.id)?.skillLevel==='number')?t('조회된 스킬 중 목표가 더 높은 스킬 {0}개',[goalCount]):t('현재 스킬 정보가 없어 올릴 항목을 비교할 수 없습니다.')} · {t('숫자는 남은 포인트가 아닌 목표 레벨입니다.')}</p>
   <p>{t('왼쪽 → 오른쪽 → 다음 줄 순서입니다. 주황 테두리는 조회된 실제 레벨보다 높은 목표입니다.')}</p>
   <p className="subtle">{t('목표가 현재보다 낮아도 반드시 낮추라는 뜻은 아닙니다.')} {t('목표는 기본 투자 + 장비 + 추천 데바니온의 합계입니다. 아이콘을 누르면 각각의 수치와 특화가 나옵니다.')}</p>
   <div className="growth-skill-grid">{skills.map(s=>{const observed=plan.character?.skills?.find((x:any)=>String(x.id)===s.id),actual=typeof observed?.skillLevel==='number'?observed.skillLevel:null,target=finalLevel(catalog,candidate,s),raise=actual!==null&&target>actual,locked=maxBase(s,plan.level,plan.ascensionGrade3Confirmed)===0;return <button key={s.id} aria-pressed={selectedSkill===s.id} className={'growth-skill '+(raise?'needs-investment ':'')+(selectedSkill===s.id?'chosen':'')} onClick={()=>setSelectedSkill(s.id)}><img src={'/shadowcraft/game'+s.iconPath} alt=""/><strong>{localSkill(s.name)}</strong><span>{actual===null?t('현재 미확인'):t('현재 {0}',[actual])}</span><b>{t('목표 {0}',[target])}</b><small>{t(locked?'해금 조건 확인':raise?'↑ 올릴 목표':actual===null?'게임에서 비교':'현재 목표 충족')}</small></button>})}</div>
   {chosen&&<div className="growth-detail" role="status"><h4>{localSkill(chosen.name)}</h4><p>{t('기본 투자 {0} + 장비 {1} + 데바니온 {2} = 목표 {3}',[candidate.base[chosen.id]||0,equipmentBonus(candidate,chosen.id),boardBonus(catalog,candidate,chosen.id),finalLevel(catalog,candidate,chosen)])}</p><p>{t('추천 특화')}: {(candidate.specs[chosen.id]||[]).map(id=>specialization(chosen.specializations.find(s=>s.id===id)?.description||id,id)).join(' · ')||t('현재 목표에서 선택할 특화 없음')}</p><p className="subtle">{t('현재 수치에는 장비 효과가 포함될 수 있습니다. 목표 차이만큼 스킬 포인트를 쓰라는 뜻은 아닙니다.')}</p></div>}
   <div className="growth-section-heading"><h3>{t('2. 데바니온')}</h3><span>{t(battle?'아스펠 결정: 추천 {0} / 총 {1} P':'일반 데바니온: 전체 보드 추천 {0} / 총 {1} P',battle?[used!.battle,used!.battleMax]:[used!.crystal,used!.crystalMax])}</span></div>
   <div className="board-tabs">{catalog.boards.map(b=><button key={b.id} aria-pressed={board.id===b.id} className={board.id===b.id?'selected':''} onClick={()=>{setBoardId(b.id);setNodeId('')}}>{t(b.name)}<small>Lv.{b.requiredLevel}</small></button>)}</div>
   {guidance&&!guidance.locked&&<div className="growth-route-summary"><p>{boardKnown?t('이 보드: 추천 {0} P · 이미 찍은 추천 노드 {1}개 · 추가 목표 {2}개',[guidance.cost,guidance.kept,guidance.missing]):t('이 보드: 추천 {0} P · 현재 배치 미확인',[guidance.cost])}</p>{nextNodes.length>0&&<><b>{t('다음 연결 후보')}</b><p>{t('현재 배치에서 바로 이어지는 후보에 화살표를 표시했습니다. 한꺼번에 모두 찍으라는 뜻은 아닙니다. 필요한 잔여량을 확인하세요.')}</p><div>{nextNodes.slice(0,3).map(n=><button className="button secondary" key={n.id} onClick={()=>{setNodeId(n.id);document.getElementById('growth-node-'+n.id)?.focus()}}>{t('{0}행 {1}열 · {2} · {3} P',[n.row,n.column,localNode(n.name),n.pointCost])}</button>)}</div></>}</div>}
   <p className="growth-legend"><span className="green-text">{t('✓ 초록: 이미 찍은 추천 노드')}</span><span>{t('+ 주황: 추가할 추천 경로')}</span><span>{t('→ 화살표: 현재 배치에서 다음 연결 후보')}</span></p>
   {!boardKnown&&<p className="notice">{t('현재 데바니온 배치를 확인하지 못했습니다. 주황색은 추천 전체이며, 이미 찍은 노드는 게임에서 확인하세요.')}</p>}
   {board.requiredLevel>plan.level?<p role="status">{t('이 보드는 Lv.{0}부터 안내합니다.',[board.requiredLevel])}</p>:<div className="growth-board" style={{gridTemplateColumns:`repeat(${lastCol-firstCol+1},minmax(0,1fr))`,gridTemplateRows:`repeat(${lastRow-firstRow+1},minmax(0,1fr))`}} aria-label={t('{0} 추천 배치',[t(board.name)])}>{board.nodes.map(n=>{const target=candidate.nodes.includes(n.id),keep=target&&owned.has(n.id),state=n.autoLearn?'start':keep?'kept':target?'needed':'';return <button id={'growth-node-'+n.id} key={n.id} className={'growth-node '+state+(nextIds.has(n.id)?' next-node':'')+(nodeId===n.id?' chosen':'')} style={{gridRow:n.row-firstRow+1,gridColumn:n.column-firstCol+1}} aria-label={t('{0}행 {1}열 · {2} · {3}',[n.row,n.column,localNode(n.name),t(n.autoLearn?'시작점':keep?'이미 찍은 추천 노드':target?'추가할 추천 경로':'이번 추천에 없음')])} onClick={()=>setNodeId(n.id)}><img src={'/shadowcraft/game'+(n.skill?.iconPath||n.iconPath)} alt=""/>{target&&!n.autoLearn&&<small>{keep?'✓':nextIds.has(n.id)?'→':'+'}</small>}</button>})}</div>}
   {node&&board.requiredLevel<=plan.level&&<div className="growth-detail" role="status"><b>{localNode(node.name)}</b><p>{t('{0}행 {1}열 · {2} P',[node.row,node.column,node.pointCost])}</p><p>{t(node.autoLearn?'이 노드는 경로의 시작점입니다.':owned.has(node.id)&&candidate.nodes.includes(node.id)?'이미 찍은 추천 노드입니다. 다시 투자할 필요가 없습니다.':candidate.nodes.includes(node.id)?'추가 목표입니다. 시작점에서 이어지는 초록·주황 경로를 따라 확인하세요.':'이번 예산의 추천에 포함되지 않습니다. 이미 찍었다고 반드시 해제할 필요는 없습니다.')}</p></div>}
   <p className="subtle">{t('이 추천은 전체 포인트를 다시 배분하는 목표입니다. 현재 노드를 유지한 채 추가 투자만 계산한 결과는 아닙니다.')}</p>
   <details className="growth-advanced"><summary>{t('이 목표를 사이트의 편집 계획으로 저장하기')}</summary><p>{t('저장하면 기존 스킬·특화·데바니온 계획이 바뀝니다. 게임에는 적용되지 않습니다.')}</p><button className="button primary" onClick={()=>onApply(candidate)}>{t('목표를 편집 계획에 저장')}</button>{applied&&<p role="status">{t('편집 계획에 저장했습니다.')}</p>}{onUndo&&<button className="button ghost" onClick={onUndo}>{t('저장 전으로 되돌리기')}</button>}<button className="button secondary" onClick={()=>onEdit('skills')}>{t('스킬 상세 편집')}</button><button className="button secondary" onClick={()=>onEdit('daevanion')}>{t('데바니온 상세 편집')}</button></details>
  </>}
 </section>
}
