import {useLocale} from './locale';
import EquipmentGrid from './equipment-grid';
type Item={id:number;name:string;slotPos:number;slotPosName:string;enchantLevel:number;exceedLevel:number};
function validItem(value:unknown):value is Item{
 if(!value||typeof value!=='object')return false;
 const x=value as Item;
 return Number.isSafeInteger(x.id)&&x.id>0&&typeof x.name==='string'&&x.name.length>0&&x.name.length<=200&&Number.isSafeInteger(x.slotPos)&&x.slotPos>0&&typeof x.slotPosName==='string'&&x.slotPosName.length<=80&&[x.enchantLevel,x.exceedLevel].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=999);
}
export default function CharacterEquipment({equipment}:{equipment:unknown}){
 const {t}=useLocale();
 const available=Array.isArray(equipment)&&equipment.length<=80;
 const items:Item[]=available?equipment.filter(validItem):[];
 const invalid=available&&items.length!==equipment.length;
 return <details className="panel character-equipment" open>
  <summary>{t('조회한 캐릭터 장비')} {available?'('+t('{0}개',[items.length])+')':''}</summary>
  <p className="subtle">{t("공식 캐릭터 조회에 포함된 장비입니다. 누락되거나 접속 중 변경된 장비가 있을 수 있습니다. 내 장비 계획에는 자동 적용하지 않습니다.")}</p>
  {!available?<p>{t("장비 조회 정보가 없습니다. 캐릭터를 새로 조회해 주세요.")}</p>:!items.length?<p>{t("표시할 장비 정보가 없습니다.")}</p>:<><EquipmentGrid items={items}/><details className="more-info"><summary>{t('목록으로 보기')}</summary><ul>{items.map((item,index)=><li key={`${item.slotPos}:${item.id}:${index}`}><strong>{item.name}</strong><span>{t('{0} · 강화 +{1} · 초월 +{2}',[item.slotPosName,item.enchantLevel,item.exceedLevel])}</span></li>)}</ul></details></>}
  {invalid&&<p role="status">{t("일부 장비 정보의 형식을 확인할 수 없어 표시하지 않았습니다.")}</p>}
 </details>;
}
