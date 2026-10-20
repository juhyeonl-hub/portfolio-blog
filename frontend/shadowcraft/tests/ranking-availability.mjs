import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
const {validRankingAvailability,loadRankingAvailability,rankingAvailabilityText,RANKING_AVAILABILITY_URL}=await import(moduleUrl(readFileSync('lib/ranking-availability.ts','utf8')));
const messages=JSON.parse(readFileSync('lib/data/ui-translations.json','utf8'));

const closed={checkedAt:'2026-10-20T03:00:00Z',published:{abyss:false,arenaOfSolitude:false,arenaOfCooperation:false},failed:false};
assert.ok(validRankingAvailability(closed));
assert.ok(validRankingAvailability({...closed,checkedAt:null,failed:true}));
for(const bad of [null,'x',{...closed,checkedAt:'yesterday'},{...closed,published:{abyss:false}},{...closed,published:{...closed.published,abyss:'yes'}},{...closed,failed:'no'},{...closed,published:null}])assert.equal(validRankingAvailability(bad),false,JSON.stringify(bad));

// Every sentence the screen can show has dictionary entries with matching placeholders, and kind names are translated.
const t=s=>messages[s]?.en??s;
const cases=[[undefined],[null],[closed],[{...closed,checkedAt:null,failed:true}],[{...closed,published:{...closed.published,abyss:true,arenaOfSolitude:true}}]];
for(const [value] of cases){
 const note=rankingAvailabilityText(value,t);
 assert.ok(messages[note.text],'dictionary entry: '+note.text);
 assert.equal((note.text.match(/\{\d\}/g)||[]).length,note.values.length,note.text);
}
assert.deepEqual(rankingAvailabilityText(closed,t).values,['2026-10-20']);
const open=rankingAvailabilityText({...closed,published:{...closed.published,abyss:true,arenaOfSolitude:true}},t);
assert.deepEqual(open.values,['Abyss·Arena of Solitude','2026-10-20']);
assert.ok(rankingAvailabilityText(null,t).text.includes('확인하지 못했습니다'));
assert.ok(rankingAvailabilityText({...closed,checkedAt:null,failed:true},t).text.includes('아직 확인하지'));

// Loader: bad status, invalid body and network errors give null; a valid body is returned as is.
let mode='bad';
const fetchImpl=async url=>{assert.equal(url,RANKING_AVAILABILITY_URL);if(mode==='throw')throw new Error('net');return {ok:mode!=='bad',json:async()=>mode==='invalid'?{nope:1}:closed};};
assert.equal(await loadRankingAvailability(fetchImpl),null);
mode='invalid';assert.equal(await loadRankingAvailability(fetchImpl),null);
mode='throw';assert.equal(await loadRankingAvailability(fetchImpl),null);
mode='ok';assert.deepEqual(await loadRankingAvailability(fetchImpl),closed);
console.log('Ranking availability: validation, translatable notes with placeholders, loader failure handling PASS');
