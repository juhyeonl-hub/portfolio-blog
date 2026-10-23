import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
const {SCHEDULED_BOSS_IDS,nextScheduledBossOccurrence,pinnedTimers,parseTimes,parseSettings,emptySettings,emptyServer,nextOccurrence,countdown,scheduleMinutes,nextContentOccurrence,nextZonedOccurrence,nextTimerOccurrence}=await import(moduleUrl(readFileSync('lib/event-timers.ts','utf8')));
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
assert.deepEqual(scheduleMinutes('rift',emptyServer()),[120,300,480,660,840,1020,1200,1380]);
assert.deepEqual(scheduleMinutes('shugo',{...emptyServer(),times:{shugo:''}}),[]);
const settings={...emptySettings(),server:'1301',profiles:{'eu:1301':{...emptyServer(),offset:0,times:{gartua:'09:00'}}}};
assert.deepEqual(parseSettings(JSON.stringify(settings)),settings);
for(const profile of [{offset:9999},{hidden:['fake']},{times:{gartua:'25:00'}},{times:[]}])assert.throws(()=>parseSettings(JSON.stringify({...settings,profiles:{'eu:1301':{...emptyServer(),...profile}}})));
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

const rift={...emptyServer(),timeZone:'Asia/Seoul'};
const instant=Date.parse('2026-10-17T00:01:00Z');
for(const [region,time] of [['eu','03:00'],['nae','03:00'],['naw','03:00'],['la','02:00'],['as','02:00']]){
  assert.equal(nextContentOccurrence(instant,'rift',rift,region),Date.parse(`2026-10-17T${time}:00Z`));
}
assert.equal(nextContentOccurrence(instant,'rift',{...rift,times:{rift:'11:00'}},'eu'),Date.parse('2026-10-17T02:00:00Z'));
assert.equal(nextContentOccurrence(instant,'rift',{...rift,times:{rift:''}},'eu'),null);
assert.equal(nextContentOccurrence(instant,'rift',rift,'unknown'),null);
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
const {BOSS_CATALOG,selectedBossIds,setBossPinned}=await import(moduleUrl(readFileSync('lib/boss-catalog.ts','utf8').replace("import data from './data/boss-catalog.json';",'const data='+readFileSync('lib/data/boss-catalog.json','utf8')+';').replace("import scheduled from './data/scheduled-bosses.json';",'const scheduled='+readFileSync('lib/data/scheduled-bosses.json','utf8')+';').replace("'./event-timers'",JSON.stringify(timersUrl))));
assert.equal(BOSS_CATALOG.length,54);assert.equal(new Set(BOSS_CATALOG.map(b=>b.id)).size,54);
assert.deepEqual(selectedBossIds(common,1),['101021']);assert.deepEqual(selectedBossIds(common,2),['111021']);
const moved=setBossPinned(common,1,'101021',true);
assert.deepEqual(selectedBossIds(moved,1),['101021']);assert.deepEqual(moved.profiles,common.profiles);
assert.deepEqual(selectedBossIds(setBossPinned(moved,1,'101021',false),1),[]);
assert.deepEqual(selectedBossIds(moved,2),['101021']);
console.log('Full boss pins: catalog, additive validation, alias deduplication, manual-profile preservation, explicit cross-faction IDs PASS');

