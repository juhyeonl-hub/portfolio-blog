import {useLocale} from './locale';
import {useEffect,useRef,useState} from 'react';
import directory from '@/lib/data/servers.json';
import FactionPicker from './faction-picker';
import {parseBossFeed,bossDisplay,type BossFeed} from '@/lib/boss-timers';
import {TIMER_IDS,TIMER_NAMES,TIMER_KEY,type TimerId,type TimerSettings,emptySettings,emptyServer,parseSettings,parseTimes,nextContentOccurrence,countdown,TIME_ZONES,legacyClockLabel} from '@/lib/event-timers';
const regions=[['eu','유럽 EU'],['nae','북미 동부'],['naw','북미 서부'],['la','남미'],['as','아시아']];
const servers=directory as Record<string,{serverId:number;serverName:string;raceId:number}[]>;
export default function EventTimers(){
 const {t}=useLocale();
 const [initial]=useState(()=>{try{const raw=localStorage.getItem(TIMER_KEY);return {settings:raw?parseSettings(raw):emptySettings(),error:''}}catch{return {settings:emptySettings(),error:'저장된 타이머 설정을 읽지 못했습니다. 다시 설정해 주세요.'}}});
 const [settings,setSettings]=useState(initial.settings),[draft,setDraft]=useState(initial.settings),[error,setError]=useState(initial.error),[editing,setEditing]=useState(false),[now,setNow]=useState(()=>Date.now());
 const [draftRace,setDraftRace]=useState(1);
 const [live,setLive]=useState<{key:string;feed:BossFeed;offset:number}|null>(null),[liveFailed,setLiveFailed]=useState('');
 const header=useRef<HTMLElement>(null);
 useEffect(()=>{
  if(!settings.server)return;
  let controller=new AbortController();let timer:ReturnType<typeof setTimeout>;let stopped=false;
  const requestKey=settings.region+':'+settings.server;
  async function refresh(){
   if(document.hidden){timer=setTimeout(refresh,60000);return}
   controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
   try{
    const response=await fetch(`/api/public/shadowcraft/boss-timers?region=${encodeURIComponent(settings.region)}&server=${encodeURIComponent(settings.server)}`,{signal:controller.signal,cache:'no-store'});
    if(!response.ok)throw Error('조회 실패');
    const feed=parseBossFeed(await response.json(),settings.region,settings.server);
    if(!stopped){setLive({key:requestKey,feed,offset:feed.serverNow-Date.now()});setLiveFailed('')}
   }catch{if(!stopped)setLiveFailed(requestKey)}finally{clearTimeout(timeout);if(!stopped)timer=setTimeout(refresh,60000)}
  }
  void refresh();return()=>{stopped=true;controller.abort();clearTimeout(timer)};
 },[settings.region,settings.server]);
 useEffect(()=>{const tick=()=>setNow(Date.now());const timer=setInterval(tick,1000);document.addEventListener('visibilitychange',tick);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',tick)}},[]);
 useEffect(()=>{const element=header.current;if(!element)return;const observer=new ResizeObserver(()=>document.documentElement.style.setProperty('--a2bc-timer-height',`${element.getBoundingClientRect().height}px`));observer.observe(element);return()=>{observer.disconnect();document.documentElement.style.removeProperty('--a2bc-timer-height')}},[]);
 useEffect(()=>{function changed(e:StorageEvent){if(e.key!==TIMER_KEY&&e.key!==null)return;try{setSettings(e.newValue?parseSettings(e.newValue):emptySettings())}catch{setError('다른 탭의 타이머 설정을 읽지 못했습니다. 현재 설정을 유지합니다.')}}window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed)},[]);
 const key=settings.region+':'+settings.server,profile=settings.profiles[key]||emptyServer();
 const selectedRace=servers[draft.region].find(s=>String(s.serverId)===draft.server)?.raceId||draftRace;
 const draftKey=draft.region+':'+draft.server,draftProfile=draft.profiles[draftKey]||emptyServer();
 const server=servers[settings.region].find(s=>String(s.serverId)===settings.server);
 function change(p:Partial<typeof draftProfile>){setDraft({...draft,profiles:{...draft.profiles,[draftKey]:{...draftProfile,...p}}})}
 function save(){try{const profileToSave={...draftProfile};if(!servers[draft.region].some(s=>String(s.serverId)===draft.server))throw Error('서버를 선택해 주세요.');if(profileToSave.offset===null&&!profileToSave.timeZone)profileToSave.timeZone=Intl.DateTimeFormat().resolvedOptions().timeZone&&TIME_ZONES.some(([zone])=>zone===Intl.DateTimeFormat().resolvedOptions().timeZone)?Intl.DateTimeFormat().resolvedOptions().timeZone:'Asia/Seoul';for(const value of Object.values(profileToSave.times))parseTimes(value);const next=parseSettings(JSON.stringify({...draft,profiles:{...draft.profiles,[draftKey]:profileToSave}}));localStorage.setItem(TIMER_KEY,JSON.stringify(next));setSettings(next);setEditing(false);setError('')}catch(e){setError(e instanceof Error?e.message:'설정 저장에 실패했습니다.')}}
 function label(id:TimerId){return id==='dimension'?(profile.dimension==='invasion'?'차원 침공':'시공의 균열'):TIMER_NAMES[id]}
 return <section ref={header} className="event-timer-header" aria-label={t('고정 콘텐츠 타이머')}>
  <div className="event-timer-toolbar"><strong>{t('콘텐츠 타이머')}</strong><span>{server?`${t(regions.find(r=>r[0]===settings.region)?.[1])} · ${server.serverName} · ${profile.timeZone?t(TIME_ZONES.find(([zone])=>zone===profile.timeZone)?.[1]):t('기존 시간 기준')}`:''}</span><button className="button ghost small" aria-expanded={editing} aria-controls="event-timer-settings" onClick={()=>{setDraft(settings);setDraftRace(servers[settings.region].find(s=>String(s.serverId)===settings.server)?.raceId||1);setEditing(!editing)}}>{t('서버·타이머 설정')}</button></div>
  {server?<div className="event-timer-strip">{TIMER_IDS.filter(id=>!profile.hidden.includes(id)).map(id=>{const automatic=!!server&&!['shugo','dimension'].includes(id)&&profile.times[id]===undefined;
   const current=live?.key===key?live:null,clock=now+(current?.offset||0);
   const state=automatic?bossDisplay(current?.feed||null,id,clock,liveFailed===key):null;
   const target=server?nextContentOccurrence(now,id,profile,settings.region):null;
   const remaining=state?(state.target?state.target-clock:0):target===null?0:target-now;
   const imminent=remaining>0&&remaining<60*60*1000;
   return <div className={`event-timer-card${imminent?' event-timer-card-imminent':''}`} key={id}><b>{t(label(id))}</b><strong>{state?(state.target?countdown(state.target,clock):t(state.text)):target===null?(server?t('시간표 미등록'):t('서버 설정 필요')):countdown(target,now)}</strong><small title={current?.feed.bosses[id]?t('마지막 관측: {0}',[new Date(current.feed.bosses[id].reportedAt).toLocaleString()]):undefined}>{state?t(state.note):target!==null?(profile.times[id]!==undefined?t('등록 시간표'):t('서버 기준 · 참고 일정')):t('다음 출현 미확인')}</small></div>})}{profile.hidden.length===6&&<span>{t('고정할 타이머를 설정에서 선택하세요.')}</span>}</div>:<p className="event-timer-empty">{t('서버를 고르면 보스·콘텐츠 출현 시간이 여기에 표시됩니다.')}</p>}
  {editing&&<form id="event-timer-settings" className="event-timer-settings" onSubmit={e=>{e.preventDefault();save()}}>
   <small className="subtle">{t('보스 데이터:')} <a href="https://a2tools.app" target="_blank" rel="noreferrer">A2Tools</a> {t('· 관측 기록 기반 · 서버별 약 1분 갱신')}</small>
   <h3>{t('서버별 시간표 설정')}</h3><div className="form-grid"><label>{t('글로벌 지역')}<select aria-label={t('글로벌 지역')} value={draft.region} onChange={e=>{setDraftRace(selectedRace);setDraft({...draft,region:e.target.value,server:''})}}>{regions.map(([id,name])=><option key={id} value={id}>{t(name)}</option>)}</select></label><div><span>{t('종족')}</span><FactionPicker value={selectedRace} onChange={race=>{setDraftRace(race);setDraft({...draft,server:''})}}/></div><label>{t('타이머 서버')}<select aria-label={t('타이머 서버')} value={draft.server} onChange={e=>{setDraftRace(selectedRace);setDraft({...draft,server:e.target.value})}}><option value="">{t('서버 선택')}</option>{servers[draft.region].filter(s=>s.raceId===selectedRace).map(s=><option key={s.serverId} value={s.serverId}>{s.serverName} · {s.raceId===1?t('천족'):t('마족')}</option>)}</select></label></div>
   <p>{t('자동 일정은 선택한 서버 지역의 시계를 사용합니다. 수동 시간표를 어느 나라 시계로 입력할지 선택하세요. 같은 나라에 시간대가 여러 개면 도시까지 골라 주세요. 지역별 서머타임은 자동 반영됩니다. 서버 선택과는 별개입니다.')}</p>
   <fieldset disabled={!draft.server}><label>{t('시간 기준 국가·지역')}<select aria-label={t('시간 기준 국가·지역')} value={draftProfile.timeZone||(draftProfile.offset===null?'':'legacy')} onChange={e=>{const next={...draftProfile};if(e.target.value==='legacy'){delete next.timeZone}else if(e.target.value){next.timeZone=e.target.value}else{delete next.timeZone;next.offset=null}setDraft({...draft,profiles:{...draft.profiles,[draftKey]:next}})}}><option value="">{t('국가·지역 선택')}</option>{draftProfile.offset!==null&&<option value="legacy">{legacyClockLabel(draftProfile.offset).replace(/^기존 설정 유지/,t('기존 설정 유지'))}</option>}{TIME_ZONES.map(([zone,name])=><option key={zone} value={zone}>{t(name)}</option>)}</select></label>
   <label>{t('차원 콘텐츠')}<select aria-label={t('차원 콘텐츠')} value={draftProfile.dimension} onChange={e=>{const times={...draftProfile.times};delete times.dimension;change({dimension:e.target.value as 'invasion'|'rift',times})}}><option value="invasion">{t('차원 침공')}</option><option value="rift">{t('시공의 균열')}</option></select></label>
   <p>{t('매일 반복되는 출현 시각을 선택한 국가·지역의 시계로 입력하세요. 예: 09:00, 21:00. 처치 시각에 따라 바뀌는 보스는 고정 시간표로 정확히 예측할 수 없습니다.')}</p>
   {TIMER_IDS.map(id=><div className="event-timer-setting" key={id}><label><input type="checkbox" checked={!draftProfile.hidden.includes(id)} onChange={e=>change({hidden:e.target.checked?draftProfile.hidden.filter(x=>x!==id):[...draftProfile.hidden,id]})}/>{t('{0} 고정',[t(TIMER_NAMES[id])])}</label><label>{t('{0} 시간표',[t(TIMER_NAMES[id])])}<input aria-label={t('{0} 시간표',[t(TIMER_NAMES[id])])} maxLength={300} value={draftProfile.times[id]??''} placeholder={id==='shugo'?t('기본: 매시 00분'):id==='dimension'?(draftProfile.dimension==='invasion'?t('기본: 매시 30분'):t('기본: 서버 02시부터 3시간 간격')):t('자동 조회 · 수동 설정 시 HH:mm')} onChange={e=>change({times:{...draftProfile.times,[id]:e.target.value}})}/></label><button type="button" className="button ghost small" onClick={()=>{const times={...draftProfile.times};delete times[id];change({times})}}>{t('기본값')}</button></div>)}
   </fieldset>
   <p className="subtle">{t('슈고 매시 00분·차원 침공 매시 30분·시공의 균열 02시부터 3시간 간격은')} <a href="https://github.com/taengu/A2Tools-Plugins/tree/main/plugins/event-timers" target="_blank" rel="noreferrer">{t('A2Tools의 게임 데이터 기반 참고 일정')}</a>{t('입니다. 공식 공지로 확인된 일정은 아니며, 서버 지역 시계와 서머타임을 적용합니다. 보스 4종은 수동 시간표가 없으면 A2Tools 관측 기록을 자동 조회합니다. 등록한 반복 일정은 점검·일정 변경 시 수정해 주세요.')}</p>
   <div className="quick-actions"><button className="button primary" type="submit">{t('시간표 저장')}</button><button className="button secondary" type="button" onClick={()=>{setEditing(false);setError('')}}>{t('취소')}</button></div>
  </form>}
  {error&&<p className="event-timer-error" role="alert">{t(error)}</p>}
 </section>;
}
