import {useLocale} from './locale';
import {SLOT_BASE_NAMES} from '../lib/game-terms';

export type EquipmentItem={id:number;name:string;slotPos:number;slotPosName:string;enchantLevel:number;exceedLevel:number};
// Standard client slot keys with the gear screen's Korean names; the rest (Cape, Rune, Amulet, Arcana) come from game-terms.
const STANDARD:Record<string,string>={MainHand:'주무기',SubHand:'보조무기',Helmet:'투구',Torso:'상의',Pants:'하의',Shoulder:'어깨',Gloves:'장갑',Boots:'신발',Belt:'허리띠',Necklace:'목걸이',Earring1:'귀걸이 1',Earring2:'귀걸이 2',Ring1:'반지 1',Ring2:'반지 2',Bracelet1:'팔찌 1',Bracelet2:'팔찌 2'};
// In-game character window order: armour down the left, accessories down the right, weapons and the rest below.
const LEFT=['Helmet','Shoulder','Torso','Gloves','Pants','Boots','Cape'];
const RIGHT=['Necklace','Earring1','Earring2','Ring1','Ring2','Bracelet1','Bracelet2','Belt'];
const BOTTOM=['MainHand','SubHand','Rune1','Rune2','Amulet','Arcana1','Arcana2','Arcana3','Arcana4','Arcana5'];
const GLYPH:Record<string,string>={MainHand:'⚔',SubHand:'🛡',Helmet:'⛑',Torso:'👕',Pants:'👖',Shoulder:'🧥',Gloves:'🧤',Boots:'👢',Cape:'🧣',Belt:'➰',Necklace:'📿',Earring:'💎',Ring:'💍',Bracelet:'⭕',Rune:'ᚱ',Amulet:'🔮',Arcana:'🃏'};

export function slotLabel(key:string,t:(s:string)=>string):string{
 if(STANDARD[key])return t(STANDARD[key]);
 const [,base,n]=/^(\D+?)(\d*)$/.exec(key)||[,key,''];
 const name=SLOT_BASE_NAMES[base]?t(SLOT_BASE_NAMES[base]):base;
 return n?name+' '+n:name;
}

/** Equipment laid out like the in-game character window. Hover or focus a slot for its details. */
export default function EquipmentGrid({items}:{items:EquipmentItem[]}){
 const {t}=useLocale();
 const bySlot=new Map(items.map(item=>[item.slotPosName,item]));
 const slot=(key:string)=>{
  const item=bySlot.get(key); const glyph=GLYPH[key]||GLYPH[key.replace(/\d+$/,'')]||'·';
  const label=slotLabel(key,t);
  return <div key={key} className={'eq-slot'+(item?' filled':' empty')} tabIndex={item?0:-1} aria-label={item?`${label}: ${item.name}`:label}>
   <span className="eq-glyph" aria-hidden="true">{glyph}</span>
   {item&&item.enchantLevel>0&&<small className="eq-enchant">+{item.enchantLevel}</small>}
   <small className="eq-label">{label}</small>
   {item&&<div className="eq-tip" role="tooltip"><b>{item.name}</b><span>{label}</span><span>{t('강화 +{0} · 초월 +{1}',[item.enchantLevel,item.exceedLevel])}</span><span className="subtle">ID {item.id}</span><span className="subtle">{t('등급·옵션 정보는 아직 제공하지 않습니다.')}</span></div>}
  </div>;
 };
 return <div className="equipment-grid" role="group" aria-label={t('장비 배치')}>
  <div className="eq-column">{LEFT.map(slot)}</div>
  <div className="eq-column">{RIGHT.map(slot)}</div>
  <div className="eq-row">{BOTTOM.map(slot)}</div>
 </div>;
}
