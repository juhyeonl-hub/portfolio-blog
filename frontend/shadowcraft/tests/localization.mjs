import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
const {localizedValue}=await import(moduleUrl(readFileSync('lib/localization.ts','utf8')));
assert.equal(localizedValue(' 로그인 ',{'로그인':'Sign in'}),' Sign in ');
assert.equal(localizedValue('알 수 없는 원문',{}),'알 수 없는 원문');
assert.equal(localizedValue('스킬 {0}: {1}%',{'스킬 {0}: {1}%':'Skill {0}: {1}%'},['A',25]),'Skill A: 25%');
assert.equal(localizedValue('스킬 {0}: {1}%',{'스킬 {0}: {1}%':'Skill {0}%'},['A',25]),'스킬 A: 25%');
assert.equal(localizedValue('{0} 님',{'{0} 님':'Hello {0}'},['<script>']),'Hello <script>');
const value={name:'사용자가 입력한 이름'};assert.equal(localizedValue(value,{'사용자가 입력한 이름':'Other'}),value);
assert.equal(localizedValue(0,{}),0);assert.equal(localizedValue(null,{}),null);
const messages=JSON.parse(readFileSync('lib/data/ui-translations.json','utf8'));
for(const [source,translations] of Object.entries(messages))for(const locale of ['en','ja','fi','fr','de','es','pt-BR','ru'])assert.ok(typeof translations[locale]==='string'&&translations[locale].trim(),source+' '+locale);
console.log('Localization: fallback, whitespace, numeric placeholders, malformed translation rejection, non-string preservation and eight-language dictionary coverage PASS');

for(const key of ['constructor','toString','__proto__'])assert.equal(localizedValue(key,{}),key,'unknown dictionary keys must not read object prototype');

// Every manual translation must preserve the exact parameter multiset.
const parameters=text=>[...text.matchAll(/\{(\d+)\}/g)].map(m=>m[1]).sort();
for(const [source,translations] of Object.entries(messages))for(const locale of ['en','ja','fi','fr','de','es','pt-BR','ru']){
 assert.deepEqual(parameters(translations[locale]),parameters(source),source+' '+locale+' parameters');
 assert.ok(!translations[locale].includes('{t('),source+' must not contain source code');
}
// Generated boss states remain source-language values in lib; renderers translate them.
const {bossDisplay}=await import(moduleUrl(readFileSync('lib/boss-timers.ts','utf8')));
const now=1000000;
const feed={enabled:true,refreshFailed:false,fetchedAt:now,bosses:{gartua:{state:'up',reportedAt:now,confirmed:true,nextSpawn:0}}};
const states=[bossDisplay(null,'gartua',now,false),bossDisplay(null,'gartua',now,true),bossDisplay({...feed,enabled:false},'gartua',now,false),bossDisplay(feed,'lagta',now,false)];
for(const confirmed of [true,false])for(const failed of [true,false])for(const state of ['up','dead'])for(const nextSpawn of [0,now-1,now+1]){
 states.push(bossDisplay({...feed,bosses:{gartua:{...feed.bosses.gartua,confirmed,state,nextSpawn}}},'gartua',now,failed));
}
for(const state of states)for(const key of [state.text,state.note])if(key)for(const locale of ['en','ja','fi','fr','de','es','pt-BR','ru']){
 assert.ok(Object.hasOwn(messages,key),key);
 assert.notEqual(messages[key][locale],key,key+' '+locale);
 if(key.includes('A2Tools'))assert.ok(messages[key][locale].includes('A2Tools'),'External observation source name must remain A2Tools');
}
console.log('Localization: exact dictionary parameters, source-code rejection and generated boss state coverage PASS');

// Ensure the newly connected screens do not leave static Korean JSX or broken
// literal t() keys behind. Dynamic source data/user names remain outside t().
const {default:ts}=await import('typescript');
const {readdirSync}=await import('node:fs');
const screens=readdirSync('app').filter(f=>f.endsWith('.tsx')).map(f=>f.slice(0,-4));
assert.ok(screens.length>=27 /* app/*.tsx screens after the crafting/live-DPS removal (2026-10-20) */);
for(const name of screens){
 const source=readFileSync('app/'+name+'.tsx','utf8');
 const ast=ts.createSourceFile(name+'.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 function visit(node){
  if(ts.isJsxText(node))assert.ok(!/[가-힣]/.test(node.text),name+' untranslated JSX: '+node.text);
  if(ts.isJsxAttribute(node)&&node.initializer&&ts.isStringLiteral(node.initializer))assert.ok(!/[가-힣]/.test(node.initializer.text),name+' untranslated attribute: '+node.initializer.text);
  if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&node.expression.text==='t'&&node.arguments[0]&&ts.isStringLiteral(node.arguments[0])){
   const key=node.arguments[0].text;
   assert.ok(!key.includes('{t('),name+' translation key contains code');
   if(/[가-힣]/.test(key))assert.ok(Object.hasOwn(messages,key),name+' missing manual translation: '+key);
  }
  ts.forEachChild(node,visit);
 }
 visit(ast);
}
console.log(`Localization: all ${screens.length} screens have translated static JSX/attributes and valid literal keys PASS`);

// New privacy translations retain the same sections/paragraphs and public contact.
const {PRIVACY}=await import(moduleUrl(readFileSync('lib/privacy-policy.ts','utf8').replace("import translatedPrivacy from './data/privacy-translations.json';",'const translatedPrivacy='+readFileSync('lib/data/privacy-translations.json','utf8')+';')));
for(const locale of ['fr','de','es','pt-BR','ru']){
 const policy=PRIVACY[locale];assert.ok(policy.title&&policy.updated);assert.equal(policy.sections.length,PRIVACY.en.sections.length);
 policy.sections.forEach((section,i)=>{assert.ok(section.heading);assert.equal(section.paragraphs.length,PRIVACY.en.sections[i].paragraphs.length);for(const text of section.paragraphs)assert.ok(text.trim());});
 assert.ok(JSON.stringify(policy).includes('contact@asbc.app'));assert.ok(!/ZXQ|QQP/.test(JSON.stringify(policy)));
}
console.log('Privacy: five additional policies retain section structure and contact PASS');
