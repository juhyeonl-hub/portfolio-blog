import {useEffect,useState} from 'react';
import {CLASSES} from '../lib/classes';
import {libraryKey,parseLibrary,type BuildLibrary} from '../lib/build-library';
import {gearKeepReason,gearReinvestment} from '../lib/gear-guidance';
import type {Catalog,Plan,GearItem} from '../lib/planner';
import {useLocale} from './locale';
import './gear-guidance.css';
export function useGearReferences(active:boolean){
 const [libraries,setLibraries]=useState<BuildLibrary[]|null>(null);
 useEffect(()=>{if(!active)return;const read=()=>{try{setLibraries(CLASSES.map(c=>parseLibrary(localStorage.getItem(libraryKey(c.key)),c.key)));}catch{setLibraries(null);}};read();window.addEventListener('storage',read);window.addEventListener('focus',read);return()=>{window.removeEventListener('storage',read);window.removeEventListener('focus',read);};},[active]);
 return libraries;
}
export function GearKeepAdvice({item,libraries}:{item:GearItem;libraries:BuildLibrary[]|null}){
 const {t}=useLocale(),a=gearKeepReason(item,libraries);
 const title={wanted:'획득 예정',current:'보관 · 현재 사용 중',target:'보관 · 목표 장비',saved:'보관 · 저장한 빌드에서 사용',review:'다른 용도 확인'}[a.kind];
 const reason={wanted:'아직 보유하지 않은 후보입니다.',current:'실제 교체를 마치기 전에는 현재 장비를 유지하세요.',target:'목표 세팅에 지정한 장비입니다.',saved:'이 장비를 지정한 저장 빌드가 있습니다.',review:'등록된 계획에서 사용처를 찾지 못했습니다. 다른 캐릭터·다른 세팅에서 쓰는지 먼저 확인하세요.'}[a.kind];
 return <div className={'gear-keep '+a.kind}><b>{t(title)}</b><p>{t(reason)}</p>{a.names.length>0&&<small>{t('사용 중인 빌드: {0}',[a.names.join(', ')])}</small>}{!a.checked&&<small>{t('보관함을 읽지 못했습니다. 보관 여부를 직접 확인하세요.')}</small>}{a.kind==='review'&&<small>{t('다른 캐릭터의 장비·귀속·조율 재료 조건은 확인하지 못합니다. 판매·분해해도 된다는 뜻은 아닙니다.')}</small>}</div>;
}
export function GearReinvestment({catalog,plan,onApply}:{catalog:Catalog;plan:Plan;onApply:(p:Plan)=>void}){
 const {t,skill}=useLocale(),result=gearReinvestment(catalog,plan);
 return <section className="panel gear-reinvest"><h3>{t('장비를 바꾸면 스킬 포인트는?')}</h3><p>{t('현재 스킬의 최종 레벨을 유지하면서, 목표 장비에 맞춰 기본 투자를 계산합니다. 등록한 장비 보너스만 반영합니다.')}</p>{!result?<p className="subtle">{t(plan.gear?.mode==='target'?'목표 장비 기준으로 계산 중입니다. 같은 교체를 반복 적용하지 않습니다.':'현재 장착과 목표 세팅을 각각 지정하면 필요한 포인트가 나옵니다.')}</p>:<>{!result.rows.length?<p>{t('장비 교체로 달라지는 스킬 보너스가 없습니다.')}</p>:<><div className="gear-reinvest-summary"><b>{t('스킬 포인트 사용 {0} → {1}',[result.before.sp,result.after.sp])}</b><b>{t('스티그마 사용 {0} → {1}',[result.before.stigma,result.after.stigma])}</b></div><div className="gear-reinvest-list">{result.rows.map(r=><div key={r.skill.id}><img src={'/shadowcraft/game'+r.skill.iconPath} alt=""/><div><b>{skill(r.skill.name)}</b><small>{t('유지할 최종 레벨 {0}',[r.goal])}</small><span>{r.after===null?t('현재 레벨·승급 조건으로는 유지할 수 없습니다.'):t('기본 투자 {0} → {1} · {2} 포인트 {3}',[r.before,r.after,t(r.skill.stigma?'스티그마':'스킬'),(r.delta!>0?'+':'')+r.delta])}</span></div></div>)}</div>{result.blocked&&<p className="gear-warning">{t('유지할 수 없는 스킬이 있어 자동 적용을 멈췄습니다.')}</p>}{!!(result.spShort||result.stigmaShort)&&<p className="gear-warning">{t('부족한 포인트 · 스킬 {0} / 스티그마 {1}',[result.spShort,result.stigmaShort])}</p>}<p>{t('남는 포인트는 자동으로 다른 스킬에 쓰지 않습니다. 데바니온 배치는 그대로 유지합니다.')}</p><button className="button primary" disabled={!result.canApply} onClick={()=>onApply(result.next)}>{t('목표 장비로 바꾸고 스킬 투자 맞추기')}</button><small>{t('사이트의 계획에 적용됩니다. 게임에서는 장비 교체와 스킬 재설정을 직접 해야 합니다.')}</small></>}</>}</section>;
}
