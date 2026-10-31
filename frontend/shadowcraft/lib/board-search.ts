import type {Board,Node} from './planner';
import {nodeStats} from './board-effects';
export function boardFrame(board:Board){
 const minColumn=Math.min(...board.nodes.map(n=>n.column)),minRow=Math.min(...board.nodes.map(n=>n.row));
 return {minColumn,minRow,columns:Math.max(...board.nodes.map(n=>n.column))-minColumn+1,rows:Math.max(...board.nodes.map(n=>n.row))-minRow+1};
}
export function findBoardNodes(board:Board,query:string,version:string|null,translate:(s:string)=>string=s=>s):Node[]{
 const normalize=(s:string)=>s.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,'');
 const q=normalize(query);if(!q)return [];
 return board.nodes.filter(n=>{const terms=[n.name,n.skill?.name||'',...nodeStats(n,version).map(s=>s.name)];return terms.some(s=>normalize(s).includes(q)||normalize(translate(s)).includes(q));});
}
