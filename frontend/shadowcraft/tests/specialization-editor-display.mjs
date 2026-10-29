import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
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
const {default:View,SpecializationOptionLabel:Option,specializationDifference:diff}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const seed=planner.emptyPlan(c),first=c.skills[0];
const render=(skill,plan,level,expanded=false)=>renderToStaticMarkup(createElement(View,{skill,plan,level,expanded,onToggle(){}}));
const ids=html=>[...html.matchAll(/data-selected-spec="([^"]+)"/g)].map(m=>m[1]);
// Intentionally choose options2+3 rather than the recommended1+4, in reverse save order.
const manual={...seed,specs:{[first.id]:[first.specializations[2].id,first.specializations[1].id]}};
const before=JSON.stringify(manual),html=render(first,manual,14);
assert.deepEqual(ids(html),[first.specializations[1].id,first.specializations[2].id]);
assert(html.includes('특화 2')&&html.includes('특화 3'));
assert(html.includes('내 선택 특화 2 · 특화 3 → 추천 특화 1 · 특화 4'));
assert(html.includes('추천을 따르려면: 특화 2 · 특화 3 해제 → 특화 1 · 특화 4 선택'));
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

assert.deepEqual(diff(first,manual,14),{current:[2,3],recommended:[1,4],remove:[2,3],add:[1,4],different:true});
assert.equal(diff(first,manual,7).different,false);
assert.equal(diff(passive,manual,20).different,false);
assert.equal(diff(stigma,manual,20).different,false);
assert.equal(diff({...first,specializations:[]},manual,20).different,false);
assert(!diff(first,{...seed,specs:{[first.id]:[first.specializations[3].id]}},8).remove.includes(4),'locked choices must not be listed for removal');
assert(!render(first,manual,7).includes('추천과 다른 선택'));
assert(!render(stigma,manual,20).includes('추천과 다른 선택'));
assert(render(first,{...seed,specs:{}},14).includes('추천을 따르려면: 특화 1 · 특화 4 선택'));
const surplus={...seed,specs:{[first.id]:first.specializations.slice(0,4).map(sp=>sp.id)}};
assert(render(first,surplus,14).includes('추천을 따르려면: 특화 2 · 특화 3 해제'));
let cases=0;
for(const file of readdirSync('lib/data/catalogs').filter(f=>f.endsWith('.json'))){
 const cat=JSON.parse(readFileSync('lib/data/catalogs/'+file));
 for(const mode of ['safe','damage','pvp'])for(const level of [1,7,8,11,12,14,16,20])for(const skill of cat.skills){
  const rec=planner.recommendSpecs(skill,level,mode),plan={...planner.emptyPlan(cat),mode,specs:{[skill.id]:[...rec].reverse()}};
  const before=JSON.stringify(plan);assert.equal(diff(skill,plan,level).different,false,'same set must match independent of order');assert.equal(JSON.stringify(plan),before);
  const changed={...plan,specs:{[skill.id]:[]}},d=diff(skill,changed,level);
  const eligible=!skill.stigma&&skill.kind!=='passive'&&planner.slots(skill,level)>0&&rec.length>0;
  assert.equal(d.different,eligible);assert.equal(d.remove.length,0);cases++;
 }
}
console.log('PASS: pure specialization differences, add/remove/mixed instructions, locked/automatic/no-recommendation exclusion, all catalog/mode/level combinations:',cases);
