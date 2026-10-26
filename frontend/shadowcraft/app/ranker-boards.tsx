import RankerBoardZoom from './ranker-board-zoom';
import RankerObservedBoard from './ranker-observed-board';
import {rankerText} from '../lib/ranker-comparison-text';
import {characterPoints} from '../lib/character-points';
import {useMemo,useState} from 'react';
import {boardGuidance} from '../lib/growth-guide';
import './leveling-guide.css';
import {recommendTargetNodes} from '../lib/recommendation';
import {useLocale} from './locale';
import {totals,type Catalog,type Plan,type Node} from '../lib/planner';
export default function RankerBoards({catalog,plan,target,boardId,onBoardChange,guideOnly=false}:{guideOnly?:boolean;catalog:Catalog;plan:Plan;target:Plan;boardId?:string;onBoardChange?:(id:string)=>void}){
 const {t,locale,node:nodeName}=useLocale();
 const [view,setView]=useState<'actual'|'guide'>('actual');
 const isGuide=guideOnly||view==='guide';
 const modes=!guideOnly&&<nav className="ranker-view-tabs" aria-label={rankerText(locale,'tabs')}>{(['actual','guide'] as const).map(mode=><button type="button" key={mode} aria-pressed={view===mode} onClick={()=>setView(mode)}>{rankerText(locale,mode==='actual'?'raw':'guide')}</button>)}</nav>;
 const [selected,setSelected]=useState('');
 const selectedNode=catalog.boards.flatMap(b=>b.nodes).find(n=>n.id===selected);
 const [localBoard,setLocalBoard]=useState(catalog.boards[0]?.id);
 const setBoardId=(id:string)=>{setLocalBoard(id);onBoardChange?.(id)};
 const board=catalog.boards.find(b=>b.id===(boardId||localBoard))||catalog.boards[0];
 const priority=useMemo(()=>new Set(isGuide?recommendTargetNodes(catalog,plan,target):[]),[isGuide,catalog,plan,target]);
 const priorityCost=totals(catalog,{...plan,nodes:[...priority]});
 const owned=new Set<string>(Array.isArray(plan.character?.nodes)?plan.character.nodes:plan.nodes),goal=new Set(target.nodes);
 const boardKnown=characterPoints(catalog,plan.character).crystal!==null;
 const guidance=boardGuidance(board,[...priority],[...owned],plan.level);
 const nextNodes=boardKnown&&board.requiredLevel<=plan.character.profile?.characterLevel?guidance.next:[];
 const nextIds=new Set(nextNodes.map(n=>n.id));
 const nodeState=(n:Node)=>n.autoLearn?'empty':goal.has(n.id)?priority.has(n.id)?owned.has(n.id)?'keep':'add':'later':owned.has(n.id)?'remove':'empty';
 const cost=totals(catalog,target);
 const boardCounts={add:0,keep:0,later:0,remove:0,empty:0};
 board.nodes.forEach(n=>boardCounts[nodeState(n)]++);
 const labels={keep:'유지 · 이미 찍은 목표 노드',remove:'랭커와 다른 노드 · 해제 검토',add:'먼저 찍기 · 내 포인트 안의 추천 경로',later:'나중에 찍기 · 추가 포인트 또는 레벨 필요',empty:'목표에 없는 노드'};
 if(!isGuide)return <div>{modes}<RankerObservedBoard catalog={catalog} target={target} boardId={boardId} onBoardChange={onBoardChange}/></div>;
 return <section className="ranker-board-comparison" aria-label={t('데바니온 목표 비교')}>
  {modes}<h3>{t('데바니온 목표 비교')}</h3><p>{t(plan.character?.nodes?'내 캐릭터 실제 배치 기준':'내 계획 기준')}</p>
  <div className="guide-budget">{[['랭커 전체 배치에 필요한 포인트',cost.crystal,cost.battle],['내가 설정한 총 포인트',cost.crystalMax,cost.battleMax],['지금 추천하는 배치의 사용량',priorityCost.crystal,priorityCost.battle]].map(([label,crystal,battle])=><div key={String(label)}><span>{t(String(label))}</span><strong>{t('결정 {0} · 아스펠 {1}',[crystal,battle])}</strong></div>)}</div>
  {(cost.crystal>cost.crystalMax||cost.battle>cost.battleMax)&&<p>{t('랭커 전체 배치까지 더 필요한 포인트: 결정 {0} · 아스펠 {1}',[Math.max(0,cost.crystal-cost.crystalMax),Math.max(0,cost.battle-cost.battleMax)])}</p>}
  <p>{t(plan.pointBudget?'게임에서 확인한 총량과 다르면 위의 내 포인트 입력에서 바꾸세요.':'내 총량은 레벨 기준 추정값입니다. 위의 내 포인트 입력에서 게임의 사용량 + 남은 양을 입력하세요.')}</p>
  <p>{t('포인트가 부족해도 목표를 비교할 수 있습니다. 빨간 노드는 랭커와 다른 선택이며, 모든 빌드에서 불필요하다는 뜻은 아닙니다.')}</p>
  <div className="goal-legend">{(['keep','remove','add','later'] as const).map(state=><span className={state} key={state}>{t(labels[state])}</span>)}</div>
  <p>{t('보드를 고르고 주황색 + 노드부터 확인하세요. 파란색 … 노드는 나중에 준비할 목표입니다. 노드를 누르면 이름과 비용을 볼 수 있습니다.')}</p>
  <details className="guide-explanation"><summary>{t('추천 기준과 색상 해석')}</summary><p className="subtle">{t('주력 스킬·플레이 스타일과 연결 비용을 고려한 재배분 제안입니다. 최적 DPS 순위는 아닙니다. 파란 노드는 보유 중이어도 이번 추천 경로에서 제외되며, 빨간 노드를 유지하면 추가 포인트가 필요할 수 있습니다.')}</p></details>
  <nav className="preview-tabs" aria-label={t('데바니온 보드 선택')}>{catalog.boards.map(b=><button type="button" key={b.id} aria-pressed={board.id===b.id} onClick={()=>{setBoardId(b.id);setSelected('')}}>{t(b.name)}</button>)}</nav>
  <p>{t('이 보드: 유지 {0}개 · 먼저 찍기 {1}개 · 나중에 찍기 {2}개',[boardCounts.keep,boardCounts.add,boardCounts.later])}</p>
  {board.pointKind.code==='battlecrystal'&&<p>{t('아스펠은 일반 데바니온 결정과 별도입니다. 아스펠 총량 {0} 안에서 추천하며, 남은 일반 결정으로 대신 찍을 수 없습니다.',[cost.battleMax])}</p>}
  {nextNodes.length>0&&<div className="growth-route-summary"><b>{t('다음 연결 후보')}</b><p>{t('현재 배치에서 바로 이어지는 후보에 화살표를 표시했습니다. 한꺼번에 모두 찍으라는 뜻은 아닙니다. 필요한 잔여량을 확인하세요.')}</p><div>{nextNodes.slice(0,3).map(n=><button className="button secondary" key={n.id} onClick={()=>{setSelected(n.id);document.getElementById('ranker-node-'+n.id)?.focus()}}>{t('{0}행 {1}열 · {2} · {3} P',[n.row,n.column,nodeName(n.name),n.pointCost])}</button>)}</div></div>}
  <p className="guide-node-feedback" role="status">{selectedNode?nodeName(selectedNode.name)+' · '+t(labels[nodeState(selectedNode)])+' · '+selectedNode.pointCost+' P':t('확인할 노드를 누르세요.')}</p>
  <RankerBoardZoom><div className="goal-boards single-board">{[board].filter(Boolean).map(board=>{const minRow=Math.min(...board.nodes.map(n=>n.row)),minCol=Math.min(...board.nodes.map(n=>n.column)),maxCol=Math.max(...board.nodes.map(n=>n.column));return <section key={board.id}><h4>{t(board.name)} · Lv.{board.requiredLevel}</h4><div className="goal-board" style={{gridTemplateColumns:`repeat(${maxCol-minCol+1},minmax(0,1fr))`}}>{board.nodes.map(n=>{
   const state=nodeState(n);
   const name=nodeName(n.name);return <button type="button" id={'ranker-node-'+n.id} key={n.id} className={'goal-node '+state+(nextIds.has(n.id)?' next-node':'')} style={{gridRow:n.row-minRow+1,gridColumn:n.column-minCol+1}} data-inspected={selected===n.id} onClick={()=>setSelected(n.id)} title={name+' · '+t(labels[state])+' · '+n.pointCost+' P'} aria-label={name+' · '+t(labels[state])}><img src={'/shadowcraft/game'+n.iconPath} alt="" loading="lazy"/><span aria-hidden="true">{state==='keep'?'✓':state==='remove'?'−':state==='add'?(nextIds.has(n.id)?'→':'+'):state==='later'?'…':''}</span></button>;
  })}</div></section>})}</div></RankerBoardZoom>

 </section>;
}
