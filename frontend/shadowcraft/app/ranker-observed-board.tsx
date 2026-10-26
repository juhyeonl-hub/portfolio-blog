import RankerBoardZoom from './ranker-board-zoom';
import {useState} from 'react';
import {totals,type Catalog,type Plan,type Node} from '../lib/planner';
import {useLocale} from './locale';
import {rankerText} from '../lib/ranker-comparison-text';
export default function RankerObservedBoard({catalog,target,boardId,onBoardChange}:{catalog:Catalog;target:Plan;boardId?:string;onBoardChange?:(id:string)=>void}){
 const {locale,t,node:nodeName}=useLocale();
 const [localBoard,setLocalBoard]=useState(catalog.boards[0]?.id),[selected,setSelected]=useState('');
 const board=catalog.boards.find(b=>b.id===(boardId||localBoard))||catalog.boards[0];
 const goal=new Set(target.nodes),cost=totals(catalog,target);
 const chosen=board.nodes.filter(n=>!n.autoLearn&&goal.has(n.id));
 const selectedNode=board.nodes.find(n=>n.id===selected);
 const label=(n:Node)=>rankerText(locale,n.autoLearn?'automatic':goal.has(n.id)?'selected':'unselected');
 const minRow=Math.min(...board.nodes.map(n=>n.row)),minCol=Math.min(...board.nodes.map(n=>n.column)),maxCol=Math.max(...board.nodes.map(n=>n.column));
 return <section className="ranker-observed-board" aria-label={rankerText(locale,'raw')}><h3>{rankerText(locale,'raw')}</h3><p>{rankerText(locale,'rawHelp')}</p><p><b>{t('결정 {0} · 아스펠 {1}',[cost.crystal,cost.battle])}</b></p>
  <nav className="preview-tabs" aria-label={t('데바니온 보드 선택')}>{catalog.boards.map(b=><button type="button" key={b.id} aria-pressed={board.id===b.id} onClick={()=>{setLocalBoard(b.id);onBoardChange?.(b.id);setSelected('')}}>{t(b.name)}</button>)}</nav>
  <div className="raw-board-summary"><b>{t(board.name)} · Lv.{board.requiredLevel}</b><span>{rankerText(locale,'selected')}: {chosen.length} · {chosen.reduce((sum,n)=>sum+n.pointCost,0)} P</span></div>
  <p className="guide-node-feedback" role="status">{selectedNode?nodeName(selectedNode.name)+' · '+label(selectedNode)+' · '+selectedNode.pointCost+' P':t('확인할 노드를 누르세요.')}</p>
  <RankerBoardZoom><div className="goal-boards single-board"><section><div className="goal-board" style={{gridTemplateColumns:`repeat(${maxCol-minCol+1},minmax(0,1fr))`}}>{board.nodes.map(n=><button type="button" key={n.id} className={'goal-node '+(n.autoLearn?'raw-auto':goal.has(n.id)?'keep':'empty')} style={{gridRow:n.row-minRow+1,gridColumn:n.column-minCol+1}} data-inspected={selected===n.id} aria-label={nodeName(n.name)+' · '+label(n)+' · '+n.pointCost+' P'} title={nodeName(n.name)+' · '+label(n)} onClick={()=>setSelected(n.id)}><img src={'/shadowcraft/game'+n.iconPath} alt="" loading="lazy"/><span aria-hidden="true">{!n.autoLearn&&goal.has(n.id)?'✓':''}</span></button>)}</div></section></div></RankerBoardZoom>
 </section>;
}
