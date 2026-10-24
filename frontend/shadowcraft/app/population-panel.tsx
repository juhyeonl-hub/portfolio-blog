import {settingsStorage} from '../lib/account-settings';
import OfficialLink from './official-link';
import {useLocale} from './locale';
import {useEffect,useState} from 'react';
import directory from '../lib/data/servers.json';
import {TIMER_KEY,TIMER_SETTINGS_EVENT,parseSettings} from '../lib/event-timers';
import {ArrowUpRight} from 'lucide-react';
import {CLASSES} from '../lib/classes';
import snapshot from '../lib/data/population.json';
import pairings from '../lib/data/server-pairs.json';

const regions=[['eu','유럽'],['nae','북미 동부'],['naw','북미 서부'],['la','남미'],['as','아시아']];

/** The content timer's server as a population entry (ids are "<region>/<lowercase name>"), or null when none is saved. */
function timerServer():{region:string;race:number;id:string}|null{
 try{const raw=settingsStorage.getItem(TIMER_KEY);if(!raw)return null;const settings=parseSettings(raw);
  const server=(directory as Record<string,{serverId:number;serverName:string;raceId:number}[]>)[settings.region]?.find(s=>String(s.serverId)===settings.server);
  const entry=server&&snapshot.servers.find(s=>s.id===settings.region+'/'+server.serverName.toLowerCase()&&s.race===server.raceId);
  return entry?{region:entry.region,race:entry.race,id:entry.id}:null;}catch{return null;}
}
export default function PopulationPanel(){
 const {t,locale}=useLocale();const number=new Intl.NumberFormat(locale);
 // Starts from the server saved in the content timer (one "my server" for both); choosing here does not change the timer.
 const [mine]=useState(timerServer);
 const [region,setRegion]=useState(mine?.region||'eu');
 const [race,setRace]=useState(mine?.race||1);
 const [serverId,setServerId]=useState(mine?.id||'');
 useEffect(()=>{function follow(){const next=timerServer();if(next){setRegion(next.region);setRace(next.race);setServerId(next.id);}}
  window.addEventListener(TIMER_SETTINGS_EVENT,follow);return()=>window.removeEventListener(TIMER_SETTINGS_EVENT,follow);},[]);
 const servers=snapshot.servers.filter(s=>s.region===region&&s.race===race);
 const selected=servers.find(s=>s.id===serverId);
 const selectedPair=pairings.pairs.find(ids=>ids.includes(serverId));
 const sides=[1,2].map(id=>({id,name:selected?snapshot.servers.find(s=>s.region===region&&s.race===id&&selectedPair?.includes(s.id))?.name||(id===1?t('천족'):t('마족')):(id===1?t('천족'):t('마족'))}));
 function changeRace(value:number){
  if(value===race)return;
  const pair=pairings.pairs.find(ids=>ids.includes(serverId));
  const opponent=snapshot.servers.find(s=>s.region===region&&s.race===value&&pair?.includes(s.id));
  setRace(value);
  setServerId(opponent?.id||'');
 }
 const samples=selected?[selected]:servers;
 const rows=CLASSES.map(c=>({...c,count:samples.reduce((sum,s)=>sum+(s.counts[c.key as keyof typeof s.counts]||0),0)})).sort((a,b)=>b.count-a.count);
 const total=rows.reduce((sum,c)=>sum+c.count,0);
 const stale=Date.now()-Date.parse(snapshot.fetchedAt)>7*86400000;
 return <section className="panel population-panel" aria-label={t('서버별 직업 분포')}>
  <div className="population-heading"><div><span className="eyebrow">{t('서버·직업')}</span><h2>{t('서버별 직업 분포')}</h2><p>{t('내 서버에는 어떤 직업이 많을까요?')}</p></div><OfficialLink className="button ghost small" href={snapshot.source} target="_blank" rel="noreferrer">{t('외부 통계 보기')} <ArrowUpRight size={14}/></OfficialLink></div>
  <div className="population-filters">
   <label>{t('지역')}<select aria-label={t('지역')} value={region} onChange={e=>{setRegion(e.target.value);setServerId('')}}>{regions.map(([id,name])=><option key={id} value={id}>{t(name)}</option>)}</select></label>
   <div className="population-matchup-field"><span>{selected?t('서버 대조'):t('종족')}</span><div className="population-matchup" role="group" aria-label={t('진영별 서버 대조')}>
    <button type="button" data-race="1" aria-pressed={race===1} className={'button secondary '+(race===1?'selected':'')} onClick={()=>changeRace(1)}>{sides[0].name}</button>
    <span className="population-versus">VS</span>
    <button type="button" data-race="2" aria-pressed={race===2} className={'button secondary '+(race===2?'selected':'')} onClick={()=>changeRace(2)}>{sides[1].name}</button>
   </div></div>
   <label>{t('서버')}<select aria-label={t('서버')} value={selected?.id||''} onChange={e=>setServerId(e.target.value)}><option value="">{race===1?t('천족'):t('마족')} {t('전체 서버')}</option>{servers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
  </div>
  {selected&&<p className="population-pair-note">{t('종족을 바꾸면 상대 서버로 전환됩니다.')} <OfficialLink href={pairings.source} target="_blank" rel="noreferrer">{t('매칭표')} ↗</OfficialLink> · {pairings.checkedAt} {t('확인')}</p>}
  <p className="population-summary" aria-live="polite">{t(regions.find(r=>r[0]===region)?.[1]||'')} · {race===1?t('천족'):t('마족')} · {selected?.name||t('전체 서버')}<strong>{t('레벨 45 캐릭터')} {number.format(total)}{locale==='ko'||locale==='ja'?'':' '}{t('명')}</strong></p>
  {total>0?<ul className="population-bars" aria-label={t('직업별 인원과 비율')}>{rows.map(c=><li key={c.key} data-class={c.key}><div><img src={'/shadowcraft/game/images/ui/resource/texture/icon/ut_class_'+c.key+'_large.webp'} alt=""/><b>{t(c.name)}</b><span>{number.format(c.count)}{locale==='ko'||locale==='ja'?'':' '}{t('명')}</span><strong>{(100*c.count/total).toFixed(1)}%</strong></div><div className="population-track" aria-hidden="true"><i style={{width:100*c.count/total+'%'}}/></div></li>)}</ul>:<p role="status">{t('선택한 서버의 수집된 캐릭터가 없습니다.')}</p>}
  <div className="population-source"><p>{t('AION2 Tier List 수집 캐릭터 기준 · 서버 전체 인원이나 실시간 접속 비율이 아닙니다.')}</p><p>{t('집계본 확인')}: <time dateTime={snapshot.fetchedAt}>{new Date(snapshot.fetchedAt).toLocaleString(locale)}</time> · {t('수동 갱신')}{stale?' · '+t('7일 이상 지난 자료'):''} · <OfficialLink href={snapshot.methodology} target="_blank" rel="noreferrer">{t('집계 기준')} ↗</OfficialLink></p></div>
 </section>;
}