const scheduled=BOSS_CATALOG.filter(b=>b.schedule);
assert.deepEqual(scheduled.map(b=>b.id),SCHEDULED_BOSS_IDS);
assert.equal(BOSS_CATALOG.filter(b=>b.side===null).length,6);
const kaira=scheduled.find(b=>b.id==='scheduled:watcher-kaira');
const nahma=scheduled.find(b=>b.id==='scheduled:guardian-nahma');
assert.equal(nextScheduledBossOccurrence(Date.parse('2026-10-21T22:59:59Z'),kaira.schedule,'eu'),Date.parse('2026-10-21T23:00:00Z'));
assert.equal(nextScheduledBossOccurrence(Date.parse('2026-10-21T23:00:01Z'),kaira.schedule,'eu'),Date.parse('2026-10-22T02:00:00Z'));
for(const [region,target] of [['eu','2026-10-23T19:00Z'],['nae','2026-10-24T01:00Z'],['naw','2026-10-24T04:00Z'],['la','2026-10-24T00:00Z'],['as','2026-10-23T12:00Z']])assert.equal(nextScheduledBossOccurrence(Date.parse('2026-10-22T00:00Z'),nahma.schedule,region),Date.parse(target));
assert.equal(nextScheduledBossOccurrence(Date.parse('2026-10-23T19:00:00.500Z'),nahma.schedule,'eu'),Date.parse('2026-10-23T19:00Z'));
assert.equal(nextScheduledBossOccurrence(Date.parse('2026-10-23T19:00:01Z'),nahma.schedule,'eu'),Date.parse('2026-10-25T20:00Z'));
assert.equal(nextScheduledBossOccurrence(Date.parse('2026-10-25T20:00:01Z'),nahma.schedule,'eu'),Date.parse('2026-10-30T20:00Z'));
assert.equal(nextScheduledBossOccurrence(Date.parse('2026-10-31T01:00:01Z'),nahma.schedule,'nae'),Date.parse('2026-11-02T02:00Z'));
assert.equal(nextScheduledBossOccurrence(Date.parse('2026-10-26T00:00Z'),nahma.schedule,'nae'),Date.parse('2026-10-26T01:00Z')); // Sunday local, Monday UTC
assert.equal(nextZonedOccurrence(Date.parse('2026-03-28T23:00Z'),[150],'Europe/Berlin',[0]),Date.parse('2026-04-05T00:30Z')); // nonexistent weekly spring hour
assert.equal(nextZonedOccurrence(Date.parse('2026-10-25T00:31Z'),[150],'Europe/Berlin',[0]),Date.parse('2026-10-25T01:30Z'));
assert.equal(nextZonedOccurrence(Date.parse('2026-10-22T00:00Z'),[1260],'Europe/Berlin',[4]),Date.parse('2026-10-22T19:00Z'));
assert.equal(nextZonedOccurrence(Date.parse('2026-10-22T00:00Z'),[1260],'Europe/Berlin',[5]),Date.parse('2026-10-23T19:00Z')); // weekday-aware cache
for(const b of scheduled.filter(b=>b.id.startsWith('scheduled:executor-')))assert.equal(nextScheduledBossOccurrence(Date.parse('2026-10-22T19:30:01Z'),b.schedule,'eu'),Date.parse('2026-10-24T19:30Z'));
assert.equal(nextScheduledBossOccurrence(now,nahma.schedule,'unknown'),null);
assert.equal(nextZonedOccurrence(now,[1260],'Europe/Berlin',[]),null);
assert.equal(nextZonedOccurrence(now,[1260],'Europe/Berlin',[7]),null);
const schedulePins=setBossPinned(expanded,1,kaira.id,true);
assert.deepEqual(parseSettings(JSON.stringify(schedulePins)),schedulePins);
assert.deepEqual(schedulePins.pinned,expanded.pinned);assert.deepEqual(schedulePins.pinnedBosses,expanded.pinnedBosses);assert.deepEqual(schedulePins.profiles,expanded.profiles);
assert(selectedBossIds(schedulePins,2).includes(kaira.id));
assert.deepEqual(setBossPinned(schedulePins,1,kaira.id,false).pinnedSchedules,[]);
for(const pinnedSchedules of [null,{},[1],['2001'],['scheduled:invented'],[kaira.id,kaira.id]])assert.throws(()=>parseSettings(JSON.stringify({...expanded,pinnedSchedules})));
console.log('Scheduled Abyss bosses:5names, weekly region clocks, EU/US DST, gap/fold, next-week gap, local weekday, cache, separate compatible pins PASS');

// The two different events must remain visible and configurable at the same time.
assert.deepEqual(pinnedTimers(emptySettings()).slice(0,3),['shugo','invasion','rift']);
assert.equal(nextContentOccurrence(instant,'invasion',rift,'eu'),Date.parse('2026-10-17T00:30:00Z'));
assert.equal(nextContentOccurrence(instant,'rift',rift,'eu'),Date.parse('2026-10-17T03:00:00Z'));
const separateTimes={...rift,times:{invasion:'11:00',rift:'14:00'}};
assert.equal(nextContentOccurrence(instant,'invasion',separateTimes,'eu'),Date.parse('2026-10-17T02:00:00Z'));
assert.equal(nextContentOccurrence(instant,'rift',separateTimes,'eu'),Date.parse('2026-10-17T05:00:00Z'));
assert.equal(nextContentOccurrence(instant,'invasion',{...separateTimes,times:{invasion:'',rift:'14:00'}},'eu'),null);
assert.equal(nextContentOccurrence(instant,'rift',{...separateTimes,times:{invasion:'',rift:'14:00'}},'eu'),Date.parse('2026-10-17T05:00:00Z'));
assert.deepEqual(pinnedTimers(parseSettings(JSON.stringify({...settings,pinned:['invasion','rift']}))),['invasion','rift']);
assert.deepEqual(pinnedTimers(parseSettings(JSON.stringify({...settings,pinned:['rift']}))),['rift']);
assert.equal(parseSettings(JSON.stringify({...settings,profiles:{'eu:1301':{...emptyServer(),hidden:['shugo','invasion','rift','gartua','lagta','kashapa','tartan']}}})).profiles['eu:1301'].hidden.length,7);
for(const invalid of [{...settings,version:3},{...settings,pinned:['dimension']},{...settings,profiles:{'eu:1301':{...emptyServer(),times:{dimension:'09:00'}}}}])assert.throws(()=>parseSettings(JSON.stringify(invalid)));

