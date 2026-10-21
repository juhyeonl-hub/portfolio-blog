import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
const {pinnedTimers,parseTimes,parseSettings,emptySettings,emptyServer,nextOccurrence,countdown,scheduleMinutes,nextContentOccurrence,nextZonedOccurrence,nextTimerOccurrence}=await import(moduleUrl(readFileSync('lib/event-timers.ts','utf8')));
assert.deepEqual(parseTimes('21:00, 09:00 09:00'),[540,1260]);
for(const x of ['24:00','12:60','9:00','12:00oops'])assert.throws(()=>parseTimes(x));
const now=Date.parse('2026-10-17T23:59:59Z');
assert.equal(nextOccurrence(now,[0],0),Date.parse('2026-10-18T00:00:00Z'));
assert.equal(nextOccurrence(Date.parse('2026-10-17T00:00:00.500Z'),[0],0),Date.parse('2026-10-17T00:00:00Z'));
assert.equal(nextOccurrence(Date.parse('2026-10-17T00:00:01Z'),[0],0),Date.parse('2026-10-18T00:00:00Z'));
assert.equal(nextOccurrence(Date.parse('2026-10-17T20:00:00Z'),[0],330),Date.parse('2026-10-18T18:30:00Z'));
assert.equal(nextOccurrence(now,[0],null),null);
assert.equal(nextOccurrence(now,[],0),null);
assert.equal(countdown(now+1000,now),'00:00:01');
assert.equal(countdown(now-1000,now),'00:00:00');
assert.equal(scheduleMinutes('shugo',emptyServer()).length,24);
assert.deepEqual(scheduleMinutes('gartua',emptyServer()),[]);
assert.deepEqual(scheduleMinutes('dimension',{...emptyServer(),dimension:'rift'}),[120,300,480,660,840,1020,1200,1380]);
assert.deepEqual(scheduleMinutes('shugo',{...emptyServer(),times:{shugo:''}}),[]);
const settings={...emptySettings(),server:'1301',profiles:{'eu:1301':{...emptyServer(),offset:0,times:{gartua:'09:00'}}}};
assert.deepEqual(parseSettings(JSON.stringify(settings)),settings);
for(const profile of [{offset:9999},{hidden:['fake']},{times:{gartua:'25:00'}},{dimension:'fake'},{times:[]}])assert.throws(()=>parseSettings(JSON.stringify({...settings,profiles:{'eu:1301':{...emptyServer(),...profile}}})));
console.log('Timers: midnight/second/offset boundaries, missing schedules, defaults, validation and settings roundtrip PASS');

assert.equal(nextZonedOccurrence(Date.parse('2026-01-01T00:00:00Z'),[9*60],'Asia/Seoul'),Date.parse('2026-01-01T00:00:00Z'));
assert.equal(nextZonedOccurrence(Date.parse('2026-01-01T00:00:01Z'),[9*60],'Asia/Seoul'),Date.parse('2026-01-02T00:00:00Z'));
assert.equal(nextZonedOccurrence(Date.parse('2026-01-01T00:00:00Z'),[12*60],'Europe/Helsinki'),Date.parse('2026-01-01T10:00:00Z'));
assert.equal(nextZonedOccurrence(Date.parse('2026-07-01T00:00:00Z'),[12*60],'Europe/Helsinki'),Date.parse('2026-07-01T09:00:00Z'));
assert.equal(nextZonedOccurrence(Date.parse('2026-03-28T23:00:00Z'),[3*60+30],'Europe/Helsinki'),Date.parse('2026-03-30T00:30:00Z'));
assert.equal(nextZonedOccurrence(Date.parse('2026-10-25T00:31:00Z'),[3*60+30],'Europe/Helsinki'),Date.parse('2026-10-25T01:30:00Z'));
assert.equal(nextZonedOccurrence(Date.parse('2026-10-24T23:00:00Z'),[3*60+30],'Europe/Helsinki'),Date.parse('2026-10-25T00:30:00Z'));
assert.equal(nextZonedOccurrence(now,[0],'invalid'),null);
assert.equal(nextTimerOccurrence(now,[0],{...emptyServer(),offset:0}),nextOccurrence(now,[0],0));
assert.equal(parseSettings(JSON.stringify({...settings,profiles:{'eu:1301':{...emptyServer(),timeZone:'Asia/Seoul'}}})).profiles['eu:1301'].timeZone,'Asia/Seoul');
assert.throws(()=>parseSettings(JSON.stringify({...settings,profiles:{'eu:1301':{...emptyServer(),timeZone:'Mars/Unknown'}}})));
console.log('Country time zones: Seoul, Helsinki summer/winter, DST gap/fold, exact boundary, legacy offset and validation PASS');

