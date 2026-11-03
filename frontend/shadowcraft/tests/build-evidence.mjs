import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {classes,localModuleUrl} from './modules.mjs';
const {macroLayout,FIXED_LEFT}=await import(localModuleUrl('macro-layout'));
const {macroEvidence,GAME_CHECKS}=await import(localModuleUrl('macro-evidence'));
const {pveActivityGuides}=await import(localModuleUrl('pve-direction-text'));
let cells=0;
for(const original of classes.CLASSES){
 const catalog=JSON.parse(readFileSync(`lib/data/catalogs/${original.key}.json`));const known=new Set(catalog.skills.map(s=>s.id));
 assert.deepEqual(Object.keys(pveActivityGuides[original.key]).sort(),Object.keys(original.pvePresets).sort());
 assert.equal(new URL(original.pvePresetSource.url).pathname,`/ko/builds/${original.slug}/pve`);
 for(const preset of ['group','single','farm']){
  const profile=classes.recommendationProfile(original.key,{level:45,mode:'safe',pvePreset:preset});
  assert.deepEqual(profile.macroColumns,original.macroColumns,'shared-layout copy must follow preset data');
  const refs=[...Object.keys(profile.specPriority),...(profile.skillSteps||[]).flatMap(x=>x.skills),...(profile.stigmaSteps||[]).map(x=>x.skill),...(profile.macroColumns||[]).flatMap(x=>x.skills),...(pveActivityGuides[profile.key]?.[preset]?.ids||[])];
  for(const id of refs)assert(known.has(id),`${profile.key}/${preset}: unknown ${id}`);
  for(const extra of [false,true]){
   const layout=macroLayout(profile,known,'pve',extra);assert.equal(layout.fixedId,FIXED_LEFT[profile.key]);
   assert(!layout.manual.includes(layout.fixedId));assert(!layout.columns.some(x=>x.skills.includes(layout.fixedId)));
   assert.equal(new Set(layout.manual).size,layout.manual.length);
   assert(layout.columns.every(x=>x.skills.length<=4&&['5','6','7','8'].includes(x.key)));
   assert(layout.manual.length<=layout.manualKeys.length*4);
   const repeat=layout.columns.flatMap(x=>x.skills);assert.equal(new Set(repeat).size,repeat.length);
   for(const id of repeat)assert(!layout.manual.includes(id));
   for(const x of layout.steps.filter(x=>x.fixed))assert.equal(x.key,'LMB');
  }
  assert.equal(macroEvidence(profile.key,'pve').gameplay,'unverified');cells++;
  console.log(`PASS ${profile.key}/${preset}: references, fixed LMB, repeat/manual partition`);
 }
 for(const context of ['pvp','leveling'])assert.equal(macroEvidence(original.key,context).repeatOrigin,'derived');
}
assert.equal(macroEvidence('ranger','pve').fixedOrigin,'screen');assert.equal(macroEvidence('ranger','pve').repeatOrigin,'derived');
assert.equal(macroEvidence('templar','pve').repeatOrigin,'reference');assert.equal(macroEvidence('unknown','pve').checkedAt,undefined);assert.equal(macroEvidence('toString','pve').known,false);
const translations=JSON.parse(readFileSync('lib/data/ui-translations.json'));
for(const text of Object.values(GAME_CHECKS))for(const lang of ['en','ja','fi','fr','de','es','pt-BR','ru'])assert(translations[text]?.[lang]);
// Render evidence independent of the browser; assert screen evidence never certifies repeat/combat.
let source=readFileSync('app/build-evidence.tsx','utf8').replace("import './build-evidence.css';",'')
 .replace("'../lib/macro-evidence'",JSON.stringify(localModuleUrl('macro-evidence')))
 .replace("'../lib/pve-direction-text'",JSON.stringify(localModuleUrl('pve-direction-text')))
 .replace("import {useLocale} from './locale';","const useLocale=()=>({t:s=>s,locale:'ko'});");
let compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replaceAll('"react/jsx-runtime"',JSON.stringify(import.meta.resolve('react/jsx-runtime')));
const {default:Evidence}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
function flat(e){if(e==null||typeof e==='boolean')return [];if(Array.isArray(e))return e.flatMap(flat);return [e,...(typeof e==='object'?flat(e.props?.children):[])];}
for(const profile of classes.CLASSES)for(const context of ['pve','pvp','leveling'])for(const preset of ['group','single','farm']){
 const els=flat(Evidence({profile,context,preset,macro:true}));
 assert(els.includes('참고 배치 · 실전 검증 전'));assert(els.includes('실제 전투의 실행 순서·지연·피해량은 아직 확인하지 않았습니다.'));
 assert.equal(els.includes('궁성 제공 화면 · AION2 모드와 고정 좌클릭만 대조'),profile.key==='ranger');
 assert.equal(els.some(x=>x?.type==='a'&&x.props.href===profile.pvePresetSource.url),context==='pve');
 assert(!els.some(x=>x?.type==='input'||x?.type==='button'),'No self-certification toggle');
}
console.log(`PASS ${cells} preset cells,72 contextual evidence renders,unknown metadata,translations; no live-gameplay claim`);
