import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {classes,planner,recommendBuild,classesUrl,plannerUrl,moduleUrl} from './modules.mjs';
const {recommendTargetNodes}=await import(moduleUrl(readFileSync('lib/recommendation.ts','utf8').replace("'./planner'",JSON.stringify(plannerUrl)).replace("'./classes'",JSON.stringify(classesUrl))));
const fixturePath='tests/fixtures/recommendation-output.json';
const expected=JSON.parse(readFileSync(fixturePath));
const actual={},measurements=[];
function check(key,input,run){
 const before=JSON.stringify(input),start=performance.now(),output=run(),ms=performance.now()-start;
 assert.equal(JSON.stringify(input),before,key+' input unchanged');
 actual[key]=createHash('sha256').update(JSON.stringify(output)).digest('hex');
 assert.equal(actual[key],expected.outputs[key],key+' matches pre-optimization output');
 measurements.push({key,ms:Math.round(ms*10)/10});return output;
}
for(const profile of classes.CLASSES){
 const c=JSON.parse(readFileSync(`lib/data/catalogs/${profile.key}.json`)),base=planner.emptyPlan(c);
 const cases=[
  ['locked',1,'safe',{sp:0,stigma:0,crystal:0,battle:0},false],
  ['leveling',20,'damage',{sp:90,stigma:8,crystal:40,battle:0},false],
  ['114-points',36,'safe',{sp:200,stigma:20,crystal:114,battle:10},false],
  ['370-points',45,'safe',{sp:383,stigma:29,crystal:370,battle:63},false],
  ['416-geared',45,'damage',{sp:383,stigma:29,crystal:416,battle:63},true],
  ['full-pvp',45,'pvp',{sp:9999,stigma:9999,crystal:9999,battle:9999},true],
 ];
 let goal;
 for(const [name,level,mode,pointBudget,ascensionGrade3Confirmed] of cases){
  const p={...base,level,mode,pointBudget,ascensionGrade3Confirmed};
  if(name==='416-geared')p.gear={mode:'target',items:[{id:'test',name:'fixture',slot:'weapon',owned:true,current:true,target:true,bonuses:Object.fromEntries(c.skills.slice(0,4).map(s=>[s.id,2])),note:''}]};
  const result=check(profile.key+'/'+name,[c,p],()=>recommendBuild(c,p));
  if(name==='416-geared')goal=result;
 }
 for(const [suffix,crystal,target] of [
  ['370',370,goal],['10',10,goal],
  ['different-target',370,{...goal,nodes:goal.nodes.filter((id,i)=>i%3!==0)}]
 ]){
  const p={...base,pointBudget:{sp:383,stigma:29,crystal,battle:0}};
  check(profile.key+'/target-'+suffix,[c,p,target],()=>recommendTargetNodes(c,p,target));
 }
 // Revisit earlier inputs after level, mode, equipment and target changes to catch stale caches.
 const p={...base,level:45,mode:'safe',pointBudget:{sp:383,stigma:29,crystal:370,battle:63},ascensionGrade3Confirmed:false};
 const result=recommendBuild(c,p);
 assert.equal(createHash('sha256').update(JSON.stringify(result)).digest('hex'),actual[profile.key+'/370-points']);
 console.log(profile.key+': exact outputs, input immutability, cache invalidation PASS');
}
if(process.env.ASBC_PERF_OUTPUT)writeFileSync(process.env.ASBC_PERF_OUTPUT,JSON.stringify(measurements,null,2));
const worst=[...measurements].sort((a,b)=>b.ms-a.ms).slice(0,5);
console.log(JSON.stringify({cases:measurements.length,totalMs:Math.round(measurements.reduce((sum,m)=>sum+m.ms,0)),slowest:worst}));
