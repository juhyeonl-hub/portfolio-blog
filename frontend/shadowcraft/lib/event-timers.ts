export const TIMER_IDS=['shugo','dimension','gartua','lagta','kashapa','tartan'] as const;
export type TimerId=typeof TIMER_IDS[number];
export const TIMER_NAMES:Record<TimerId,string>={shugo:'슈고',dimension:'차원',gartua:'가르투아',lagta:'라그타',kashapa:'지배 카샤파',tartan:'타르탄'};
export const TIMER_KEY='a2bc-event-timers-v1';
export type ServerTimers={offset:number|null;dimension:'invasion'|'rift';hidden:TimerId[];times:Partial<Record<TimerId,string>>};
export type TimerSettings={version:1;region:string;server:string;profiles:Record<string,ServerTimers>};
export const emptySettings=():TimerSettings=>({version:1,region:'eu',server:'',profiles:{}});
export const emptyServer=():ServerTimers=>({offset:null,dimension:'invasion',hidden:[],times:{}});
export function parseTimes(value:string):number[]{
 if(!value.trim())return [];
 const parts=value.trim().split(/[,\s]+/);
 if(parts.length>48||parts.some(p=>!/^([01]\d|2[0-3]):[0-5]\d$/.test(p)))throw Error('시각은 HH:mm 형식으로 입력하세요. 예: 09:00, 21:00');
 return [...new Set(parts.map(p=>Number(p.slice(0,2))*60+Number(p.slice(3))))].sort((a,b)=>a-b);
}
export function parseSettings(raw:string):TimerSettings{
 const x=JSON.parse(raw);
 if(x?.version!==1||!['eu','nae','naw','la','as'].includes(x.region)||typeof x.server!=='string'||!/^\d{0,8}$/.test(x.server)||!x.profiles||Array.isArray(x.profiles)||typeof x.profiles!=='object'||Object.keys(x.profiles).length>200)throw Error('타이머 설정을 읽을 수 없습니다.');
 for(const [key,p] of Object.entries(x.profiles) as [string,ServerTimers][]){
  if(!/^(eu|nae|naw|la|as):\d{1,8}$/.test(key)||!p||!(p.offset===null||(Number.isInteger(p.offset)&&p.offset>=-720&&p.offset<=840))||!['invasion','rift'].includes(p.dimension)||!Array.isArray(p.hidden)||p.hidden.length>6||new Set(p.hidden).size!==p.hidden.length||p.hidden.some(id=>!TIMER_IDS.includes(id))||!p.times||typeof p.times!=='object'||Array.isArray(p.times))throw Error('타이머 설정 형식이 잘못되었습니다.');
  for(const [id,value] of Object.entries(p.times)){if(!TIMER_IDS.includes(id as TimerId)||typeof value!=='string'||value.length>300)throw Error('시간표 형식이 잘못되었습니다.');parseTimes(value);}
 }
 return x;
}
export function scheduleMinutes(id:TimerId,p:ServerTimers):number[]{
 if(p.times[id]!==undefined)return parseTimes(p.times[id]!);
 // Community reference, not an official live server feed. Rift anchors are unknown.
 if(id==='shugo')return Array.from({length:24},(_,h)=>h*60);
 if(id==='dimension'&&p.dimension==='invasion')return Array.from({length:24},(_,h)=>h*60+30);
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
