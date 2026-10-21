// Read-only official global notices. A planned window is not a live server-health probe.
export const NOTICE_HOME='https://aion2.plaync.com/en-us/board/notice/list';
export const NOTICE_API='https://api-global-community.plaync.com/aion2_global/board/notice_en/article/';
const HOUR=3600000,DAY=24*HOUR;
export type MaintenanceNotice={id:string;title:string;url:string;postedAt:number;start:number|null;end:number|null;global:boolean;completed:boolean};
export type MaintenanceFeed={checkedAt:number;notices:MaintenanceNotice[]};
export function noticeText(html:string){return html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;|\u200b/g,' ').replace(/&amp;/g,'&').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n))).replace(/\s+/g,' ').trim()}
const months=['january','february','march','april','may','june','july','august','september','october','november','december'];
// Only explicit years and unambiguous fixed-offset timezone labels are accepted.
export function noticeStart(value:string):number|null{
 const found=[...value.matchAll(/([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(20\d{2})\s+(?:at\s+)?(\d{1,2})[:h](\d{2})\s*(PDT|PST|CEST|CET|UTC|GMT)\b/gi)];
 if(!found.length)return null;
 const instants:number[]=[];
 for(const m of found){const month=months.findIndex(x=>x===m[1].toLowerCase()||x.slice(0,3)===m[1].toLowerCase());const day=Number(m[2]),year=Number(m[3]),hour=Number(m[4]),minute=Number(m[5]);if(month<0||hour>23||minute>59||day<1)return null;const date=new Date(Date.UTC(year,month,day,hour,minute));if(date.getUTCMonth()!==month||date.getUTCDate()!==day)return null;const offsets:Record<string,number>={PDT:-7,PST:-8,CEST:2,CET:1,UTC:0,GMT:0};instants.push(date.getTime()-offsets[m[6].toUpperCase()]*HOUR)}
 // The usual PDT / CEST pair must describe the same instant, not different windows.
 return new Set(instants).size===1?instants[0]:null;
}
export function parseMaintenance(detail:unknown):MaintenanceNotice{
 const a=(detail as any)?.article,meta=a?.contentMeta,html=a?.content?.content;
 if(!meta||typeof meta.id!=='string'||! /^[a-f0-9]{24}$/.test(meta.id)||typeof meta.title!=='string'||meta.title.length>400||typeof html!=='string'||html.length>500000)throw Error('Invalid official notice');
 const postedAt=Date.parse(meta.timestamps?.postedAt);if(!Number.isFinite(postedAt))throw Error('Invalid notice date');
 const rows:Record<string,string>={};
 for(const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){const cells=[...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(x=>noticeText(x[1]));if(cells.length===2)rows[cells[0].replace(/:$/,'').toLowerCase()]=cells[1]}
 const title=noticeText(meta.title),body=noticeText(html);
 const global=/^(?:all\s+)?game servers[.!]?$/i.test(rows['affected services']||'')&&/^(?:\[Notice\]\s*)?(?:(?:Scheduled|Temporary|Emergency|Weekly)\s+)?(?:Game\s+Server\s+|Server\s+)?Maintenance(?:\s+(?:Completed|Cancelled|Canceled))?(?:\s*[|(:-]|\s*$)/i.test(title)&&! /\b(Europe|Asia|North America|South America|NA East|NA West|EU)\b/i.test(title)&&!Object.keys(rows).some(k=>/affected (regions|servers)/.test(k)&&! /^(all|global)$/i.test(rows[k]));
 let start=noticeStart(rows.when||rows['date and time']||'');if(start!==null&&Math.abs(start-postedAt)>14*DAY)start=null;
 const duration=/^(?:approximately\s+)?(\d+(?:\.\d+)?)\s*(hours?|minutes?)(?:\s*\(subject to change\))?$/i.exec(rows.duration||'');
 const length=duration?Number(duration[1])*(duration[2].toLowerCase().startsWith('hour')?HOUR:60000):0;
 // Extended notices may retain an old duration: never turn it into an authoritative new ETA.
 const end=start!==null&&length>0&&length<=2*DAY&&!/extend|extension/i.test(title)?start+length:null;
 const completed=/\b(completed|cancelled|canceled)\b/i.test(title)||/^(?:Hello Daevas[,.!]?\s*)?(?:The )?(?:server )?maintenance (?:has been|is) (?:completed|cancelled|canceled)\b/i.test(body);
 return {id:meta.id,title,url:'https://aion2.plaync.com/en-us/board/notice/view?articleId='+meta.id,postedAt,start,end,global,completed};
}
export function maintenanceState(n:MaintenanceNotice,now:number):'notice'|'upcoming'|'scheduled'|'overdue'|null{
 if(n.completed||now<n.postedAt-5*60000)return null;
 if(!n.global||n.start===null)return now-n.postedAt<DAY?'notice':null;
 if(now<n.start)return n.start-now<=DAY?'upcoming':null;
 if(n.end!==null){if(now>n.end+6*HOUR)return null;return now<n.end?'scheduled':'overdue'}
 return now<n.start+DAY?'scheduled':null;
}
export function currentMaintenance(notices:MaintenanceNotice[],now:number){
 for(const n of [...notices].sort((a,b)=>b.postedAt-a.postedAt)){
  if(n.completed&&n.global&&now>=n.postedAt&&now-n.postedAt<DAY)return null;
  if(maintenanceState(n,now)!==null)return n;
 }
 return null;
}
export async function loadMaintenance(signal:AbortSignal,fetcher:typeof fetch=fetch):Promise<MaintenanceFeed>{
 async function read(url:string){const r=await fetcher(url,{signal,credentials:'omit',headers:{Accept:'application/json'}});if(!r.ok)throw Error('Notice unavailable');const text=await r.text();if(text.length>1000000)throw Error('Notice too large');return JSON.parse(text)}
 const list=await read(NOTICE_API+'search/moreArticle?moreSize=20&moreDirection=BEFORE&previousArticleId=0');
 if(!Array.isArray(list?.contentList)||list.contentList.length>100)throw Error('Invalid notice list');
 const now=Date.now();
 const candidates=list.contentList.filter((a:any)=>typeof a?.title==='string'&&/\bmaintenance\b/i.test(a.title)&&! /platform services/i.test(a.title)&&typeof a.id==='string'&&/^[a-f0-9]{24}$/.test(a.id)&&Number.isFinite(Date.parse(a.timestamps?.postedAt))&&now-Date.parse(a.timestamps.postedAt)<14*DAY).sort((a:any,b:any)=>Date.parse(b.timestamps.postedAt)-Date.parse(a.timestamps.postedAt)).slice(0,4);
 const notices:MaintenanceNotice[]=[];
 for(const a of candidates){
  const detail=await read(NOTICE_API+a.id); // Network failures remain distinguishable from malformed article fields.
  try{const notice=parseMaintenance(detail);if(notice.id===a.id)notices.push(notice)}catch{/* One nonstandard article must not hide the other valid official notices. */}
 }
 return {checkedAt:Date.now(),notices};
}