const rift={...emptyServer(),dimension:'rift',timeZone:'Asia/Seoul'};
const instant=Date.parse('2026-10-17T00:01:00Z');
for(const [region,time] of [['eu','03:00'],['nae','03:00'],['naw','03:00'],['la','02:00'],['as','02:00']]){
  assert.equal(nextContentOccurrence(instant,'dimension',rift,region),Date.parse(`2026-10-17T${time}:00Z`));
}
assert.equal(nextContentOccurrence(instant,'dimension',{...rift,times:{dimension:'11:00'}},'eu'),Date.parse('2026-10-17T02:00:00Z'));
assert.equal(nextContentOccurrence(instant,'dimension',{...rift,times:{dimension:''}},'eu'),null);
assert.equal(nextContentOccurrence(instant,'dimension',rift,'unknown'),null);
console.log('Regional default rifts, visitor clock independence, explicit manual/empty overrides PASS');

const legacyPins={...settings,profiles:{'eu:1301':{...emptyServer(),hidden:['tartan'],times:{gartua:'09:00'}}}};
assert.equal(pinnedTimers(parseSettings(JSON.stringify(legacyPins))).includes('tartan'),false);
const common={...legacyPins,pinned:['gartua','shugo']};
assert.deepEqual(pinnedTimers(parseSettings(JSON.stringify(common))),['gartua','shugo']);
assert.deepEqual(pinnedTimers({...common,server:'1302'}),common.pinned);
assert.deepEqual(pinnedTimers({...common,pinned:[]}),[]);
assert.deepEqual(parseSettings(JSON.stringify(common)).profiles,legacyPins.profiles);
for(const pinned of [null,{},'gartua',['unknown'],['shugo','shugo'],[1]])assert.throws(()=>parseSettings(JSON.stringify({...settings,pinned})));
console.log('Common pins: legacy fallback, empty selection, server independence, profile preservation and invalid input PASS');

const expanded={...common,pinnedBosses:['101001','111001','2001','99999']};
assert.deepEqual(parseSettings(JSON.stringify(expanded)),expanded);
for(const pinnedBosses of [null,['01'],['x'],[1],['2001','2001'],Array.from({length:201},(_,i)=>String(i+1))])assert.throws(()=>parseSettings(JSON.stringify({...common,pinnedBosses})));
const timersUrl=moduleUrl(readFileSync('lib/event-timers.ts','utf8'));
const {BOSS_CATALOG,selectedBossIds,setBossPinned}=await import(moduleUrl(readFileSync('lib/boss-catalog.ts','utf8').replace("import data from './data/boss-catalog.json';",'const data='+readFileSync('lib/data/boss-catalog.json','utf8')+';').replace("'./event-timers'",JSON.stringify(timersUrl))));
assert.equal(BOSS_CATALOG.length,49);assert.equal(new Set(BOSS_CATALOG.map(b=>b.id)).size,49);
assert.deepEqual(selectedBossIds(common,1),['101021']);assert.deepEqual(selectedBossIds(common,2),['111021']);
const moved=setBossPinned(common,1,'101021',true);
assert.deepEqual(selectedBossIds(moved,1),['101021']);assert.deepEqual(moved.profiles,common.profiles);
assert.deepEqual(selectedBossIds(setBossPinned(moved,1,'101021',false),1),[]);
assert.deepEqual(selectedBossIds(moved,2),['101021']);
console.log('Full boss pins: catalog, additive validation, alias deduplication, manual-profile preservation, explicit cross-faction IDs PASS');
