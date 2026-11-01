import {useState} from 'react';
import {type Catalog,type Plan,type DaevanionPurchases,DAEVANION_SHOP_POINTS,daevanionPurchaseBase,daevanionPurchaseTotal,daevanionPurchasePatch,canApplyDaevanionPurchases,isEndgamePointLevel} from '@/lib/planner';
import {useLocale} from './locale';
import './daevanion-purchases.css';
const empty:DaevanionPurchases={shugo:false,nightmare:false};
export default function DaevanionPurchasesPanel({catalog,plan,onChange}:{catalog:Catalog;plan:Plan;onChange:(patch:Partial<Plan>)=>void}){
 const {t}=useLocale();
 const [draft,setDraft]=useState<{source:Plan;shops:DaevanionPurchases}|null>(null);
 const pending=draft?.source===plan?draft:null,shops=pending?.shops||plan.daevanionPurchases||empty;
 const base=daevanionPurchaseBase(catalog,plan),total=daevanionPurchaseTotal(catalog,plan,shops);
 function change(key:keyof DaevanionPurchases,checked:boolean){
  const next={...shops,[key]:checked};
  if(canApplyDaevanionPurchases(catalog,plan)){setDraft(null);onChange(daevanionPurchasePatch(catalog,plan,next));}
  else setDraft({source:plan,shops:next});
 }
 return <fieldset className="daevanion-purchases"><legend>{t('데바니온 상점 구매 체크')}</legend>
 <p>{t('끝까지 구매한 상점을 체크하면 데바니온 총량을 맞춰 줍니다.')}</p>
 <div className="daevanion-shop-options">{(['shugo','nightmare'] as const).map(key=><label key={key}><input type="checkbox" checked={shops[key]} onChange={e=>change(key,e.target.checked)}/><span>{t(key==='shugo'?'슈고 페스타 · 데바니온 구매 완료':'악몽 · 데바니온 구매 완료')}</span><strong>+{DAEVANION_SHOP_POINTS[key]}</strong></label>)}</div>
 <p className="daevanion-shop-total" role="status">{t('체크 기준: 기본 {0} + 상점 {1} = 총 {2}포인트',[base,total-base,total])}</p>
 <p className="subtle">{t(isEndgamePointLevel(plan)?'기본 316은 45레벨·지역 퀘스트·자기 진영 봉인던전 완료 기준입니다.':'레벨링 중에는 레벨 보상에 체크한 상점 구매분만 더합니다.')}</p>
 <p className="subtle">{t('일부만 구매했거나 내실이 덜 끝났다면 위의 데바니온 총량을 직접 수정하세요. 아리엘·아스펠은 별도입니다.')}</p>
 {(pending||(plan.daevanionPurchases&&!canApplyDaevanionPurchases(catalog,plan)))&&<div className="daevanion-shop-confirm"><p>{t('기존 총량에는 상점 구매분이 포함돼 있을 수 있어 그대로 두었습니다. 체크한 내역으로 다시 맞출까요?')}</p><button type="button" className="button primary" onClick={()=>{onChange(daevanionPurchasePatch(catalog,plan,shops));setDraft(null)}}>{t('총량을 {0}으로 맞추기',[total])}</button><button type="button" className="button secondary" onClick={()=>{setDraft(null);if(plan.daevanionPurchases&&!canApplyDaevanionPurchases(catalog,plan))onChange({daevanionPurchases:undefined})}}>{t('현재 값 유지')}</button></div>}
 </fieldset>;
}
