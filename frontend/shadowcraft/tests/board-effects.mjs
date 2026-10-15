import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
const raw=readFileSync('lib/data/board-effects.json','utf8');
const {nodeStats}=await import(moduleUrl(readFileSync('lib/board-effects.ts','utf8').replace("import overlay from './data/board-effects.json';",`const overlay=${raw};`)));
const overlay=JSON.parse(raw);
let supplemented=0;
for(const key of Object.keys(overlay.source.catalogSha256)){
 const c=JSON.parse(readFileSync(`lib/data/catalogs/${key}.json`));
 const before=JSON.stringify(c);
 for(const board of c.boards)for(const node of board.nodes){
  const stats=nodeStats(node,c.version);
  if(overlay.rules[node.id]){assert.equal(stats.length,2);supplemented++;}
  else assert.equal(stats.length,node.stat?1:0);
 }
 assert.equal(JSON.stringify(c),before);
}
assert.equal(supplemented,192);
const [id,rule]=Object.entries(overlay.rules)[0];
const node={id,row:rule.row,column:rule.column,stat:{...rule.primary,name:'original'}};
assert.equal(nodeStats(node,rule.catalogVersion).length,2);
assert.equal(nodeStats({...node,row:node.row+1},rule.catalogVersion).length,1);
assert.equal(nodeStats({...node,stat:{...node.stat,value:node.stat.value+1}},rule.catalogVersion).length,1);
assert.equal(nodeStats({...node,stat:{...node.stat,key:'changed'}},rule.catalogVersion).length,1);
assert.equal(nodeStats({...node,stat:{...node.stat,format:'{v:0}%'}},rule.catalogVersion).length,1);
assert.equal(nodeStats({...node,stat:undefined},rule.catalogVersion).length,0);
console.log('Board effects: all 8 classes/192 compound nodes, fallback on changed data and nonmutation PASS');

assert.equal(nodeStats(node,"unreviewed-version").length,1);
