import {useEffect,useRef,useState} from 'react';
import {useLocale} from './locale';
import {isEndgamePointLevel,pointBudgetSourceLabel,type Catalog,type Plan,pointLimits,totals} from '@/lib/planner';
import {BUILD_PURPOSES,PURPOSE_NAMES,type BuildPurpose,buildPurpose,recommendPurposeBuild} from '@/lib/build-purpose';
import './leveling-guide.css';
import './direct-build.css';
import CharacterPoints from './character-points';
import PointNumber from './point-number';

// One setup for the editable plan below. A recommendation never applies on navigation or input.
export default function QuickBuild({catalog,plan,onApply,onChange,onPurposeChange,onCompare}:{catalog:Catalog;plan:Plan;onApply:(next:Plan)=>void;onChange:(patch:Partial<Plan>)=>void;onPurposeChange:(purpose:BuildPurpose)=>void;onCompare:()=>void}){
 const {t}=useLocale();
 const [result,setResult]=useState<{source:Plan;catalog:Catalog;next:Plan}|null>(null),[error,setError]=useState('');
 const [purposeRequest,setPurposeRequest]=useState<{plan:Plan;catalog:Catalog}|null>(null);
 const purposeDialog=useRef<HTMLDialogElement>(null),levelingButton=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  const element=purposeDialog.current;if(!purposeRequest||!element)return;
  if(purposeRequest.plan!==plan||purposeRequest.catalog!==catalog){setPurposeRequest(null);return}
  element.showModal();return()=>{element.close();if(levelingButton.current?.isConnected)levelingButton.current.focus()};
 },[purposeRequest,plan,catalog]);
 const selectPurpose=(value:BuildPurpose)=>{if(value==='leveling'&&isEndgamePointLevel(plan))setPurposeRequest({plan,catalog});else onPurposeChange(value)};
 const purpose=buildPurpose(plan),points=pointLimits(catalog,plan),candidate=result?.source===plan&&result.catalog===catalog?result.next:null;
 useEffect(()=>{setError('');const timer=setTimeout(()=>{try{setResult({source:plan,catalog,next:recommendPurposeBuild(catalog,plan)})}catch{setResult(null);setError(t('추천 계산에 실패했습니다. 레벨과 포인트를 확인하세요.'))}},150);return()=>clearTimeout(timer)},[catalog,plan,t]);
 const actualLevel=plan.character?.profile?.characterLevel,resultPoints=candidate?totals(catalog,candidate):null;
 return <section id="point-budget" className="panel growth-guide direct-build build-setup" aria-label={t('빌드 설정')} tabIndex={-1}>
 <h1>{t('내 빌드')}</h1><p className="recommendation-origin">{t('사이트 추천은 직업별 우선순위와 입력한 포인트로 계산합니다. 랭커의 평균 배분은 아닙니다.')} <button type="button" className="text-button" onClick={onCompare}>{t('랭커 세팅을 참고해서 만들기')}</button></p><p>{t('레벨과 포인트를 입력한 뒤, 아래에서 데바니온 → 스킬·특화 순서로 수정하세요.')}</p>
  {typeof actualLevel==='number'&&<div className="growth-basis"><b>{t('조회한 캐릭터: {0} · Lv.{1}',[plan.character.profile.characterName,actualLevel])}</b><span>{t('계산할 목표: Lv.{0}',[plan.level])}</span>{actualLevel!==plan.level&&<p>{t('입력한 레벨을 기준으로 계획을 세우는 중입니다. ‘현재 캐릭터 배치’와 실제 스킬 레벨은 마지막 조회 정보를 보여줍니다.')}</p>}</div>}
  <div className="growth-inputs">
   <label>{t('캐릭터 레벨')}<PointNumber label={t('캐릭터 레벨')} min={1} max={45} value={plan.level} onValue={level=>onChange({level})}/></label>

  </div>
  <p className="subtle">{t('총 포인트 = 이미 쓴 양 + 남은 양. 캐릭터 조회로 총량은 확인되지 않습니다.')} {t(pointBudgetSourceLabel(plan))}</p>
  <details className="growth-basis-details"><summary>{t('포인트 계산 기준')}</summary>
  <p>{t(isEndgamePointLevel(plan)?'45레벨은 콘텐츠 완료 기준으로 안내합니다. 아직 완료하지 않았거나 총량이 다르면 아래 숫자를 수정하세요.':'레벨만 입력하면 최소 기준으로 안내합니다. 추가로 얻은 포인트까지 반영하려면 아래 총량을 수정하세요.')}</p>
  <p className="subtle">{t(isEndgamePointLevel(plan)?'45레벨 기본값은 서브 퀘스트·봉인던전·주둔지를 모두 완료했다고 가정합니다. 실제 완료 여부를 조회한 값은 아닙니다.':'레벨별 최소 기준은 레벨업 보상만 포함합니다. 봉인던전·서브 퀘스트 등에서 얻은 추가 포인트는 사람마다 달라 제외합니다.')}</p>
  {isEndgamePointLevel(plan)&&<p className="subtle">{t('서브 퀘스트 보상 58 + 내 종족 봉인던전 61곳 × 2를 더합니다. 주둔지의 별도 포인트는 추가하지 않습니다. 스티그마는 레벨 보상 29이며, 승급 추가 보상·상점 구매·이벤트는 별도입니다.')}</p>}
  <button className="button secondary small" onClick={()=>onChange({pointBudget:undefined,extraSP:0,extraStigma:0,extraCrystal:0,extraBattle:0})}>{t(isEndgamePointLevel(plan)?'포인트를 기본 내실 완료 기준으로 맞추기':'포인트를 레벨 기본값으로 맞추기')}</button>
  </details>
  <CharacterPoints catalog={catalog} plan={plan} points={points} onChange={onChange}/>
  <div className="direct-build-options">
  {!isEndgamePointLevel(plan)&&<label className="ascension-confirm"><input type="checkbox" checked={plan.ascensionGrade3Confirmed===true} onChange={e=>onChange({ascensionGrade3Confirmed:e.target.checked})}/>{t('게임에서 3차 승급을 완료했습니다')}</label>}
  <div className="growth-purpose" role="group" aria-label={t('플레이 목적')}><span>{t('플레이 목적')}</span>{BUILD_PURPOSES.map(value=><button ref={value==='leveling'?levelingButton:undefined} type="button" className={'button secondary '+(purpose===value?'selected':'')+(value==='leveling'&&isEndgamePointLevel(plan)?' requires-confirm':'')} aria-pressed={purpose===value} aria-describedby={value==='leveling'&&isEndgamePointLevel(plan)?'leveling-availability':undefined} aria-haspopup={value==='leveling'&&isEndgamePointLevel(plan)?'dialog':undefined} key={value} onClick={()=>selectPurpose(value)}>{t(PURPOSE_NAMES[value])}</button>)}</div>
  </div>
  {isEndgamePointLevel(plan)&&<p id="leveling-availability" className="leveling-availability">{t('현재 목표는 45레벨입니다. ‘레벨링’을 누르면 44레벨 빌드로 바꿔 볼 수 있습니다.')}</p>}
  {purposeRequest&&<dialog ref={purposeDialog} className="leveling-confirm-dialog" aria-labelledby="leveling-confirm-title" aria-describedby="leveling-confirm-effect" onCancel={e=>{e.preventDefault();setPurposeRequest(null)}} onClose={()=>setPurposeRequest(null)} onClick={e=>{if(e.target===e.currentTarget)setPurposeRequest(null)}}>
   <h2 id="leveling-confirm-title">{t('레벨링 빌드를 볼까요?')}</h2>
   <p id="leveling-confirm-effect">{t('목표를 44레벨과 해당 레벨의 기본 포인트로 맞춥니다.')}</p>
   <p>{t('찍어 둔 배분은 그대로 두며, 원래 설정으로 되돌릴 수 있습니다.')}</p>
   <div className="leveling-confirm-actions"><button autoFocus type="button" className="button secondary" onClick={()=>setPurposeRequest(null)}>{t('현재 빌드 유지')}</button><button type="button" className="button primary" onClick={()=>{const current=purposeRequest.plan===plan&&purposeRequest.catalog===catalog;setPurposeRequest(null);if(current)onPurposeChange('leveling')}}>{t('레벨링 보기')}</button></div>
  </dialog>}
  <p className="growth-purpose-note" role="status"><b>{t('계산할 목표: Lv.{0}',[plan.level])}</b><br/>{t(purpose==='leveling'?'레벨링: 현재 레벨에서 열리는 스킬과 데바니온으로 공격 위주 배분을 안내합니다.':purpose==='pve'?'PvE: 45레벨 원정 기준입니다. 아래에서 생존과 공격 중 추천 방향을 고르세요.':'PvP: 유저와의 전투용 능력치와 데바니온을 우선합니다. 스킬은 기존 직업 가이드를 참고합니다.')}</p>
  <p className="subtle">{t('레벨링은 최대 44레벨, PvE는 45레벨 목표로 전환합니다. 레벨이 바뀌면 포인트는 해당 레벨의 기본값으로 바뀝니다.')} {t('현재 포인트 안에서 계산한 참고 배분이며, 콘텐츠별 최적 세팅을 검증한 결과는 아닙니다.')}</p>

 {isEndgamePointLevel(plan)&&<p className="completion-basis">{t('45레벨은 3차 승급·봉인던전·주둔지·서브 퀘스트 등 기본 내실을 완료한 상태를 기준으로 계획합니다.')}<br/><small>{t('실제 완료 여부를 조회한 값은 아닙니다. 총 포인트가 다르면 위의 총량을 수정하세요.')}</small></p>}
 {purpose==='pve'&&<div className="build-direction" role="group" aria-label={t('추천 방향')}><b>{t('추천 방향')}</b>{(['safe','damage'] as const).map(mode=><button type="button" key={mode} aria-pressed={plan.mode===mode} onClick={()=>onChange({mode,specs:plan.specs})}><strong>{t(mode==='safe'?'생존에 여유':'공격 우선')}</strong><small>{t(mode==='safe'?'파티·보스전 기준으로 생존도 고려':'필드·사명에서도 참고할 공격 중심 배분')}</small></button>)}</div>}
 <div className="recommendation-apply-box"><h3>{t('이 설정으로 새 배분 만들기')}</h3><p>{t('레벨·포인트·플레이 목적을 바꿨다면 아래 버튼으로 데바니온과 스킬·특화를 함께 다시 배분하세요. 직접 찍어 둔 배분도 바뀝니다.')}</p> <div className="build-recommend-action"><button type="button" className="button primary" disabled={!candidate} onClick={()=>candidate&&onApply(candidate)}>{t(candidate?'데바니온·스킬 추천 배분 적용':'현재 레벨·포인트로 계산 중…')}</button>
 {resultPoints&&<span>{t('추천 배분 사용량: 스킬 {0} · 스티그마 {1} · 데바니온 {2}',[resultPoints.sp,resultPoints.stigma,resultPoints.crystal])}{resultPoints.battle>0&&<> · {t('아스펠 결정')} {resultPoints.battle}</>}{(resultPoints.ariel??0)>0&&<> · {t('아리엘 결정')} {resultPoints.ariel}</>}</span>}</div>
 <p className="subtle">{t('입력만 바꾸면 현재 배분은 유지됩니다. 적용한 뒤에도 직전 배분으로 되돌릴 수 있습니다.')}</p></div>

 {error&&<p role="alert">{error}</p>}
 </section>;
}
