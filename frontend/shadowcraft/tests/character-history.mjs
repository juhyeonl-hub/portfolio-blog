import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {moduleUrl,plannerUrl,planner} from './modules.mjs';
const pointsUrl=moduleUrl(readFileSync('lib/character-points.ts','utf8').replace("'./planner'",JSON.stringify(plannerUrl)));
const {growthSnapshot,growthKey,parseGrowthHistory,appendGrowth,growthChanges}=await import(moduleUrl(readFileSync('lib/character-history.ts','utf8').replace("'./character-points'",JSON.stringify(pointsUrl))));
const c=JSON.parse(readFileSync('lib/data/catalogs/templar.json'));const sk=c.skills.find(s=>!s.stigma&&planner.maxBase(s,45)>=8),n=c.boards.flatMap(b=>b.nodes).find(n=>!n.autoLearn);
const ch={region:'eu',profile:{serverId:1304,characterId:'history-test',characterName:'검증용 캐릭터',characterLevel:40},importedAt:'2026-10-24T10:00:00Z',equipment:[{id:10,name:'검증 장비',slotPos:1,slotPosName:'주무기',enchantLevel:3,exceedLevel:0}],skills:[{id:sk.id,skillLevel:10}],nodes:[],failedBoards:[]};
const first=growthSnapshot(c,ch);assert(first);assert.deepEqual(first.nodes,[]);assert(!('profile' in first));assert(growthKey(first.identity).includes('templar:eu:1304:history-test'));
let history=appendGrowth([],first);assert.equal(appendGrowth(history,{...first,at:'2026-10-24T11:00:00Z'}),history,'no-change query not duplicated');
const second=growthSnapshot(c,{...ch,profile:{...ch.profile,characterLevel:41},importedAt:'2026-10-25T10:00:00Z',equipment:[{...ch.equipment[0],enchantLevel:5}],skills:[{id:sk.id,skillLevel:12}],nodes:[n.id]});
history=appendGrowth(history,second);assert.equal(history.length,2);const diff=growthChanges(first,second);assert.equal(diff.gear[0].after.enchant,5);assert.equal(diff.skills[0].after,12);assert.deepEqual(diff.nodes.added,[n.id]);assert.equal(appendGrowth(history,first),history,'late response ignored');
assert.throws(()=>growthChanges(first,{...second,identity:'other'}));assert.throws(()=>appendGrowth(history,{...second,identity:'other'}));assert.throws(()=>parseGrowthHistory(JSON.stringify(history),'other'));
assert.equal(growthChanges(first,{...second,version:'future'}).skills,null);assert.equal(growthChanges(first,{...second,version:'future'}).nodes,null);
assert.equal(growthSnapshot(c,{...ch,failedBoards:['1']}).nodes,null);assert.equal(growthSnapshot(c,{...ch,nodes:['bad']} ).nodes,null);assert.equal(growthSnapshot(c,{...ch,equipment:[null]}).gear,null);assert.equal(growthSnapshot(c,{...ch,skills:[null]}).skills,null);assert.equal(growthSnapshot(c,{...ch,skills:[]}).skills,null);assert.equal(growthSnapshot(c,{...ch,importedAt:'bad'}),null);
assert.equal(growthChanges(first,{...second,gear:null}).gear,null);assert.equal(growthChanges(first,{...second,skills:[]}).skills[0].after,undefined,'missing skill is unknown, not level zero');
assert.deepEqual(parseGrowthHistory(JSON.stringify(history),first.identity),history);assert.throws(()=>parseGrowthHistory('{',first.identity));assert.throws(()=>parseGrowthHistory(JSON.stringify([first,first]),first.identity));
let many=[];for(let i=0;i<25;i++)many=appendGrowth(many,{...first,at:new Date(Date.UTC(2026,9,1,0,i)).toISOString(),level:i+1});assert.equal(many.length,20);
const base=planner.emptyPlan(c);const gearItem=(id,bonus,flags)=>({id,name:id,slot:'주무기',owned:true,current:false,target:false,bonuses:{[sk.id]:bonus},note:'',...flags});
const plan={...base,level:40,character:ch,base:{...base.base,[sk.id]:8},pointBudget:{sp:9999,stigma:9999,crystal:9999,battle:9999},gear:{mode:'current',items:[gearItem('검증 현재 무기',2,{current:true}),gearItem('검증 목표 무기',4,{target:true}),gearItem('검증 보관 후보',0,{})]}};
const dir=process.env.ASBC_QA_DIR;
if(dir){
writeFileSync(dir+'qa-growth-first.json',JSON.stringify({schema:'shadowcraft-v1',catalogVersion:c.version,plan}));
writeFileSync(dir+'qa-growth-second.json',JSON.stringify({schema:'shadowcraft-v1',catalogVersion:c.version,plan:{...plan,character:{...ch,profile:{...ch.profile,characterLevel:41},importedAt:second.at,equipment:[{...ch.equipment[0],enchantLevel:5}],skills:[{id:sk.id,skillLevel:12}],nodes:[n.id]}}}));
}
console.log('History identity isolation, no-change/stale deduplication, 20-snapshot cap, actual deltas, missing-data/version gates, corrupt storage preservation PASS');
