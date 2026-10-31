import {useEffect,useState} from 'react';
import {EquipmentOptions,equipmentKey,type EquipmentIdentity,type EquipmentTask} from '../lib/equipment-options';
import {queryArmory} from '../lib/armory-client';
import {parseEquippedDetail} from '../lib/equipment-advice';
import type {Catalog,Plan} from '../lib/planner';
import {compareRankerEquipment,type Ranker} from '../lib/ranker-builds';
// Kept above the equipment/skills/Daevanion tabs: switching tabs must not start another lookup.
export function useEquipmentSnapshot(catalog:Catalog,plan:Plan,ranker:Ranker|undefined,live:any){
 const mine=plan.character;
 const ownKey=JSON.stringify([mine?.classKey,mine?.region,mine?.profile?.characterId,mine?.profile?.serverId,mine?.importedAt,mine?.equipment]);
 const signature=JSON.stringify([catalog.classKey,ranker?.characterId,ranker?.serverId,ranker?.region,live?.lookupSnapshot,ownKey]);
 const [state,setState]=useState<{signature:string;store:EquipmentOptions}|null>(null);
 useEffect(()=>{
  if(!ranker||!live?.lookupSnapshot){setState(null);return;}
  const identity:EquipmentIdentity|null=mine?.classKey===catalog.classKey&&mine?.profile?.characterId&&mine?.profile?.serverId&&mine?.region?{id:mine.profile.characterId,server:String(mine.profile.serverId),region:mine.region}:null;
  const other={id:ranker.characterId,server:String(ranker.serverId),region:ranker.region};
  const rows=compareRankerEquipment(mine?.equipment,live.equipment).rows;
  const tasks:EquipmentTask[]=[];
  for(const row of rows){
   for(const [owner,item] of [[identity,row.left],[other,row.right]] as const){
    if(owner&&item&&Number.isInteger(item.id)&&Number.isInteger(item.slotPos)&&Number.isInteger(item.enchantLevel))tasks.push({key:equipmentKey(owner,item),identity:owner,item});
   }
  }
  const itemSnapshot=crypto.randomUUID();
  const store=new EquipmentOptions(tasks,async(task,signal)=>{
   const {identity,item}=task;
   const result=await queryArmory({action:'item',class:catalog.classKey||'',...identity,snapshot:itemSnapshot,itemId:String(item.id),slot:String(item.slotPos),enchant:String(item.enchantLevel)},signal);
   const detail=parseEquippedDetail(result,{...identity,itemId:item.id,slot:item.slotPos,enchant:item.enchantLevel});
   if(!detail)throw Error('실제 장비 옵션을 확인하지 못했습니다. 캐릭터를 다시 조회하세요.');
   return detail;
  });
  const first=rows.find(r=>(r.right||r.left)?.slotPosName==='MainHand')||rows[0];
  if(first)store.prioritize([equipmentKey(identity,first.left),equipmentKey(other,first.right)]);
  setState({signature,store});
  // Defer one microtask so StrictMode cleanup can cancel without issuing duplicate requests.
  queueMicrotask(()=>store.start());
  return()=>store.dispose();
  // signature contains the complete lookup identity and equipped items, never advice/points/locale.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[signature]);
 return state?.signature===signature&&live?.lookupSnapshot?state.store:null;
}
