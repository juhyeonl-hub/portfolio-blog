import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl,classesUrl} from './modules.mjs';
const {authorHref,characterHref,readPeopleRoute,parseAuthors,checkedCharacter,observedBoards}=await import(moduleUrl(readFileSync('lib/people.ts','utf8').replace("'./classes'",JSON.stringify(classesUrl))));
const id='11111111-1111-1111-1111-111111111111',target={region:'eu',classKey:'templar',server:'2201',id:'abc+/=%&한글'};
assert.deepEqual(readPeopleRoute(characterHref(target)).target,target);
assert.equal(readPeopleRoute(authorHref(id)).author,id);
assert.equal(readPeopleRoute('#/people?kind=author&author=../private').invalid,true);
for(const change of [{region:'kr'},{classKey:'bad'},{server:'../../1'},{id:'a'}])assert.equal(readPeopleRoute(characterHref({...target,...change})).invalid,true);
const listing={items:[{id,name:'Visible Author',builds:2}],page:0,totalElements:1,totalPages:1};assert.deepEqual(parseAuthors(listing),listing);
for(const change of [v=>v.items[0].builds=0,v=>v.items[0].id='bad',v=>v.items[0].name='',v=>v.items.push(v.items[0]),v=>v.page=-1,v=>v.totalPages=2]){const v=structuredClone(listing);change(v);assert.throws(()=>parseAuthors(v));}
const actual={region:'eu',classKey:'templar',profile:{characterId:target.id,serverId:2201,characterName:'GreenOrc'},importedAt:'2026-10-26T03:00:00Z'};
assert.equal(checkedCharacter(actual,target),actual);
for(const change of [{region:'nae'},{classKey:'ranger'},{profile:{...actual.profile,serverId:2202}},{profile:{...actual.profile,characterId:'other'}},{importedAt:'bad'}])assert.throws(()=>checkedCharacter({...actual,...change},target));
console.log('People: author validation, direct-link encoding/roundtrip, invalid targets and wrong profile identity rejection PASS');

const catalog={boards:[{id:'1',nodes:[{id:'n1'}]},{id:'2',nodes:[{id:'n2'}]}]};
const observed={boards:[{id:1,open:1},{id:2,open:0}],nodes:['n1'],failedBoards:[]};
assert.deepEqual(observedBoards(catalog,observed).boards,[catalog.boards[0]]);
assert.equal(observedBoards(catalog,{...observed,failedBoards:['2']}),null);
assert.equal(observedBoards(catalog,{...observed,nodes:['n2']}),null);
assert.equal(observedBoards(catalog,{...observed,nodes:[42]}),null);
assert.equal(observedBoards(catalog,{...observed,boards:undefined}),null);
assert.deepEqual(observedBoards(catalog,{boards:[],nodes:[],failedBoards:[]}).boards,[]);
console.log('Observed boards: locked boards excluded, missing/failed/unknown nodes stay unknown PASS');
