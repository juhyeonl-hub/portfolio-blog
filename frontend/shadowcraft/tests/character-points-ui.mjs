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
let source=readFileSync('app/character-points.tsx','utf8')
 .replace("import {useEffect,useState} from 'react';",'const useEffect=()=>{};const useState=()=>[globalThis.__pointsGear,()=>{}];')
 .replace("'@/lib/planner'",JSON.stringify(plannerUrl)).replace("'@/lib/character-points'",JSON.stringify(pointsUrl))
 .replace("'./point-number'",JSON.stringify(numberUrl)).replace("import './leveling-guide.css';",'')
 .replace("import {queryArmory} from '@/lib/armory-client';",'const queryArmory=()=>{throw Error("Unexpected network call")};')
 .replace("import {useLocale} from './locale';",'const useLocale=()=>({t:s=>s});');
const {default:CharacterPoints}=await import(url(jsx(source)));
const catalog=JSON.parse(readFileSync('lib/data/catalogs/templar.json','utf8'));
const fixture=JSON.parse(readFileSync('tests/fixtures/templar-points-lv39.json','utf8'));
const initial={...planner.emptyPlan(catalog),level:39,character:fixture.character};
function flatten(el){if(el==null||typeof el==='boolean')return [];if(Array.isArray(el))return el.flatMap(flatten);return [el,...(typeof el==='object'?flatten(typeof el.type==='function'?el.type(el.props):el.props?.children):[])];}
function render(plan,bonus=null){globalThis.__pointsGear={source:plan.character,bonus};let next=plan;const tree=CharacterPoints({catalog,plan,points:planner.pointLimits(catalog,plan),onChange:patch=>{next=planner.updatePlan(catalog,plan,patch)}});const els=flatten(tree),inputs=els.filter(x=>x?.type==='input');return {els,inputs,change:(label,value)=>{inputs.find(x=>x.props['aria-label']===label).props.onChange({target:{value}});return next;}};}
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
