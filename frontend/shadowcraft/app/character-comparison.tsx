import {useState} from 'react';
import {compareCharacters} from '../lib/character-comparison';
export default function CharacterComparison({current,saved}:{current:unknown;saved:unknown}){
 const [differencesOnly,setDifferencesOnly]=useState(true);
 const comparison=compareCharacters(current,saved);
 return <section className="character-comparison" aria-label="캐릭터 조회 결과 비교">
  <h4>캐릭터 조회 결과 비교</h4>
  <p>왼쪽은 현재 연결된 캐릭터, 오른쪽은 보관 당시 조회 결과입니다. 직접 편집한 계획·스킬 특화와는 별개이며, 빠진 항목은 미착용·미습득을 뜻하지 않습니다.</p>
  <label><input type="checkbox" checked={differencesOnly} onChange={e=>setDifferencesOnly(e.target.checked)}/>차이 있는 항목만 보기</label>
  {comparison.sections.map(section=>{const rows=section.rows.filter(row=>!differencesOnly||row.changed);return <div key={section.name}><h4>{section.name}</h4>{section.unavailable?<p>양쪽의 유효한 {section.name} 조회 정보가 필요합니다. 캐릭터를 새로 조회한 뒤 보관하세요.</p>:rows.length?<div className="comparison-scroll"><table><thead><tr><th scope="col">항목</th><th scope="col">현재 캐릭터</th><th scope="col">보관 당시 캐릭터</th></tr></thead><tbody>{rows.map((row,index)=><tr key={index} className={row.changed?'comparison-changed':undefined}><th scope="row">{row.label}</th><td>{row.current}</td><td>{row.saved}</td></tr>)}</tbody></table></div>:<p>조회된 항목의 차이가 없습니다.</p>}</div>})}
  <h4>데바니움 개방 노드</h4>
  {comparison.nodes?<p>공통 {comparison.nodes.common}개 · 현재 조회에만 {comparison.nodes.currentOnly}개 · 보관 조회에만 {comparison.nodes.savedOnly}개</p>:<p>양쪽 노드 정보가 필요합니다. 일부 보드 조회가 실패했거나 이전 기록에 조회 상태가 없으면 비교하지 않습니다.</p>}
 </section>;
}
