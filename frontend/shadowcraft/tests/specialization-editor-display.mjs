import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {planner,plannerUrl} from './modules.mjs';
const require=createRequire(import.meta.url),c=JSON.parse(readFileSync('lib/data/catalogs/templar.json'));
let source=readFileSync('app/skill-specialization-summary.tsx','utf8')
 .replace("'@/lib/planner'",JSON.stringify(plannerUrl))
 .replace("import {useLocale} from './locale';", "const useLocale=()=>({t:(key,values=[])=>key.replace(/\\{(\\d+)\\}/g,(_,i)=>String(values[Number(i)]??'')),skill:name=>name,specialization:source=>source});")
 .replace("import './skill-specialization-summary.css';",'');
source=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText
 .replace(/from ["']react\/jsx-runtime["']/g,'from '+JSON.stringify(pathToFileURL(require.resolve('react/jsx-runtime')).href));
const {default:View,SpecializationOptionLabel:Option}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const seed=planner.emptyPlan(c),first=c.skills[0];
const render=(skill,plan,level,expanded=false)=>renderToStaticMarkup(createElement(View,{skill,plan,level,expanded,onToggle(){}}));
const ids=html=>[...html.matchAll(/data-selected-spec="([^"]+)"/g)].map(m=>m[1]);
// Intentionally choose options2+3 rather than the recommended1+4, in reverse save order.
const manual={...seed,specs:{[first.id]:[first.specializations[2].id,first.specializations[1].id]}};
const before=JSON.stringify(manual),html=render(first,manual,14);
assert.deepEqual(ids(html),[first.specializations[1].id,first.specializations[2].id]);
assert(html.includes('특화 2')&&html.includes('특화 3')&&!html.includes('특화 4'));
assert(html.includes('내 계획의 특화 (2/2칸)'));
assert.equal(JSON.stringify(manual),before);
for(const level of [7,8,12,16,20]){
 const none=render(first,{...seed,specs:{[first.id]:[]}},level);
 assert(none.includes(level<8?'아직 특화 선택 칸이 열리지 않았습니다.':'선택한 특화 없음'));
 assert.deepEqual(ids(none),[],'empty saved choice must not be replaced by a recommendation');
 assert(none.includes('0/'+planner.slots(first,level)+'칸'));
}
const open=render(first,manual,14,true);assert(open.includes('aria-expanded="true"'));assert.deepEqual(ids(open),[]);
const passive=c.skills.find(s=>s.kind==='passive'&&!s.stigma);assert(render(passive,seed,10).includes('패시브는 별도 특화 선택 없이'));assert(!render(passive,seed,10).includes('<button'));
const stigma=c.skills.find(s=>s.stigma);
for(const level of [1,5,10,15,20]){
 const out=render(stigma,seed,level);assert(out.includes('레벨에 따라 자동 적용'));
 assert.deepEqual(ids(out),stigma.specializations.filter(sp=>sp.requiredParentLevel<=level).map(sp=>sp.id));assert(!out.includes('/0칸'));
}
const option=(overrides={})=>renderToStaticMarkup(createElement(Option,{option:first.specializations[0],number:1,selected:false,locked:false,recommended:false,automatic:false,...overrides}));
assert(option({selected:true,recommended:true}).includes('선택됨'));assert(option({selected:true,recommended:true}).includes('추천 특화'));
assert(option({locked:true,recommended:true}).includes('잠긴 특화'));assert(!option({locked:true,recommended:true}).includes('추천 특화'));
assert(option({selected:true,automatic:true,recommended:true}).includes('자동 적용 효과'));assert(!option({selected:true,automatic:true,recommended:true}).includes('추천 특화'));
assert(!html.includes('Infinity')&&!html.includes('NaN')&&!html.includes('undefined'));
console.log('PASS: saved manual choices and catalog numbering, no mutation/recommendation substitution, empty/locked thresholds, expanded state, passive/stigma automatic effects and option status labels.');
