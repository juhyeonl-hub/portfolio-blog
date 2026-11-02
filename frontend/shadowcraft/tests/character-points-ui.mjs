import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {moduleUrl,plannerUrl,planner} from './modules.mjs';
const jsx=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replaceAll('"react/jsx-runtime"',JSON.stringify(import.meta.resolve('react/jsx-runtime')));
const url=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const pointsUrl=moduleUrl(readFileSync('lib/character-points.ts','utf8').replace("'./planner'",JSON.stringify(plannerUrl)));
const numberUrl=url(jsx(readFileSync('app/point-number.tsx','utf8').replace("import {useEffect,useState} from 'react';",'const useEffect=()=>{};const useState=value=>[value,x=>{globalThis.__draft=x}];')));
const {default:PointNumber}=await import(numberUrl);
const shopsUrl=url(jsx(readFileSync('app/daevanion-purchases.tsx','utf8')
 .replace("import {useState} from 'react';",'const useState=value=>[value,()=>{}];')
 .replace("'@/lib/planner'",JSON.stringify(plannerUrl))
 .replace("import {useLocale} from './locale';",'const useLocale=()=>({t:s=>s});')
 .replace("import './daevanion-purchases.css';",'')));
let source=readFileSync('app/character-points.tsx','utf8')
 .replace("import {createPointGear,pointGearState,type PointGearFailure} from '@/lib/point-gear';",'const createPointGear=()=>null;const pointGearState=()=>({});')
 .replace("'./daevanion-purchases'",JSON.stringify(shopsUrl))
 .replace("import {useEffect,useState} from 'react';",'const useEffect=()=>{};const useState=value=>[value===0?0:globalThis.__pointsGear,()=>{}];')
 .replace("'@/lib/planner'",JSON.stringify(plannerUrl)).replace("'@/lib/character-points'",JSON.stringify(pointsUrl))
 .replace("'./point-number'",JSON.stringify(numberUrl)).replace("import './leveling-guide.css';",'')
 .replace("import {queryArmory} from '@/lib/armory-client';",'const queryArmory=()=>{throw Error("Unexpected network call")};')
 .replace("import {useLocale} from './locale';",'const useLocale=()=>({t:s=>s,skill:s=>s});');
