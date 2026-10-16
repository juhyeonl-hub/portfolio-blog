import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl,plannerUrl,classesUrl,planner} from './modules.mjs';
const memory=moduleUrl(readFileSync('lib/plan-memory.ts','utf8'));
const shareUrl=moduleUrl(readFileSync('lib/build-share.ts','utf8').replace("'./plan-memory'",JSON.stringify(memory)).replace("'./planner'",JSON.stringify(plannerUrl)).replace("'./classes'",JSON.stringify(classesUrl)));
const {publicBuild}=await import(shareUrl);
const {parseListing,parsePublicBuild,buildId}=await import(moduleUrl(readFileSync('lib/public-builds.ts','utf8').replace("'./classes'",JSON.stringify(classesUrl)).replace("'./build-share'",JSON.stringify(shareUrl))));
const catalog=JSON.parse(readFileSync('lib/data/catalogs/assassin.json','utf8'));
const row={id:'11111111-1111-1111-1111-111111111111',title:'Example',description:'Text',classKey:'assassin',catalogVersion:'2.0.7.0',published:true,revision:0,updatedAt:'2026-10-16T00:00:00Z'};
const listing={items:[row],page:0,totalElements:1,totalPages:1};
assert.deepEqual(parseListing(listing),listing);
const detail={...row,shared:publicBuild(catalog,planner.emptyPlan(catalog))};
assert.deepEqual(parsePublicBuild(detail,row.id),detail);
for(const mutate of [v=>v.items[0].published=false,v=>v.items[0].id='bad',v=>v.items[0].revision=-1,v=>v.items[0].classKey='bad',v=>v.items[0].updatedAt='bad',v=>v.items[0].title='x'.repeat(81),v=>v.items.push(v.items[0]),v=>v.totalPages=2,v=>v.page=-1,v=>v.items=Array(21).fill(row)]){const bad=structuredClone(listing);mutate(bad);assert.throws(()=>parseListing(bad));}
assert.throws(()=>parsePublicBuild({...detail,published:false},row.id));
assert.throws(()=>parsePublicBuild({...detail,id:'22222222-2222-2222-2222-222222222222'},row.id));
assert.throws(()=>parsePublicBuild({...detail,shared:{schema:'invalid'}},row.id));
assert.equal(buildId('../path'),false);
console.log('Public builds: list/detail validation, draft exclusion, IDs, metadata, pagination, duplicate/oversized lists and private payload rejection PASS');
