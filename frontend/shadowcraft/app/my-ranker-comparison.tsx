import './equipment-guidance.css';
import {useEffect,useState} from 'react';
import {useLocale} from './locale';
import EquipmentGrid,{slotLabel} from './equipment-grid';
import {loadItemIndex,type ItemIndex} from '../lib/item-index';
import {compareRankerEquipment,type Ranker,type RankerEquipment} from '../lib/ranker-builds';
import {equipped,MODE_NAMES,type Catalog,type Plan} from '../lib/planner';
import {queryArmory} from '../lib/armory-client';
import {equipmentAdvice,optionReason,parseEquippedDetail,skillFit,statFit,type EquippedDetail,type Investment} from '../lib/equipment-advice';

type Identity={id:string;server:string;region:string};
const ADVICE={progress:'다음 던전 준비용 장비입니다. 필요한 강화·옵션 개선부터 검토하고, 반복 조율·영혼각인은 교체 예상 시기와 비용을 비교하세요.',unknown:'장비 레벨 또는 실제 옵션 정보가 부족해 투자 판단을 보류합니다.',replace:'교체 예정 장비입니다. 조율·영혼각인보다 교체 자원을 우선 확보하세요.',low:'70레벨 미만 장비는 교체 시기를 먼저 확인하세요. 다음 던전 준비에 필요하다면 성장용 사용을 선택해 필요한 만큼 투자를 검토할 수 있습니다.',budget:'먼저 사용할 수 있는 재료와 비용을 확인하세요. 지금은 목표 옵션을 살펴보고, 재료를 쓰는 결정은 나중에 해도 됩니다.',plan:'다음 장비를 얻기 전까지 사용할지, 오래 사용할지 선택하면 목적에 맞게 안내합니다.',unsupported:'이 장비의 무작위 옵션 변경 가능 여부를 확인할 수 없습니다. 게임에서 지원 여부를 확인하세요.',tune:'직접 고른 변경 후보가 있습니다. 게임에서 조율 가능 옵션·비용·유지할 옵션을 확인한 뒤 조율을 검토하세요. 작업 순서는 확인하지 못했으므로 게임의 설명을 먼저 확인하세요.',review:'옵션별 용도를 확인하세요. 판단하지 못한 옵션을 나쁜 옵션으로 간주하지 않습니다.',engrave:'장기 사용을 선택하고 옵션 확인에 체크했습니다. 이것만으로 추가 투자가 꼭 필요한 것은 아닙니다. 게임에서 영혼각인 대상·상승 여지·비용을 확인하고, 개선 여지가 있을 때만 진행하세요.'};
const FIT={mismatch:'사용 목적 확인',priority:'유지 후보',review:'판단 정보 부족'};
function ActualOptions({identity,item,mine,catalog,plan,referenceLevel,index}:{identity:Identity|null;item:RankerEquipment|undefined;mine:boolean;catalog:Catalog;plan:Plan;referenceLevel:number|null;index:ItemIndex|null}){
 const {t,locale,skill:skillName}=useLocale();
 const [detail,setDetail]=useState<EquippedDetail|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[retry,setRetry]=useState(0);
 const [investment,setInvestment]=useState<Investment>('unknown'),[budget,setBudget]=useState(false),[reviewed,setReviewed]=useState(false),[unwanted,setUnwanted]=useState<string[]>([]);
 const [purpose,setPurpose]=useState('build');
 const adviceMode=purpose==='build'?plan.mode:purpose==='pvp'?'pvp':purpose==='attack'?'damage':'safe';
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
 const options=detail?[...detail.subStats.map(s=>({key:'stat:'+s.id,name:locale==='ko'?(index?.stats[s.id]?.ko||s.name):s.name,value:s.value,fit:statFit(s.id,adviceMode)})),...detail.subSkills.map(s=>({key:'skill:'+s.id,name:skillName(catalog.skills.find(x=>x.id===String(s.id))?.name||s.name),value:'+'+s.level,fit:skillFit(String(s.id),known,used,inactive)}))]:[];
 const advice=equipmentAdvice({detail,referenceLevel,investment,budget,unwanted:unwanted.length,reviewed});
 return <div className="actual-options">
  <h4>{t(mine?'내 장비의 실제 옵션':'랭커 장비의 실제 옵션')}</h4>
  {!item||!identity?<p>{t('캐릭터 또는 해당 부위의 조회 정보가 없습니다.')}</p>:loading?<p role="status">{t('실제 장착 옵션 조회 중…')}</p>:error?<><p role="alert">{t(error)}</p><button className="button ghost" onClick={()=>setRetry(n=>n+1)}>{t('다시 조회')}</button></>:detail&&<>
   <b>{detail.name}</b><p>{t('아이템 레벨 {0}',[detail.level])}</p>
   <p className="subtle">{t('아래는 이번 공식 응답의 실제 무작위 옵션과 스킬입니다. 기본 능력치·마석·신석은 투자 판단에서 제외합니다.')}</p>
   {!options.length&&<p>{t('공개된 무작위 옵션이 없습니다.')}</p>}
   {mine&&<div className="investment-advice">
    <h4>{t('이 장비로 무엇을 하고 싶나요?')}</h4>
    <label>{t('장비 안내의 사용 목적')}<select value={purpose} onChange={e=>{setPurpose(e.target.value);setReviewed(false);setUnwanted([]);}}>
     <option value="build">{t('현재 빌드 기준')}</option><option value="solo">{t('혼자 사냥')}</option><option value="attack">{t('파티에서 공격')}</option><option value="heal">{t('파티에서 회복')}</option><option value="pvp">{t('유저와 전투')}</option>
    </select></label>
    <p className="subtle">{t('이 선택은 아래 안내만 바꿉니다. 스킬 배치와 저장된 빌드는 바뀌지 않습니다. 회복량·생존력의 정확한 효율은 계산하지 않습니다.')}</p>
   </div>}
   <ul className="rolled-options">{options.map((o,i)=><li key={o.key+':'+i}><span><b>{o.name}</b> {o.value}</span>{mine&&<><small className={'option-fit '+o.fit}>{t(FIT[o.fit])}</small><small>{t(optionReason(o.key.startsWith('skill:')?'skill':'stat',o.fit))}</small><label><input type="checkbox" checked={unwanted.includes(o.key)} onChange={e=>{setReviewed(false);setUnwanted(v=>e.target.checked?[...v,o.key]:v.filter(x=>x!==o.key));}}/>{t('이 옵션을 다른 옵션으로 바꾸고 싶어요')}</label></>}</li>)}</ul>
   {mine&&<div className="investment-advice">
    <h4>{t('이 장비, 지금 무엇부터 할까요?')}</h4><p>{t('옵션 변경 체크는 조율 후보를 고르는 표시입니다. 체크만으로 게임 장비가 바뀌지는 않습니다.')}</p>
    <p>{t('랭커 장비 레벨 {0}은 참고 정보입니다. 레벨이 낮거나 옵션이 다르다는 이유만으로 교체·조율을 권하지 않습니다.',[referenceLevel??t('미확인')])}</p>
    <label>{t('이 장비를 언제까지 쓸 예정인가요?')}<select value={investment} onChange={e=>setInvestment(e.target.value as Investment)}><option value="unknown">{t('아직 미정')}</option><option value="replace">{t('곧 교체')}</option><option value="progress">{t('다음 던전 장비를 얻을 때까지')}</option><option value="keep">{t('장기 사용')}</option></select></label>
    <label><input type="checkbox" checked={budget} onChange={e=>setBudget(e.target.checked)}/>{t('이 장비의 성장에 쓸 재료와 비용을 확인했어요')}</label>
    <label><input type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/>{t('모든 옵션이 내 운용에 필요한지 확인했어요')}</label>
    <h5>{t('1. 지금 확인할 것')}</h5>
    <p className={'advice-result advice-'+advice} role="status">{t(ADVICE[advice])}</p>
    <h5>{t('2. 바꾸기 전에 볼 것')}</h5>
    <p>{unwanted.length?t('직접 고른 변경 후보 {0}개입니다. 게임에서 해당 줄을 바꿀 수 있는지, 다른 옵션이 유지되는지, 재료가 얼마나 드는지 확인하세요.',[unwanted.length]):t('아직 변경 후보를 고르지 않았습니다. 랭커와 다르다는 이유만으로 바꾸지 않아도 됩니다.')}</p>
    <h5>{t('3. 어디서 멈추면 될까요?')}</h5>
    <p>{t('현재 목적에 맞는 옵션이라면 더 좋은 옵션만 노리며 반복할 필요는 없습니다. 사용할 재료의 한도를 먼저 정하고, 한도에 도달하면 다시 판단하세요.')}</p>
    <details><summary>{t('강화·조율·영혼각인, 확인이 필요한 정보')}</summary><p>{t('적정 강화 수치, 목표 옵션의 등장 여부와 확률, 작업 순서, 계승·귀속 조건은 여기서 확정하지 않습니다. 게임 안의 대상 장비 설명과 공식 안내를 확인해 주세요.')}</p><p>{t('현재 장비와 새 장비의 강화·영석 상태가 다르면 지금 보이는 수치만으로 어느 장비가 더 좋은지 결정할 수 없습니다.')}</p></details>
   </div>}
  </>}
 </div>;
}
export default function MyRankerComparison({catalog,plan,ranker,live,onConnect}:{catalog:Catalog;plan:Plan;ranker:Ranker;live:any;onConnect?:()=>void}){
 const {t}=useLocale();
 const [index,setIndex]=useState<ItemIndex|null>(null),[slot,setSlot]=useState<number|null>(null);
 useEffect(()=>{let active=true;loadItemIndex().then(x=>{if(active)setIndex(x)});return()=>{active=false};},[]);
 const mine=plan.character,comparison=compareRankerEquipment(mine?.equipment,live?.equipment??ranker.equipment);
 const row=comparison.rows.find(r=>r.slot===slot);
 const identity:Identity|null=mine?.classKey===catalog.classKey&&mine?.profile?.characterId&&mine?.profile?.serverId&&mine?.region?{id:mine.profile.characterId,server:String(mine.profile.serverId),region:mine.region}:null;
 const other:Identity={id:ranker.characterId,server:String(ranker.serverId),region:ranker.region};
 return <section className="my-ranker-comparison" aria-label={t('내 캐릭터와 랭커 비교')}>
  <h3>{t('내 캐릭터와 랭커 비교')}</h3>
  <p>{t('어느 쪽 장비든 마우스를 올리거나 누르면 같은 부위의 양쪽 옵션을 함께 보여 줍니다.')}</p>
  <p className="subtle">{t('판단 기준: {0} · {1}. 레벨 비교는 글로벌 아이템 자료 기준이며 랭커의 옵션을 정답으로 취급하지 않습니다.',[t(catalog.className||catalog.classKey||''),t(MODE_NAMES[plan.mode])])}</p>
  {!identity&&(onConnect?<button className="button primary" onClick={onConnect}>{t('내 캐릭터 연결하고 비교')}</button>:<p role="status">{t('빌드 화면에서 내 캐릭터를 먼저 연결하세요.')}</p>)}
  <div className="equipment-pair headings"><div><strong>{t('내 캐릭터')}</strong><b>{mine?.profile?.characterName||t('연결되지 않음')}</b><small>{mine?.importedAt?new Date(mine.importedAt).toLocaleString():''}</small></div><div><strong>{t('비교할 랭커')}</strong><b>{ranker.name}</b><small>{t(live?'이번 공식 응답':'저장된 장비 목록')}</small></div></div>
  <div className="comparison-workbench"><div className="visual-equipment-windows"><section aria-label={t('내 캐릭터 장비창')}><EquipmentGrid items={comparison.rows.flatMap(r=>r.left?[r.left]:[])} selectedSlot={slot} onInspect={setSlot}/></section><section aria-label={t('랭커 장비창')}><EquipmentGrid items={comparison.rows.flatMap(r=>r.right?[r.right]:[])} selectedSlot={slot} onInspect={setSlot}/></section></div>
   <div className="paired-option-inspector" aria-label={t('양쪽 장비 옵션 비교')}>
   {row?<><h4>{slotLabel(row.left?.slotPosName||row.right?.slotPosName||String(row.slot),t)}</h4><div className="equipment-pair option-pair" key={JSON.stringify([identity,other,row.left,row.right,plan.mode,plan.base,live?.importedAt])}>
    <ActualOptions identity={identity} item={row.left} mine catalog={catalog} plan={plan} referenceLevel={row.right?index?.items[row.right.id]?.lv??null:null} index={index}/>
    <ActualOptions identity={other} item={row.right} mine={false} catalog={catalog} plan={plan} referenceLevel={null} index={index}/>
   </div></>:<p>{t('비교할 장비 아이콘을 선택하세요.')}</p>}
   </div></div>
 </section>;
}
