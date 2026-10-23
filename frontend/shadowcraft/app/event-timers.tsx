import {Coins,Swords,Orbit,Skull,Eclipse,CircleHelp,Pin} from 'lucide-react';
import {BOSS_CATALOG,bossName,bossMap,legacyBossIds,selectedBossIds,setBossPinned,type CatalogBoss} from '@/lib/boss-catalog';
import {useLocale} from './locale';
import './timer-page.css';
import MaintenanceBanner from './maintenance-banner';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import directory from '@/lib/data/servers.json';
import FactionPicker from './faction-picker';
import {parseBossFeed,bossDisplay,type BossFeed} from '@/lib/boss-timers';
import {pinnedTimers,TIMER_IDS,TIMER_NAMES,TIMER_KEY,TIMER_SETTINGS_EVENT,type TimerId,type TimerSettings,emptySettings,emptyServer,parseSettings,parseTimes,nextContentOccurrence,nextScheduledBossOccurrence,countdown,TIME_ZONES,legacyClockLabel} from '@/lib/event-timers';
const regions=[['eu','유럽 EU'],['nae','북미 동부'],['naw','북미 서부'],['la','남미'],['as','아시아']];
const servers=directory as Record<string,{serverId:number;serverName:string;raceId:number}[]>;
export default function EventTimers({children,expanded=false}:{children?:ReactNode;expanded?:boolean}){
 const {t,locale}=useLocale();
 const [initial]=useState(()=>{try{const raw=localStorage.getItem(TIMER_KEY);return {settings:raw?parseSettings(raw):emptySettings(),error:''}}catch{return {settings:emptySettings(),error:'저장된 타이머 설정을 읽지 못했습니다. 다시 설정해 주세요.'}}});
 const [settings,setSettings]=useState(initial.settings),[draft,setDraft]=useState(initial.settings),[error,setError]=useState(initial.error),[editing,setEditing]=useState(false),[now,setNow]=useState(()=>Date.now());
 const [draftRace,setDraftRace]=useState(1);
 const [pinnedOnly,setPinnedOnly]=useState(false),[pageSearch,setPageSearch]=useState(''),[pageSide,setPageSide]=useState('all'),[fullscreen,setFullscreen]=useState(false);
 const fullscreenButton=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(!expanded)return;const changed=()=>{const active=document.fullscreenElement===header.current;setFullscreen(active);if(!active)fullscreenButton.current?.focus()};const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'&&document.fullscreenElement===header.current&&!header.current?.querySelector('#event-timer-pins,#event-timer-settings')){event.preventDefault();void document.exitFullscreen().catch(()=>{})}};document.addEventListener('fullscreenchange',changed);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('fullscreenchange',changed);document.removeEventListener('keydown',escape)}},[expanded]);
 async function toggleFullscreen(){try{if(document.fullscreenElement===header.current)await document.exitFullscreen();else await header.current?.requestFullscreen();}catch{setError('전체 화면을 열지 못했습니다. 현재 페이지에서도 모든 타이머를 볼 수 있습니다.')}}
 const [live,setLive]=useState<{key:string;feed:BossFeed;offset:number}|null>(null),[liveFailed,setLiveFailed]=useState('');
 const header=useRef<HTMLElement>(null),pinButton=useRef<HTMLButtonElement>(null),settingsButton=useRef<HTMLButtonElement>(null);
 const [choosingPins,setChoosingPins]=useState(false),[bossSearch,setBossSearch]=useState(''),[bossSide,setBossSide]=useState('all');
 useEffect(()=>{
  if(!editing&&!choosingPins)return;
  const trigger=choosingPins?pinButton.current:settingsButton.current;
  const panel=header.current?.querySelector<HTMLElement>(choosingPins?'#event-timer-pins':'#event-timer-settings');
  panel?.querySelector<HTMLElement>('input,select,button')?.focus();
  const close=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();setEditing(false);setChoosingPins(false);trigger?.focus()}};
  const outside=(e:PointerEvent)=>{if(!header.current?.contains(e.target as Node)){setEditing(false);setChoosingPins(false)}};
  const focusOutside=(e:FocusEvent)=>{if(choosingPins&&!header.current?.contains(e.target as Node))setChoosingPins(false)};
  document.addEventListener('focusin',focusOutside);document.addEventListener('keydown',close);document.addEventListener('pointerdown',outside);
  return()=>{document.removeEventListener('focusin',focusOutside);document.removeEventListener('keydown',close);document.removeEventListener('pointerdown',outside)};
 },[editing,choosingPins]);
 function persist(next:TimerSettings){
  try{const valid=parseSettings(JSON.stringify(next));localStorage.setItem(TIMER_KEY,JSON.stringify(valid));setSettings(valid);window.dispatchEvent(new Event(TIMER_SETTINGS_EVENT));setError('')}
  catch(e){setError(e instanceof Error?e.message:'설정 저장에 실패했습니다.')}
 }
 function pin(id:TimerId,checked:boolean){
  try{const selected=pinnedTimers(settings);const next=parseSettings(JSON.stringify({...settings,pinned:TIMER_IDS.filter(x=>x===id?checked:selected.includes(x))}));localStorage.setItem(TIMER_KEY,JSON.stringify(next));setSettings(next);window.dispatchEvent(new Event(TIMER_SETTINGS_EVENT));setError('')}
  catch(e){setError(e instanceof Error?e.message:'설정 저장에 실패했습니다.')}
 }
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
 useEffect(()=>{if(expanded)return;const element=header.current;if(!element)return;const observer=new ResizeObserver(()=>document.documentElement.style.setProperty('--a2bc-timer-height',`${element.getBoundingClientRect().height}px`));observer.observe(element);return()=>{observer.disconnect();document.documentElement.style.removeProperty('--a2bc-timer-height')}},[expanded]);
 useEffect(()=>{function changed(e:StorageEvent){if(e.key!==TIMER_KEY&&e.key!==null)return;try{setSettings(e.newValue?parseSettings(e.newValue):emptySettings())}catch{setError('다른 탭의 타이머 설정을 읽지 못했습니다. 현재 설정을 유지합니다.')}}window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed)},[]);
 const key=settings.region+':'+settings.server,profile=settings.profiles[key]||emptyServer();
 const selectedRace=servers[draft.region].find(s=>String(s.serverId)===draft.server)?.raceId||draftRace;
 const draftKey=draft.region+':'+draft.server,draftProfile=draft.profiles[draftKey]||emptyServer();
 const server=servers[settings.region].find(s=>String(s.serverId)===settings.server);
 const race=server?.raceId||1,aliases=legacyBossIds(race);
 const current=live?.key===key?live:null;
 const catalog:CatalogBoss[]=[...BOSS_CATALOG,...[...new Set([...Object.keys(current?.feed.allBosses||{}),...settings.pinnedBosses||[]])].filter(id=>!BOSS_CATALOG.some(b=>b.id===id)).map(id=>({id,side:'unknown',names:{en:t('보스 #{0} · 이름 미확인',[id])},maps:{}}))];
 const chosenBosses=selectedBossIds(settings,race);
 const eventPins=pinnedTimers(settings).filter(id=>!aliases[id]);
 const visibleBosses=catalog.filter(b=>(bossSide==='all'||(b.side||'abyss')===bossSide)&&[...Object.values(b.names),...Object.values(b.maps),b.id].some(name=>name.toLocaleLowerCase().includes(bossSearch.trim().toLocaleLowerCase())));
 const sideLabel=(side:string|null)=>t(side==='elyos'?'천족':side==='asmodian'?'마족':side==='unknown'?'진영 미확인':'어비스');
 const pinnedCards=[...eventPins.map(id=>({id,legacy:id,boss:undefined as CatalogBoss|undefined})),...chosenBosses.map(id=>({id,legacy:Object.entries(aliases).find(([,value])=>value===id)?.[0] as TimerId|undefined,boss:catalog.find(b=>b.id===id)}))];
 const allCards=[...(['shugo','dimension'] as TimerId[]).map(id=>({id,legacy:id,boss:undefined as CatalogBoss|undefined})),...catalog.map(boss=>({id:boss.id,legacy:Object.entries(aliases).find(([,value])=>value===boss.id)?.[0] as TimerId|undefined,boss}))];
 const cards=(expanded?(pinnedOnly?pinnedCards:allCards):pinnedCards).filter(({boss,legacy})=>!expanded||((pageSide==='all'||(boss?.side|| (boss?'abyss':'events'))===pageSide)&&(boss?[...Object.values(boss.names),...Object.values(boss.maps)]:[t(label(legacy!))]).some(name=>name.toLocaleLowerCase().includes(pageSearch.trim().toLocaleLowerCase()))));
 function change(p:Partial<typeof draftProfile>){setDraft({...draft,profiles:{...draft.profiles,[draftKey]:{...draftProfile,...p}}})}
 function save(){try{const profileToSave={...draftProfile};if(!servers[draft.region].some(s=>String(s.serverId)===draft.server))throw Error('서버를 선택해 주세요.');if(profileToSave.offset===null&&!profileToSave.timeZone)profileToSave.timeZone=Intl.DateTimeFormat().resolvedOptions().timeZone&&TIME_ZONES.some(([zone])=>zone===Intl.DateTimeFormat().resolvedOptions().timeZone)?Intl.DateTimeFormat().resolvedOptions().timeZone:'Asia/Seoul';for(const value of Object.values(profileToSave.times))parseTimes(value);const next=parseSettings(JSON.stringify({...draft,profiles:{...draft.profiles,[draftKey]:profileToSave}}));localStorage.setItem(TIMER_KEY,JSON.stringify(next));window.dispatchEvent(new Event(TIMER_SETTINGS_EVENT));setSettings(next);setEditing(false);settingsButton.current?.focus();setError('')}catch(e){setError(e instanceof Error?e.message:'설정 저장에 실패했습니다.')}}
 function label(id:TimerId){return id==='dimension'?(profile.dimension==='invasion'?'차원 침공':'시공의 균열'):TIMER_NAMES[id]}
 return <section ref={header} className={expanded?"event-timer-header event-timer-page":"event-timer-header"} aria-label={t(expanded?'콘텐츠 타이머':'고정 콘텐츠 타이머')}>
  <div className="event-timer-toolbar">{expanded?<h1>{t('콘텐츠 타이머')}</h1>:<strong>{t('콘텐츠 타이머')}</strong>}<span>{server?`${t(regions.find(r=>r[0]===settings.region)?.[1])} · ${server.serverName} · ${profile.timeZone?t(TIME_ZONES.find(([zone])=>zone===profile.timeZone)?.[1]):t('기존 시간 기준')}`:''}</span>{children}<div className="event-timer-controls"><button ref={pinButton} type="button" className="button secondary small" aria-expanded={choosingPins} aria-controls="event-timer-pins" onClick={()=>{setEditing(false);setChoosingPins(!choosingPins)}}>{t('고정할 콘텐츠')} <span>{pinnedCards.length}</span></button><button ref={settingsButton} className="button ghost small" aria-expanded={editing} aria-controls="event-timer-settings" onClick={()=>{setChoosingPins(false);setDraft(settings);setDraftRace(servers[settings.region].find(s=>String(s.serverId)===settings.server)?.raceId||1);setEditing(!editing)}}>{t('서버·타이머 설정')}</button>{expanded&&<button ref={fullscreenButton} type="button" className="button secondary small" onClick={toggleFullscreen}>{t(fullscreen?'전체 화면 닫기':'타이머만 크게 보기')}</button>}</div></div>
  <MaintenanceBanner/>
  {expanded&&<div className="timer-page-filters">
   <p>{t('출현 시간을 한눈에 확인하세요. 핀 버튼으로 헤더에 고정하거나 해제할 수 있습니다.')}</p>
   <div className="timer-page-view" role="group" aria-label={t('표시할 콘텐츠')}><button type="button" className="button secondary" aria-pressed={!pinnedOnly} onClick={()=>setPinnedOnly(false)}>{t('전체 콘텐츠')}</button><button type="button" className="button secondary" aria-pressed={pinnedOnly} onClick={()=>setPinnedOnly(true)}>{t('내가 고정한 콘텐츠')}</button></div>
   <label>{t('콘텐츠 검색')}<input type="search" value={pageSearch} onChange={e=>setPageSearch(e.target.value)} placeholder={t('이름 또는 지역 검색')}/></label>
   <div className="event-boss-categories" role="group" aria-label={t('타이머 분류')}>{[['all','전체'],['elyos','천족'],['asmodian','마족'],['abyss','어비스'],['events','이벤트'],...(catalog.some(b=>b.side==='unknown')?[['unknown','진영 미확인']]:[])].map(([value,name])=><button key={value} type="button" className="button secondary small" aria-pressed={pageSide===value} onClick={()=>setPageSide(value)}>{t(name)}</button>)}</div>
   {server&&<p className="subtle">{t('표시 중 {0}개',[cards.length])} · {t('관측 기록과 참고 일정이며 실제 출현과 다를 수 있습니다.')}</p>}
  </div>}
  {choosingPins&&<section id="event-timer-pins" className="event-timer-pins" aria-label={t('고정할 콘텐츠')}><h3>{t('고정할 콘텐츠')}</h3><p>{t('선택한 콘텐츠는 이 브라우저의 모든 페이지와 서버에서 유지됩니다.')}</p>
   <div className="event-pin-options">{(['shugo','dimension'] as TimerId[]).map(id=><label key={id}><input type="checkbox" checked={pinnedTimers(settings).includes(id)} onChange={e=>pin(id,e.target.checked)}/>{t(label(id))}</label>)}</div>
   <h4>{t('전체 보스 목록')} · {catalog.length}</h4><p>{t('관측형 보스는 서버별 관측 기록을 사용합니다. 정기 출현 보스는 서버 시간대의 참고 일정이며 실제 출현을 확인한 것은 아닙니다.')}</p>
   <div className="event-boss-filters"><label>{t('보스 검색')}<input type="search" value={bossSearch} onChange={e=>setBossSearch(e.target.value)} placeholder={t('이름 또는 지역 검색')}/></label><div className="event-boss-categories" role="group" aria-label={t('진영 필터')}>{[['all','전체'],['elyos','천족'],['asmodian','마족'],['abyss','어비스'],...(catalog.some(b=>b.side==='unknown')?[['unknown','진영 미확인']]:[])].map(([value,name])=><button key={value} type="button" className="button secondary small" aria-pressed={bossSide===value} onClick={()=>setBossSide(value)}>{t(name)}</button>)}</div></div>
   <div className="event-pin-options event-boss-options">{visibleBosses.map(b=><label key={b.id}><input type="checkbox" aria-label={`${bossName(b,locale)} · ${sideLabel(b.side)}`} checked={chosenBosses.includes(b.id)} onChange={e=>persist(setBossPinned(settings,race,b.id,e.target.checked))}/><span>{bossName(b,locale)}<small>{sideLabel(b.side)} · {bossMap(b,locale)||t('지역 미확인')}</small><small>{t(b.schedule?'정기 출현 · 참고 일정':'관측 기록')}</small></span></label>)}</div>{visibleBosses.length===0&&<p>{t('검색 결과가 없습니다.')}</p>}
   <button type="button" className="button secondary small" onClick={()=>{setChoosingPins(false);pinButton.current?.focus()}}>{t('완료')}</button></section>}
  {server?<div className="event-timer-strip" aria-label={expanded?t('콘텐츠 타이머 목록'):undefined}>{cards.map(({id,legacy,boss})=>{
   const manual=legacy!==undefined&&profile.times[legacy]!==undefined;
   const automatic=!!boss&&!boss.schedule&&!manual,clock=now+(current?.offset||0);
   const state=automatic?bossDisplay(current?.feed||null,id,clock,liveFailed===key):null;
   const timerNow=boss?.schedule?clock:now;
   const target=boss?.schedule?nextScheduledBossOccurrence(timerNow,boss.schedule,settings.region):legacy?nextContentOccurrence(now,legacy,profile,settings.region):null;
   const remaining=state?(state.target?state.target-clock:0):target===null?0:target-timerNow;
   const imminent=remaining>0&&remaining<60*60*1000;
   const record=current?.feed.allBosses?.[id]||(legacy?current?.feed.bosses[legacy]:undefined);
   const kind=boss?(boss.side===null||boss.side==='abyss'?'abyss':boss.side==='elyos'||boss.side==='asmodian'?'field':'unknown'):legacy==='shugo'?'shugo':legacy==='dimension'?profile.dimension:'unknown';
   const category={shugo:{Icon:Coins,label:'슈고'},invasion:{Icon:Swords,label:'차원 침공'},rift:{Icon:Orbit,label:'시공의 균열'},field:{Icon:Skull,label:'필드 보스'},abyss:{Icon:Eclipse,label:'어비스 보스'},unknown:{Icon:CircleHelp,label:'분류 미확인'}}[kind];
   const {Icon}=category;
   const name=boss?bossName(boss,locale):t(label(legacy!));
   const isPinned=boss?chosenBosses.includes(id):eventPins.includes(legacy!);
   return <div className={`event-timer-card${imminent?' event-timer-card-imminent':''}`} key={id} data-boss-id={boss?id:undefined} data-timer-kind={kind}>
    <b className={expanded?'timer-card-title':undefined} title={boss?bossMap(boss,locale):undefined}>
     {expanded&&<span className={`timer-kind-icon timer-kind-${kind}`} aria-hidden="true"><Icon size={20}/></span>}
     <span>{name}{expanded?<span className="event-boss-side">{t(boss?category.label:'이벤트')}{kind==='field'&&boss?' · '+sideLabel(boss.side):''}</span>:boss&&<span className="event-boss-side">{sideLabel(boss.side)}</span>}</span>
    </b>
    <strong>{state?(state.target?countdown(state.target,clock):t(state.text)):target===null?t('시간표 미등록'):countdown(target,timerNow)}</strong>
    <small title={record?t('마지막 관측: {0}',[new Date(record.reportedAt).toLocaleString()]):undefined}>{state?t(state.note):target!==null?(manual?t('등록 시간표'):t('서버 기준 · 참고 일정')):t('다음 출현 미확인')}</small>
    {expanded&&<button type="button" className="button ghost small timer-card-pin" aria-label={t('{0} 헤더에 고정',[name])} title={t(isPinned?'고정됨':'헤더에 고정')} aria-pressed={isPinned} onClick={()=>boss?persist(setBossPinned(settings,race,id,!chosenBosses.includes(id))):pin(legacy!,!eventPins.includes(legacy!))}><Pin size={15} aria-hidden="true"/></button>}
   </div>})}{cards.length===0&&<p className="timer-no-results">{t(expanded?(pageSearch||pageSide!=='all'?'조건에 맞는 콘텐츠가 없습니다. 검색어나 분류를 바꿔 보세요.':'고정한 콘텐츠가 없습니다. 전체 콘텐츠에서 헤더에 고정할 항목을 선택하세요.'):'고정한 콘텐츠가 없습니다. ‘고정할 콘텐츠’에서 선택하세요.')}</p>}</div>:<p className="event-timer-empty">{t('서버를 고르면 보스·콘텐츠 출현 시간이 여기에 표시됩니다.')}{expanded&&<button type="button" className="button primary" onClick={()=>{setChoosingPins(false);setDraft(settings);setEditing(true)}}>{t('서버 선택')}</button>}</p>}
  {editing&&<form id="event-timer-settings" className="event-timer-settings" onSubmit={e=>{e.preventDefault();save()}}>
   <small className="subtle">{t('보스 데이터:')} <span>A2Tools</span> {t('· 관측 기록 기반 · 서버별 약 1분 갱신')}</small>
   <h3>{t('서버별 시간표 설정')}</h3><div className="form-grid"><label>{t('글로벌 지역')}<select aria-label={t('글로벌 지역')} value={draft.region} onChange={e=>{setDraftRace(selectedRace);setDraft({...draft,region:e.target.value,server:''})}}>{regions.map(([id,name])=><option key={id} value={id}>{t(name)}</option>)}</select></label><div><span>{t('종족')}</span><FactionPicker value={selectedRace} onChange={race=>{setDraftRace(race);setDraft({...draft,server:''})}}/></div><label>{t('타이머 서버')}<select aria-label={t('타이머 서버')} value={draft.server} onChange={e=>{setDraftRace(selectedRace);setDraft({...draft,server:e.target.value})}}><option value="">{t('서버 선택')}</option>{servers[draft.region].filter(s=>s.raceId===selectedRace).map(s=><option key={s.serverId} value={s.serverId}>{s.serverName} · {s.raceId===1?t('천족'):t('마족')}</option>)}</select></label></div>
   <p>{t('자동 일정은 선택한 서버 지역의 시계를 사용합니다. 수동 시간표를 어느 나라 시계로 입력할지 선택하세요. 같은 나라에 시간대가 여러 개면 도시까지 골라 주세요. 지역별 서머타임은 자동 반영됩니다. 서버 선택과는 별개입니다.')}</p>
   <fieldset disabled={!draft.server}><label>{t('시간 기준 국가·지역')}<select aria-label={t('시간 기준 국가·지역')} value={draftProfile.timeZone||(draftProfile.offset===null?'':'legacy')} onChange={e=>{const next={...draftProfile};if(e.target.value==='legacy'){delete next.timeZone}else if(e.target.value){next.timeZone=e.target.value}else{delete next.timeZone;next.offset=null}setDraft({...draft,profiles:{...draft.profiles,[draftKey]:next}})}}><option value="">{t('국가·지역 선택')}</option>{draftProfile.offset!==null&&<option value="legacy">{legacyClockLabel(draftProfile.offset).replace(/^기존 설정 유지/,t('기존 설정 유지'))}</option>}{TIME_ZONES.map(([zone,name])=><option key={zone} value={zone}>{t(name)}</option>)}</select></label>
   <label>{t('차원 콘텐츠')}<select aria-label={t('차원 콘텐츠')} value={draftProfile.dimension} onChange={e=>{const times={...draftProfile.times};delete times.dimension;change({dimension:e.target.value as 'invasion'|'rift',times})}}><option value="invasion">{t('차원 침공')}</option><option value="rift">{t('시공의 균열')}</option></select></label>
   <p>{t('매일 반복되는 출현 시각을 선택한 국가·지역의 시계로 입력하세요. 예: 09:00, 21:00. 처치 시각에 따라 바뀌는 보스는 고정 시간표로 정확히 예측할 수 없습니다.')}</p>
   {TIMER_IDS.map(id=><div className="event-timer-setting" key={id}><label><input type="checkbox" checked={legacyBossIds(selectedRace)[id]?selectedBossIds(draft,selectedRace).includes(legacyBossIds(selectedRace)[id]!):pinnedTimers(draft).includes(id)} onChange={e=>setDraft(legacyBossIds(selectedRace)[id]?setBossPinned(draft,selectedRace,legacyBossIds(selectedRace)[id]!,e.target.checked):{...draft,pinned:TIMER_IDS.filter(x=>x===id?e.target.checked:pinnedTimers(draft).includes(x))})}/>{t('{0} 고정',[t(TIMER_NAMES[id])])}</label><label>{t('{0} 시간표',[t(TIMER_NAMES[id])])}<input aria-label={t('{0} 시간표',[t(TIMER_NAMES[id])])} maxLength={300} value={draftProfile.times[id]??''} placeholder={id==='shugo'?t('기본: 매시 00분'):id==='dimension'?(draftProfile.dimension==='invasion'?t('기본: 매시 30분'):t('기본: 서버 02시부터 3시간 간격')):t('자동 조회 · 수동 설정 시 HH:mm')} onChange={e=>change({times:{...draftProfile.times,[id]:e.target.value}})}/></label><button type="button" className="button ghost small" onClick={()=>{const times={...draftProfile.times};delete times[id];change({times})}}>{t('기본값')}</button></div>)}
   </fieldset>
   <p className="subtle">{t('슈고 매시 00분·차원 침공 매시 30분·시공의 균열 02시부터 3시간 간격은')} <span>{t('A2Tools의 게임 데이터 기반 참고 일정')}</span>{t('입니다. 서버 지역 시계와 서머타임을 적용합니다. 전체 보스는 ‘고정할 콘텐츠’에서 선택하세요. 보스 시간은 A2Tools 관측 기록 또는 정기 출현 참고 일정을 사용하며, 기존 보스의 수동 시간표는 우선 적용됩니다.')}</p>
   <div className="quick-actions"><button className="button primary" type="submit">{t('시간표 저장')}</button><button className="button secondary" type="button" onClick={()=>{setEditing(false);setError('')}}>{t('취소')}</button></div>
  </form>}
  {error&&<p className="event-timer-error" role="alert">{t(error)}</p>}
 </section>;
}
