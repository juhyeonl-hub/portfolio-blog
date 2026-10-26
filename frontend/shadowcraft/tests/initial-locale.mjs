import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
const {initialLocale}=await import(moduleUrl(readFileSync('lib/initial-locale.ts','utf8')));
for(const saved of ['ko','en','ja','fi'])assert.equal(initialLocale(saved,['en-US']),saved);
for(const [languages,expected] of [[['en-US'],'en'],[['ko-KR'],'ko'],[['ja-JP'],'ja'],[['fi-FI'],'fi'],[['de-DE','en-GB'],'en'],[['zh-CN'],'en'],[[],'en'],[['KO_kr'],'ko'],[['ja-JP','en-US'],'ja']]){
 for(const saved of [undefined,null,'','invalid',{},42])assert.equal(initialLocale(saved,languages),expected);
}
console.log('PASS first-visit locale: saved choice wins, browser preference order, language variants, unsupported/absent fallback');
