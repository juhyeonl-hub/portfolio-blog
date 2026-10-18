import {useState} from 'react';
import {compareRankerEquipment,rankerObservationTime,type Ranker,type RankerEquipment} from '../lib/ranker-builds';

const identity=(row:Ranker)=>`${row.region}:${row.serverId}:${row.characterId}`;
function Equipment({item}:{item:RankerEquipment|undefined}){
 return item?<><strong>{item.name}</strong><small>강화 +{item.enchantLevel} · 초월 +{item.exceedLevel}</small></>:<span>정보 미확인</span>;
}
export default function RankerEquipmentComparison({rows}:{rows:Ranker[]}){
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
  <summary>랭커 장비 비교 · 부위별 차이 확인</summary>
  <p>저장된 공식 조회 장비를 비교합니다. 같은 장비라도 강화·초월이 다르면 차이로 표시하며, 누락된 부위는 미착용으로 판단하지 않습니다.</p>
  <div className="ranker-compare-grid">{[{label:'기준 캐릭터',row:left,set:setLeftId},{label:'비교 캐릭터',row:right,set:setRightId}].map(side=><label key={side.label}>{side.label}<select aria-label={side.label} value={identity(side.row)} onChange={e=>side.set(e.target.value)}>{rows.map(r=><option key={identity(r)} value={identity(r)}>{r.rank}. {r.name} · {r.serverName}</option>)}</select><small>장비 확인 {rankerObservationTime(side.row.verifiedAt)}</small></label>)}</div>
  <label className="ranker-diff-filter"><input type="checkbox" checked={onlyDifferent} onChange={e=>setOnlyDifferent(e.target.checked)}/>차이·미확인 부위만 보기</label>
  <p role="status">차이 {different}개 · 미확인 {unknown}개 · 비교 부위 {comparison.rows.length}개</p>
  {(!comparison.leftValid||!comparison.rightValid)&&<p>일부 장비 목록의 형식을 확인할 수 없습니다. 해당 캐릭터를 다시 조회해야 합니다.</p>}
  {!shown.length&&<p>{comparison.rows.length?'확인된 장비·강화·초월이 같습니다.':'비교할 장비 정보가 없습니다.'}</p>}
  <div className="ranker-equipment-rows">{shown.map(row=><div className="ranker-equipment-row" key={row.slot}><h4>{row.left?.slotPosName||row.right?.slotPosName||`부위 ${row.slot}`} · {row.status==='unknown'?'미확인':row.status==='same'?'동일':'차이'}</h4><div className="ranker-compare-grid"><div><small>{left.name}</small><Equipment item={row.left}/></div><div><small>{right.name}</small><Equipment item={row.right}/></div></div></div>)}</div>
  <p className="subtle">랜덤 옵션·마석·세트 효과와 실제 성능 차이는 이 비교에 포함되지 않습니다. 내 장비 계획은 변경하지 않습니다.</p>
 </details>;
}
