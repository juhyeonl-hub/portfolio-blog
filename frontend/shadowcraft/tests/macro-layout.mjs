import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classes,localModuleUrl} from './modules.mjs';
const {macroLayout,FIXED_LEFT,QUICK_KEYS}=await import(localModuleUrl('macro-layout'));
for(const profile of classes.CLASSES){
 const catalog=JSON.parse(readFileSync(`lib/data/catalogs/${profile.key}.json`));
 const known=new Set(catalog.skills.map(s=>s.id));
 for(const context of ['pve','pvp','leveling'])for(const extra of [false,true]){
  const result=macroLayout(profile,known,context,extra);
  assert.equal(result.fixedId,FIXED_LEFT[profile.key]);
  assert(!result.manual.includes(result.fixedId));
  assert.deepEqual(result.manualKeys.slice(0,6),['1','2','3','4','Q','E']);
  assert(result.manualKeys.every(k=>!result.columns.some(c=>c.key===k)));
  assert(result.columns.every(c=>['5','6','7','8'].includes(c.key)));
  assert(result.columns.every(c=>!c.skills.includes(result.fixedId)&&c.key!=='LMB'));
  assert(result.columns.every((c,i)=>c.key===QUICK_KEYS[i+4]));
  assert(result.steps.every(s=>s.skills.every(id=>known.has(id))));
  assert(result.steps.filter(s=>s.fixed).every(s=>s.key==='LMB'&&s.skills.length===1&&s.skills[0]===result.fixedId));
 }
}
const ranger=classes.classProfile('ranger');
const known=new Set(JSON.parse(readFileSync('lib/data/catalogs/ranger.json')).skills.map(s=>s.id));
const result=macroLayout(ranger,known);
assert.deepEqual(result.steps.map(s=>s.key),['5','LMB','6']);
assert.equal(result.steps[1].skills[0],'14020000');
assert(!result.manual.includes('14020000'));
assert.equal(macroLayout(ranger,new Set()).steps.length,0);
const assassin=classes.classProfile('assassin');
const assassinIds=new Set(JSON.parse(readFileSync('lib/data/catalogs/assassin.json')).skills.map(s=>s.id));
assert.deepEqual(macroLayout(assassin,assassinIds).steps.map(s=>s.key),['5','LMB']);
assert(macroLayout(assassin,assassinIds,'pve',true).columns[0].skills.includes('13060000'));
console.log('PASS fixed-left exclusion, 8-class bindings, macro input order, missing catalog and assassin extra');
