import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {classes,localModuleUrl} from './modules.mjs';
const layoutUrl=localModuleUrl('macro-layout');const {macroLayout,QUICK_KEYS}=await import(layoutUrl);
const guidanceUrl=localModuleUrl('manual-skill-guidance');
const {holdAdvice,HOLD_SKILL_GROUPS,CLASS_MACRO_ADVICE,ASSASSIN_CONDITIONAL_FLOW}=await import(guidanceUrl);
const source=readFileSync('app/manual-skill-guide.tsx','utf8')
 .replace("'../lib/macro-layout'",JSON.stringify(layoutUrl))
 .replace("'../lib/manual-skill-guidance'",JSON.stringify(guidanceUrl))
 .replace("import purposes from '../lib/data/manual-skill-purpose.json';",'const purposes='+readFileSync('lib/data/manual-skill-purpose.json','utf8')+';')
 .replace("import {useLocale} from './locale';",'const useLocale=()=>({t:(s,args=[])=>s.replace(/\\{(\\d+)\\}/g,(_,i)=>args[i]),skill:s=>s});');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replaceAll('"react/jsx-runtime"',JSON.stringify(import.meta.resolve('react/jsx-runtime')));
const {default:Guide}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
function flatten(el){if(el==null||typeof el==='boolean')return [];if(Array.isArray(el))return el.flatMap(flatten);return [el,...(typeof el==='object'?flatten(el.props?.children):[])];}
function render(profile,catalog,context,extra=false){const layout=macroLayout(profile,new Set(catalog.skills.map(s=>s.id)),context,extra);const manualSlots=new Map(layout.manual.map((id,i)=>[(Math.floor(i/layout.manualKeys.length)*QUICK_KEYS.length)+QUICK_KEYS.indexOf(layout.manualKeys[i%layout.manualKeys.length]),id]));return {layout,els:flatten(Guide({profile,catalog,manualSlots,columns:layout.columns,fixedId:layout.fixedId,context}))};}
let scenarios=0;
for(const original of classes.CLASSES)for(const preset of ['group','single','farm']){
 const profile=classes.recommendationProfile(original.key,{level:45,mode:'pve',pvePreset:preset});
 const before=JSON.stringify(profile);
 const catalog=JSON.parse(readFileSync(`lib/data/catalogs/${profile.key}.json`));
 for(const context of ['pve','pvp','leveling'])for(const extra of [false,true]){
  scenarios++;
  const {layout,els}=render(profile,catalog,context,extra);const cards=els.filter(e=>e?.props?.className==='manual-usage-card');
  assert.equal(cards.length,layout.manual.length);
  assert(!els.some(e=>e?.type==='input'||e?.type==='button'),'comparison is advisory, not an unverified macro switch');
  assert.equal(els.some(e=>e?.props?.className==='manual-use-flow'),context==='pve'&&profile.rotation.length>0);
  assert(els.some(e=>typeof e==='string'&&e.includes('모든 스킬을 넣는 배치는 검증되지 않았습니다.')));
  assert.equal(els.some(e=>e?.props?.className==='manual-use-flow manual-conditional-flow'),context==='pve'&&profile.key==='assassin'&&!profile.rotation.length);
  assert(CLASS_MACRO_ADVICE[profile.key]);assert(els.includes(CLASS_MACRO_ADVICE[profile.key]));
  for(const card of cards){const flat=flatten(card);assert(flat.some(e=>e?.type==='img'));assert(flat.some(e=>e?.type==='kbd'));
   for(const label of ['사용 시점','사용 순서','아껴야 할 때'])assert(flat.includes(label));
   assert(holdAdvice(card.key),`missing hold: ${profile.key}/${card.key}`);assert(flat.includes(holdAdvice(card.key)));
  }
  assert.equal(JSON.stringify(profile),before,'guidance must not change presets');
 }
}
const ranger=classes.classProfile('ranger'),catalog=JSON.parse(readFileSync('lib/data/catalogs/ranger.json'));
const {els}=render(ranger,catalog,'pve');
const card=id=>els.find(e=>e?.props?.className==='manual-usage-card'&&e.key===id);
assert(flatten(card('14090000')).includes('1'));assert(flatten(card('14220000')).includes('Q'));assert(flatten(card('14380000')).includes('E'));
assert(flatten(card('14010000')).includes('회피가 급하면 충전보다 생존을 우선하세요.'));
assert(flatten(card('14260000')).includes('상황이 생겼을 때'));
console.log('PASS manual usage guide:8classes,3purposes,optional Assassin skill,icon/key mapping,conditional flow and advisory comparison');

const assassin=classes.classProfile('assassin'),assassinCatalog=JSON.parse(readFileSync('lib/data/catalogs/assassin.json'));
const upper=render(assassin,assassinCatalog,'pve').els.find(e=>e?.props?.className==='manual-usage-card'&&e.key==='13100000');
const upperKey=flatten(upper).find(e=>e?.type==='kbd');assert.equal(upperKey.props.children,'?');assert.equal(upperKey.props['aria-label'],'별도 키 지정');

const purposes=JSON.parse(readFileSync('lib/data/manual-skill-purpose.json'));
const ids=Object.values(HOLD_SKILL_GROUPS).flat();assert.equal(ids.length,new Set(ids).size);
assert.deepEqual([...ids].sort(),Object.keys(purposes).sort());assert.equal(holdAdvice('unknown'),undefined);
assert(HOLD_SKILL_GROUPS.guard.includes('18240000'));assert(HOLD_SKILL_GROUPS.toggle.includes('16250000'));
const translations=JSON.parse(readFileSync('lib/data/ui-translations.json'));
for(const text of [...ids.map(holdAdvice),...Object.values(CLASS_MACRO_ADVICE),...ASSASSIN_CONDITIONAL_FLOW.flatMap(x=>[x.title,x.body]),'살성 · 조건별 사용 예시','조건별 사용 · {0}']) {
 for(const lang of ['en','ja','fi','fr','de','es','pt-BR','ru'])assert(translations[text]?.[lang],`missing ${lang}: ${text}`);
}
console.log(`PASS all-class guidance: ${scenarios} scenarios, ${ids.length} explicit conditions, 8 locale translations`);
