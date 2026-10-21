import {useLocale} from './locale';
import {useState} from 'react';
import {type Catalog,type Plan,pointLimits,totals,finalLevel} from '@/lib/planner';
import {classProfile} from '@/lib/classes';
import {recommendBuild} from '@/lib/recommendation';
import {MODE_NAMES} from '@/lib/planner';
// Levelling route summarised from game8's 序盤の進め方 (https://game8.jp/aion2/822366); the planner adds the per-level allocation.
const LEVELING_LEVELS=[10,20,30,40,45] as const;
const LEVELING_TIPS=['메인 스토리를 최우선으로 진행합니다. 경험치가 가장 많고 진행에 따라 콘텐츠가 열립니다.','각성 게이지가 부족해 스토리가 막히면 지역 퀘스트·봉인 던전을 돌고 다시 스토리로 돌아옵니다.','이동 중 보이는 신의 흔적은 챙기되, 레벨링이 목적이면 멀리 돌아가지 않습니다.','초반 장비는 자주 바뀌므로 강화 재료를 아끼고, 막히면 무기만 우선 강화합니다.','45 이후에는 아이템 레벨 1000을 목표로 장비 강화, 허리띠·아뮬렛 우선, 지역 퀘스트·주둔지·봉인 던전으로 넘어갑니다.'];

