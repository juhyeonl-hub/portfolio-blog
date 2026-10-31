import {useEffect,useState} from 'react';
import {useLocale} from './locale';
import {GRADE_NAMES,SLOT_BASE_NAMES} from '../lib/game-terms';
import {itemIconUrl,itemSummary,loadItemIndex,type ItemIndex} from '../lib/item-index';

export type EquipmentItem={id:number;name:string;slotPos:number;slotPosName:string;enchantLevel:number;exceedLevel:number};
// Standard client slot keys with the gear screen's Korean names; the rest (Cape, Rune, Amulet, Arcana) come from game-terms.
const STANDARD:Record<string,string>={MainHand:'주무기',SubHand:'보조무기',Helmet:'투구',Torso:'상의',Pants:'하의',Shoulder:'어깨',Gloves:'장갑',Boots:'신발',Belt:'허리띠',Necklace:'목걸이',Earring1:'귀걸이 1',Earring2:'귀걸이 2',Ring1:'반지 1',Ring2:'반지 2',Bracelet1:'팔찌 1',Bracelet2:'팔찌 2'};
// In-game character window order: armour down the left, accessories down the right, weapons and the rest below.
const LEFT=['Helmet','Shoulder','Torso','Gloves','Pants','Boots','Cape'];
const RIGHT=['Necklace','Earring1','Earring2','Ring1','Ring2','Bracelet1','Bracelet2','Belt'];
const BOTTOM=['MainHand','SubHand','Rune1','Rune2','Amulet','Arcana1','Arcana2','Arcana3','Arcana4','Arcana5'];
const GLYPH:Record<string,string>={MainHand:'⚔',SubHand:'🛡',Helmet:'⛑',Torso:'👕',Pants:'👖',Shoulder:'🧥',Gloves:'🧤',Boots:'👢',Cape:'🧣',Belt:'➰',Necklace:'📿',Earring:'💎',Ring:'💍',Bracelet:'⭕',Rune:'ᚱ',Amulet:'🔮',Arcana:'🃏'};
const SHOWN_CANDIDATES=8;

export function slotLabel(key:string,t:(s:string)=>string):string{
 if(STANDARD[key])return t(STANDARD[key]);
 const [,base,n]=/^(\D+?)(\d*)$/.exec(key)||[,key,''];
 const name=SLOT_BASE_NAMES[base]?t(SLOT_BASE_NAMES[base]):base;
 return n?name+' '+n:name;
}

/** Equipment laid out like the in-game character window. Hover or focus a slot for its icon, grade and options. */
export default function EquipmentGrid({items,onInspect,selectedSlot,inspectOnHover=true,onHover,onLeave}:{items:EquipmentItem[];onInspect?:(slot:number)=>void;selectedSlot?:number|null;inspectOnHover?:boolean;onHover?:(slot:number)=>void;onLeave?:()=>void}){
 const {t,locale}=useLocale();
 const [index,setIndex]=useState<ItemIndex|null>(null);
 useEffect(()=>{let live=true;loadItemIndex().then(value=>{if(live)setIndex(value);});return()=>{live=false;};},[]);
 const bySlot=new Map(items.map(item=>[item.slotPosName,item]));
 const statName=(key:string)=>{const names=index?.stats[key];return names?(locale==='en'?names.en:t(names.ko)):key;};
 const slot=(key:string)=>{
  const item=bySlot.get(key); const glyph=GLYPH[key]||GLYPH[key.replace(/\d+$/,'')]||'·';
  const label=slotLabel(key,t);
  const summary=item?itemSummary(index,item.id):null;
  const icon=itemIconUrl(summary?.detail);
  const grade=summary?GRADE_NAMES[summary.detail.g]:undefined;
  const pool=summary?.pool||[];
  const granted=summary?Math.max(summary.detail.sc?.[1]||0,summary.detail.rs||0):0;
  return <div key={key} className={'eq-slot'+(item?' filled':' empty')+(summary?' grade-'+summary.detail.g.toLowerCase():'')} role={onInspect&&item?'button':undefined} data-selected={item&&selectedSlot===item.slotPos||undefined} onMouseEnter={()=>{if(item){onHover?.(item.slotPos);if(inspectOnHover)onInspect?.(item.slotPos)}}} onMouseLeave={onLeave} onFocus={()=>{if(item&&inspectOnHover)onInspect?.(item.slotPos)}} onClick={()=>{if(item)onInspect?.(item.slotPos)}} onKeyDown={e=>{if(item&&onInspect&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onInspect(item.slotPos)}}} tabIndex={item?0:-1} aria-label={item?`${label}: ${item.name}`:label}>
   {icon?<img className="eq-icon" src={icon} alt="" loading="lazy" decoding="async"/>:<span className="eq-glyph" aria-hidden="true">{glyph}</span>}
   {item&&item.enchantLevel>0&&<small className="eq-enchant">+{item.enchantLevel}</small>}
   <small className="eq-label">{label}</small>
   {item&&!onInspect&&<div className="eq-tip" role="tooltip">
    <b>{item.name}</b>
    <span>{[grade?t(grade):null,summary?t('아이템 레벨 {0}',[summary.detail.lv]):null,label].filter(Boolean).join(' · ')}</span>
    <span>{t('강화 +{0} · 초월 +{1}',[item.enchantLevel,item.exceedLevel])}</span>
    {summary&&summary.main.length>0&&<ul className="eq-stats" aria-label={t('주요 능력치')}>{summary.main.map(([stat,value])=><li key={stat}><span>{statName(stat)}</span><b>{value.toLocaleString(locale)}</b></li>)}</ul>}
    {pool.length>0&&<><span className="subtle">{t('옵션 후보 {0}개 · 부여 최대 {1}개',[pool.length,granted])}</span>
     <ul className="eq-stats eq-candidates">{pool.slice(0,SHOWN_CANDIDATES).map(([stat,low,high])=><li key={stat}><span>{statName(stat)}</span><b>{low===high?low.toLocaleString(locale):low.toLocaleString(locale)+'–'+high.toLocaleString(locale)}</b></li>)}</ul>
     {pool.length>SHOWN_CANDIDATES&&<span className="subtle">{t('외 {0}개',[pool.length-SHOWN_CANDIDATES])}</span>}</>}
    {summary&&(summary.detail.ms||summary.detail.gs)?<span className="subtle">{[summary.detail.ms?t('마석 홈 {0}',[summary.detail.ms]):null,summary.detail.gs?t('신석 홈 {0}',[summary.detail.gs]):null].filter(Boolean).join(' · ')}</span>:null}
    <span className="subtle">ID {item.id}{summary?' · '+t('게임 원본 데이터 수치'):''}</span>
    {index&&!summary&&<span className="subtle">{t('이 아이템의 상세 정보가 클라이언트 표에 없습니다.')}</span>}
   </div>}
  </div>;
 };
 return <div className="equipment-grid" role="group" aria-label={t('장비 배치')}>
  <div className="eq-column">{LEFT.map(slot)}</div>
  <div className="eq-column">{RIGHT.map(slot)}</div>
  <div className="eq-row">{BOTTOM.map(slot)}</div>
 </div>;
}
