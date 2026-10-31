import {useEffect,useState} from 'react';
import {type Catalog,type Plan,type PointBudget} from '@/lib/planner';
import {characterPoints,pointBalance,confirmRemaining} from '@/lib/character-points';
import {queryArmory} from '@/lib/armory-client';
import {useLocale} from './locale';
import PointNumber from './point-number';
import './leveling-guide.css';
export default function CharacterPoints({catalog,plan,points,onChange}:{catalog:Catalog;plan:Plan;points:PointBudget;onChange:(patch:Partial<Plan>)=>void}){
 const {t}=useLocale();const character=plan.character;
 const [gear,setGear]=useState<{source:any;bonus:Record<string,number>|null}|null>(null);
 useEffect(()=>{
  if(!character)return;const abort=new AbortController();setGear(null);
  (async()=>{try{
   if(!Array.isArray(character.equipment))throw Error('missing equipment');
   const bonus:Record<string,number>={};const items=[...character.equipment];
   async function worker(){while(items.length){const item=items.shift();if(!item)break;
    const d=await queryArmory({action:'item',class:catalog.classKey||plan.classKey||'assassin',region:character.region||'eu',server:String(character.profile.serverId),id:character.profile.characterId,itemId:String(item.id),slot:String(item.slotPos),enchant:String(item.enchantLevel)},abort.signal);
    if(d.item?.id!==item.id||d.item?.enchantLevel!==item.enchantLevel||d.slotPos!==item.slotPos||d.characterId!==character.profile.characterId)throw Error('changed equipment');
    const skills=d.item.subSkills;
    if(!Array.isArray(skills)&&d.item.subSkillCountMax!==0)throw Error('unknown bonuses');
    for(const s of skills||[]){if(!Number.isInteger(s.level)||s.level<0)throw Error('invalid bonus');bonus[String(s.id)]=(bonus[String(s.id)]||0)+s.level;}
   }}
   await Promise.all([worker(),worker()]);if(!abort.signal.aborted)setGear({source:character,bonus});
  }catch{if(!abort.signal.aborted)setGear({source:character,bonus:null});}})();
  return()=>abort.abort();
 },[character,catalog.classKey,plan.classKey]);
 const spent=characterPoints(catalog,character,gear&&gear.source===character?gear.bonus:null),sameLevel=!!character&&plan.level===character.profile?.characterLevel;
 return <section className="growth-actual-points" aria-label={t('내 캐릭터 포인트')}>
 <h3>{t('사용 / 남음 / 총량')}</h3><p>{t('사용은 조회 정보로 계산합니다. 게임에 남은 양을 입력하면, 사용량을 아는 항목의 총량과 추천이 바로 바뀝니다.')}</p>
 {!character&&<p>{t(plan.confirmedRemaining?'직접 입력해 둔 남은 포인트입니다. 같은 캐릭터를 같은 레벨로 다시 조회하면 이 값을 이어서 사용합니다.':'캐릭터를 연결하면 사용량을 확인할 수 있습니다. 지금은 총량으로 추천을 볼 수 있습니다.')}</p>}
 {character&&!sameLevel&&<p>{t('다른 레벨의 목표를 보는 중입니다. 잔여량 입력은 조회한 캐릭터 레벨에서 할 수 있습니다.')}</p>}
 <div className="growth-points-grid">{(['sp','stigma','crystal','battle','ariel'] as const).map((key,i)=>{const used=spent[key],remaining=pointBalance(points[key],used),confirmed=plan.confirmedRemaining?.[key];return <div className="growth-point-card" key={key}>
 <b>{t(['스킬 포인트','스티그마 포인트','데바니온 포인트','아스펠 결정','아리엘 결정'][i])}</b>
 <div className="point-metrics">
 <div><span>{t('사용')}</span><strong>{used===null?t(character&&gear===null&&i<2?'장비 확인 중…':'확인 불가'):used}</strong></div>
 <label>{t('남음')}<PointNumber label={t(['남은 스킬 포인트','남은 스티그마 포인트','남은 데바니온 포인트','남은 아스펠 결정','남은 아리엘 결정'][i])} value={confirmed} disabled={!sameLevel} key={JSON.stringify([character?.region,character?.profile?.serverId,character?.profile?.characterId,character?.profile?.characterLevel,plan.level])} placeholder={t('게임에서 확인')} onValue={value=>{const patch=confirmRemaining(plan,points,key,value,used);if(patch)onChange(patch)}}/></label>
 <label>{t('총량')}<PointNumber label={t(['스킬 포인트','스티그마 포인트','데바니온 포인트','아스펠 결정','아리엘 결정'][i])} value={points[key]??0} onValue={value=>onChange({pointBudget:{...points,[key]:value}})}/></label>
 </div>
 {used===null?<small>{t('사용량 미확인: 남은 양은 보존하고, 추천은 입력한 총량으로 계산합니다.')}</small>:sameLevel&&confirmed!==undefined&&remaining!==confirmed?<small>{t('계산한 남은 포인트와 직접 입력한 값이 다릅니다. 추천은 입력한 총량으로 계산합니다.')}</small>:<small>{t('사용: 조회 기반 · 남음: 직접 확인 · 총량: 추천 계산용')}</small>}
 </div>})}</div>
 <details><summary>{t('포인트 계산 기준과 확인되지 않은 값')}</summary><p>{t('‘남음’은 게임에서 확인해 직접 입력한 값입니다. 다시 조회하거나 총량을 바꿔도 이 입력값은 유지합니다. 조회 정보로 계산한 수치는 게임과 다를 수 있습니다.')}</p>
 <p>{t('스킬 사용량은 실제 최종 레벨에서 조회한 데바니온·장비 스킬 보너스를 뺀 계산값입니다. 다른 보너스나 조회 지연이 있으면 게임과 다를 수 있습니다.')}</p></details>
 </section>;
}