export default function QuickBuild({catalog,plan,onApply,onEdit}:{catalog:Catalog;plan:Plan;onApply:(next:Plan)=>void;onEdit:(tab:string)=>void}){
 const {t,specialization,skill:localSkill}=useLocale();
 const [mode,setMode]=useState(plan.mode),[level,setLevel]=useState(plan.level);
 const [points,setPoints]=useState(pointLimits(catalog,plan));
 const [ascended,setAscended]=useState(plan.ascensionGrade3Confirmed===true);
 const [preview,setPreview]=useState<{source:Plan;catalog:Catalog;next:Plan}|null>(null);
 const [error,setError]=useState('');
 const candidate=preview?.source===plan&&preview.catalog===catalog?preview.next:null;
 const profile=classProfile(plan.classKey),before=totals(catalog,plan),after=candidate?totals(catalog,candidate):null;
 function invalidate(){setPreview(null);setError('')}
 function prepare(){try{setPreview({source:plan,catalog,next:recommendBuild(catalog,{...plan,mode,level,pointBudget:points,ascensionGrade3Confirmed:ascended})});setError('')}catch{setError('배분을 만들지 못했습니다. 레벨과 포인트를 확인해 주세요.')}}
 return <><section className="panel quick-build" aria-label={t('간편 빌드 선택')}>
  <div className="quick-build-heading"><span className="eyebrow">{t(profile.name)} · {t('빌드 플래너')}</span><h2>{t('플레이 스타일을 선택하세요')}</h2></div>
  <p>{t('유형을 고르고 미리 본 뒤 적용하세요. 세부 설정은 언제든 조정할 수 있습니다.')}</p>
  <p className="subtle">{t('기본 추천이며 최적의 세팅을 보장하지 않습니다. 내 레벨과 포인트를 확인한 뒤 적용하세요.')}</p>
  <div className="quick-build-options">{(['safe','damage','pvp'] as const).map(value=><button key={value} aria-pressed={mode===value} className={'button secondary '+(mode===value?'selected':'')} onClick={()=>{setMode(value);invalidate()}}><strong>{t(MODE_NAMES[value])}</strong><span>{t(value==='safe'?'생존 능력치도 고려한 보스전 입문':value==='damage'?'공격 관련 효과를 우선하는 보스전 배분':'PvP 전용 데바니온 노드와 상태이상·치명타 저항을 우선합니다. 공식 PvP 랭킹 공개 전 임시 추천입니다.')}</span><small>{t(value==='safe'?'공격 효과보다 생존 노드를 더 고려합니다.':value==='damage'?'위험한 패턴은 직접 피해야 합니다.':'아스펠(전투) 포인트는 내 레벨·포인트에서 입력하세요.')}</small></button>)}</div>
  <details className="leveling-guide"><summary>{t('레벨링 — 45까지 빠르게')}</summary>
   <p>{t('목표 레벨을 고르면 그 레벨에서 열리는 보드·스킬만으로 공격형 배분을 미리 봅니다.')}</p>
   <div className="leveling-levels">{LEVELING_LEVELS.map(v=><button key={v} className={'button secondary'+(level===v&&mode==='damage'?' selected':'')} aria-pressed={level===v&&mode==='damage'} onClick={()=>{setLevel(v);setMode('damage');invalidate()}}>Lv.{v}</button>)}</div>
   <ul className="leveling-tips">{LEVELING_TIPS.map(tip=><li key={tip}>{t(tip)}</li>)}</ul>
   <p className="subtle">{t('진행 요령은 game8 공략을 요약한 것입니다.')} <a href="https://game8.jp/aion2/822366" target="_blank" rel="noreferrer">game8 · 序盤の進め方</a></p>
  </details>
  <p className="subtle">{t('{0}의 핵심 스킬을 우선합니다.',[t(profile.name)])} {plan.classKey!=='assassin'&&t('두 유형의 스킬·스티그마 구성은 같고 데바니온 우선순위가 다릅니다.')+' '}{t('실제 포인트와 장비에 따라 결과가 같을 수 있습니다.')}</p>
  <details className="point-extras"><summary>{t('내 레벨·포인트에 맞추기 (선택)')}</summary>
   <p>{t('포인트는 이미 쓴 양과 남은 양을 합친 총량입니다.')} {t(plan.pointBudget?'저장된 총량을 사용합니다.':'현재 숫자는 추정 총량이므로 게임에서 확인해 주세요.')}</p>
   <div className="point-entry-grid"><label>{t('캐릭터 레벨')}<input aria-label={t('간편 캐릭터 레벨')} type="number" min={1} max={45} value={level} onChange={e=>{setLevel(Math.max(1,Math.min(45,Math.floor(Number(e.target.value)||1))));invalidate()}}/></label>{(['sp','stigma','crystal','battle'] as const).map((key,i)=><label key={key}>{t(['스킬 포인트','스티그마 포인트','데바니온 포인트','아스펠 전용 결정'][i])}<input aria-label={t('간편 {0}',[key])} type="number" min={0} max={9999} value={points[key]} onChange={e=>{setPoints({...points,[key]:Math.min(9999,Math.max(0,Math.floor(Number(e.target.value)||0)))});invalidate()}}/></label>)}</div>
   <label><input type="checkbox" checked={ascended} onChange={e=>{setAscended(e.target.checked);invalidate()}}/>{t('게임에서 3차 승급 조건 충족을 확인했습니다')}</label>
  </details>
  <button className="button primary" onClick={prepare}>{t('이 빌드 미리보기')}</button>
  {error&&<p role="alert">{t(error)}</p>}
  {candidate&&after&&<div className="quick-preview">
   <h3>{t('적용하면 이렇게 바뀝니다')}</h3>
   <p>Lv.{plan.level} → Lv.{candidate.level} · {t(MODE_NAMES[candidate.mode])}</p>
   <ul>{[{name:'스킬',old:before.sp,used:after.sp,max:after.spMax},{name:'스티그마',old:before.stigma,used:after.stigma,max:after.stigmaMax},{name:'데바니온',old:before.crystal,used:after.crystal,max:after.crystalMax},{name:'아스펠',old:before.battle,used:after.battle,max:after.battleMax}].map(row=><li key={row.name}>{t('{0}: {1} → {2} / {3} P · {4} P 남음',[t(row.name),row.old,row.used,row.max,row.max-row.used])}</li>)}</ul>{!ascended&&<p className="stigma-gate">{t('3차 승급 확인 전이라 스티그마는 추천에 포함되지 않습니다. 승급했다면 위의 3차 승급 확인을 체크하세요.')}</p>}
   <h4>{t('핵심 스킬')}</h4><ul>{profile.core.map(id=>catalog.skills.find(s=>s.id===id)).filter(s=>!!s).map(s=><li key={s.id}>{localSkill(s.name)}: Lv.{finalLevel(catalog,plan,s)} → Lv.{finalLevel(catalog,candidate,s)} · {t(profile.roles[s.id]||'직업 핵심 스킬 우선 투자')}</li>)}</ul>
   <details><summary>{t('특화·데바니온 변경 자세히 보기')}</summary><ul>{catalog.skills.filter(s=>JSON.stringify(plan.specs[s.id]||[])!==JSON.stringify(candidate.specs[s.id]||[])).map(s=><li key={s.id}>{localSkill(s.name)}: {(candidate.specs[s.id]||[]).map(id=>specialization(s.specializations.find(x=>x.id===id)?.description||id,id)).join(' / ')||t('선택 특화 없음')}</li>)}</ul><ul>{catalog.boards.map(b=><li key={b.id}>{t(b.name)}: {t('{0} → {1}개 노드',[b.nodes.filter(n=>!n.autoLearn&&plan.nodes.includes(n.id)).length,b.nodes.filter(n=>!n.autoLearn&&candidate.nodes.includes(n.id)).length])}{b.requiredLevel>level?' · '+t('Lv.{0}에 개방',[b.requiredLevel]):''}</li>)}</ul></details>
   <p>{t('현재 레벨·포인트와 장비 보너스 안에서 가능한 배분입니다. 승급 미확인 스킬은 추천에서 제한되며, 잠긴 특화는 레벨·장비를 갖춘 뒤 상세 편집에서 조정하세요.')}</p>
   <p className="subtle">{t('스킬·특화·데바니온 계획을 교체합니다. 장비와 캐릭터 조회 정보는 유지하며, 게임 안의 설정은 직접 변경해야 합니다.')}</p>
   <div className="quick-actions"><button className="button primary" onClick={()=>{onApply(candidate);setPreview(null)}}>{t('이 빌드 적용')}</button><button className="button ghost" onClick={()=>setPreview(null)}>{t('미리보기 취소')}</button></div>
  </div>}
  <details className="quick-edit"><summary>{t('직접 조정하고 싶어요 — 상세 편집')}</summary><div className="quick-actions">{[['skills','스킬·특화 편집'],['daevanion','데바니온 보드 편집'],['gear','장비 입력·비교']].map(([tab,label])=><button key={tab} className="button secondary" onClick={()=>onEdit(tab)}>{t(label)}</button>)}</div></details>
 </section></>;
}