const v1={version:1,region:'eu',server:'1301',pinned:['dimension','gartua'],pinnedBosses:['2001'],pinnedSchedules:['scheduled:watcher-kaira'],profiles:{
 'eu:1301':{offset:120,timeZone:'Asia/Seoul',dimension:'rift',hidden:['dimension','tartan'],times:{dimension:'11:00',gartua:'09:00'}},
 'eu:1302':{offset:-240,dimension:'invasion',hidden:[],times:{dimension:'18:30'}}
}};
const original=JSON.stringify(v1),migrated=parseSettings(original);
assert.equal(migrated.version,2);
assert.deepEqual(migrated.pinned,['rift','gartua']);
assert.deepEqual(migrated.pinnedBosses,v1.pinnedBosses);
assert.deepEqual(migrated.pinnedSchedules,v1.pinnedSchedules);
assert.deepEqual(migrated.profiles['eu:1301'],{offset:120,timeZone:'Asia/Seoul',hidden:['rift','tartan','invasion'],times:{rift:'11:00',gartua:'09:00'}});
assert.deepEqual(migrated.profiles['eu:1302'],{offset:-240,hidden:['rift'],times:{invasion:'18:30'}});
assert.equal(nextContentOccurrence(instant,'rift',migrated.profiles['eu:1301'],'eu'),Date.parse('2026-10-17T02:00:00Z'));
assert.equal(nextContentOccurrence(instant,'invasion',migrated.profiles['eu:1301'],'eu'),Date.parse('2026-10-17T00:30:00Z'));
assert.deepEqual(parseSettings(JSON.stringify(migrated)),migrated);
assert.equal(JSON.stringify(v1),original);
assert.deepEqual(parseSettings(JSON.stringify({...v1,pinned:[]})).pinned,[]);
assert.deepEqual(parseSettings(JSON.stringify({...v1,server:'1302'})).pinned,['invasion','gartua']);
const noExplicitPin={...v1};delete noExplicitPin.pinned;
const migratedProfiles=parseSettings(JSON.stringify(noExplicitPin));
assert.equal(migratedProfiles.pinned,undefined);
assert.deepEqual(pinnedTimers(migratedProfiles),['shugo','gartua','lagta','kashapa']);
assert.deepEqual(pinnedTimers({...migratedProfiles,server:'1302'}),['shugo','invasion','gartua','lagta','kashapa','tartan']);
assert.deepEqual(pinnedTimers(parseSettings(JSON.stringify({version:1,region:'eu',server:'',profiles:{}}))),['shugo','invasion','rift','gartua','lagta','kashapa','tartan']);
const disabled=parseSettings(JSON.stringify({...v1,profiles:{'eu:1301':{...v1.profiles['eu:1301'],times:{dimension:''}}}}));
assert.equal(nextContentOccurrence(instant,'rift',disabled.profiles['eu:1301'],'eu'),null);
assert.notEqual(nextContentOccurrence(instant,'invasion',disabled.profiles['eu:1301'],'eu'),null);
for(const invalid of [{...v1,pinned:['rift']},{...v1,profiles:{'eu:1301':{...v1.profiles['eu:1301'],dimension:'fake'}}},{...v1,profiles:{'eu:1301':{...v1.profiles['eu:1301'],times:{dimension:'25:00'}}}}])assert.throws(()=>parseSettings(JSON.stringify(invalid)));
console.log('Separate invasion/rift: simultaneous defaults, independent pins/manual times, v1 migrations for both events/servers, empty pins/disabled schedules, clock/boss preservation and idempotent reload PASS');
