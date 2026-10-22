import {useMemo,useState} from 'react';
import {recommendTargetNodes} from '../lib/recommendation';
import {useLocale} from './locale';
import {totals,type Catalog,type Plan} from '../lib/planner';
export default function RankerBoards({catalog,plan,target}:{catalog:Catalog;plan:Plan;target:Plan}){
 const {t,node:nodeName}=useLocale();
 const [selected,setSelected]=useState('');
 const [boardId,setBoardId]=useState(catalog.boards[0]?.id);
 const board=catalog.boards.find(b=>b.id===boardId)||catalog.boards[0];
 const priority=useMemo(()=>new Set(recommendTargetNodes(catalog,plan,target)),[catalog,plan,target]);
 const priorityCost=totals(catalog,{...plan,nodes:[...priority]});
 const owned=new Set<string>(Array.isArray(plan.character?.nodes)?plan.character.nodes:plan.nodes),goal=new Set(target.nodes);
 const cost=totals(catalog,target);
 const labels={keep:'유지 · 이미 찍은 목표 노드',remove:'랭커와 다른 노드 · 해제 검토',add:'먼저 찍기 · 내 포인트 안의 추천 경로',later:'나중에 찍기 · 추가 포인트 또는 레벨 필요',empty:'목표에 없는 노드'};
 return <section className="ranker-board-comparison" aria-label={t('데바니온 목표 비교')}>
  <h3>{t('데바니온 목표 비교')}</h3><p>{t(plan.character?.nodes?'내 캐릭터 실제 배치 기준':'내 계획 기준')}</p>
  <p>{t('결정 {0} / {1} · 아스펠 {2} / {3}',[cost.crystal,cost.crystalMax,cost.battle,cost.battleMax])}</p>
  <p>{t('포인트가 부족해도 목표를 비교할 수 있습니다. 빨간 노드는 랭커와 다른 선택이며, 모든 빌드에서 불필요하다는 뜻은 아닙니다.')}</p>
  <div className="goal-legend">{(['keep','remove','add','later'] as const).map(state=><span className={state} key={state}>{t(labels[state])}</span>)}</div>
  <p>{t('추천 경로: 결정 {0}/{1} · 아스펠 {2}/{3}',[priorityCost.crystal,priorityCost.crystalMax,priorityCost.battle,priorityCost.battleMax])}</p>
  <p className="subtle">{t('주력 스킬·플레이 스타일과 연결 비용을 고려한 재배분 제안입니다. 최적 DPS 순위는 아닙니다. 파란 노드는 보유 중이어도 이번 추천 경로에서 제외되며, 빨간 노드를 유지하면 추가 포인트가 필요할 수 있습니다.')}</p>
  <nav className="preview-tabs" aria-label={t('데바니온 보드 선택')}>{catalog.boards.map(b=><button type="button" key={b.id} aria-pressed={board.id===b.id} onClick={()=>{setBoardId(b.id);setSelected('')}}>{t(b.name)}</button>)}</nav>
  <div className="goal-boards single-board">{[board].filter(Boolean).map(board=>{const minRow=Math.min(...board.nodes.map(n=>n.row)),minCol=Math.min(...board.nodes.map(n=>n.column)),maxCol=Math.max(...board.nodes.map(n=>n.column));return <section key={board.id}><h4>{t(board.name)} · Lv.{board.requiredLevel}</h4><div className="goal-board" style={{gridTemplateColumns:`repeat(${maxCol-minCol+1},minmax(0,1fr))`}}>{board.nodes.map(n=>{
   const state=n.autoLearn?'empty':goal.has(n.id)?priority.has(n.id)?owned.has(n.id)?'keep':'add':'later':owned.has(n.id)?'remove':'empty';
   const name=nodeName(n.name);return <button type="button" key={n.id} className={'goal-node '+state} style={{gridRow:n.row-minRow+1,gridColumn:n.column-minCol+1}} onClick={()=>setSelected(name+' · '+t(labels[state])+' · '+n.pointCost+' P')} title={name+' · '+t(labels[state])+' · '+n.pointCost+' P'} aria-label={name+' · '+t(labels[state])}><img src={'/shadowcraft/game'+n.iconPath} alt="" loading="lazy"/><span aria-hidden="true">{state==='keep'?'✓':state==='remove'?'−':state==='add'?'+':state==='later'?'…':''}</span></button>;
  })}</div></section>})}</div>
  {selected&&<p role="status">{selected}</p>}
 </section>;
}
