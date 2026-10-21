import {useEffect,useState} from 'react';
import {useLocale} from './locale';
import {slotLabel} from './equipment-grid';
import {loadItemIndex,type ItemIndex} from '../lib/item-index';
import {compareRankerEquipment,type Ranker,type RankerEquipment} from '../lib/ranker-builds';
import {equipped,MODE_NAMES,type Catalog,type Plan} from '../lib/planner';
import {queryArmory} from '../lib/armory-client';
import {equipmentAdvice,parseEquippedDetail,skillFit,statFit,type EquippedDetail,type Investment} from '../lib/equipment-advice';

type Identity={id:string;server:string;region:string};
const ADVICE={unknown:'장비 레벨 또는 실제 옵션 정보가 부족해 투자 판단을 보류합니다.',replace:'교체 예정 장비입니다. 조율·영혼각인보다 교체 자원을 우선 확보하세요.',low:'비교 장비보다 아이템 레벨이 낮습니다. 조율·영혼각인은 보류하고 교체부터 검토하세요.',budget:'자원 여유가 확인되지 않았습니다. 조율·영혼각인 투자를 보류합니다.',plan:'장기 사용할 장비인지 먼저 정하세요. 사용 계획이 미정이면 투자를 보류합니다.',unsupported:'이 장비의 무작위 옵션 변경 가능 여부를 확인할 수 없습니다. 게임에서 지원 여부를 확인하세요.',tune:'우선순위가 낮은 옵션이 있습니다. 게임에서 조율 가능 옵션·비용·유지할 옵션을 확인한 뒤 조율을 검토하세요. 영혼각인은 옵션 구성을 정한 다음입니다.',review:'옵션별 용도를 확인하세요. 판단하지 못한 옵션을 나쁜 옵션으로 간주하지 않습니다.',engrave:'장기 사용과 옵션 구성이 확인되었습니다. 게임에서 영혼각인 대상·상승 여지·비용을 확인하고, 개선 여지가 있을 때만 진행하세요.'};
const FIT={mismatch:'현재 빌드에서 낮은 우선순위',priority:'현재 빌드의 우선 옵션',review:'용도 확인 필요'};
function ActualOptions({identity,item,mine,catalog,plan,referenceLevel,index}:{identity:Identity|null;item:RankerEquipment|undefined;mine:boolean;catalog:Catalog;plan:Plan;referenceLevel:number|null;index:ItemIndex|null}){
 const {t,locale,skill:skillName}=useLocale();
 const [detail,setDetail]=useState<EquippedDetail|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[retry,setRetry]=useState(0);
 const [investment,setInvestment]=useState<Investment>('unknown'),[budget,setBudget]=useState(false),[reviewed,setReviewed]=useState(false),[unwanted,setUnwanted]=useState<string[]>([]);
 const id=identity?.id,server=identity?.server,region=identity?.region,itemId=item?.id,slot=item?.slotPos,enchant=item?.enchantLevel;
 useEffect(()=>{
  const controller=new AbortController();let active=true;
  setDetail(null);setError('');setLoading(true);setReviewed(false);setUnwanted([]);
  if(!id||!server||!region||!itemId||slot===undefined||enchant===undefined){setLoading(false);return()=>controller.abort();}
  queryArmory({action:'item',class:catalog.classKey||'',id,server,region,itemId:String(itemId),slot:String(slot),enchant:String(enchant)},controller.signal).then(result=>{
   if(!active)return;
   const parsed=parseEquippedDetail(result,{id,server,region,itemId,slot,enchant});
   if(!parsed)throw Error('실제 장비 옵션을 확인하지 못했습니다. 캐릭터를 다시 조회하세요.');
   setDetail(parsed);
  }).catch(e=>{if(active)setError(e instanceof Error?e.message:'공식 조회 실패');}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;controller.abort();};
 },[id,server,region,itemId,slot,enchant,catalog.classKey,retry]);
 const known=catalog.skills.map(s=>s.id),used=catalog.skills.filter(s=>s.stigma?equipped(plan).includes(s.id):(plan.base[s.id]??1)>0).map(s=>s.id),inactive=catalog.skills.filter(s=>s.stigma&&!equipped(plan).includes(s.id)).map(s=>s.id);
 const options=detail?[...detail.subStats.map(s=>({key:'stat:'+s.id,name:locale==='ko'?(index?.stats[s.id]?.ko||s.name):s.name,value:s.value,fit:statFit(s.id,plan.mode)})),...detail.subSkills.map(s=>({key:'skill:'+s.id,name:skillName(catalog.skills.find(x=>x.id===String(s.id))?.name||s.name),value:'+'+s.level,fit:skillFit(String(s.id),known,used,inactive)}))]:[];
 const advice=equipmentAdvice({detail,referenceLevel,investment,budget,unwanted:options.filter(o=>o.fit==='mismatch'||unwanted.includes(o.key)).length,reviewed});
 return <div className="actual-options">
  <h4>{t(mine?'내 장비의 실제 옵션':'랭커 장비의 실제 옵션')}</h4>
  {!item||!identity?<p>{t('캐릭터 또는 해당 부위의 조회 정보가 없습니다.')}</p>:loading?<p role="status">{t('실제 장착 옵션 조회 중…')}</p>:error?<><p role="alert">{t(error)}</p><button className="button ghost" onClick={()=>setRetry(n=>n+1)}>{t('다시 조회')}</button></>:detail&&<>
   <b>{detail.name}</b><p>{t('아이템 레벨 {0}',[detail.level])}</p>
   <p className="subtle">{t('아래는 이번 공식 응답의 실제 무작위 옵션과 스킬입니다. 기본 능력치·마석·신석은 투자 판단에서 제외합니다.')}</p>
   {!options.length&&<p>{t('공개된 무작위 옵션이 없습니다.')}</p>}
   <ul className="rolled-options">{options.map((o,i)=><li key={o.key+':'+i}><span><b>{o.name}</b> {o.value}</span>{mine&&<><small className={'option-fit '+o.fit}>{t(FIT[o.fit])}</small>{o.fit!=='mismatch'&&<label><input type="checkbox" checked={unwanted.includes(o.key)} onChange={e=>{setReviewed(false);setUnwanted(v=>e.target.checked?[...v,o.key]:v.filter(x=>x!==o.key));}}/>{t('내 용도에는 불필요')}</label>}</>}</li>)}</ul>
   {mine&&<div className="investment-advice">
    <h4>{t('이 장비에 투자해도 될까?')}</h4>
    <p>{t('레벨 기준: 같은 부위 랭커 장비 {0}. 낮은 레벨은 교체 우선으로 판단합니다. 성능 순위나 공통 최소 레벨을 뜻하지 않습니다.',[referenceLevel??'?'])}</p>
    <label>{t('사용 계획')}<select value={investment} onChange={e=>setInvestment(e.target.value as Investment)}><option value="unknown">{t('아직 미정')}</option><option value="replace">{t('곧 교체')}</option><option value="keep">{t('장기 사용')}</option></select></label>
    <label><input type="checkbox" checked={budget} onChange={e=>setBudget(e.target.checked)}/>{t('교체·필수 성장 비용을 제외해도 자원이 남아요')}</label>
    <label><input type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/>{t('모든 옵션이 내 운용에 필요한지 확인했어요')}</label>
    <p className={'advice-result advice-'+advice} role="status">{t(ADVICE[advice])}</p>
   </div>}
  </>}
 </div>;
}
export default function MyRankerComparison({catalog,plan,ranker,live}:{catalog:Catalog;plan:Plan;ranker:Ranker;live:any}){
 const {t}=useLocale();
 const [index,setIndex]=useState<ItemIndex|null>(null),[slot,setSlot]=useState<number|null>(null);
 useEffect(()=>{let active=true;loadItemIndex().then(x=>{if(active)setIndex(x)});return()=>{active=false};},[]);
 const mine=plan.character,comparison=compareRankerEquipment(mine?.equipment,live?.equipment??ranker.equipment);
 const row=comparison.rows.find(r=>r.slot===slot);
 const identity:Identity|null=mine?.classKey===catalog.classKey&&mine?.profile?.characterId&&mine?.profile?.serverId&&mine?.region?{id:mine.profile.characterId,server:String(mine.profile.serverId),region:mine.region}:null;
 const other:Identity={id:ranker.characterId,server:String(ranker.serverId),region:ranker.region};
 const summary=(item:RankerEquipment|undefined)=>item?<><b>{item.name}</b><small>{t('강화 +{0} · 초월 +{1}',[item.enchantLevel,item.exceedLevel])}{index?.items[item.id]?' · '+t('아이템 레벨 {0}',[index.items[item.id].lv]):''}</small></>:<span>{t('조회 정보 없음')}</span>;
 return <section className="my-ranker-comparison" aria-label={t('내 캐릭터와 랭커 비교')}>
  <h3>{t('내 캐릭터와 랭커 비교')}</h3>
  <p>{t('같은 부위를 좌우로 비교하세요. 부위를 선택하면 실제 옵션과 내 장비의 투자 조언을 조회합니다.')}</p>
  <p className="subtle">{t('판단 기준: {0} · {1}. 레벨 비교는 글로벌 아이템 자료 기준이며 랭커의 옵션을 정답으로 취급하지 않습니다.',[t(catalog.className||catalog.classKey||''),t(MODE_NAMES[plan.mode])])}</p>
  {!identity&&<p role="status">{t('빌드 화면에서 내 캐릭터를 먼저 연결하세요.')}</p>}
  <div className="equipment-pair headings"><div><strong>{t('내 캐릭터')}</strong><b>{mine?.profile?.characterName||t('연결되지 않음')}</b><small>{mine?.importedAt?new Date(mine.importedAt).toLocaleString():''}</small></div><div><strong>{t('비교할 랭커')}</strong><b>{ranker.name}</b><small>{t(live?'이번 공식 응답':'저장된 장비 목록')}</small></div></div>
  <div className="aligned-equipment">{comparison.rows.map(r=><div className={'aligned-slot '+(slot===r.slot?'selected':'')} key={r.slot}>
   <button className="slot-selector" aria-pressed={slot===r.slot} onClick={()=>setSlot(r.slot)}>{slotLabel(r.left?.slotPosName||r.right?.slotPosName||String(r.slot),t)} <span>{t('옵션 비교')}</span></button>
   <div className="equipment-pair"><div>{summary(r.left)}</div><div>{summary(r.right)}</div></div>
   {slot===r.slot&&row&&<div className="equipment-pair option-pair" key={JSON.stringify([identity,other,row.left,row.right,plan.mode,plan.base,live?.importedAt])}>
    <ActualOptions identity={identity} item={row.left} mine catalog={catalog} plan={plan} referenceLevel={row.right?index?.items[row.right.id]?.lv??null:null} index={index}/>
    <ActualOptions identity={other} item={row.right} mine={false} catalog={catalog} plan={plan} referenceLevel={null} index={index}/>
   </div>}
  </div>)}</div>
 </section>;
}
