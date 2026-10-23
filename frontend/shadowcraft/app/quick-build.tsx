import {useEffect,useState} from 'react';
import {useLocale} from './locale';
import {isEndgamePointLevel,pointBudgetSourceLabel,type Catalog,type Plan,pointLimits,totals,finalLevel,equipmentBonus,boardBonus,maxBase} from '@/lib/planner';
import {recommendBuild} from '@/lib/recommendation';
import './leveling-guide.css';
import './direct-build.css';

// Keep catalog order: it matches the in-game row order, unlike investment priority.
export default function QuickBuild({catalog,plan,onApply,onEdit,onChange,applied=false,onUndo}:{catalog:Catalog;plan:Plan;onApply:(next:Plan)=>void;onEdit:(tab:string)=>void;onChange:(patch:Partial<Plan>)=>void;applied?:boolean;onUndo?:()=>void}){
 const {t,skill:localSkill,node:localNode,specialization}=useLocale();
 const [result,setResult]=useState<{source:Plan;catalog:Catalog;next:Plan}|null>(null);
 const [error,setError]=useState(''),[group,setGroup]=useState('active'),[selectedSkill,setSelectedSkill]=useState(''),[boardId,setBoardId]=useState(catalog.boards[0]?.id),[nodeId,setNodeId]=useState('');
 const points=pointLimits(catalog,plan),candidate=result?.source===plan&&result.catalog===catalog?result.next:null;
 // Debounce input; stale results are hidden immediately, never labelled as current.
 useEffect(()=>{setError('');const timer=setTimeout(()=>{try{setResult({source:plan,catalog,next:recommendBuild(catalog,plan)})}catch{setResult(null);setError(t('추천 계산에 실패했습니다. 레벨과 포인트를 확인하세요.'))}},150);return()=>clearTimeout(timer)},[catalog,plan,t]);
 const board=catalog.boards.find(b=>b.id===boardId)||catalog.boards[0],node=board?.nodes.find(n=>n.id===nodeId);
 const firstRow=Math.min(...board.nodes.map(n=>n.row)),lastRow=Math.max(...board.nodes.map(n=>n.row)),firstCol=Math.min(...board.nodes.map(n=>n.column)),lastCol=Math.max(...board.nodes.map(n=>n.column));
 const skills=catalog.skills.filter(s=>group==='stigma'?s.stigma:!s.stigma&&s.kind===group);
 const chosen=catalog.skills.find(s=>s.id===selectedSkill);
 const boardKnown=!!plan.character&&Array.isArray(plan.character.nodes)&&!plan.character.failedBoards?.length;
 const owned=new Set<string>(boardKnown?plan.character.nodes:[]);
 const used=candidate?totals(catalog,candidate):null;
 const count=(v:string,max=9999)=>Math.min(max,Math.max(0,Math.floor(Number(v)||0)));
 return <section className="panel growth-guide direct-build" aria-label={t('내 성장 안내')}>
  <h1>{t('지금 올릴 스킬과 데바니온')}</h1>
  <div className="growth-inputs">
   <label>{t('캐릭터 레벨')}<input aria-label={t('캐릭터 레벨')} type="number" min={1} max={45} value={plan.level} onChange={e=>onChange({level:Math.max(1,count(e.target.value,45))})}/></label>
   {(['sp','stigma','crystal','battle'] as const).map((key,i)=><label key={key}>{t(['스킬 포인트','스티그마 포인트','데바니온 포인트','아스펠 결정'][i])}<input aria-label={t(['스킬 포인트','스티그마 포인트','데바니온 포인트','아스펠 결정'][i])} type="number" min={0} max={9999} value={points[key]} onChange={e=>onChange({pointBudget:{...points,[key]:count(e.target.value)}})}/></label>)}
  </div>
  <p className="subtle">{t('총 포인트 = 이미 쓴 양 + 남은 양. 캐릭터 조회로 총량은 확인되지 않습니다.')} {t(pointBudgetSourceLabel(plan))}</p>
  <details className="growth-basis-details"><summary>{t('포인트 계산 기준')}</summary>
  <p>{t(isEndgamePointLevel(plan)?'45레벨은 콘텐츠 완료 기준으로 안내합니다. 아직 완료하지 않았거나 총량이 다르면 아래 숫자를 수정하세요.':'레벨만 입력하면 최소 기준으로 안내합니다. 추가로 얻은 포인트까지 반영하려면 아래 총량을 수정하세요.')}</p>
  <p className="subtle">{t(isEndgamePointLevel(plan)?'45레벨 기본값은 서브 퀘스트·봉인던전·주둔지를 모두 완료했다고 가정합니다. 실제 완료 여부를 조회한 값은 아닙니다.':'레벨별 최소 기준은 레벨업 보상만 포함합니다. 봉인던전·서브 퀘스트 등에서 얻은 추가 포인트는 사람마다 달라 제외합니다.')}</p>
  {isEndgamePointLevel(plan)&&<p className="subtle">{t('서브 퀘스트 보상 58 + 내 종족 봉인던전 61곳 × 2를 더합니다. 주둔지의 별도 포인트는 추가하지 않습니다. 스티그마는 레벨 보상 29이며, 승급 추가 보상·상점 구매·이벤트는 별도입니다.')}</p>}
  <button className="button secondary small" onClick={()=>onChange({pointBudget:undefined,extraSP:0,extraStigma:0,extraCrystal:0,extraBattle:0})}>{t(isEndgamePointLevel(plan)?'콘텐츠 완료 기준으로 되돌리기':'레벨별 최소 기준으로 되돌리기')}</button>
  </details>
  <div className="direct-build-options">
  <label className="ascension-confirm"><input type="checkbox" checked={plan.ascensionGrade3Confirmed===true} onChange={e=>onChange({ascensionGrade3Confirmed:e.target.checked})}/>{t('게임에서 3차 승급을 완료했습니다')}</label>
  <div className="growth-purpose"><span>{t('플레이 목적')}</span>{(['damage','safe','pvp'] as const).map((mode,i)=><button className={'button secondary '+(plan.mode===mode?'selected':'')} aria-pressed={plan.mode===mode} key={mode} onClick={()=>onChange({mode})}>{t(['사냥 · 공격','생존도 고려','유저와 전투'][i])}</button>)}</div>
  </div>
  <p className="subtle">{t('레벨 제한과 포인트 안에서 계산한 참고 배분입니다. 레벨링 최적 효율을 검증한 정답은 아닙니다.')}</p>
  {!candidate&&!error&&<p role="status">{t('현재 레벨·포인트로 계산 중…')}</p>}{error&&<p role="alert">{error}</p>}
  {candidate&&<>
   <div className="growth-section-heading"><h3>{t('1. 스킬')}</h3><div className="segmented">{[['active','액티브'],['passive','패시브'],['stigma','스티그마']].map(([key,label])=><button key={key} aria-pressed={group===key} className={group===key?'selected':''} onClick={()=>{setGroup(key);setSelectedSkill('')}}>{t(label)}</button>)}</div></div>
   <p>{t('왼쪽 → 오른쪽 → 다음 줄 순서입니다. 주황 테두리는 조회된 실제 레벨보다 높은 목표입니다.')}</p>
   <p className="subtle">{t('목표가 현재보다 낮아도 반드시 낮추라는 뜻은 아닙니다.')} {t('목표는 기본 투자 + 장비 + 추천 데바니온의 합계입니다. 아이콘을 누르면 각각의 수치와 특화가 나옵니다.')}</p>
   <div className="growth-skill-grid">{skills.map(s=>{const observed=plan.character?.skills?.find((x:any)=>String(x.id)===s.id),actual=typeof observed?.skillLevel==='number'?observed.skillLevel:null,target=finalLevel(catalog,candidate,s),raise=actual!==null&&target>actual,locked=maxBase(s,plan.level,plan.ascensionGrade3Confirmed)===0;return <button key={s.id} aria-pressed={selectedSkill===s.id} className={'growth-skill '+(raise?'needs-investment ':'')+(selectedSkill===s.id?'chosen':'')} onClick={()=>setSelectedSkill(s.id)}><img src={'/shadowcraft/game'+s.iconPath} alt=""/><strong>{localSkill(s.name)}</strong><span>{actual===null?t('현재 미확인'):t('현재 {0}',[actual])}</span><b>{t('목표 {0}',[target])}</b><small>{t(locked?'해금 조건 확인':raise?'↑ 올릴 목표':actual===null?'게임에서 비교':'추가 투자 없음')}</small></button>})}</div>
   {chosen&&<div className="growth-detail" role="status"><h4>{localSkill(chosen.name)}</h4><p>{t('기본 투자 {0} + 장비 {1} + 데바니온 {2} = 목표 {3}',[candidate.base[chosen.id]||0,equipmentBonus(candidate,chosen.id),boardBonus(catalog,candidate,chosen.id),finalLevel(catalog,candidate,chosen)])}</p><p>{t('추천 특화')}: {(candidate.specs[chosen.id]||[]).map(id=>specialization(chosen.specializations.find(s=>s.id===id)?.description||id,id)).join(' · ')||t('현재 목표에서 선택할 특화 없음')}</p><p className="subtle">{t('현재 수치에는 장비 효과가 포함될 수 있습니다. 목표 차이만큼 스킬 포인트를 쓰라는 뜻은 아닙니다.')}</p></div>}
   <div className="growth-section-heading"><h3>{t('2. 데바니온')}</h3><span>{t('추천 사용 {0} / {1} P',[used!.crystal,used!.crystalMax])}</span></div>
   <div className="board-tabs">{catalog.boards.map(b=><button key={b.id} aria-pressed={board.id===b.id} className={board.id===b.id?'selected':''} onClick={()=>{setBoardId(b.id);setNodeId('')}}>{t(b.name)}<small>Lv.{b.requiredLevel}</small></button>)}</div>
   <p className="growth-legend"><span className="green-text">{t('✓ 초록: 이미 찍은 추천 노드')}</span><span>{t('+ 주황: 추가할 추천 경로')}</span><span>{t('테두리 없음: 이번 추천에 없음')}</span></p>
   {!boardKnown&&<p className="notice">{t('현재 데바니온 배치를 확인하지 못했습니다. 주황색은 추천 전체이며, 이미 찍은 노드는 게임에서 확인하세요.')}</p>}
   {board.requiredLevel>plan.level?<p role="status">{t('이 보드는 Lv.{0}부터 안내합니다.',[board.requiredLevel])}</p>:<div className="growth-board" style={{gridTemplateColumns:`repeat(${lastCol-firstCol+1},minmax(0,1fr))`,gridTemplateRows:`repeat(${lastRow-firstRow+1},minmax(0,1fr))`}} aria-label={t('{0} 추천 배치',[t(board.name)])}>{board.nodes.map(n=>{const target=candidate.nodes.includes(n.id),keep=target&&owned.has(n.id),state=n.autoLearn?'start':keep?'kept':target?'needed':'';return <button key={n.id} className={'growth-node '+state+(nodeId===n.id?' chosen':'')} style={{gridRow:n.row-firstRow+1,gridColumn:n.column-firstCol+1}} aria-label={t('{0}행 {1}열 · {2} · {3}',[n.row,n.column,localNode(n.name),t(n.autoLearn?'시작점':keep?'이미 찍은 추천 노드':target?'추가할 추천 경로':'이번 추천에 없음')])} onClick={()=>setNodeId(n.id)}><img src={'/shadowcraft/game'+(n.skill?.iconPath||n.iconPath)} alt=""/>{target&&!n.autoLearn&&<small>{keep?'✓':'+'}</small>}</button>})}</div>}
   {node&&<div className="growth-detail" role="status"><b>{localNode(node.name)}</b><p>{t('{0}행 {1}열 · {2} P',[node.row,node.column,node.pointCost])}</p><p>{t(candidate.nodes.includes(node.id)?'시작점에서 연결되는 주황 경로를 따라 찍으세요.':'이번 예산의 추천에 포함되지 않습니다. 이미 찍었다고 반드시 해제할 필요는 없습니다.')}</p></div>}
   <p className="subtle">{t('이 추천은 전체 포인트를 다시 배분하는 목표입니다. 현재 노드를 유지한 채 추가 투자만 계산한 결과는 아닙니다.')}</p>
   <details className="growth-advanced"><summary>{t('이 목표를 사이트의 편집 계획으로 저장하기')}</summary><p>{t('저장하면 기존 스킬·특화·데바니온 계획이 바뀝니다. 게임에는 적용되지 않습니다.')}</p><button className="button primary" onClick={()=>onApply(candidate)}>{t('목표를 편집 계획에 저장')}</button>{applied&&<p role="status">{t('편집 계획에 저장했습니다.')}</p>}{onUndo&&<button className="button ghost" onClick={onUndo}>{t('저장 전으로 되돌리기')}</button>}<button className="button secondary" onClick={()=>onEdit('skills')}>{t('스킬 상세 편집')}</button><button className="button secondary" onClick={()=>onEdit('daevanion')}>{t('데바니온 상세 편집')}</button></details>
  </>}
 </section>
}
