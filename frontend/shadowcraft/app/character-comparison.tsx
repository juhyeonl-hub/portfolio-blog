import {useLocale} from './locale';
import {useState} from 'react';
import {compareCharacters} from '../lib/character-comparison';
export default function CharacterComparison({current,saved,ranker=false}:{current:unknown;saved:unknown;ranker?:boolean}){
 const {t}=useLocale();
 const [differencesOnly,setDifferencesOnly]=useState(true);
 const comparison=compareCharacters(current,saved);
 function observation(value:string){
  if(value==='조회 정보 없음')return t(value);
  const gear=value.match(/^(.*) · 강화 \+(\d+) · 초월 \+(\d+)$/);
  if(gear)return t('{0} · 강화 +{1} · 초월 +{2}',gear.slice(1));
  const skill=value.match(/^Lv\.(\d+) · (장착|미장착)$/);
  return skill?t('Lv.{0} · {1}',[skill[1],t(skill[2])]):value;
 }
 return <section className="character-comparison" aria-label={t("캐릭터 조회 결과 비교")}>
  <h4>{t("캐릭터 조회 결과 비교")}</h4>
  <p>{t(ranker?'왼쪽은 내 캐릭터, 오른쪽은 랭커의 공식 조회 결과입니다. 빠진 항목은 미착용·미습득을 뜻하지 않습니다.':'왼쪽은 현재 연결된 캐릭터, 오른쪽은 보관 당시 조회 결과입니다. 직접 편집한 계획·스킬 특화와는 별개이며, 빠진 항목은 미착용·미습득을 뜻하지 않습니다.')}</p>
  <label><input type="checkbox" checked={differencesOnly} onChange={e=>setDifferencesOnly(e.target.checked)}/>{t("차이 있는 항목만 보기")}</label>
  {comparison.sections.map(section=>{const rows=section.rows.filter(row=>!differencesOnly||row.changed);return <div key={section.name}><h4>{t(section.name)}</h4>{section.unavailable?<p>{t('양쪽의 유효한 {0} 조회 정보가 필요합니다. 캐릭터를 새로 조회한 뒤 보관하세요.',[t(section.name)])}</p>:rows.length?<div className="comparison-scroll"><table><thead><tr><th scope="col">{t("항목")}</th><th scope="col">{t("현재 캐릭터")}</th><th scope="col">{t(ranker?'비교할 랭커':'보관 당시 캐릭터')}</th></tr></thead><tbody>{rows.map((row,index)=><tr key={index} className={row.changed?'comparison-changed':undefined}><th scope="row">{row.label}</th><td>{observation(row.current)}</td><td>{observation(row.saved)}</td></tr>)}</tbody></table></div>:<p>{t("조회된 항목의 차이가 없습니다.")}</p>}</div>})}
  <h4>{t("데바니움 개방 노드")}</h4>
  {comparison.nodes?<p>{t(ranker?'공통 {0}개 · 내 캐릭터만 {1}개 · 랭커만 {2}개':'공통 {0}개 · 현재 조회에만 {1}개 · 보관 조회에만 {2}개',[comparison.nodes.common,comparison.nodes.currentOnly,comparison.nodes.savedOnly])}</p>:<p>{t("양쪽 노드 정보가 필요합니다. 일부 보드 조회가 실패했거나 이전 기록에 조회 상태가 없으면 비교하지 않습니다.")}</p>}
 </section>;
}
