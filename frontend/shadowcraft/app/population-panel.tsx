import {useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {CLASSES} from '../lib/classes';
import snapshot from '../lib/data/population.json';
import FactionPicker from './faction-picker';

const regions=[['eu','유럽'],['nae','북미 동부'],['naw','북미 서부'],['la','남미'],['as','아시아']];
const number=new Intl.NumberFormat('ko-KR');
export default function PopulationPanel(){
 const [region,setRegion]=useState('eu');
 const [race,setRace]=useState(1);
 const [serverId,setServerId]=useState('');
 const servers=snapshot.servers.filter(s=>s.region===region&&s.race===race);
 const selected=servers.find(s=>s.id===serverId);
 const samples=selected?[selected]:servers;
 const rows=CLASSES.map(c=>({...c,count:samples.reduce((sum,s)=>sum+(s.counts[c.key as keyof typeof s.counts]||0),0)})).sort((a,b)=>b.count-a.count);
 const total=rows.reduce((sum,c)=>sum+c.count,0);
 const stale=Date.now()-Date.parse(snapshot.fetchedAt)>7*86400000;
 return <section className="panel population-panel" aria-label="서버별 직업 분포">
  <div className="population-heading"><div><span className="eyebrow">SERVER & CLASS</span><h2>서버별 직업 분포</h2><p>내 서버에는 어떤 직업이 많을까요?</p></div><a className="button ghost small" href={snapshot.source} target="_blank" rel="noreferrer">외부 통계 보기 <ArrowUpRight size={14}/></a></div>
  <div className="population-filters">
   <label>지역<select aria-label="지역" value={region} onChange={e=>{setRegion(e.target.value);setServerId('')}}>{regions.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
   <div><span>종족</span><FactionPicker value={race} onChange={value=>{setRace(value);setServerId('')}}/></div>
   <label>서버<select aria-label="서버" value={selected?.id||''} onChange={e=>setServerId(e.target.value)}><option value="">{race===1?'천족':'마족'} 전체 서버</option>{servers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
  </div>
  <p className="population-summary" aria-live="polite">{regions.find(r=>r[0]===region)?.[1]} · {race===1?'천족':'마족'} · {selected?.name||'전체 서버'}<strong>레벨 45 캐릭터 {number.format(total)}명</strong></p>
  {total>0?<ul className="population-bars" aria-label="직업별 인원과 비율">{rows.map(c=><li key={c.key} data-class={c.key}><div><img src={'/shadowcraft/game/images/ui/resource/texture/icon/ut_class_'+c.key+'_large.webp'} alt=""/><b>{c.name}</b><span>{number.format(c.count)}명</span><strong>{(100*c.count/total).toFixed(1)}%</strong></div><div className="population-track" aria-hidden="true"><i style={{width:100*c.count/total+'%'}}/></div></li>)}</ul>:<p role="status">선택한 서버의 수집된 캐릭터가 없습니다.</p>}
  <div className="population-source"><p>AION2 Tier List 수집 캐릭터 기준 · 서버 전체 인원이나 실시간 접속 비율이 아닙니다.</p><p>집계본 확인: <time dateTime={snapshot.fetchedAt}>{new Date(snapshot.fetchedAt).toLocaleString('ko-KR')}</time> · 수동 갱신{stale?' · 7일 이상 지난 자료':''} · <a href={snapshot.methodology} target="_blank" rel="noreferrer">집계 기준 ↗</a></p></div>
 </section>;
}
