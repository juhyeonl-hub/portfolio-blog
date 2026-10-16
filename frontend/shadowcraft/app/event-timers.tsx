import {useEffect,useRef,useState} from 'react';
import directory from '@/lib/data/servers.json';
import {TIMER_IDS,TIMER_NAMES,TIMER_KEY,type TimerId,type TimerSettings,emptySettings,emptyServer,parseSettings,parseTimes,scheduleMinutes,nextOccurrence,countdown} from '@/lib/event-timers';
const regions=[['eu','유럽 EU'],['nae','북미 동부'],['naw','북미 서부'],['la','남미'],['as','아시아']];
const servers=directory as Record<string,{serverId:number;serverName:string;raceId:number}[]>;
export default function EventTimers(){
 const [initial]=useState(()=>{try{const raw=localStorage.getItem(TIMER_KEY);return {settings:raw?parseSettings(raw):emptySettings(),error:''}}catch{return {settings:emptySettings(),error:'저장된 타이머 설정을 읽지 못했습니다. 다시 설정해 주세요.'}}});
 const [settings,setSettings]=useState(initial.settings),[draft,setDraft]=useState(initial.settings),[error,setError]=useState(initial.error),[editing,setEditing]=useState(false),[now,setNow]=useState(()=>Date.now());
 const header=useRef<HTMLElement>(null);
 useEffect(()=>{const tick=()=>setNow(Date.now());const timer=setInterval(tick,1000);document.addEventListener('visibilitychange',tick);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',tick)}},[]);
 useEffect(()=>{const element=header.current;if(!element)return;const observer=new ResizeObserver(()=>document.documentElement.style.setProperty('--a2bc-timer-height',`${element.getBoundingClientRect().height}px`));observer.observe(element);return()=>{observer.disconnect();document.documentElement.style.removeProperty('--a2bc-timer-height')}},[]);
 useEffect(()=>{function changed(e:StorageEvent){if(e.key!==TIMER_KEY&&e.key!==null)return;try{setSettings(e.newValue?parseSettings(e.newValue):emptySettings())}catch{setError('다른 탭의 타이머 설정을 읽지 못했습니다. 현재 설정을 유지합니다.')}}window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed)},[]);
 const key=settings.region+':'+settings.server,profile=settings.profiles[key]||emptyServer();
 const draftKey=draft.region+':'+draft.server,draftProfile=draft.profiles[draftKey]||emptyServer();
 const server=servers[settings.region].find(s=>String(s.serverId)===settings.server);
 function change(p:Partial<typeof draftProfile>){setDraft({...draft,profiles:{...draft.profiles,[draftKey]:{...draftProfile,...p}}})}
 function save(){try{if(!servers[draft.region].some(s=>String(s.serverId)===draft.server))throw Error('서버를 선택해 주세요.');if(draftProfile.offset===null)throw Error('게임 서버 시계의 UTC 기준을 선택해 주세요.');for(const value of Object.values(draftProfile.times))parseTimes(value);const next=parseSettings(JSON.stringify({...draft,profiles:{...draft.profiles,[draftKey]:draftProfile}}));localStorage.setItem(TIMER_KEY,JSON.stringify(next));setSettings(next);setEditing(false);setError('')}catch(e){setError(e instanceof Error?e.message:'설정 저장에 실패했습니다.')}}
 function label(id:TimerId){return id==='dimension'?(profile.dimension==='invasion'?'차원 침공':'시공의 균열'):TIMER_NAMES[id]}
 return <section ref={header} className="event-timer-header" aria-label="고정 콘텐츠 타이머">
  <div className="event-timer-toolbar"><strong>콘텐츠 타이머</strong><span>{server?`${regions.find(r=>r[0]===settings.region)?.[1]} · ${server.serverName}`:'서버를 선택하세요'}</span><button className="button ghost small" aria-expanded={editing} aria-controls="event-timer-settings" onClick={()=>{setDraft(settings);setEditing(!editing)}}>서버·타이머 설정</button></div>
  <div className="event-timer-strip">{TIMER_IDS.filter(id=>!profile.hidden.includes(id)).map(id=>{const target=server?nextOccurrence(now,scheduleMinutes(id,profile),profile.offset):null;return <div className="event-timer-card" key={id}><b>{label(id)}</b><strong>{target===null?(server?'시간표 미등록':'서버 설정 필요'):countdown(target,now)}</strong><small>{target!==null?(profile.times[id]!==undefined?'등록 시간표':'참고 일정'):'다음 출현 미확인'}</small></div>})}{profile.hidden.length===6&&<span>고정할 타이머를 설정에서 선택하세요.</span>}</div>
  {editing&&<form id="event-timer-settings" className="event-timer-settings" onSubmit={e=>{e.preventDefault();save()}}>
   <h3>서버별 시간표 설정</h3><div className="form-grid"><label>글로벌 지역<select aria-label="글로벌 지역" value={draft.region} onChange={e=>setDraft({...draft,region:e.target.value,server:''})}>{regions.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><label>타이머 서버<select aria-label="타이머 서버" value={draft.server} onChange={e=>setDraft({...draft,server:e.target.value})}><option value="">서버 선택</option>{servers[draft.region].map(s=><option key={s.serverId} value={s.serverId}>{s.serverName} · {s.raceId===1?'천족':'마족'}</option>)}</select></label></div>
   <p>시간표는 선택한 서버에 따로 저장됩니다. 게임의 서버 시계 기준을 선택하세요. PC 시간대와 다를 수 있습니다.</p>
   <fieldset disabled={!draft.server}><label>서버 시계<select aria-label="서버 시계" value={draftProfile.offset===null?'':draftProfile.offset} onChange={e=>change({offset:e.target.value===''?null:Number(e.target.value)})}><option value="">UTC 기준 선택</option>{Array.from({length:53},(_,i)=>-720+i*30).map(m=><option key={m} value={m}>UTC{m>=0?'+':'−'}{String(Math.floor(Math.abs(m)/60)).padStart(2,'0')}:{String(Math.abs(m)%60).padStart(2,'0')}</option>)}</select></label>
   <label>차원 콘텐츠<select aria-label="차원 콘텐츠" value={draftProfile.dimension} onChange={e=>{const times={...draftProfile.times};delete times.dimension;change({dimension:e.target.value as 'invasion'|'rift',times})}}><option value="invasion">차원 침공</option><option value="rift">시공의 균열</option></select></label>
   <p>매일 반복되는 출현 시각을 서버 시계로 입력하세요. 예: 09:00, 21:00. 처치 시각에 따라 바뀌는 보스는 고정 시간표로 정확히 예측할 수 없습니다.</p>
   {TIMER_IDS.map(id=><div className="event-timer-setting" key={id}><label><input type="checkbox" checked={!draftProfile.hidden.includes(id)} onChange={e=>change({hidden:e.target.checked?draftProfile.hidden.filter(x=>x!==id):[...draftProfile.hidden,id]})}/>{TIMER_NAMES[id]} 고정</label><label>{TIMER_NAMES[id]} 시간표<input aria-label={TIMER_NAMES[id]+' 시간표'} maxLength={300} value={draftProfile.times[id]??''} placeholder={id==='shugo'?'기본: 매시 00분':id==='dimension'&&draftProfile.dimension==='invasion'?'기본: 매시 30분':'미등록 · HH:mm, HH:mm'} onChange={e=>change({times:{...draftProfile.times,[id]:e.target.value}})}/></label><button type="button" className="button ghost small" onClick={()=>{const times={...draftProfile.times};delete times[id];change({times})}}>기본값</button></div>)}
   </fieldset>
   <p className="subtle">슈고 매시 00분·차원 침공 매시 30분은 <a href="https://aion2.tools/guides/event-timers" target="_blank" rel="noreferrer">공개 참고 일정</a>입니다. 공식 실시간 연동이 아니며 보스 4종·시공의 균열은 확인된 서버 시간표가 없습니다. 등록한 반복 일정은 점검·일정 변경 시 수정해 주세요.</p>
   <div className="quick-actions"><button className="button primary" type="submit">시간표 저장</button><button className="button secondary" type="button" onClick={()=>{setEditing(false);setError('')}}>취소</button></div>
  </form>}
  {error&&<p className="event-timer-error" role="alert">{error}</p>}
 </section>;
}
