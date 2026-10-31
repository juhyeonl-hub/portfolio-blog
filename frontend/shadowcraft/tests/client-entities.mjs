import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {localModuleUrl} from './modules.mjs';
const api=await import(localModuleUrl('client-entities'));
const {validClientEntities,resolveEntityName,entitySearchText,loadClientEntities}=api;
const locales=['ko','en','ja','fr','de','es','pt-BR','ru'];
const packs=Object.fromEntries(locales.map(l=>[l,JSON.parse(readFileSync('../public/shadowcraft/data/client-entities/'+l+'.json','utf8'))]));
const indexes={npcs:JSON.parse(readFileSync('../public/shadowcraft/data/npc-index.json')),journal:JSON.parse(readFileSync('../public/shadowcraft/data/journal-index.json'))};
for(const [locale,pack] of Object.entries(packs)){
 assert(validClientEntities(pack,locale),locale+' valid');
 assert.equal(pack.buildId,'25926599');assert.equal(pack.textBuildId,'26262663');
 for(const kind of ['npcs','quests','dungeons','pets']){
  const ids=new Set((kind==='npcs'?indexes.npcs.npcs:indexes.journal[kind]).map(row=>row.id));
  for(const id of Object.keys(pack[kind]))assert(ids.has(id),kind+'/'+id+' indexed');
  const id=Object.keys(pack[kind])[0];assert.equal(resolveEntityName(pack,packs.en,locale,kind,id,'missing',pack.buildId).name,pack[kind][id].name);
 }
}
const id=Object.keys(packs.ko.quests).find(id=>packs.ko.quests[id].name!==packs.en.quests[id].name);
assert(entitySearchText([packs.en,packs.ko],'quests',id,'').includes(packs.ko.quests[id].name.toLowerCase()));
assert.equal(resolveEntityName(packs.ko,packs.en,'ja','quests',id,'x').language,'en');
assert.equal(resolveEntityName(null,packs.en,'fi','quests',id,'x').fallback,true);
assert.equal(resolveEntityName(packs.ko,packs.en,'ko','quests',id,'new','999999').name,'new');
assert.equal(resolveEntityName(packs.ko,packs.en,'ko','npcs','constructor','missing').name,'missing');
for(const change of [p=>p.locale='en',p=>p.textBuildId='oops',p=>p.quests[id].name='<script>',p=>p.quests[id].summary='{value}',p=>p.npcs={},p=>Object.defineProperty(p.quests,'__proto__',{value:{name:'bad'},enumerable:true})]){
 const p=structuredClone(packs.ko);change(p);assert.equal(validClientEntities(p,'ko'),false);
}
let calls=0;globalThis.fetch=async url=>{calls++;const locale=url.split('/').at(-1).replace('.json','');return{ok:true,text:async()=>JSON.stringify(packs[locale])};};
await Promise.all([loadClientEntities('ko'),loadClientEntities('ko'),loadClientEntities('en')]);assert.equal(calls,2);
await loadClientEntities('ko');await loadClientEntities('fi');assert.equal(calls,2);
globalThis.fetch=async()=>({ok:false});assert.equal(await loadClientEntities('ja'),null);
globalThis.fetch=async()=>({ok:true,text:async()=>JSON.stringify(packs.ko)});assert.equal(await loadClientEntities('ja'),null);
globalThis.fetch=async()=>({ok:true,text:async()=>JSON.stringify(packs.ja)});assert.equal((await loadClientEntities('ja')).locale,'ja');
console.log('PASS 8 entity locales, stable IDs, mixed-language search, stale language/build isolation, fallback, validation, deduplication and retry');
