import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
const source=readFileSync('lib/client-locales.ts','utf8'),api=await import(moduleUrl(source));
const {CLIENT_CULTURES,validClientLocale,resolveClientName,resolveClientStat,loadClientLocale}=api;
const packs=Object.fromEntries(Object.keys(CLIENT_CULTURES).map(l=>[l,JSON.parse(readFileSync('../public/shadowcraft/data/client-locales/'+l+'.json','utf8'))]));
for(const [locale,pack] of Object.entries(packs)){
 assert.ok(validClientLocale(pack,locale),locale+' committed pack validates');
 assert.ok(Object.keys(pack.items).length>9300); assert.equal(Object.keys(pack.skills).length,280);
 assert.equal(pack.textBuildId,'26262663');assert.equal(pack.buildId,'25926599');
 const value=resolveClientName(pack,packs.en,locale,'items',110430021,'unexpected');
 assert.equal(value.name,pack.items['110430021']);assert.equal(value.fallback,false);
 for(const skill of Object.values(pack.skills))for(const field of ['description','traits'])if(skill[field])assert.equal(skill[field].valueScope,'unresolved-client-values');
}
assert.equal(packs.ko.items['110430021'],'빛나는 건룡왕의 활');
assert.equal(packs.ko.items['110430037'],'분노한 크로메데의 장궁');
assert.equal(packs.en.items['110430037'],'Enraged Kromede Longbow');
assert.equal(resolveClientName(packs.ko,packs.en,'ja','items',110430021,'x').language,'en','stale locale must never leak');
assert.equal(resolveClientName(null,packs.en,'fi','items',110430021,'x').fallback,true);
assert.deepEqual(resolveClientName(packs.ko,packs.en,'ko','items',999999999999,'New official item'),{name:'New official item',language:null,fallback:true});
assert.equal(resolveClientName(packs.en,packs.en,'en','items',999999999999,'Original').fallback,false);
for(const mutate of [p=>p.locale='fr',p=>p.culture='xx',p=>Object.defineProperty(p.items,'__proto__',{value:'bad',enumerable:true}),p=>p.items['0']='x',p=>p.items['110430021']='x\u0000',p=>p.items['110430021']='<script>x</script>',p=>p.skills['1']={name:'x',description:{text:'{value}',unresolvedValues:0}},p=>p.textBuildId='unknown']){
 const p=JSON.parse(JSON.stringify(packs.ko));mutate(p);assert.equal(validClientLocale(p,'ko'),false);
}
let calls=0;globalThis.fetch=async url=>{calls++;const locale=url.split('/').at(-1).replace('.json','');return {ok:true,json:async()=>packs[locale]};};
await Promise.all([loadClientLocale('ko'),loadClientLocale('ko'),loadClientLocale('en')]);assert.equal(calls,2);
await loadClientLocale('ko');assert.equal(calls,2);await loadClientLocale('fi');assert.equal(calls,2,'unsupported locale does not fetch');
globalThis.fetch=async()=>{calls++;return {ok:false}};assert.equal(await loadClientLocale('ja'),null);
globalThis.fetch=async()=>({ok:true,json:async()=>packs.ko});assert.equal(await loadClientLocale('ja'),null,'wrong-language response rejected');
globalThis.fetch=async()=>({ok:true,json:async()=>packs.ja});assert.equal((await loadClientLocale('ja')).locale,'ja','failed requests retry');
console.log('PASS 8 official locale bundles; ID mapping, stale-locale isolation, Finnish/unknown fallback, validation, shared cache and retry');

for(const key of ['constructor','toString','__proto__'])assert.equal(resolveClientStat(packs.ko,key,'Unknown stat'),'Unknown stat');
const statKey=Object.keys(packs.ko.stats)[0];assert.equal(resolveClientStat(packs.ko,statKey,'fallback'),packs.ko.stats[statKey]);
