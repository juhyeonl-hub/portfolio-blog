import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
const {parseBossFeed,bossDisplay}=await import(moduleUrl(readFileSync('lib/boss-timers.ts','utf8')));
const now=1792206000000;
const b={id:101021,state:'dead',reportedAt:now,nextSpawn:now+60000,upSince:0,confirmed:true};
const feed={server:1301,region:'eu',serverNow:now,fetchedAt:now,enabled:true,refreshFailed:false,bosses:{gartua:b}};
assert.equal(parseBossFeed(feed,'eu','1301'),feed);
assert.throws(()=>parseBossFeed(feed,'eu','2301'));
assert.throws(()=>parseBossFeed({...feed,bosses:{gartua:{...b,reportedAt:NaN}}},'eu','1301'));
assert.equal(bossDisplay(feed,'gartua',now,false).target,now+60000);
assert.equal(bossDisplay(feed,'gartua',now+60000,false).text,'출현 예정 시각 경과');
assert.match(bossDisplay(feed,'gartua',now,true).note,/갱신 지연/);
assert.match(bossDisplay({...feed,bosses:{gartua:{...b,state:'up'}}},'gartua',now+700000,false).text,/확인 필요/);
assert.equal(bossDisplay(feed,'lagta',now,false).text,'관측 기록 없음');
assert.equal(bossDisplay(null,'gartua',now,true).text,'조회 실패');
console.log('Boss timers: server isolation, malformed input, observation age, failures and elapsed spawn PASS');

const all={...feed,allBosses:{'101001':{...b,id:101001},'2001':{...b,id:2001},'99999':{...b,id:99999}}};
assert.equal(parseBossFeed(all,'eu','1301'),all);
assert.equal(bossDisplay(all,'101001',now,false).target,now+60000);
assert.equal(bossDisplay(feed,'101021',now,false).target,now+60000); // old API fallback
for(const allBosses of [null,[],{'01':b},{'101001':b},{'2001':{...b,id:2001,reportedAt:now+400000}}])assert.throws(()=>parseBossFeed({...feed,allBosses},'eu','1301'));
console.log('Full boss feed: arbitrary IDs, malformed keys, identity validation, old API fallback PASS');
