'use client';
import {useEffect,useState} from 'react';
import {Swords,Zap,Waypoints,Shield,RefreshCw,Check,Undo2,Calculator} from 'lucide-react';
import {type Catalog,type Plan,type PointBudget,pointLimits,totals,finalLevel,equipped,unmetAscensionSkills} from '@/lib/planner';
import {classProfile} from '@/lib/classes';
import {recommendBuild} from '@/lib/recommendation';
import {useLocale} from './locale';

const fields=[{key:'sp',label:'스킬 포인트',icon:Swords},{key:'stigma',label:'스티그마 포인트',icon:Zap},{key:'crystal',label:'데바니온 포인트',icon:Waypoints}] as const;
const count=(value:string)=>Math.min(9999,Math.max(0,Math.floor(Number(value)||0)));
export default function PointBudgetPanel({catalog,plan,onEdit,onApply}:{catalog:Catalog;plan:Plan;onEdit:(p:Partial<Plan>)=>void;onApply:(p:Plan)=>void}){
 const {t,skill:localSkill}=useLocale();
 const limits=pointLimits(catalog,plan);
 const unmet=unmetAscensionSkills(catalog,plan);
 const [candidate,setCandidate]=useState<Plan|null>(null),[previous,setPrevious]=useState<Plan|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [calcKind,setCalcKind]=useState<keyof PointBudget>('sp'),[spent,setSpent]=useState(''),[remaining,setRemaining]=useState('');
 useEffect(()=>{setCandidate(null);setError('')},[plan,catalog]);
 function setPoints(key:keyof PointBudget,value:number){onEdit({pointBudget:{...limits,[key]:value}})}
 function preview(){setBusy(true);setError('');setTimeout(()=>{try{setCandidate(recommendBuild(catalog,plan))}catch{setError(t('추천 계산에 실패했습니다. 포인트와 레벨을 확인한 뒤 다시 시도하세요.'))}finally{setBusy(false)}},30)}
 const result=candidate?totals(catalog,candidate):null;
 return <section id="point-budget" className="panel budget-panel direct-budget">
  <div className="section-title"><div><span className="eyebrow">YOUR POINTS → YOUR BUILD</span><h3>{t('내 포인트로 추천 배분')}</h3></div><label className="level-field">{t('캐릭터 레벨')}<input type="number" min={1} max={45} value={plan.level} disabled={busy} onChange={e=>onEdit({level:Math.max(1,Math.min(45,count(e.target.value)))})}/></label></div>
  <label className="ascension-confirm"><input type="checkbox" checked={plan.ascensionGrade3Confirmed===true} disabled={busy} onChange={e=>onEdit({ascensionGrade3Confirmed:e.target.checked})}/>{t('승급 조건 충족을 게임에서 확인했습니다 (AscensionGrade_3)')}</label>
  <p className="subtle">{t('확인 전에는 승급이 필요한 스킬의 신규 투자·추천이 제한됩니다. 자동 캐릭터 조회로 확인한 값이 아니며, 이 설정은 현재 직업의 계획에 저장됩니다.')}</p>
  {unmet.length>0&&<div className="notice amber-notice" role="status">{t('승급 확인이 필요한 기존 투자 {0}개: {1}. 저장된 투자는 유지됩니다. 게임에서 조건을 확인하거나 추천을 다시 적용하세요.',[unmet.length,unmet.map(s=>localSkill(s.name)).join(', ')])}</div>}
  <p className="budget-help"><b>{t('총 보유량 = 이미 사용한 포인트 + 남은 포인트.')}</b> {t('게임에서 확인한 총량을 입력하세요. 레벨 보상은 여기에 더해지지 않습니다.')}</p>
  <div className="point-entry-grid">{fields.map(f=><label className="point-entry" key={f.key}><span><f.icon size={17}/>{t(f.label)}</span><div><input type="number" min={0} max={9999} step={1} value={limits[f.key]} disabled={busy} onChange={e=>setPoints(f.key,count(e.target.value))}/><b>P</b></div><small>{t('사용 + 미사용을 합친 총량')}</small></label>)}</div>
  <details className="point-extras"><summary><Calculator size={14}/>{t('남은 포인트만 알고 있나요? / 아스펠 결정 입력')}</summary><div className="remaining-calculator"><label>{t('포인트 종류')}<select value={calcKind} onChange={e=>setCalcKind(e.target.value as keyof PointBudget)}>{fields.map(f=><option key={f.key} value={f.key}>{t(f.label)}</option>)}</select></label><label>{t('게임에서 이미 쓴 양')}<input type="number" min={0} max={9999} placeholder={t('예: {0}',[180])} value={spent} onChange={e=>setSpent(e.target.value)}/></label><span>+</span><label>{t('게임에 남은 양')}<input type="number" min={0} max={9999} placeholder={t('예: {0}',[20])} value={remaining} onChange={e=>setRemaining(e.target.value)}/></label><button className="button secondary" disabled={busy||spent===''||remaining===''} onClick={()=>setPoints(calcKind,Math.min(9999,count(spent)+count(remaining)))}>{t('합계 {0} 입력',[Math.min(9999,count(spent)+count(remaining))])}</button></div><p className="subtle">{t('예: 180 사용 + 20 남음 → 총 200. 게임의 실제 사용량을 넣으세요. 현재 페이지의 계획 사용량과 다를 수 있습니다.')}</p><label className="battle-budget"><Shield size={15}/>{t('아스펠 전용 결정 총량')}<input type="number" min={0} max={9999} value={limits.battle} disabled={busy} onChange={e=>setPoints('battle',count(e.target.value))}/><small>{t('일반 데바니온과 별도 예산 · 없으면 0')}</small></label></details>
  <div className="recommend-actions"><div className="segmented"><button disabled={busy} className={plan.mode==='safe'?'selected':''} onClick={()=>onEdit({mode:'safe'})}><Shield size={14}/>{t('안정형')}</button><button disabled={busy} className={plan.mode==='damage'?'selected':''} onClick={()=>onEdit({mode:'damage'})}><Swords size={14}/>{t('공격형')}</button></div><button className="button primary" disabled={busy} onClick={preview}>{busy?<RefreshCw className="spin" size={16}/>:<Zap size={16}/>} {t(busy?'배분 계산 중':'내 포인트로 추천 미리보기')}</button></div>
  <p className="recommend-rule">{t('{0}의 보스·파티 역할에 맞는 핵심 스킬과 패시브, 개방된 스티그마 슬롯, 연결 가능한 데바니온 경로를 우선합니다. 안정형은 데바니온 생존 능력치를 더 반영합니다.',[t(classProfile(plan.classKey).name)])+' '}{plan.classKey!=='assassin'&&t('두 모드는 같은 직업별 스킬·스티그마 구성을 사용합니다.')+' '}{t('이동기는 계속 수동 사용입니다.')}</p>
  {!plan.pointBudget&&<p className="subtle">{t('현재 숫자는 기존 계획의 추정 총량입니다. 실제 보유량과 다르면 위 숫자를 바꾸세요.')}</p>}
  {error&&<div className="notice amber-notice">{error}</div>}
  {candidate&&result&&<div className="recommend-preview"><div className="section-title"><h3>{t('추천 결과 미리보기')}</h3><span className="tiny-tag">{t(candidate.mode==='safe'?'안정형':'공격형')} · Lv.{candidate.level}</span></div><div className="allocation-table-wrap"><table className="allocation-table"><thead><tr><th>{t('포인트')}</th><th>{t('총량')}</th><th>{t('추천 사용')}</th><th>{t('남음')}</th></tr></thead><tbody>{[{name:'스킬',used:result.sp,max:result.spMax},{name:'스티그마',used:result.stigma,max:result.stigmaMax},{name:'데바니온',used:result.crystal,max:result.crystalMax},...(limits.battle?[{name:'아스펠',used:result.battle,max:result.battleMax}]:[])].map(r=><tr key={r.name}><td>{t(r.name)}</td><td>{r.max}</td><td>{r.used}</td><td>{r.max-r.used}</td></tr>)}</tbody></table></div>
  <details className="recommend-details" open><summary>{t('스킬·스티그마 추천 투자')}</summary><div className="allocation-skills">{catalog.skills.filter(s=>(candidate.base[s.id]||0)>0&&(!s.stigma||equipped(candidate).includes(s.id))).map(s=><div key={s.id}><img src={'/shadowcraft/game'+s.iconPath} alt=""/><span>{localSkill(s.name)}<small>{t(s.stigma?'스티그마':s.kind==='passive'?'패시브':'액티브')}</small></span><b>{t('기본 {0}',[candidate.base[s.id]])}<small>{t('최종 {0}',[finalLevel(catalog,candidate,s)])}</small></b></div>)}</div></details>
  <details className="recommend-details" open><summary>{t('데바니온 보드별 추천')}</summary><div className="board-allocation">{catalog.boards.map(b=>{const selected=b.nodes.filter(n=>candidate.nodes.includes(n.id)&&!n.autoLearn);return <div key={b.id}><b>{t(b.name)}</b><span>{b.requiredLevel>plan.level?t('Lv.{0}에 개방',[b.requiredLevel]):t('{0}개 노드',[selected.length])}</span><strong>{selected.reduce((sum,n)=>sum+n.pointCost,0)} P</strong></div>})}</div></details>
  <p className="subtle">{t('현재 계획의 스킬·특화·데바니온을 새 배분으로 바꿉니다. 장비 보너스와 조회한 캐릭터 정보는 유지합니다. 레벨 제한·노드 비용 때문에 포인트가 남을 수 있습니다. 이 추천은 우선순위 규칙에 따른 제안이며 최고 DPS를 보장하지 않습니다.')}</p><button className="button primary full" onClick={()=>{setPrevious(plan);onApply(candidate);setCandidate(null)}}><Check size={16}/>{t('이 추천을 전체 계획에 적용')}</button></div>}
  {previous&&!candidate&&<button className="button ghost small undo-allocation" onClick={()=>{onApply(previous);setPrevious(null)}}><Undo2 size={14}/>{t('추천 적용 전으로 되돌리기')}</button>}
 </section>
}
