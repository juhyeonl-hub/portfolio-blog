import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planner,recommendBuild,moduleUrl} from './modules.mjs';
const effectsUrl=moduleUrl(readFileSync('lib/board-effects.ts','utf8').replace("import overlay from './data/board-effects.json';",'const overlay='+readFileSync('lib/data/board-effects.json','utf8')+';'));
const search=await import(moduleUrl(readFileSync('lib/board-search.ts','utf8').replace("'./board-effects'",JSON.stringify(effectsUrl))));
for(const key of ['gladiator','templar','ranger','assassin','elementalist','sorcerer','cleric','chanter']){
 const c=JSON.parse(readFileSync(`lib/data/catalogs/${key}.json`));const ariel=c.boards.find(b=>b.pointKind.code==='conquestcrystal');
 assert.equal(ariel.nodes.length,153);assert.equal(ariel.nodes.reduce((v,n)=>v+n.pointCost,0),232);
 const input={...planner.emptyPlan(c),pointBudget:{sp:0,stigma:0,crystal:0,battle:0,ariel:10}};
 const before=JSON.stringify(input),result=recommendBuild(c,input),totals=planner.totals(c,result);
 assert.equal(JSON.stringify(input),before);assert.equal(totals.crystal,0);assert.equal(totals.battle,0);assert(totals.ariel>0&&totals.ariel<=10);
 const legacy=recommendBuild(c,{...input,pointBudget:{sp:0,stigma:0,crystal:999,battle:999}});
 assert.equal(planner.totals(c,legacy).ariel,0,'other currencies cannot fund Ariel');
 const matched=search.findBoardNodes(ariel,'공격력',c.version);assert(matched.length>0);
 const frame=search.boardFrame(c.boards[0]);assert(frame.columns<=15&&frame.rows<=15);
}
console.log('PASS 8-class Ariel separate budgets, old-budget isolation, effect search and board bounds');
