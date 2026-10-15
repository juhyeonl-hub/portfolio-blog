import {useEffect,useMemo,useState} from 'react';
import {emptyPlan,type Catalog,type Plan} from '@/lib/planner';
import {PlanMemory} from '@/lib/plan-memory';
// Anonymous planner: no account identifiers or remote plan endpoints are used.
export function usePlanMemory(classKey:string,catalog:Catalog){
 const memory=useMemo(()=>new PlanMemory(classKey==='assassin'?'shadowcraft-plan-v1':'shadowcraft-plan-v1:'+classKey,classKey,emptyPlan(catalog),()=>window.localStorage),[classKey]);
 const [plan,setState]=useState(memory.value),[ready,setReady]=useState(false),[save,setSave]=useState('불러오는 중');
 function setPlan(next:Plan|((old:Plan)=>Plan)){const value=typeof next==='function'?next(memory.value):next;setState(memory.update(value));setSave(memory.localSaved?'이 기기에 저장됨':'기기 저장 실패 · 빌드를 내보내 주세요')}
 useEffect(()=>{setState(memory.restore());setReady(true);setSave(memory.hasData?'이 기기에 저장된 내용 복원됨':memory.readFailed?'기기 저장을 읽지 못했습니다 · 백업 확인':'입력하면 이 기기에 자동 저장')},[memory]);
 return {plan,setPlan,ready,save};
}
