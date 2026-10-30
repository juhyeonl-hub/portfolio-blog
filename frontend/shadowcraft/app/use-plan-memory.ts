import {useSettingsRefresh} from './use-settings-refresh';
import {settingsStorage} from '../lib/account-settings';
import {useLocale} from './locale';
import {useEffect,useMemo,useState} from 'react';
import {emptyPlan,type Catalog,type Plan} from '@/lib/planner';
import {PlanMemory} from '@/lib/plan-memory';
// The storage adapter keeps anonymous plans local and isolates signed-in account plans.
export function usePlanMemory(classKey:string,catalog:Catalog){
 const {t}=useLocale();
 const memory=useMemo(()=>new PlanMemory(classKey==='assassin'?'shadowcraft-plan-v1':'shadowcraft-plan-v1:'+classKey,classKey,emptyPlan(catalog),()=>settingsStorage),[classKey]);
 const [plan,setState]=useState(memory.value),[ready,setReady]=useState(false),[save,setSave]=useState('불러오는 중');
 function setPlan(next:Plan|((old:Plan)=>Plan)){const value=typeof next==='function'?next(memory.value):next;setState(memory.update(value));setSave(memory.localSaved?'이 기기에 저장됨':'기기 저장 실패 · 빌드를 내보내 주세요')}
 useEffect(()=>{setState(memory.restore());setReady(true);setSave(memory.hasData?'저장한 빌드를 불러왔습니다.':memory.readFailed?'이 브라우저에 저장한 빌드를 불러오지 못했습니다. 백업 파일이 있다면 ‘저장한 빌드 가져오기’로 불러오세요.':'입력하면 이 기기에 자동 저장')},[memory]);
 useSettingsRefresh(memory.key,()=>{setState(memory.restore());setSave('저장한 빌드를 불러왔습니다.');});
 return {plan,setPlan,ready,save:t(save)};
}
