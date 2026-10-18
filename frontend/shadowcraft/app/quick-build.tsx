import {useState} from 'react';
import {type Catalog,type Plan,pointLimits,totals,finalLevel} from '@/lib/planner';
import {classProfile} from '@/lib/classes';
import {recommendBuild} from '@/lib/recommendation';

export default function QuickBuild({catalog,plan,onApply,onEdit}:{catalog:Catalog;plan:Plan;onApply:(next:Plan)=>void;onEdit:(tab:string)=>void}){
 const [mode,setMode]=useState(plan.mode),[level,setLevel]=useState(plan.level);
 const [points,setPoints]=useState(pointLimits(catalog,plan));
 const [ascended,setAscended]=useState(plan.ascensionGrade3Confirmed===true);
 const [preview,setPreview]=useState<{source:Plan;catalog:Catalog;next:Plan}|null>(null);
 const [error,setError]=useState('');
 const candidate=preview?.source===plan&&preview.catalog===catalog?preview.next:null;
 const profile=classProfile(plan.classKey),before=totals(catalog,plan),after=candidate?totals(catalog,candidate):null;
 function invalidate(){setPreview(null);setError('')}
 function prepare(){try{setPreview({source:plan,catalog,next:recommendBuild(catalog,{...plan,mode,level,pointBudget:points,ascensionGrade3Confirmed:ascended})});setError('')}catch{setError('배분을 만들지 못했습니다. 레벨과 포인트를 확인해 주세요.')}}
 return <section className="panel quick-build" aria-label="간편 빌드 선택">
  <div className="quick-build-heading"><span className="eyebrow">{profile.name} · BUILD PLANNER</span><h2>플레이 스타일을 선택하세요</h2></div>
  <p>유형을 고르고 미리 본 뒤 적용하세요. 세부 설정은 언제든 조정할 수 있습니다.</p>
  <p className="subtle">현재 제공: 기본 가이드 · 상위 랭커 10명 분석 빌드는 아직 준비되지 않았습니다.</p>
  <div className="quick-build-options">{(['safe','damage'] as const).map(value=><button key={value} aria-pressed={mode===value} className={'button secondary '+(mode===value?'selected':'')} onClick={()=>{setMode(value);invalidate()}}><strong>{value==='safe'?'안정형':'공격형'}</strong><span>{value==='safe'?'생존 능력치도 고려한 보스전 입문':'공격 관련 효과를 우선하는 보스전 배분'}</span><small>{value==='safe'?'공격 효과보다 생존 노드를 더 고려합니다.':'위험한 패턴은 직접 피해야 합니다.'}</small></button>)}</div>
  <p className="subtle">{profile.name}의 핵심 스킬을 우선합니다. {plan.classKey!=='assassin'&&'두 유형의 스킬·스티그마 구성은 같고 데바니온 우선순위가 다릅니다. '}실제 포인트와 장비에 따라 결과가 같을 수 있습니다.</p>
  <details className="point-extras"><summary>내 레벨·포인트에 맞추기 (선택)</summary>
   <p>포인트는 이미 쓴 양과 남은 양을 합친 총량입니다. {plan.pointBudget?'저장된 총량을 사용합니다.':'현재 숫자는 추정 총량이므로 게임에서 확인해 주세요.'}</p>
   <div className="point-entry-grid"><label>캐릭터 레벨<input aria-label="간편 캐릭터 레벨" type="number" min={1} max={45} value={level} onChange={e=>{setLevel(Math.max(1,Math.min(45,Math.floor(Number(e.target.value)||1))));invalidate()}}/></label>{(['sp','stigma','crystal','battle'] as const).map((key,i)=><label key={key}>{['스킬 포인트','스티그마 포인트','데바니온 포인트','아스펠 전용 결정'][i]}<input aria-label={'간편 '+key} type="number" min={0} max={9999} value={points[key]} onChange={e=>{setPoints({...points,[key]:Math.min(9999,Math.max(0,Math.floor(Number(e.target.value)||0)))});invalidate()}}/></label>)}</div>
   <label><input type="checkbox" checked={ascended} onChange={e=>{setAscended(e.target.checked);invalidate()}}/>게임에서 3차 승급 조건 충족을 확인했습니다</label>
  </details>
  <button className="button primary" onClick={prepare}>이 빌드 미리보기</button>
  {error&&<p role="alert">{error}</p>}
  {candidate&&after&&<div className="quick-preview">
   <h3>적용하면 이렇게 바뀝니다</h3>
   <p>Lv.{plan.level} → Lv.{candidate.level} · {candidate.mode==='safe'?'안정형':'공격형'}</p>
   <ul>{[{name:'스킬',old:before.sp,used:after.sp,max:after.spMax},{name:'스티그마',old:before.stigma,used:after.stigma,max:after.stigmaMax},{name:'데바니온',old:before.crystal,used:after.crystal,max:after.crystalMax},{name:'아스펠',old:before.battle,used:after.battle,max:after.battleMax}].map(row=><li key={row.name}>{row.name}: {row.old} → {row.used} / {row.max} P · {row.max-row.used} P 남음</li>)}</ul>
   <h4>핵심 스킬</h4><ul>{profile.core.map(id=>catalog.skills.find(s=>s.id===id)).filter(s=>!!s).map(s=><li key={s.id}>{s.name}: Lv.{finalLevel(catalog,plan,s)} → Lv.{finalLevel(catalog,candidate,s)} · {profile.roles[s.id]||'직업 핵심 스킬 우선 투자'}</li>)}</ul>
   <details><summary>특화·데바니온 변경 자세히 보기</summary><ul>{catalog.skills.filter(s=>JSON.stringify(plan.specs[s.id]||[])!==JSON.stringify(candidate.specs[s.id]||[])).map(s=><li key={s.id}>{s.name}: {(candidate.specs[s.id]||[]).map(id=>s.specializations.find(x=>x.id===id)?.description||id).join(' / ')||'선택 특화 없음'}</li>)}</ul><ul>{catalog.boards.map(b=><li key={b.id}>{b.name}: {b.nodes.filter(n=>!n.autoLearn&&plan.nodes.includes(n.id)).length} → {b.nodes.filter(n=>!n.autoLearn&&candidate.nodes.includes(n.id)).length}개 노드{b.requiredLevel>level?` · Lv.${b.requiredLevel}에 개방`:''}</li>)}</ul></details>
   <p>현재 레벨·포인트와 장비 보너스 안에서 가능한 배분입니다. 승급 미확인 스킬은 추천에서 제한되며, 잠긴 특화는 레벨·장비를 갖춘 뒤 상세 편집에서 조정하세요.</p>
   <p className="subtle">스킬·특화·데바니온 계획을 교체합니다. 장비와 캐릭터 조회 정보는 유지하며, 게임 안의 설정은 직접 변경해야 합니다.</p>
   <div className="quick-actions"><button className="button primary" onClick={()=>{onApply(candidate);setPreview(null)}}>이 빌드 적용</button><button className="button ghost" onClick={()=>setPreview(null)}>미리보기 취소</button></div>
  </div>}
  <details className="quick-edit"><summary>직접 조정하고 싶어요 — 상세 편집</summary><div className="quick-actions">{[['skills','스킬·특화 편집'],['daevanion','데바니온 보드 편집'],['gear','장비 입력·비교']].map(([tab,label])=><button key={tab} className="button secondary" onClick={()=>onEdit(tab)}>{label}</button>)}</div></details>
 </section>;
}
