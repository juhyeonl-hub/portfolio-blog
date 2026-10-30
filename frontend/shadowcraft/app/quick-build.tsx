import {useEffect,useRef,useState} from 'react';
import {useLocale} from './locale';
import {isEndgamePointLevel,pointBudgetSourceLabel,type Catalog,type Plan,pointLimits,totals,MODE_NAMES} from '@/lib/planner';
import {BUILD_PURPOSES,PURPOSE_NAMES,type BuildPurpose,buildPurpose,recommendPurposeBuild} from '@/lib/build-purpose';
import './leveling-guide.css';
import './direct-build.css';
import CharacterPoints from './character-points';
import PointNumber from './point-number';

// One setup for the editable plan below. A recommendation never applies on navigation or input.
export default function QuickBuild({catalog,plan,onApply,onChange,onPurposeChange,onStyleApply}:{catalog:Catalog;plan:Plan;onApply:(next:Plan)=>void;onChange:(patch:Partial<Plan>)=>void;onPurposeChange:(purpose:BuildPurpose)=>void;onStyleApply:(mode:Plan['mode'])=>void}){
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
 <h1>{t('내 빌드')}</h1><p>{t('위에서 포인트를 정하고, 아래에서 스킬과 데바니온을 바로 수정하세요.')}</p>
  {typeof actualLevel==='number'&&<div className="growth-basis"><b>{t('조회한 캐릭터: {0} · Lv.{1}',[plan.character.profile.characterName,actualLevel])}</b><span>{t('계산할 목표: Lv.{0}',[plan.level])}</span>{actualLevel!==plan.level&&<p>{t('입력한 레벨의 가상 목표입니다. 아래 현재 스킬·노드는 마지막 조회 당시의 정보입니다.')}</p>}</div>}
  <div className="growth-inputs">
   <label>{t('캐릭터 레벨')}<PointNumber label={t('캐릭터 레벨')} min={1} max={45} value={plan.level} onValue={level=>onChange({level})}/></label>

  </div>
  <p className="subtle">{t('총 포인트 = 이미 쓴 양 + 남은 양. 캐릭터 조회로 총량은 확인되지 않습니다.')} {t(pointBudgetSourceLabel(plan))}</p>
  <details className="growth-basis-details"><summary>{t('포인트 계산 기준')}</summary>
  <p>{t(isEndgamePointLevel(plan)?'45레벨은 콘텐츠 완료 기준으로 안내합니다. 아직 완료하지 않았거나 총량이 다르면 아래 숫자를 수정하세요.':'레벨만 입력하면 최소 기준으로 안내합니다. 추가로 얻은 포인트까지 반영하려면 아래 총량을 수정하세요.')}</p>
  <p className="subtle">{t(isEndgamePointLevel(plan)?'45레벨 기본값은 서브 퀘스트·봉인던전·주둔지를 모두 완료했다고 가정합니다. 실제 완료 여부를 조회한 값은 아닙니다.':'레벨별 최소 기준은 레벨업 보상만 포함합니다. 봉인던전·서브 퀘스트 등에서 얻은 추가 포인트는 사람마다 달라 제외합니다.')}</p>
  {isEndgamePointLevel(plan)&&<p className="subtle">{t('서브 퀘스트 보상 58 + 내 종족 봉인던전 61곳 × 2를 더합니다. 주둔지의 별도 포인트는 추가하지 않습니다. 스티그마는 레벨 보상 29이며, 승급 추가 보상·상점 구매·이벤트는 별도입니다.')}</p>}
  <button className="button secondary small" onClick={()=>onChange({pointBudget:undefined,extraSP:0,extraStigma:0,extraCrystal:0,extraBattle:0})}>{t(isEndgamePointLevel(plan)?'콘텐츠 완료 기준으로 되돌리기':'레벨별 최소 기준으로 되돌리기')}</button>
  </details>
  <CharacterPoints catalog={catalog} plan={plan} points={points} onChange={onChange}/>
  <div className="direct-build-options">
  {!isEndgamePointLevel(plan)&&<label className="ascension-confirm"><input type="checkbox" checked={plan.ascensionGrade3Confirmed===true} onChange={e=>onChange({ascensionGrade3Confirmed:e.target.checked})}/>{t('게임에서 3차 승급을 완료했습니다')}</label>}
  <div className="growth-purpose" role="group" aria-label={t('플레이 목적')}><span>{t('플레이 목적')}</span>{BUILD_PURPOSES.map(value=><button ref={value==='leveling'?levelingButton:undefined} type="button" className={'button secondary '+(purpose===value?'selected':'')+(value==='leveling'&&isEndgamePointLevel(plan)?' requires-confirm':'')} aria-pressed={purpose===value} aria-describedby={value==='leveling'&&isEndgamePointLevel(plan)?'leveling-availability':undefined} aria-haspopup={value==='leveling'&&isEndgamePointLevel(plan)?'dialog':undefined} key={value} onClick={()=>selectPurpose(value)}>{t(PURPOSE_NAMES[value])}</button>)}</div>
  </div>
  {isEndgamePointLevel(plan)&&<p id="leveling-availability" className="leveling-availability">{t('현재 목표가 만렙(45레벨)이므로 레벨링은 기본 선택이 아닙니다. 그래도 보고 싶다면 레벨링을 눌러 확인하세요.')}</p>}
  {purposeRequest&&<dialog ref={purposeDialog} className="leveling-confirm-dialog" aria-labelledby="leveling-confirm-title" aria-describedby="leveling-confirm-effect" onCancel={e=>{e.preventDefault();setPurposeRequest(null)}} onClose={()=>setPurposeRequest(null)} onClick={e=>{if(e.target===e.currentTarget)setPurposeRequest(null)}}>
   <h2 id="leveling-confirm-title">{t('레벨링 빌드를 볼까요?')}</h2>
   <p id="leveling-confirm-effect">{t('레벨링 빌드를 보면 목표 레벨은 44로, 포인트는 해당 레벨의 기본값으로 바뀝니다.')}</p>
   <p>{t('현재 스킬·특화·데바니온 배분은 유지합니다. 전환 후에는 이전 설정으로 되돌릴 수 있습니다.')}</p>
   <div className="leveling-confirm-actions"><button autoFocus type="button" className="button secondary" onClick={()=>setPurposeRequest(null)}>{t('현재 빌드 유지')}</button><button type="button" className="button primary" onClick={()=>{const current=purposeRequest.plan===plan&&purposeRequest.catalog===catalog;setPurposeRequest(null);if(current)onPurposeChange('leveling')}}>{t('레벨링 보기')}</button></div>
  </dialog>}
  <p className="growth-purpose-note" role="status"><b>{t('계산할 목표: Lv.{0}',[plan.level])}</b><br/>{t(purpose==='leveling'?'레벨링: 현재 레벨에서 열리는 스킬과 데바니온으로 공격 위주 배분을 안내합니다.':purpose==='pve'?'PvE: 45레벨 원정을 위한 직업별 보스·파티 가이드에 생존을 고려해 배분합니다.':'PvP: 유저와의 전투용 능력치와 데바니온을 우선합니다. 스킬은 기존 직업 가이드를 참고합니다.')}</p>
  <p className="subtle">{t('레벨링은 최대 44레벨, PvE는 45레벨 목표로 전환합니다. 레벨이 바뀌면 포인트는 해당 레벨의 기본값으로 바뀝니다.')} {t('현재 포인트 안에서 계산한 참고 배분이며, 콘텐츠별 최적 세팅을 검증한 결과는 아닙니다.')}</p>

 {isEndgamePointLevel(plan)&&<p className="completion-basis">{t('45레벨은 3차 승급·봉인던전·주둔지·서브 퀘스트 등 기본 내실을 완료한 상태를 기준으로 계획합니다.')}<br/><small>{t('실제 완료 여부를 조회한 값은 아닙니다. 총 포인트가 다르면 위의 총량을 수정하세요.')}</small></p>}
 <div className="build-recommend-action"><button type="button" className="button primary" disabled={!candidate} onClick={()=>candidate&&onApply(candidate)}>{t(candidate?'추천 배분 적용':'현재 레벨·포인트로 계산 중…')}</button>
 {resultPoints&&<span>{t('추천 포인트: 스킬 {0} · 스티그마 {1} · 데바니온 {2}',[resultPoints.sp,resultPoints.stigma,resultPoints.crystal])}</span>}</div>
 <p className="subtle">{t('추천을 적용하면 아래 스킬·특화·데바니온 계획이 바뀝니다. 직접 수정한 내용도 바뀌며 되돌릴 수 있습니다.')}</p>
 <details className="build-style-options"><summary>{t('다른 추천 방식')}</summary><div className="beginner-next">{(['safe','damage'] as const).map(mode=><button key={mode} type="button" className="button secondary" onClick={()=>onStyleApply(mode)}>{t('{0} 추천 적용',[t(MODE_NAMES[mode])])}</button>)}</div></details>
 {error&&<p role="alert">{error}</p>}
 </section>;
}
