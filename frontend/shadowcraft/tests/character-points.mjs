import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl,plannerUrl} from './modules.mjs';
const {characterPoints,pointBalance}=await import(moduleUrl(readFileSync('lib/character-points.ts','utf8').replace("'./planner'",JSON.stringify(plannerUrl))));
const c=JSON.parse(readFileSync('lib/data/catalogs/templar.json','utf8'));
const d=JSON.parse(readFileSync('tests/fixtures/templar-points-lv36.json','utf8'));
const p=characterPoints(c,d,{});console.log(p);
assert.deepEqual(p,{sp:149,stigma:13,crystal:104,battle:0,ariel:0});
assert.equal(pointBalance(114,p.crystal),10);
assert.equal(pointBalance(100,p.crystal),null);
assert.equal(characterPoints(c,{...d,failedBoards:['21']},{}).crystal,null);
assert.equal(characterPoints(c,{...d,nodes:[...d.nodes,'unknown']},{}).crystal,null);
assert.equal(characterPoints(c,d,null).sp,null);
assert.equal(characterPoints(c,{...d,nodes:[...d.nodes,...d.nodes]},{}).crystal,104);
console.log('PASS GreenOrc snapshot, bonus subtraction, duplicates, incomplete data and 114=104+10');

assert.equal(characterPoints(c,{...d,boards:[{id:21,open:1,openNodeCount:999}]},{}).crystal,null);
assert.equal(characterPoints(c,d,{'12010000':1}).sp,145,'equipment +1 must not be charged as invested SP');

const {test}=await import('node:test');
const {planner}=await import('./modules.mjs');
const {confirmRemaining}=await import(moduleUrl(readFileSync('lib/character-points.ts','utf8').replace("'./planner'",JSON.stringify(plannerUrl))));
const {PlanMemory,validStoredPlan}=await import(moduleUrl(readFileSync('lib/plan-memory.ts','utf8')));
const latest=JSON.parse(readFileSync('tests/fixtures/templar-points-lv39.json','utf8'));
const character={...latest.character,region:'eu',profile:{...latest.character.profile,characterId:'fixture',serverId:'2311'}};
const initial={...planner.emptyPlan(c),classKey:'templar',level:39,character};
const limits=planner.pointLimits(c,initial);
const apply=(p,key,n,used)=>planner.updatePlan(c,p,confirmRemaining(p,planner.pointLimits(c,p),key,n,used)||{});
test('latest local snapshot: unknown skill cost, known 104 crystals',()=>{
 assert.deepEqual(characterPoints(c,character,latest.gearBonus),{sp:null,stigma:null,crystal:104,battle:0,ariel:0});
 assert.deepEqual(characterPoints(c,character,{}),{sp:149,stigma:13,crystal:104,battle:0,ariel:0}); // conditional zero-bonus assumption only
});
test('complete bonuses derive total from confirmed balance',()=>{
 const next=apply(initial,'sp',30,149);
 assert.equal(next.confirmedRemaining.sp,30);assert.equal(next.pointBudget.sp,179);
});
test('incomplete bonuses preserve confirmed SP30/stigma5 without inventing totals',()=>{
 let next=apply(initial,'sp',30,null);next=apply(next,'stigma',5,null);
 assert.deepEqual(next.confirmedRemaining,{sp:30,stigma:5});assert.equal(next.pointBudget,undefined);
 assert.deepEqual(planner.pointLimits(c,next),limits);
});
test('same-character refreshed object and changed equipment keep confirmations',()=>{
 const p=apply(initial,'sp',30,null);
 const next=planner.updatePlan(c,p,{character:{...structuredClone(character),equipment:[{id:123}]},level:39});
 assert.equal(next.confirmedRemaining.sp,30);
 assert.equal(characterPoints(c,next.character,null).sp,null);
 assert.equal(characterPoints(c,next.character,{}).sp,149);
 assert.equal(next.confirmedRemaining.sp,30);
});
test('local persistence/restore and configured total edits never clobber confirmation',()=>{
 const values=new Map();const storage=()=>({getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)});
 const memory=new PlanMemory('test','templar',initial,storage);memory.update(apply(initial,'sp',30,null));
 const restored=new PlanMemory('test','templar',initial,storage).restore();
 assert.equal(restored.confirmedRemaining.sp,30);
 const edited=planner.updatePlan(c,restored,{pointBudget:{...limits,sp:999}});
 assert.equal(edited.confirmedRemaining.sp,30);
 assert.equal(planner.updatePlan(c,edited,{pointBudget:undefined}).confirmedRemaining.sp,30);
});
test('zero remains a confirmation with complete and incomplete data',()=>{
 for(const used of [null,149]){const p=apply(initial,'sp',0,used);assert.equal(p.confirmedRemaining.sp,0);if(used!==null)assert.equal(p.pointBudget.sp,149);}
});
test('over-budget and overflow keep valid confirmation without false zero or truncation',()=>{
 assert.equal(pointBalance(100,149),null);
 assert.equal(apply(initial,'sp',30,149).pointBudget.sp,179);
 const p=apply(initial,'sp',9999,149);assert.equal(p.confirmedRemaining.sp,9999);assert.equal(p.pointBudget,undefined);
});
test('invalid inputs rejected; hypothetical target cannot confirm actual remaining',()=>{
 for(const n of [-1,1.5,10000,NaN,Infinity])assert.equal(confirmRemaining(initial,limits,'sp',n,null),null);
 assert.equal(confirmRemaining({...initial,level:45},limits,'sp',30,null),null);
 for(const value of [{sp:-1},{sp:NaN},{sp:1.5},{other:3}])assert.equal(validStoredPlan({...initial,confirmedRemaining:value},'templar'),false);
});
test('target-level changes preserve actual balance; actual level/identity changes invalidate it',()=>{
 const p=apply(initial,'sp',30,null);
 assert.equal(planner.updatePlan(c,p,{level:45}).confirmedRemaining.sp,30);
 for(const changed of [null,{...character,region:'kr'},{...character,profile:{...character.profile,serverId:'other'}},{...character,profile:{...character.profile,characterId:'other'}},{...character,profile:{...character.profile,characterLevel:40}}])assert.equal(planner.updatePlan(c,p,{character:changed}).confirmedRemaining,undefined);
});
