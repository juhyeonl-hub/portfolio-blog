import {SLOT_BASE_NAMES} from '../lib/game-terms';
import {useLocale} from './locale';
import {useState} from 'react';
import {compareRankerEquipment,rankerObservationTime,type Ranker,type RankerEquipment} from '../lib/ranker-builds';

const identity=(row:Ranker)=>`${row.region}:${row.serverId}:${row.characterId}`;
function Equipment({item}:{item:RankerEquipment|undefined}){
 const {t}=useLocale();
 return item?<><strong>{item.name}</strong><small>{t('강화 +{0} · 초월 +{1}',[item.enchantLevel,item.exceedLevel])}</small></>:<span>{t("정보 미확인")}</span>;
}
// Client slot keys shown with the gear screen's names; Cape, Rune, Amulet and Arcana use the names in lib/game-terms.ts ("아르카나 1").
const SLOT_NAMES:Record<string,string>={MainHand:'주무기',SubHand:'보조무기',Helmet:'투구',Torso:'상의',Pants:'하의',Shoulder:'어깨',Gloves:'장갑',Boots:'신발',Belt:'허리띠',Necklace:'목걸이',Earring1:'귀걸이 1',Earring2:'귀걸이 2',Ring1:'반지 1',Ring2:'반지 2',Bracelet1:'팔찌 1',Bracelet2:'팔찌 2'};
export default function RankerEquipmentComparison({rows}:{rows:Ranker[]}){
 const {t,locale}=useLocale();
 const slotLabel=(key?:string)=>{if(!key)return '';if(SLOT_NAMES[key])return t(SLOT_NAMES[key]);const [,base,n]=/^(\D+?)(\d*)$/.exec(key)||[,key,''];const name=SLOT_BASE_NAMES[base]?t(SLOT_BASE_NAMES[base]):base;return n?name+' '+n:name;};
 const observedTime=(value:unknown)=>rankerObservationTime(value)==='시각 미확인'?t('시각 미확인'):new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value as string));
 const [leftId,setLeftId]=useState(''),[rightId,setRightId]=useState('');
 const left=rows.find(r=>identity(r)===leftId)||rows[0];
 const right=rows.find(r=>identity(r)===rightId)||rows[1]||rows[0];
 const [onlyDifferent,setOnlyDifferent]=useState(true);
 if(!left||!right)return null;
 const comparison=compareRankerEquipment(left.equipment,right.equipment);
 const shown=comparison.rows.filter(r=>!onlyDifferent||r.status!=='same');
 const different=comparison.rows.filter(r=>r.status==='different').length;
 const unknown=comparison.rows.filter(r=>r.status==='unknown').length;
 return <details className="ranker-equipment-compare">
  <summary>{t("랭커 장비 비교 · 부위별 차이 확인")}</summary>
  <p>{t("저장된 공식 조회 장비를 비교합니다. 같은 장비라도 강화·초월이 다르면 차이로 표시하며, 누락된 부위는 미착용으로 판단하지 않습니다.")}</p>
  <div className="ranker-compare-grid">{[{label:'기준 캐릭터',row:left,set:setLeftId},{label:'비교 캐릭터',row:right,set:setRightId}].map(side=><label key={side.label}>{t(side.label)}<select aria-label={t(side.label)} value={identity(side.row)} onChange={e=>side.set(e.target.value)}>{rows.map(r=><option key={identity(r)} value={identity(r)}>{r.rank}. {r.name} · {r.serverName}</option>)}</select><small>{t('장비 확인 {0}',[observedTime(side.row.verifiedAt)])}</small></label>)}</div>
  <label className="ranker-diff-filter"><input type="checkbox" checked={onlyDifferent} onChange={e=>setOnlyDifferent(e.target.checked)}/>{t("차이·미확인 부위만 보기")}</label>
  <p role="status">{t('차이 {0}개 · 미확인 {1}개 · 비교 부위 {2}개',[different,unknown,comparison.rows.length])}</p>
  {(!comparison.leftValid||!comparison.rightValid)&&<p>{t("일부 장비 목록의 형식을 확인할 수 없습니다. 해당 캐릭터를 다시 조회해야 합니다.")}</p>}
  {!shown.length&&<p>{t(comparison.rows.length?'확인된 장비·강화·초월이 같습니다.':'비교할 장비 정보가 없습니다.')}</p>}
  <div className="ranker-equipment-rows">{shown.map(row=><div className="ranker-equipment-row" key={row.slot}><h4>{slotLabel(row.left?.slotPosName||row.right?.slotPosName)||t('부위 {0}',[row.slot])} · {t(row.status==='unknown'?'미확인':row.status==='same'?'동일':'차이')}</h4><div className="ranker-compare-grid"><div><small>{left.name}</small><Equipment item={row.left}/></div><div><small>{right.name}</small><Equipment item={row.right}/></div></div></div>)}</div>
  <p className="subtle">{t("랜덤 옵션·마석·세트 효과와 실제 성능 차이는 이 비교에 포함되지 않습니다. 내 장비 계획은 변경하지 않습니다.")}</p>
 </details>;
}
