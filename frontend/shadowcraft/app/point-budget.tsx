'use client';
import {useEffect,useState} from 'react';
import {Swords,Zap,Waypoints,Shield,RefreshCw,Check,Undo2,Calculator} from 'lucide-react';
import {isEndgamePointLevel,pointBudgetSourceLabel,hasCustomPointBudget,type Catalog,type Plan,type PointBudget,pointLimits,totals,unmetAscensionSkills,MODE_NAMES} from '@/lib/planner';
import {classProfile} from '@/lib/classes';
import {recommendBuild} from '@/lib/recommendation';
import {useLocale} from './locale';
import CharacterPoints from './character-points';
import AllocationSpecializations from './allocation-specializations';

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
  <div className="section-title"><div><span className="eyebrow">{t('내 포인트 → 내 빌드')}</span><h3>{t('내 포인트로 추천 배분')}</h3></div><label className="level-field">{t('캐릭터 레벨')}<input type="number" min={1} max={45} value={plan.level} disabled={busy} onChange={e=>onEdit({level:Math.max(1,Math.min(45,count(e.target.value)))})}/></label></div>
  <label className="ascension-confirm"><input type="checkbox" checked={plan.ascensionGrade3Confirmed===true} disabled={busy} onChange={e=>onEdit({ascensionGrade3Confirmed:e.target.checked})}/>{t('승급 조건 충족을 게임에서 확인했습니다 (AscensionGrade_3)')}</label>
  <p className="subtle">{t('확인 전에는 승급이 필요한 스킬의 신규 투자·추천이 제한됩니다. 자동 캐릭터 조회로 확인한 값이 아니며, 이 설정은 현재 직업의 계획에 저장됩니다.')}</p>
  {unmet.length>0&&<div className="notice amber-notice" role="status">{t('승급 확인이 필요한 기존 투자 {0}개: {1}. 저장된 투자는 유지됩니다. 게임에서 조건을 확인하거나 추천을 다시 적용하세요.',[unmet.length,unmet.map(s=>localSkill(s.name)).join(', ')])}</div>}
  <p className="notice violet-notice">{t(pointBudgetSourceLabel(plan))} · {t('캐릭터를 불러와도 스킬·스티그마·데바니온의 총 보유량은 자동으로 확인되지 않습니다.')}</p><p className="budget-help"><b>{t('총 보유량 = 이미 사용한 포인트 + 남은 포인트.')}</b> {t('게임에서 확인한 총량을 입력하세요. 레벨 보상은 여기에 더해지지 않습니다.')}</p>
  <p className="subtle">{t(isEndgamePointLevel(plan)?'45레벨 기본값은 서브 퀘스트·봉인던전·주둔지를 모두 완료했다고 가정합니다. 실제 완료 여부를 조회한 값은 아닙니다.':'레벨별 최소 기준은 레벨업 보상만 포함합니다. 봉인던전·서브 퀘스트 등에서 얻은 추가 포인트는 사람마다 달라 제외합니다.')}</p>{isEndgamePointLevel(plan)&&<p className="subtle">{t('서브 퀘스트 보상 58 + 내 종족 봉인던전 61곳 × 2를 더합니다. 주둔지의 별도 포인트는 추가하지 않습니다. 스티그마는 레벨 보상 29이며, 승급 추가 보상·상점 구매·이벤트는 별도입니다.')}</p>}<button className="button secondary small" onClick={()=>onEdit({pointBudget:undefined,extraSP:0,extraStigma:0,extraCrystal:0,extraBattle:0})}>{t(isEndgamePointLevel(plan)?'콘텐츠 완료 기준으로 되돌리기':'레벨별 최소 기준으로 되돌리기')}</button>
  <CharacterPoints catalog={catalog} plan={plan} points={limits} onChange={onEdit}/>
  <details className="point-extras"><summary><Calculator size={14}/>{t('조회되지 않은 사용량 직접 계산')}</summary><div className="remaining-calculator"><label>{t('포인트 종류')}<select value={calcKind} onChange={e=>setCalcKind(e.target.value as keyof PointBudget)}>{fields.map(f=><option key={f.key} value={f.key}>{t(f.label)}</option>)}</select></label><label>{t('게임에서 이미 쓴 양')}<input type="number" min={0} max={9999} placeholder={t('예: {0}',[180])} value={spent} onChange={e=>setSpent(e.target.value)}/></label><span>+</span><label>{t('게임에 남은 양')}<input type="number" min={0} max={9999} placeholder={t('예: {0}',[20])} value={remaining} onChange={e=>setRemaining(e.target.value)}/></label><button className="button secondary" disabled={busy||spent===''||remaining===''} onClick={()=>setPoints(calcKind,Math.min(9999,count(spent)+count(remaining)))}>{t('합계 {0} 입력',[Math.min(9999,count(spent)+count(remaining))])}</button></div><p className="subtle">{t('예: 180 사용 + 20 남음 → 총 200. 게임의 실제 사용량을 넣으세요. 현재 페이지의 계획 사용량과 다를 수 있습니다.')}</p></details>
  <div className="recommend-actions"><div className="segmented"><button disabled={busy} className={plan.mode==='safe'?'selected':''} onClick={()=>onEdit({mode:'safe'})}><Shield size={14}/>{t('안정형')}</button><button disabled={busy} className={plan.mode==='damage'?'selected':''} onClick={()=>onEdit({mode:'damage'})}><Swords size={14}/>{t('공격형')}</button><button disabled={busy} className={plan.mode==='pvp'?'selected':''} onClick={()=>onEdit({mode:'pvp'})}><Swords size={14}/>{t('PvP형')}</button></div><button className="button primary" disabled={busy} onClick={preview}>{busy?<RefreshCw className="spin" size={16}/>:<Zap size={16}/>} {t(busy?'배분 계산 중':'내 포인트로 추천 미리보기')}</button></div>
  <p className="recommend-rule">{t('{0}의 보스·파티 역할에 맞는 핵심 스킬과 패시브, 개방된 스티그마 슬롯, 연결 가능한 데바니온 경로를 우선합니다. 안정형은 데바니온 생존 능력치를 더 반영합니다.',[t(classProfile(plan.classKey).name)])+' '}{plan.classKey!=='assassin'&&t('두 모드는 같은 직업별 스킬·스티그마 구성을 사용합니다.')+' '}{t('이동기는 계속 수동 사용입니다.')}</p>
  {!hasCustomPointBudget(plan)&&!isEndgamePointLevel(plan)&&<p className="subtle">{t('레벨별 공개 자료의 기본량을 최소 기준으로 사용합니다. 실제 보유량이 더 많으면 직접 수정할 수 있습니다.')}</p>}
  {error&&<div className="notice amber-notice">{error}</div>}
  {candidate&&result&&<div className="recommend-preview"><div className="section-title"><h3>{t('추천 결과 미리보기')}</h3><span className="tiny-tag">{t(MODE_NAMES[candidate.mode]||'공격형')} · Lv.{candidate.level}</span></div><div className="allocation-table-wrap"><table className="allocation-table"><thead><tr><th>{t('포인트')}</th><th>{t('총량')}</th><th>{t('추천 사용')}</th><th>{t('남음')}</th></tr></thead><tbody>{[{name:'스킬',used:result.sp,max:result.spMax},{name:'스티그마',used:result.stigma,max:result.stigmaMax},{name:'데바니온',used:result.crystal,max:result.crystalMax},...(limits.battle?[{name:'아스펠',used:result.battle,max:result.battleMax}]:[])].map(r=><tr key={r.name}><td>{t(r.name)}</td><td>{r.max}</td><td>{r.used}</td><td>{r.max-r.used}</td></tr>)}</tbody></table></div>
  <details className="recommend-details" open><summary>{t('스킬·스티그마 추천 투자')}</summary><AllocationSpecializations catalog={catalog} plan={candidate}/></details>
  <details className="recommend-details" open><summary>{t('데바니온 보드별 추천')}</summary><div className="board-allocation">{catalog.boards.map(b=>{const selected=b.nodes.filter(n=>candidate.nodes.includes(n.id)&&!n.autoLearn);return <div key={b.id}><b>{t(b.name)}</b><span>{b.requiredLevel>plan.level?t('Lv.{0}에 개방',[b.requiredLevel]):t('{0}개 노드',[selected.length])}</span><strong>{selected.reduce((sum,n)=>sum+n.pointCost,0)} P</strong></div>})}</div></details>
  <p className="subtle">{t('현재 계획의 스킬·특화·데바니온을 새 배분으로 바꿉니다. 장비 보너스와 조회한 캐릭터 정보는 유지합니다. 레벨 제한·노드 비용 때문에 포인트가 남을 수 있습니다. 이 추천은 우선순위 규칙에 따른 제안이며 최고 DPS를 보장하지 않습니다.')}</p><button className="button primary full" onClick={()=>{setPrevious(plan);onApply(candidate);setCandidate(null)}}><Check size={16}/>{t('이 추천을 전체 계획에 적용')}</button></div>}
  {previous&&!candidate&&<button className="button ghost small undo-allocation" onClick={()=>{onApply(previous);setPrevious(null)}}><Undo2 size={14}/>{t('추천 적용 전으로 되돌리기')}</button>}
 </section>
}