const {default:CharacterPoints}=await import(url(jsx(source)));
const catalog=JSON.parse(readFileSync('lib/data/catalogs/templar.json','utf8'));
const fixture=JSON.parse(readFileSync('tests/fixtures/templar-points-lv39.json','utf8'));
const initial={...planner.emptyPlan(catalog),level:39,character:fixture.character};
function flatten(el){if(el==null||typeof el==='boolean')return [];if(Array.isArray(el))return el.flatMap(flatten);return [el,...(typeof el==='object'?flatten(typeof el.type==='function'?el.type(el.props):el.props?.children):[])];}
function render(plan,bonus=null,extra={}){globalThis.__pointsGear={source:plan.character,bonus,...extra};let next=plan;const tree=CharacterPoints({catalog,plan,points:planner.pointLimits(catalog,plan),onChange:patch=>{next=planner.updatePlan(catalog,plan,patch)}});const els=flatten(tree),inputs=els.filter(x=>x?.type==='input');return {els,inputs,change:(label,value)=>{inputs.find(x=>x.props['aria-label']===label).props.onChange({target:{value}});return next;}};}
test('unknown usage retains entered balance without inventing a total',()=>{
 const view=render(initial);const next=view.change('남은 스킬 포인트','30');assert.equal(next.confirmedRemaining.sp,30);assert.equal(next.pointBudget,undefined);
 assert.equal(render(next).inputs[0].props.value,'30');
 assert.ok(view.els.includes('사용량 미확인: 남은 양은 보존하고, 추천은 입력한 총량으로 계산합니다.'));
});
test('valid input updates immediately without blur, including zero',()=>{
 const next=render(initial,{}).change('남은 스킬 포인트','30');assert.equal(next.pointBudget.sp,179);
 assert.equal(render(next,{}).change('남은 스킬 포인트','0').pointBudget.sp,149);
 assert.equal(render(next,{}).change('데바니온 포인트','370').pointBudget.crystal,370);
});
test('editing confirmed value does not remount the input',()=>{
 const first=render(initial);const next=first.change('남은 스킬 포인트','30');
 const key=view=>view.els.filter(x=>x?.type===PointNumber)[0].key;
 assert.equal(key(first),key(render(next)));assert.equal(key(first),key(render({...next,character:structuredClone(next.character)},{})));
});
test('blank, negative, fraction and overflow never overwrite valid points',()=>{
 const plan=render(initial).change('남은 스킬 포인트','30');
 for(const value of ['', '-1', '1.5', '10000'])assert.equal(render(plan).change('남은 스킬 포인트',value),plan);
 const overflow=render(plan,{}).change('남은 스킬 포인트','9999');assert.equal(overflow.confirmedRemaining.sp,9999);assert.equal(overflow.pointBudget,undefined);
});
test('hypothetical level and missing character disable balance entry, not totals',()=>{
 for(const plan of [{...initial,level:45},{...initial,character:null}]){
  const view=render(plan);assert.equal(view.inputs[0].props.disabled,true);assert.equal(view.inputs[1].props.disabled,false);
  assert.equal(view.change('남은 스킬 포인트','100'),plan);assert.equal(view.change('스킬 포인트','200').pointBudget.sp,200);
 }
});
test('synced confirmations are read-only until the actual character is loaded',()=>{
 const view=render({...initial,character:null,confirmedRemaining:{sp:30,crystal:0}});
 assert.equal(view.inputs[0].props.value,'30');assert.equal(view.inputs[4].props.value,'0');assert.equal(view.inputs[0].props.disabled,true);
});
test('editing total preserves confirmed balance and explains a mismatch',()=>{
 const plan=render(initial,{}).change('남은 스킬 포인트','30');const next=render(plan,{}).change('스킬 포인트','200');
 assert.equal(next.confirmedRemaining.sp,30);assert.ok(render(next,{}).els.includes('계산한 남은 포인트와 직접 입력한 값이 다릅니다. 추천은 입력한 총량으로 계산합니다.'));
});
test('number draft stays blank while editing, restores on blur and supports Enter',()=>{
 let calls=[];const el=PointNumber({label:'test',value:370,onValue:n=>calls.push(n)});
 el.props.onChange({target:{value:''}});assert.equal(globalThis.__draft,'');assert.deepEqual(calls,[]);
 el.props.onBlur();assert.equal(globalThis.__draft,'370');
 for(const value of ['3','37','370'])el.props.onChange({target:{value}});assert.deepEqual(calls,[3,37,370]);
 let blurred=false;el.props.onKeyDown({key:'Enter',currentTarget:{blur:()=>{blurred=true}}});assert.ok(blurred);
});
delete globalThis.__pointsGear;delete globalThis.__draft;

// One missing item is actionable, but never renders an invented usage figure.
test('per-item diagnostics and explicit retry preserve the plan',()=>{
 let retries=0;const view=render(initial,null,{failure:true,completed:17,total:20,loading:false,errors:[{key:'coat',name:'Vakron Breastplate',slot:5,reason:'missing'}],retry:()=>{retries++}});
 assert.ok(view.els.includes('Vakron Breastplate'));
 assert.ok(view.els.includes('공식 응답에 스킬 보너스가 없습니다. 0으로 계산하지 않습니다.'));
 const retry=view.els.find(x=>x?.type==='button'&&x.props.children==='장비 보너스 다시 확인');
 assert.equal(retry.props.disabled,false);retry.props.onClick();assert.equal(retries,1);
 assert.equal(view.change('남은 스킬 포인트','30').pointBudget,undefined);
 const loading=render(initial,null,{failure:true,loading:true,retry:()=>{}});
 assert.equal(loading.els.find(x=>x?.type==='button'&&x.props.children==='장비 보너스 다시 확인').props.disabled,true);
 assert.ok(loading.els.includes('장비 확인 중…'));
});

test('rate-limited pending items show waiting without false per-item failures',()=>{
 const view=render(initial,null,{loading:true,retryAt:Date.now()+60000,completed:1,total:25,errors:[]});
 assert.ok(view.els.includes('조회 요청이 많아 잠시 대기 중입니다. 확인한 장비는 유지하고 자동으로 이어서 조회합니다.'));
 assert.ok(view.els.includes('조회 대기 중…'));
 assert.ok(!view.els.includes('장비 조회에 실패했습니다. 잠시 후 다시 확인하세요.'));
 const exhausted=render(initial,null,{failure:true,loading:false,errors:[{key:'rate',name:'Item',slot:1,reason:'busy'}],retry:()=>{}});
 assert.ok(exhausted.els.includes('조회 제한으로 보류됐습니다. 잠시 후 다시 확인하세요.'));
});
