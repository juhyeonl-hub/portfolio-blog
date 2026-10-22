import {useState} from 'react';
import {useLocale} from './locale';
import {totals,type Catalog,type Plan} from '../lib/planner';
export default function RankerBoards({catalog,plan,target}:{catalog:Catalog;plan:Plan;target:Plan}){
 const {t,node:nodeName}=useLocale();
 const [selected,setSelected]=useState('');
 const owned=new Set<string>(Array.isArray(plan.character?.nodes)?plan.character.nodes:plan.nodes),goal=new Set(target.nodes);
 const cost=totals(catalog,target);
 const labels={keep:'유지 · 이미 찍은 목표 노드',remove:'랭커와 다른 노드 · 해제 검토',add:'추가로 찍을 목표 노드',empty:'목표에 없는 노드'};
 return <section className="ranker-board-comparison" aria-label={t('데바니온 목표 비교')}>
  <h3>{t('데바니온 목표 비교')}</h3><p>{t(plan.character?.nodes?'내 캐릭터 실제 배치 기준':'내 계획 기준')}</p>
  <p>{t('결정 {0} / {1} · 아스펠 {2} / {3}',[cost.crystal,cost.crystalMax,cost.battle,cost.battleMax])}</p>
  <p>{t('포인트가 부족해도 목표를 비교할 수 있습니다. 빨간 노드는 랭커와 다른 선택이며, 모든 빌드에서 불필요하다는 뜻은 아닙니다.')}</p>
  <div className="goal-legend">{(['keep','remove','add'] as const).map(state=><span className={state} key={state}>{t(labels[state])}</span>)}</div>
  <div className="goal-boards">{catalog.boards.map(board=>{const minRow=Math.min(...board.nodes.map(n=>n.row)),minCol=Math.min(...board.nodes.map(n=>n.column)),maxCol=Math.max(...board.nodes.map(n=>n.column));return <section key={board.id}><h4>{t(board.name)} · Lv.{board.requiredLevel}</h4><div className="goal-board" style={{gridTemplateColumns:`repeat(${maxCol-minCol+1},minmax(0,1fr))`}}>{board.nodes.map(n=>{
   const state=n.autoLearn?'empty':owned.has(n.id)?goal.has(n.id)?'keep':'remove':goal.has(n.id)?'add':'empty';
   const name=nodeName(n.name);return <button type="button" key={n.id} className={'goal-node '+state} style={{gridRow:n.row-minRow+1,gridColumn:n.column-minCol+1}} onClick={()=>setSelected(name+' · '+t(labels[state])+' · '+n.pointCost+' P')} title={name+' · '+t(labels[state])+' · '+n.pointCost+' P'} aria-label={name+' · '+t(labels[state])}><img src={'/shadowcraft/game'+n.iconPath} alt="" loading="lazy"/><span aria-hidden="true">{state==='keep'?'✓':state==='remove'?'−':state==='add'?'+':''}</span></button>;
  })}</div></section>})}</div>
  {selected&&<p role="status">{selected}</p>}
 </section>;
}
