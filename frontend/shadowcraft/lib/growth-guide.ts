import {type Board,adjacent,connected} from './planner';

// Connection order only: not a claim about combat efficiency or available unspent points.
export function boardGuidance(board:Board,targetIds:string[],ownedIds:string[],level:number){
 const locked=board.requiredLevel>level,target=new Set(targetIds),owned=new Set(ownedIds);
 const recommended=locked?[]:board.nodes.filter(n=>target.has(n.id)&&!n.autoLearn);
 const reachable=new Set(locked?[]:connected(board,board.nodes.filter(n=>owned.has(n.id)).map(n=>n.id)));
 const next=recommended.filter(n=>!owned.has(n.id)&&board.nodes.some(parent=>reachable.has(parent.id)&&adjacent(n,parent))).sort((a,b)=>a.row-b.row||a.column-b.column);
 return {locked,cost:recommended.reduce((sum,n)=>sum+n.pointCost,0),kept:recommended.filter(n=>owned.has(n.id)).length,missing:recommended.filter(n=>!owned.has(n.id)).length,next};
}
