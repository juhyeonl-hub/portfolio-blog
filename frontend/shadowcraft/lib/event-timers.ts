export const SCHEDULED_BOSS_IDS:string[]=["scheduled:watcher-kaira", "scheduled:guardian-nahma", "scheduled:executor-tamasa", "scheduled:executor-argo", "scheduled:executor-kaira"];
export type BossSchedule={days:number[];starts:number[]};
export const TIMER_IDS=['shugo','dimension','gartua','lagta','kashapa','tartan'] as const;
export type TimerId=typeof TIMER_IDS[number];
export const TIMER_NAMES:Record<TimerId,string>={shugo:'슈고',dimension:'차원',gartua:'가르투아',lagta:'라그타',kashapa:'지배 카샤파',tartan:'타르탄'};
export const TIMER_KEY='a2bc-event-timers-v1';
/** Fired in this tab after the timer settings are saved (other tabs get the storage event). */
export const TIMER_SETTINGS_EVENT='asbc-timer-settings';
export type ServerTimers={offset:number|null;timeZone?:string;dimension:'invasion'|'rift';hidden:TimerId[];times:Partial<Record<TimerId,string>>};
export type TimerSettings={version:1;region:string;server:string;pinned?:TimerId[];pinnedBosses?:string[];pinnedSchedules?:string[];profiles:Record<string,ServerTimers>};
// Old profiles keep their hidden selection until the user explicitly chooses common pins.
export function pinnedTimers(settings:TimerSettings):TimerId[]{return settings.pinned??TIMER_IDS.filter(id=>!(settings.profiles[settings.region+':'+settings.server]?.hidden||[]).includes(id))}
export const emptySettings=():TimerSettings=>({version:1,region:'eu',server:'',profiles:{}});
export const emptyServer=():ServerTimers=>({offset:null,dimension:'invasion',hidden:[],times:{}});
export const TIME_ZONES=[
 ['Asia/Seoul','대한민국 · 서울'],['Europe/Helsinki','핀란드 · 헬싱키'],
 ['Europe/London','영국 · 런던'],['Europe/Berlin','독일 · 베를린'],['Europe/Paris','프랑스 · 파리'],
 ['Europe/Stockholm','스웨덴 · 스톡홀름'],['Europe/Warsaw','폴란드 · 바르샤바'],['Europe/Istanbul','튀르키예 · 이스탄불'],
 ['America/New_York','미국 · 뉴욕 (동부)'],['America/Chicago','미국 · 시카고 (중부)'],
 ['America/Denver','미국 · 덴버 (산악)'],['America/Los_Angeles','미국 · 로스앤젤레스 (서부)'],
 ['America/Phoenix','미국 · 피닉스 (애리조나)'],['Pacific/Honolulu','미국 · 호놀룰루 (하와이)'],
 ['America/Toronto','캐나다 · 토론토'],['America/Vancouver','캐나다 · 밴쿠버'],
 ['America/Sao_Paulo','브라질 · 상파울루'],['America/Mexico_City','멕시코 · 멕시코시티'],
 ['Asia/Tokyo','일본 · 도쿄'],['Asia/Taipei','대만 · 타이베이'],['Asia/Shanghai','중국 · 상하이'],
 ['Asia/Singapore','싱가포르'],['Asia/Bangkok','태국 · 방콕'],['Asia/Kolkata','인도 · 콜카타'],
 ['Australia/Sydney','호주 · 시드니'],['Australia/Perth','호주 · 퍼스'],['Pacific/Auckland','뉴질랜드 · 오클랜드'],
 ['Atlantic/Reykjavik','아이슬란드 · 레이캬비크 (연중 세계 표준시)']
] as const;
export function legacyClockLabel(offset:number){return `기존 설정 유지 (UTC${offset>=0?'+':'−'}${String(Math.floor(Math.abs(offset)/60)).padStart(2,'0')}:${String(Math.abs(offset)%60).padStart(2,'0')})`}
export function parseTimes(value:string):number[]{
 if(!value.trim())return [];
 const parts=value.trim().split(/[,\s]+/);
 if(parts.length>48||parts.some(p=>!/^([01]\d|2[0-3]):[0-5]\d$/.test(p)))throw Error('시각은 HH:mm 형식으로 입력하세요. 예: 09:00, 21:00');
 return [...new Set(parts.map(p=>Number(p.slice(0,2))*60+Number(p.slice(3))))].sort((a,b)=>a-b);
}
export function parseSettings(raw:string):TimerSettings{
 const x=JSON.parse(raw);
 if(x?.version!==1||!['eu','nae','naw','la','as'].includes(x.region)||typeof x.server!=='string'||!/^\d{0,8}$/.test(x.server)||!x.profiles||Array.isArray(x.profiles)||typeof x.profiles!=='object'||Object.keys(x.profiles).length>200)throw Error('타이머 설정을 읽을 수 없습니다.');
 if(x.pinned!==undefined&&(!Array.isArray(x.pinned)||x.pinned.length>TIMER_IDS.length||new Set(x.pinned).size!==x.pinned.length||x.pinned.some((id:TimerId)=>!TIMER_IDS.includes(id))))throw Error('타이머 설정 형식이 잘못되었습니다.');
 if(x.pinnedBosses!==undefined&&(!Array.isArray(x.pinnedBosses)||x.pinnedBosses.length>200||new Set(x.pinnedBosses).size!==x.pinnedBosses.length||x.pinnedBosses.some((id:unknown)=>typeof id!=='string'||! /^[1-9]\d{0,7}$/.test(id))))throw Error('타이머 설정 형식이 잘못되었습니다.');
 if(x.pinnedSchedules!==undefined&&(!Array.isArray(x.pinnedSchedules)||x.pinnedSchedules.length>SCHEDULED_BOSS_IDS.length||new Set(x.pinnedSchedules).size!==x.pinnedSchedules.length||x.pinnedSchedules.some((id:unknown)=>typeof id!=='string'||!SCHEDULED_BOSS_IDS.includes(id))))throw Error('타이머 설정 형식이 잘못되었습니다.');
 for(const [key,p] of Object.entries(x.profiles) as [string,ServerTimers][]){
  if(!/^(eu|nae|naw|la|as):\d{1,8}$/.test(key)||!p||!(p.offset===null||(Number.isInteger(p.offset)&&p.offset>=-720&&p.offset<=840))||!['invasion','rift'].includes(p.dimension)||!Array.isArray(p.hidden)||p.hidden.length>6||new Set(p.hidden).size!==p.hidden.length||p.hidden.some(id=>!TIMER_IDS.includes(id))||!p.times||typeof p.times!=='object'||Array.isArray(p.times))throw Error('타이머 설정 형식이 잘못되었습니다.');
  if(p.timeZone!==undefined&&!TIME_ZONES.some(([zone])=>zone===p.timeZone))throw Error('지원하지 않는 국가·지역 시간대입니다.');
  for(const [id,value] of Object.entries(p.times)){if(!TIMER_IDS.includes(id as TimerId)||typeof value!=='string'||value.length>300)throw Error('시간표 형식이 잘못되었습니다.');parseTimes(value);}
 }
 return x;
}
export function scheduleMinutes(id:TimerId,p:ServerTimers):number[]{
 if(p.times[id]!==undefined)return parseTimes(p.times[id]!);
 // Reference facts: A2Tools-Plugins/plugins/event-timers/README.md (2026-10-17).
 if(id==='shugo')return Array.from({length:24},(_,h)=>h*60);
 if(id==='dimension')return p.dimension==='invasion'?Array.from({length:24},(_,h)=>h*60+30):Array.from({length:8},(_,i)=>(2+i*3)*60);
 return [];
}
export function nextOccurrence(now:number,minutes:number[],offset:number|null):number|null{
 if(!Number.isFinite(now)||offset===null||!Number.isInteger(offset)||offset< -720||offset>840||!minutes.length||minutes.some(m=>!Number.isInteger(m)||m<0||m>=1440))return null;
 const day=86400000,shift=offset*60000;
 const start=Math.floor((now+shift)/day)*day-shift;
 // At the exact start second display 00:00:00, then move to the next occurrence.
 const second=Math.floor(now/1000)*1000;
 return Math.min(...minutes.map(m=>{const target=start+m*60000;return target<second?target+day:target}));
}
export function countdown(target:number,now:number):string{
 const seconds=Math.max(0,Math.ceil((target-now)/1000));
 return [Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(n=>String(n).padStart(2,'0')).join(':');
}

// Cache day candidates, not countdown values, so wall-clock changes and background tabs stay correct.
const zoneCandidates=new Map<string,number[]>();
export function nextZonedOccurrence(now:number,minutes:number[],timeZone:string,days:number[]=[0,1,2,3,4,5,6]):number|null{
 if(!days.length||days.some(d=>!Number.isInteger(d)||d<0||d>6)||!Number.isFinite(now)||!TIME_ZONES.some(([zone])=>zone===timeZone)||!minutes.length||minutes.some(m=>!Number.isInteger(m)||m<0||m>=1440))return null;
 const day=86400000,utcDay=Math.floor(now/day)*day;
 const key=JSON.stringify([utcDay,minutes,timeZone,days]);
 let candidates=zoneCandidates.get(key);
 if(!candidates){
  const formatter=new Intl.DateTimeFormat('en-GB',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  function localStamp(ms:number){const parts=Object.fromEntries(formatter.formatToParts(ms).map(p=>[p.type,p.value]));return Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day),Number(parts.hour),Number(parts.minute),Number(parts.second))}
  // Sample both sides of transitions. Roundtrip validation excludes nonexistent spring hours;
  // distinct offsets retain both occurrences of repeated autumn hours.
  const offsets=new Set<number>();
  for(let hours=-48;hours<=240;hours+=12){const t=utcDay+hours*3600000;offsets.add(localStamp(t)-t)}
  candidates=[];
  // A full week plus boundary days covers weekly schedules across UTC/local date and DST changes.
  for(let d=-1;d<=8;d++)for(const minute of minutes){const wall=utcDay+d*day+minute*60000;if(!days.includes(new Date(wall).getUTCDay()))continue;for(const offset of offsets){const target=wall-offset;if(localStamp(target)===wall)candidates.push(target)}}
  candidates=[...new Set(candidates)].sort((a,b)=>a-b);
  if(zoneCandidates.size>=32)zoneCandidates.delete(zoneCandidates.keys().next().value!);
  zoneCandidates.set(key,candidates);
 }
 return candidates.find(t=>t>=Math.floor(now/1000)*1000)??null;
}
export function nextTimerOccurrence(now:number,minutes:number[],profile:ServerTimers):number|null{
 return profile.timeZone?nextZonedOccurrence(now,minutes,profile.timeZone):nextOccurrence(now,minutes,profile.offset);
}

// Independent schedule conversion; provider reference clocks, not the visitor's clock.
const REGION_CLOCKS:Record<string,string>={eu:'Europe/Berlin',nae:'America/New_York',naw:'America/Los_Angeles',la:'America/Sao_Paulo',as:'Asia/Seoul'};
export function nextContentOccurrence(now:number,id:TimerId,profile:ServerTimers,region:string):number|null{
 const minutes=scheduleMinutes(id,profile);
 if(profile.times[id]!==undefined)return nextTimerOccurrence(now,minutes,profile);
 const zone=REGION_CLOCKS[region];
 return zone?nextZonedOccurrence(now,minutes,zone):null;
}

export function nextScheduledBossOccurrence(now:number,schedule:BossSchedule,region:string):number|null{
 const zone=REGION_CLOCKS[region];
 return zone?nextZonedOccurrence(now,schedule.starts,zone,schedule.days):null;
}
