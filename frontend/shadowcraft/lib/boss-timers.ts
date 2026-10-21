export type BossRecord={id:number;state:'up'|'dead';reportedAt:number;nextSpawn:number;upSince:number;confirmed:boolean};
export type BossFeed={server:number;region:string;serverNow:number;fetchedAt:number;refreshFailed:boolean;enabled:boolean;allBosses?:Record<string,BossRecord>;bosses:Record<string,BossRecord>};
export function parseBossFeed(x:unknown,region:string,server:string):BossFeed{
 const f=x as BossFeed;
 if(!f||f.server!==Number(server)||f.region!==region||!Number.isFinite(f.serverNow)||!Number.isFinite(f.fetchedAt)||typeof f.refreshFailed!=='boolean'||typeof f.enabled!=='boolean'||!f.bosses||Array.isArray(f.bosses)||typeof f.bosses!=='object')throw Error('보스 응답 형식 오류');
 for(const [key,b] of Object.entries(f.bosses)){
  if(!['gartua','lagta','kashapa','tartan'].includes(key)||!b||!Number.isInteger(b.id)||!['up','dead'].includes(b.state)||typeof b.confirmed!=='boolean'||![b.reportedAt,b.nextSpawn,b.upSince].every(v=>Number.isFinite(v)&&v>=0)||b.reportedAt>f.serverNow+300000)throw Error('보스 기록 형식 오류');
 }
 if(f.allBosses!==undefined){
  if(!f.allBosses||typeof f.allBosses!=='object'||Array.isArray(f.allBosses)||Object.keys(f.allBosses).length>200)throw Error('보스 응답 형식 오류');
  for(const [id,b] of Object.entries(f.allBosses)){
   if(!/^[1-9]\d{0,7}$/.test(id)||!b||b.id!==Number(id)||!['up','dead'].includes(b.state)||typeof b.confirmed!=='boolean'||![b.reportedAt,b.nextSpawn,b.upSince].every(v=>Number.isFinite(v)&&v>=0)||b.reportedAt>f.serverNow+300000)throw Error('보스 기록 형식 오류');
  }
 }
 return f;
}
// Observation age is independent of HTTP cache freshness. Ten minutes is our display policy.
export function bossDisplay(feed:BossFeed|null,id:string,now:number,failed:boolean){
 const b=feed?.allBosses?.[id]??feed?.bosses[id]??Object.values(feed?.bosses||{}).find(b=>String(b.id)===id);
 if(!feed)return {text:failed?'조회 실패':'불러오는 중',note:'A2Tools · 관측 기록 대기',target:0};
 if(!feed.enabled)return {text:'연동 중지',note:'다음 출현 미확인',target:0};
 if(!b)return {text:failed||feed.refreshFailed?'조회 실패':'관측 기록 없음',note:'A2Tools · 다음 출현 미확인',target:0};
 const stale=failed||feed.refreshFailed||now-b.reportedAt>600000||now-feed.fetchedAt>120000;
 const note=`A2Tools · ${stale?'갱신 지연 · ':''}${b.confirmed?'확인된 기록':'미확인 기록'}`;
 if(b.state==='up')return {text:stale?'생존 기록 · 확인 필요':'생존 관측',note,target:0};
 if(!b.nextSpawn)return {text:'출현 시각 미확인',note,target:0};
 if(b.nextSpawn<=now)return {text:'출현 예정 시각 경과',note,target:0};
 return {text:'',note,target:b.nextSpawn};
}
