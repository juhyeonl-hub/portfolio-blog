import {useEffect,useState} from 'react';
import {type Catalog,type Plan,type PointBudget} from '@/lib/planner';
import {characterPointReport,pointBalance,confirmRemaining} from '@/lib/character-points';
import {queryArmory} from '@/lib/armory-client';
import {createPointGear,pointGearState,type PointGearFailure} from '@/lib/point-gear';
import {useLocale} from './locale';
import PointNumber from './point-number';
import DaevanionPurchasesPanel from './daevanion-purchases';
import './leveling-guide.css';
export default function CharacterPoints({catalog,plan,points,onChange}:{catalog:Catalog;plan:Plan;points:PointBudget;onChange:(patch:Partial<Plan>)=>void}){
 const {t,skill:skillName}=useLocale();const character=plan.character;
 const [gear,setGear]=useState<{source:any;bonus:Record<string,number>|null;failure?:boolean;loading?:boolean;completed?:number;total?:number;retryAt?:number|null;errors?:PointGearFailure[];retry?:()=>void}|null>(null);
 useEffect(()=>{
  if(!character){setGear(null);return;}
  const lookup=createPointGear(character,catalog.classKey||plan.classKey||'assassin',queryArmory);
  if(!lookup){setGear({source:character,bonus:null,failure:true,loading:false});return;}
  const retry=()=>{for(const [key,entry] of lookup.store.entries)if(entry.status==='error')lookup.store.retry(key);};
  const refresh=()=>setGear({source:character,...pointGearState(lookup),retry});
  const unsubscribe=lookup.store.subscribe(refresh);refresh();
  queueMicrotask(()=>lookup.store.start());
  return()=>{unsubscribe();lookup.store.dispose();};
 },[character,catalog.classKey,plan.classKey]);
 const report=characterPointReport(catalog,character,gear&&gear.source===character?gear.bonus:null),spent=report.spent,sameLevel=!!character&&plan.level===character.profile?.characterLevel;
 return <section className="growth-actual-points" aria-label={t('내 캐릭터 포인트')}>
 <h3>{t('사용 / 남음 / 총량')}</h3><p>{t('사용은 조회 정보로 계산합니다. 게임에 남은 양을 입력하면, 사용량을 아는 항목의 총량과 추천이 바로 바뀝니다.')}</p>
 {!character&&<p>{t(plan.confirmedRemaining?'직접 입력해 둔 남은 포인트입니다. 같은 캐릭터를 같은 레벨로 다시 조회하면 이 값을 이어서 사용합니다.':'캐릭터를 연결하면 사용량을 확인할 수 있습니다. 지금은 총량으로 추천을 볼 수 있습니다.')}</p>}
 {character&&!sameLevel&&<p>{t('다른 레벨의 목표를 보는 중입니다. 잔여량 입력은 조회한 캐릭터 레벨에서 할 수 있습니다.')}</p>}
 {character&&report.reasons.length>0&&<div className="point-diagnostics" role="status"><strong>{t('사용량을 계산하려면 추가 확인이 필요해요')}</strong><ul>
 {report.reasons.includes('boards')&&<li>{t('데바니온 조회가 일부 빠졌거나 저장된 노드 정보와 다릅니다. 위의 새로 조회를 눌러 주세요.')}</li>}
 {report.reasons.includes('gear')&&<li>{t(gear?.source===character&&gear?.retryAt?'조회 요청이 많아 잠시 대기 중입니다. 확인한 장비는 유지하고 자동으로 이어서 조회합니다.':!gear||gear.source!==character||gear.loading?'장비의 스킬 보너스를 확인하고 있어요. 확인이 끝나면 사용량을 다시 계산합니다.':'장비 보너스를 모두 확인하지 못했어요. 다시 확인해도 안 되면 게임에서 총 포인트를 확인해 입력하세요.')}</li>}
 {report.reasons.includes('skills')&&<li>{t('조회된 스킬 레벨이 일부 없거나 읽을 수 없습니다. 위의 새로 조회를 눌러 주세요.')}</li>}
 {report.reasons.includes('bonus')&&<li>{t('조회된 스킬 레벨과 보너스가 맞지 않아 사용량을 확정할 수 없어요. 게임의 총 포인트를 입력하면 추천은 계속 볼 수 있어요.')}<span> {report.mismatches.slice(0,3).map(id=>skillName(catalog.skills.find(s=>s.id===id)?.name||id)).join(' · ')}</span></li>}
 </ul>{gear&&gear.source===character&&<>
 {gear.total!==undefined&&<p>{t('장비 보너스 확인: {0}/{1}개',[gear.completed,gear.total])}</p>}
 {!!gear.errors?.length&&<ul>{gear.errors.map(item=><li key={item.key}>{item.name||t('장비 부위 {0}',[item.slot])} · {t(item.reason==='busy'?'조회 제한으로 보류됐습니다. 잠시 후 다시 확인하세요.':item.reason==='missing'?'공식 응답에 스킬 보너스가 없습니다. 0으로 계산하지 않습니다.':item.reason==='changed'?'장비 정보가 달라졌습니다. 위의 새로 조회를 눌러 주세요.':item.reason==='invalid'?'장비 보너스 형식을 확인할 수 없습니다.':'장비 조회에 실패했습니다. 잠시 후 다시 확인하세요.')}</li>)}</ul>}
 {gear.failure&&gear.retry&&<button type="button" className="button secondary" disabled={gear.loading} onClick={gear.retry}>{t('장비 보너스 다시 확인')}</button>}
 {gear.failure&&!gear.retry&&<p>{t('장비 정보가 달라졌습니다. 위의 새로 조회를 눌러 주세요.')}</p>}
 </>}</div>}
 <div className="growth-points-grid">{(['sp','stigma','crystal','battle','ariel'] as const).map((key,i)=>{const used=spent[key],remaining=pointBalance(points[key],used),confirmed=plan.confirmedRemaining?.[key];return <div className="growth-point-card" key={key}>
 <b>{t(['스킬 포인트','스티그마 포인트','데바니온 포인트','아스펠 결정','아리엘 결정'][i])}</b>
 <div className="point-metrics">
 <div><span>{t('사용')}</span><strong>{used===null?t(character&&gear?.source===character&&gear?.retryAt&&i<2?'조회 대기 중…':character&&(!gear||gear.source!==character||gear.loading)&&i<2?'장비 확인 중…':'확인 불가'):used}</strong></div>
 <label>{t('남음')}<PointNumber label={t(['남은 스킬 포인트','남은 스티그마 포인트','남은 데바니온 포인트','남은 아스펠 결정','남은 아리엘 결정'][i])} value={confirmed} disabled={!sameLevel} key={JSON.stringify([character?.region,character?.profile?.serverId,character?.profile?.characterId,character?.profile?.characterLevel,plan.level])} placeholder={t('게임에서 확인')} onValue={value=>{const patch=confirmRemaining(plan,points,key,value,used);if(patch)onChange(patch)}}/></label>
 <label>{t('총량')}<PointNumber label={t(['스킬 포인트','스티그마 포인트','데바니온 포인트','아스펠 결정','아리엘 결정'][i])} value={points[key]??0} onValue={value=>onChange({pointBudget:{...points,[key]:value}})}/></label>
 </div>
 {used===null?<small>{t('사용량 미확인: 남은 양은 보존하고, 추천은 입력한 총량으로 계산합니다.')}</small>:sameLevel&&confirmed!==undefined&&remaining!==confirmed?<small>{t('계산한 남은 포인트와 직접 입력한 값이 다릅니다. 추천은 입력한 총량으로 계산합니다.')}</small>:<small>{t('사용: 조회 기반 · 남음: 직접 확인 · 총량: 추천 계산용')}</small>}
 </div>})}</div>
 <DaevanionPurchasesPanel catalog={catalog} plan={plan} onChange={onChange}/>
 <details><summary>{t('포인트 계산 기준과 확인되지 않은 값')}</summary><p>{t('‘남음’은 게임에서 확인해 직접 입력한 값입니다. 다시 조회하거나 총량을 바꿔도 이 입력값은 유지합니다. 조회 정보로 계산한 수치는 게임과 다를 수 있습니다.')}</p>
 <p>{t('스킬 사용량은 실제 최종 레벨에서 조회한 데바니온·장비 스킬 보너스를 뺀 계산값입니다. 다른 보너스나 조회 지연이 있으면 게임과 다를 수 있습니다.')}</p></details>
 </section>;
}
