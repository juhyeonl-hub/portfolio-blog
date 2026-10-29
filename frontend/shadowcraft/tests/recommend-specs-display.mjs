import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {planner,plannerUrl,recommendBuild} from './modules.mjs';
const require=createRequire(import.meta.url);
const c=JSON.parse(readFileSync('lib/data/catalogs/templar.json'));
let source=readFileSync('app/allocation-specializations.tsx','utf8')
 .replace("'@/lib/planner'",JSON.stringify(plannerUrl))
 .replace("import {useLocale} from './locale';", "const useLocale=()=>({t:(key,values=[])=>key.replace(/\\{(\\d+)\\}/g,(_,i)=>String(values[Number(i)]??'')),skill:name=>name,specialization:source=>source});")
 .replace("import './allocation-specializations.css';",'');
source=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText
 .replace(/from ["']react\/jsx-runtime["']/g,'from '+JSON.stringify(pathToFileURL(require.resolve('react/jsx-runtime')).href));
const {default:View}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const render=plan=>renderToStaticMarkup(createElement(View,{catalog:c,plan}));
const row=(html,id)=>html.match(new RegExp('<article[^>]*data-skill-id="'+id+'"[\\s\\S]*?</article>'))?.[0]||'';
const ids=html=>[...html.matchAll(/data-spec-id="([^"]+)"/g)].map(m=>m[1]);
const seed={...planner.emptyPlan(c),ascensionGrade3Confirmed:true,pointBudget:{sp:383,stigma:30,crystal:316,battle:0}};
const candidate=recommendBuild(c,seed),original=JSON.stringify(candidate),html=render(candidate);
assert.equal(JSON.stringify(candidate),original,'render must not alter candidate');
for(const s of c.skills.filter(s=>candidate.base[s.id]>0&&(!s.stigma||planner.equipped(candidate).includes(s.id)))){
 const expected=s.stigma?s.specializations.filter(sp=>sp.requiredParentLevel<=planner.finalLevel(c,candidate,s)).map(sp=>sp.id):s.specializations.filter(sp=>candidate.specs[s.id].includes(sp.id)).map(sp=>sp.id);
 assert.deepEqual(ids(row(html,s.id)),expected,s.name+' displayed selections differ from applied candidate');
}
const first=c.skills[0];
for(const level of [7,8,12,16,20]){
 const p={...seed,nodes:[],base:{[first.id]:1},bonus:{[first.id]:level-1},specs:{[first.id]:planner.recommendSpecs(first,level,seed.mode)}};
 const r=row(render(p),first.id);
 assert.deepEqual(ids(r),first.specializations.filter(sp=>p.specs[first.id].includes(sp.id)).map(sp=>sp.id));
 const next=[8,12,20].find(n=>n>level);
 if(next)assert(r.includes('다음 특화 칸: 최종 Lv.'+next));else assert(!r.includes('다음 특화 칸:'));
 if(level===7)assert(r.includes('아직 특화 선택 칸이 열리지 않았습니다.'));
 if(level===12)assert(r.includes('최종 Lv.16에 새 효과 개방'));
}
const noChoice={...seed,nodes:[],base:{[first.id]:10},specs:{[first.id]:[]}};
assert(row(render(noChoice),first.id).includes('이 추천에는 선택된 특화가 없습니다.'));
const passive=c.skills.find(s=>s.kind==='passive'&&!s.stigma);
assert(row(render({...seed,base:{[passive.id]:1}}),passive.id).includes('패시브는 별도 특화 선택 없이'));
const stigma=c.skills.find(s=>s.stigma);
for(const level of [1,5,10]){
 const r=row(render({...seed,nodes:[],base:{[stigma.id]:level},stigmaSkills:[stigma.id],specs:{[stigma.id]:[]}}),stigma.id);
 assert(r.includes('레벨에 따라 자동 적용'));
 assert.deepEqual(ids(r),stigma.specializations.filter(sp=>sp.requiredParentLevel<=level).map(sp=>sp.id));
 if(level===1)assert(r.includes('아직 자동 적용 효과가 없습니다.'));
}
assert(!html.includes('Infinity')&&!html.includes('NaN')&&!html.includes('undefined'));
console.log('PASS: actual rendered candidate choices, catalog order, thresholds 7/8/12/16/20, empty choices, passive/stigma, immutable render.');
