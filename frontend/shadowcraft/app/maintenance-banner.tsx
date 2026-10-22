import OfficialLink from './official-link';
import {useEffect,useState} from 'react';
import {useLocale} from './locale';
import {loadMaintenance,currentMaintenance,maintenanceState,NOTICE_HOME,type MaintenanceFeed} from '@/lib/maintenance';
export default function MaintenanceBanner(){
 const {t,locale}=useLocale();
 const [feed,setFeed]=useState<MaintenanceFeed|null>(null),[failed,setFailed]=useState(false),[now,setNow]=useState(Date.now);
 useEffect(()=>{
  let stopped=false,busy=false,lastAttempt=0;let controller:AbortController|undefined;
  async function refresh(){if(busy||document.hidden||Date.now()-lastAttempt<5*60000)return;busy=true;lastAttempt=Date.now();controller=new AbortController();const timeout=setTimeout(()=>controller?.abort(),20000);
   try{const next=await loadMaintenance(controller.signal);if(!stopped){setFeed(next);setFailed(false)}}catch{if(!stopped)setFailed(true)}finally{busy=false;clearTimeout(timeout)}
  }
  void refresh();const timer=setInterval(()=>{setNow(Date.now());void refresh()},30000);const visible=()=>{setNow(Date.now());void refresh()};document.addEventListener('visibilitychange',visible);
  return()=>{stopped=true;controller?.abort();clearInterval(timer);document.removeEventListener('visibilitychange',visible)};
 },[]);
 const notice=feed?currentMaintenance(feed.notices,now):null;
 const state=notice?maintenanceState(notice,now):null;
 const stale=!!feed&&now-feed.checkedAt>15*60000;
 if(!notice)return null;
 const date=(value:number)=>new Intl.DateTimeFormat(locale,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',timeZoneName:'short'}).format(value);
 const title=stale?'점검 공지 확인 필요':state==='upcoming'?'서버 점검 예정':state==='scheduled'?'서버 점검 시간 (공식 일정 기준)':state==='overdue'?'점검 종료 확인 필요':'공식 점검 공지';
 return <aside className="maintenance-banner" aria-label={t('서버 점검 안내')}>
  <div className="maintenance-heading" role="status"><strong>{t(title)}</strong><OfficialLink href={notice?.url||NOTICE_HOME} target="_blank" rel="noreferrer">{t('공식 공지 보기')} ↗</OfficialLink></div>
  {stale?<p>{t('최신 공지를 확인하지 못했습니다. 조회 실패가 서버 점검을 뜻하지는 않습니다.')}</p>:state==='notice'?<p>{notice?.title}</p>:<p>{state==='upcoming'&&notice?.start!==null&&notice?.start!==undefined?<span>{t('점검 시작: {0}',[date(notice.start)])} · </span>:null}{notice?.end!==null&&notice?.end!==undefined?<span>{t('종료 예정: {0}',[date(notice.end)])}{state==='scheduled'?' · '+t('약 {0}분 남음',[Math.max(1,Math.ceil((notice.end-now)/60000))]):''}</span>:t('종료 예정 시각 미정')}</p>}
  <small>{failed&&!stale?t('공지 갱신 실패 · 마지막으로 확인한 일정입니다.'):state==='overdue'?t('예정 시각이 지났습니다. 실제 종료 여부는 공식 공지를 확인해 주세요.'):t('공식 공지 기준 · 일정은 변경될 수 있으며 실시간 서버 상태와 다를 수 있습니다.')}</small>
 </aside>;
}
