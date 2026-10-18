import {useEffect,useRef,useState} from 'react';
import type {Catalog,Plan} from '../lib/planner';
import {totals} from '../lib/planner';
import {groupRankers,compareRankerSkills,previewRankerBoards,type Ranker} from '../lib/ranker-builds';
import {queryArmory} from '../lib/armory-client';
import snapshot from '../lib/data/rankers.json';
import skillGuides from '../lib/data/ranker-skill-guides.json';
import CharacterEquipment from './character-equipment';
import CharacterComparison from './character-comparison';

export default function RankerBuilds({catalog,plan,onApply}:{catalog:Catalog;plan:Plan;onApply:(next:Plan)=>void}){
 const rows=(snapshot.entries as Ranker[]).filter(r=>r.classKey===catalog.classKey);
 const [selectedId,setSelectedId]=useState('');
 const [compareLeft,setCompareLeft]=useState<string|null>(null),[compareRight,setCompareRight]=useState<string|null>(null);
 const selected=rows.find(r=>r.characterId===selectedId);
 const [live,setLive]=useState<any>(null),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const [preview,setPreview]=useState<{source:Plan;next:Plan}|null>(null);
 const request=useRef(0);useEffect(()=>()=>{request.current++},[]);
 const itemUsage=new Map<number,{name:string;count:number}>();
 for(const row of rows)for(const item of new Map(row.equipment.map(item=>[item.id,item])).values()){const entry=itemUsage.get(item.id)||{name:item.name,count:0};entry.count++;itemUsage.set(item.id,entry)}
 const commonItems=[...itemUsage.values()].sort((a,b)=>b.count-a.count).slice(0,6);
 const groups=groupRankers(rows),candidate=preview?.source===plan?preview.next:null;
 const left=groups.find(g=>g.ids.join(',')===compareLeft)||groups[0];
 const right=groups.find(g=>g.ids.join(',')===compareRight)||groups[1]||groups[0];
 const difference=compareRankerSkills(left?.ids||[],right?.ids||[]);
 const skillName=(id:string)=>catalog.skills.find(s=>s.id===id)?.name||rows.flatMap(r=>r.skills).find(s=>String(s.id)===id)?.name||id;
 const guidance=(ids:string[])=>{
  const notes=skillGuides.skills.filter(s=>s.classKey===catalog.classKey&&ids.includes(s.id));
  return <details className="ranker-guidance"><summary>장점과 활용 상황 · {notes.length}/{ids.length}개 기술 분석</summary>
   <p className="subtle">글로벌 클라이언트 빌드 {skillGuides.source.buildId}의 기본 효과 설명을 해석했습니다. 활용 상황은 선택을 돕는 제안이며, 이 캐릭터의 실제 운용·콘텐츠 성적을 뜻하지 않습니다.</p>
   {notes.map(note=><div key={note.id}><h4>{skillName(note.id)} · {note.title}</h4><p>{note.advantage}</p><p><b>활용 제안:</b> {note.situation}</p><p><b>주의점:</b> {note.caution}</p><details><summary>효과 설명 근거</summary><p>{note.evidence.replaceAll('[unresolved value]','[수치 미확인]')}</p><small>글로벌 Steam 기본 설명 · 기술 ID {note.id} · 특화 및 현재 장비 효과 제외</small></details></div>)}
   {ids.some(id=>!notes.some(n=>n.id===id))&&<p className="subtle">추가 분석 전: {ids.filter(id=>!notes.some(n=>n.id===id)).map(skillName).join(' · ')}. 설명이 없는 기술의 효과나 우열은 추정하지 않았습니다.</p>}
  </details>;
 };
 async function inspect(row:Ranker){const token=++request.current;setSelectedId(row.characterId);setLive(null);setPreview(null);setError('');setLoading(true);try{const result=await queryArmory({action:'profile',class:row.classKey,region:row.region,server:String(row.serverId),id:row.characterId});if(request.current===token)setLive(result)}catch(e){if(request.current===token)setError(e instanceof Error?e.message:'공식 조회 실패')}finally{if(request.current===token)setLoading(false)}}
 return <section className="panel ranker-builds" aria-label="랭커 빌드 분석">
  <div className="section-heading"><div><span className="eyebrow">OBSERVED BUILDS</span><h2>상위 캐릭터 세팅 살펴보기</h2><p>전투력 표본 상위 10명 · 선택한 직업</p></div><a href={snapshot.source} target="_blank" rel="noreferrer">순위 출처 ↗</a></div>
  <p className="subtle">AION2 Tier List의 글로벌 전투력 상위 500명 표본에서 직업별 10명을 골랐습니다. 공식 전체 순위·DPS 순위가 아닙니다. 명단 확인 {new Date(snapshot.fetchedAt).toLocaleString('ko-KR')} · 수동 갱신</p>
  <details className="ranker-analysis"><summary>10명의 공통 구성과 빌드 분기 ({groups.length}가지)</summary><p>공개된 장착 Dp 스킬 조합으로 묶었습니다. 특화·스킬 운용은 공개되지 않아 조합만으로 성능이나 콘텐츠 적합성을 단정하지 않습니다.</p>{left&&right&&<section className="ranker-compare" aria-label="빌드 구성 비교"><h3>두 구성 비교</h3><p>사용자 수는 이 표본의 선택 빈도입니다. 성능 순위가 아닙니다. 비교해도 내 빌드는 바뀌지 않습니다.</p><div className="ranker-compare-grid">{([{label:'기준 구성',value:left,set:setCompareLeft},{label:'비교 구성',value:right,set:setCompareRight}]).map(choice=><label key={choice.label}>{choice.label}<select aria-label={choice.label} value={choice.value.ids.join(',')} onChange={e=>choice.set(e.target.value)}>{groups.map((g,i)=><option key={g.ids.join(',')} value={g.ids.join(',')}>구성 {i+1} · {g.members.length}명 · {g.ids.length}개 기술</option>)}</select></label>)}</div><details className="ranker-shared"><summary>공통 기술 {difference.shared.length}개</summary><p>{difference.shared.map(skillName).join(' · ')||'없음'}</p></details><div className="ranker-compare-grid">{([{label:'기준 구성에만 있는 기술',ids:difference.leftOnly},{label:'비교 구성에만 있는 기술',ids:difference.rightOnly}]).map(side=><div className="ranker-difference" key={side.label}><h4>{side.label} · {side.ids.length}개</h4><p>{side.ids.map(skillName).join(' · ')||'없음'}</p>{side.ids.length>0&&guidance(side.ids)}</div>)}</div>{!difference.leftOnly.length&&!difference.rightOnly.length&&<p role="status">두 구성의 공개 장착 기술이 같습니다.</p>}</section>}<h3>자주 사용하는 장비</h3><ul>{commonItems.map(item=><li key={item.name}>{item.name} · {item.count}/10명</li>)}</ul>{groups.map((g,i)=><article key={g.ids.join(',')}><h3>구성 {i+1} · {g.members.length}/10명</h3><p>{g.ids.map(skillName).join(' · ')||'공개된 장착 Dp 스킬 없음'}</p><p>사용 캐릭터: {g.members.map(r=>r.name).join(', ')}</p>{guidance(g.ids)}</article>)}</details>
  <div className="ranker-list">{rows.map(row=><button className={'button secondary '+(selected===row?'selected':'')} key={row.characterId} aria-pressed={selected===row} onClick={()=>inspect(row)}><b>{row.rank}. {row.name}</b><span>{row.region.toUpperCase()} · {row.serverName} · {row.race===1?'천족':'마족'}</span><small>명단 전투력 {row.combatPower.toLocaleString()} · 표본 전체 {row.sampleRank}위</small></button>)}</div>
  {selected&&<div className="ranker-detail"><h3>{selected.name} 세팅</h3><a href={selected.sourceProfile} target="_blank" rel="noreferrer">명단 원본 캐릭터 ↗</a><p>장비·스킬 확인 {new Date(selected.verifiedAt).toLocaleString('ko-KR')} · 당시 공식 전투력 {selected.currentCombatPower.toLocaleString()}</p>
   <CharacterEquipment equipment={live?.equipment||selected.equipment}/>
   <details><summary>스킬 목표 레벨 확인</summary><p>장비·데바니온 보너스가 포함된 최종 레벨입니다. 투자 포인트 및 특화 선택은 미확인입니다.</p><ul>{selected.skills.filter(s=>s.skillLevel>0).map(s=><li key={s.id}>{skillName(String(s.id))} · Lv.{s.skillLevel}{s.category==='Dp'?(s.equip===1?' · 장착':' · 미장착'):''}</li>)}</ul></details>
   {loading&&<p role="status">공식 프로필과 데바니온을 조회하고 있습니다…</p>}{error&&<p role="alert">{error}</p>}
   {!loading&&<button className="button ghost" onClick={()=>inspect(selected)}>공식 세팅 다시 조회</button>}
   {live&&<><CharacterComparison current={plan.character} saved={live}/><p>따라하기는 공개된 데바니온 배치만 적용합니다. 내 장비·기본 스킬 투자·연결 캐릭터는 유지합니다. 배치 변경으로 잠기는 기존 특화는 해제됩니다.</p><button className="button secondary" onClick={()=>{try{setPreview({source:plan,next:previewRankerBoards(catalog,plan,selected,live)});setError('')}catch(e){setPreview(null);setError(e instanceof Error?e.message:'복사할 수 없습니다.')}}}>데바니온 따라하기 미리보기</button></>}
   {candidate&&<div className="quick-preview"><h4>내 계획에 적용할 변경</h4><p>노드 {plan.nodes.length} → {candidate.nodes.length} · 결정 {totals(catalog,candidate).crystal} / {totals(catalog,candidate).crystalMax}</p><button className="button primary" onClick={()=>{onApply(candidate);setPreview(null)}}>이 데바니온 배치 적용</button><button className="button ghost" onClick={()=>setPreview(null)}>취소</button></div>}
  </div>}
 </section>;
}
