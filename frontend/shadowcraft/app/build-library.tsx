import {useEffect, useState} from 'react';
import './build-library.css';
import BuildPreview from './build-preview';
import {totals,MODE_NAMES,type Catalog} from '../lib/planner';
import type {Plan} from '../lib/planner';
import CharacterComparison from './character-comparison';
import {useLocale} from './locale';
import {useMember} from './community';
import {libraryKey, parseLibrary, snapshot, writeLibrary, type BuildLibrary, type SavedBuild} from '../lib/build-library';
export default function BuildLibraryPanel({classKey, catalog, catalogVersion, plan, onApply}: {classKey: string; catalog: Catalog; catalogVersion: string; plan: Plan; onApply: (plan: Plan) => void}) {
  const {t,locale} = useLocale();
  const member=useMember();
  const [state,setState] = useState<{raw:string|null; data:BuildLibrary}|null>(null);
  const [name,setName] = useState('');
  const [error,setError] = useState('');
  const [message,setMessage] = useState('');
  const [pending,setPending] = useState<SavedBuild|null>(null);
  const [removing,setRemoving] = useState<string|null>(null);
  function reload() {
    try {const raw=localStorage.getItem(libraryKey(classKey));setState({raw,data:parseLibrary(raw,classKey)});setError('');setPending(null);setRemoving(null);}
    catch {setState(null);setError('보관함을 읽지 못했습니다. 기존 데이터는 변경하지 않았습니다.');}
  }
  useEffect(() => {
    reload();
    const changed=(event:StorageEvent)=>{if(event.key===libraryKey(classKey)||event.key===null)reload();};
    window.addEventListener('storage',changed);
    return()=>window.removeEventListener('storage',changed);
  },[classKey]);
  async function write(next:BuildLibrary) {
    if(!state)return false;
    try {
      if(!navigator.locks)throw Error('이 브라우저는 안전한 보관함 저장을 지원하지 않습니다. 빌드 내보내기를 이용하세요.');
      const raw=await navigator.locks.request(libraryKey(classKey),()=>writeLibrary(localStorage,classKey,state.raw,next));
      setState({raw,data:next});setError('');return true;
    }
    catch(e){setError(e instanceof Error?e.message:'보관함 저장 실패');return false;}
  }
  async function save() {
    if(!state)return;
    try {
      const entry=snapshot(plan,classKey,name,catalogVersion,crypto.randomUUID());
      if(await write({...state.data,entries:[entry,...state.data.entries]})){setName('');setMessage('현재 계획을 이 기기 보관함에 저장했습니다.');}
    } catch(e){setError(e instanceof Error?e.message:'빌드를 보관하지 못했습니다.');}
  }
  function download(entry:SavedBuild) {
    const blob=new Blob([JSON.stringify({schema:'shadowcraft-v1',catalogVersion:entry.catalogVersion,plan:entry.plan})],{type:'application/json'});
    const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='a2bc-'+classKey+'-build.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function apply() {
    if(!state||!pending)return;
    try {
      const recovery=snapshot(plan,classKey,'복원 직전 계획',catalogVersion,crypto.randomUUID());
      if(!await write({...state.data,recovery}))return;
      onApply(JSON.parse(JSON.stringify(pending.plan)));
      setPending(null);setMessage('보관한 빌드를 적용했습니다. 직전 계획도 복구할 수 있습니다.');
    } catch(e){setError(e instanceof Error?e.message:'복원 실패');}
  }
  const pendingTotals=pending?totals(catalog,pending.plan):null;
  return <section className="card build-library" aria-label={t('빌드 보관함')}><h2>{t('빌드 보관함')}</h2>
    <p>{t(member?'현재 계획의 배분·포인트·장비 선택은 계정으로 자동 동기화됩니다.':'현재 계획은 이 브라우저에 자동 저장됩니다. 다른 기기에서도 이어 하려면 로그인하세요.')} <a href="#/account">{t(member?'동기화 상태 보기':'Steam으로 로그인')}</a></p>
    <h3>{t('이 기기 보관함 · 자동 동기화 안 됨')}</h3>
    <p>{t('이름을 붙여 최대 20개까지 따로 보관합니다. 다른 기기로 옮기려면 원하는 보관본 옆의 내보내기를 누르고, 그 기기에서 같은 직업을 선택해 저장한 빌드 가져오기로 여세요.')}</p>
    {error&&<p role="alert">{t(error)}</p>}{message&&<p role="status">{t(message)}</p>}
    <button className="button ghost small library-reload" onClick={reload}>{t('보관함 다시 불러오기')}</button>
    {state&&<><div className="database-filters"><label>{t('빌드 이름')}<input aria-label={t('빌드 이름')} maxLength={60} value={name} onChange={e=>setName(e.target.value)}/></label><button className="button primary" disabled={!name.trim()||state.data.entries.length>=20} onClick={save}>{t('현재 계획 보관')}</button>{!name.trim()&&<small className="subtle">{t('빌드 이름을 입력하면 보관할 수 있습니다.')}</small>}</div>
      <p>{t('{0} / 20개',[state.data.entries.length])}</p>
      {state.data.entries.length===0&&<p>{t('보관한 빌드가 없습니다.')}</p>}
      <div className="database-list">{state.data.entries.map(entry=><div key={entry.id}><button onClick={()=>{setPending(entry);setRemoving(null);setMessage('');}}><strong>{entry.name}</strong><small>Lv.{entry.plan.level} · {t(MODE_NAMES[entry.plan.mode])} · {entry.plan.character?.profile?.characterName||t('캐릭터 미연결')} · {new Date(entry.savedAt).toLocaleString(locale==='ko'?'ko-KR':locale)}</small></button><button className="button ghost" aria-label={t('{0} 보관본 내보내기',[entry.name])} onClick={()=>download(entry)}>{t('내보내기')}</button><button className="button ghost" aria-label={t('{0} 보관본 삭제',[entry.name])} onClick={()=>{setRemoving(entry.id);setPending(null);}}>{t('삭제')}</button></div>)}</div>
      {removing&&<div role="group" aria-label={t('보관본 삭제 확인')}><p>{t('선택한 보관본을 삭제합니다. 현재 적용된 계획은 유지됩니다.')}</p><button className="button ghost" onClick={async()=>{if(await write({...state.data,entries:state.data.entries.filter(e=>e.id!==removing)})){setRemoving(null);setMessage('보관본을 삭제했습니다.');}}}>{t('보관본 삭제 확인')}</button><button className="button ghost" onClick={()=>setRemoving(null)}>{t('삭제 취소')}</button></div>}
      {state.data.recovery&&<button className="button ghost" onClick={()=>{setPending(state.data.recovery);setRemoving(null);}}>{t('복원 직전 계획 보기')}</button>}
      {pending&&<div className="database-detail library-preview" aria-label={t('빌드 복원 미리보기')}><h3>{pending===state.data.recovery?t(pending.name):pending.name}</h3><p>Lv.{pending.plan.level} · {t(MODE_NAMES[pending.plan.mode])} · {t('보관 당시 데이터 {0}',[pending.catalogVersion])}</p><p>{t('적용하면 현재 캐릭터·장비·포인트·검색 조건이 보관 당시 값으로 바뀝니다. 직전 계획은 복구용으로 저장합니다.')}</p>{pending.catalogVersion!==catalogVersion&&<p>{t('현재 데이터 버전과 다릅니다. 적용 후 배분과 잠긴 조건을 확인하세요.')}</p>}<div className="library-actions"><button className="button primary" onClick={apply}>{t('적용하고 스킬 수정')}</button><button className="button ghost" onClick={()=>setPending(null)}>{t('복원 취소')}</button></div>{pendingTotals&&<p className="library-budget">{t('스킬')}: {pendingTotals.sp} / {pendingTotals.spMax} · {t('스티그마')}: {pendingTotals.stigma} / {pendingTotals.stigmaMax} · {t('데바니온')}: {pendingTotals.crystal} / {pendingTotals.crystalMax} · {t('아스펠 결정')}: {pendingTotals.battle} / {pendingTotals.battleMax}</p>}<BuildPreview key={pending.id} catalog={catalog} plan={pending.plan}/>{plan.character&&pending.plan.character&&<details><summary>{t('캐릭터 조회 결과 비교')}</summary><CharacterComparison key={pending.id} current={plan.character} saved={pending.plan.character}/></details>}</div>}
    </>}
  </section>;
}
