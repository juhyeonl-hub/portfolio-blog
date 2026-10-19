import {useEffect,useRef,useState} from 'react';
import {useLocale} from './locale';
import {OLD_ORIGIN,NEW_ORIGIN,NEW_PATH,applyEntries,collectEntries,conflicts,isTransferRequest,summarize,validEntries,type Entries} from '../lib/origin-transfer';

const randomNonce=()=>{const bytes=new Uint8Array(24);crypto.getRandomValues(bytes);return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
// The old page waits this long for the new window's request; the new page waits this long for the data.
const WAIT_MS=60_000;

/** Old address: tells visitors about the move and hands their saved data to the new address. */
export function MoveBanner(){
 const {t}=useLocale();
 const [status,setStatus]=useState('');
 const listener=useRef<((e:MessageEvent)=>void)|null>(null);
 useEffect(()=>()=>{if(listener.current)window.removeEventListener('message',listener.current);},[]);
 if(!NEW_ORIGIN||location.origin!==OLD_ORIGIN)return null;
 function move(){
  const target=window.open(NEW_ORIGIN+NEW_PATH+'#transfer','asbc-new');
  if(!target){setStatus('새 창이 차단되었습니다. 팝업을 허용한 뒤 다시 눌러 주세요.');return;}
  if(listener.current)window.removeEventListener('message',listener.current);
  const handle=(e:MessageEvent)=>{
   if(e.origin!==NEW_ORIGIN||e.source!==target||!isTransferRequest(e.data))return;
   target.postMessage({type:'asbc-transfer-data',nonce:e.data.nonce,entries:collectEntries(localStorage)},NEW_ORIGIN);
   setStatus('새 주소로 데이터를 보냈습니다. 새 창에서 가져오기를 확인하세요.');
  };
  listener.current=handle;window.addEventListener('message',handle);
  setTimeout(()=>{if(listener.current===handle){window.removeEventListener('message',handle);listener.current=null;}},WAIT_MS);
  setStatus('새 주소를 열었습니다…');
 }
 return <aside className="asbc-move-banner" role="region" aria-label={t('새 주소 안내')}>
  <p><b>{t('ASBC가 새 주소로 이사했습니다.')}</b> {t('저장한 빌드·장비·지도 기록을 새 주소로 옮길 수 있습니다. 이 주소의 데이터는 지워지지 않습니다.')}</p>
  <button className="button primary small" onClick={move}>{t('내 데이터와 함께 새 주소로 이동')}</button>
  <a className="button ghost small" href={NEW_ORIGIN+NEW_PATH}>{t('데이터 없이 이동')}</a>
  {status&&<p role="status">{t(status)}</p>}
 </aside>;
}

/** New address: on /#transfer opened from the old page, requests the data, shows a summary and imports on confirmation. */
export function TransferImport(){
 const {t}=useLocale();
 // Decided once on mount: importing removes #transfer from the address but the result must stay visible.
 const [active]=useState(()=>!!NEW_ORIGIN&&location.origin===NEW_ORIGIN&&location.hash==='#transfer');
 const [state,setState]=useState<{phase:'waiting'|'ready'|'done'|'failed';entries?:Entries;message?:string;kept?:number}>({phase:'waiting'});
 useEffect(()=>{
  if(!active)return;
  const opener=window.opener as Window|null;
  if(!opener){setState({phase:'failed',message:'옛 주소에서 "내 데이터와 함께 새 주소로 이동"을 눌러 이 창을 열어 주세요.'});return;}
  const nonce=randomNonce();
  const handle=(e:MessageEvent)=>{
   if(e.origin!==OLD_ORIGIN||e.source!==opener||!e.data||e.data.type!=='asbc-transfer-data'||e.data.nonce!==nonce)return;
   const entries=validEntries(e.data.entries);
   setState(entries?{phase:'ready',entries}:{phase:'failed',message:'받은 데이터 형식을 확인하지 못했습니다. 옛 주소에서 빌드 내보내기로 옮겨 주세요.'});
   window.removeEventListener('message',handle);
  };
  window.addEventListener('message',handle);
  opener.postMessage({type:'asbc-transfer-request',nonce},OLD_ORIGIN);
  const timer=setTimeout(()=>{window.removeEventListener('message',handle);setState(s=>s.phase==='waiting'?{phase:'failed',message:'옛 주소에서 응답이 없습니다. 옛 주소 창에서 다시 시도해 주세요.'}:s);},WAIT_MS);
  return()=>{clearTimeout(timer);window.removeEventListener('message',handle);};
 },[active]);
 if(!active)return null;
 function finish(overwrite:boolean){
  try{const result=applyEntries(localStorage,state.entries!,overwrite);history.replaceState(null,'',location.pathname);setState({phase:'done',message:result.kept?'가져왔습니다. 이 주소에 있던 다른 데이터 {0}개는 그대로 두었습니다.':'가져왔습니다.',kept:result.kept});}
  catch{setState({phase:'failed',message:'이 브라우저에 저장하지 못했습니다. 저장 공간이나 시크릿 모드를 확인하세요.'});}
 }
 const summary=state.entries?summarize(state.entries):null;
 const clash=state.phase==='ready'&&state.entries?conflicts(localStorage,state.entries).length:0;
 return <section className="card asbc-transfer" role="dialog" aria-label={t('옛 주소 데이터 가져오기')}>
  <h2>{t('옛 주소 데이터 가져오기')}</h2>
  {state.phase==='waiting'&&<p role="status">{t('옛 주소에서 데이터를 받는 중…')}</p>}
  {state.phase==='ready'&&summary&&<>
   <p>{t('직업별 계획 {0}개, 빌드 보관함 {1}개, 지도 기록 {2}개 등 총 {3}개 항목을 가져옵니다.',[summary.plans,summary.library,summary.maps,summary.total])}</p>
   {summary.total===0?<p>{t('옛 주소에 가져올 데이터가 없습니다.')}</p>:clash>0?<>
    <p>{t('이 주소에도 이미 다른 데이터가 {0}개 있습니다.',[clash])}</p>
    <button className="button primary" onClick={()=>finish(false)}>{t('이 주소 데이터는 유지하고 나머지만 가져오기')}</button>
    <button className="button danger" onClick={()=>finish(true)}>{t('옛 주소 데이터로 덮어쓰기')}</button>
   </>:<button className="button primary" onClick={()=>finish(false)}>{t('가져오기')}</button>}
  </>}
  {state.phase==='done'&&<><p role="status">{t(state.message||'가져왔습니다.',[state.kept||0])}</p><button className="button primary" onClick={()=>location.reload()}>{t('플래너 열기')}</button></>}
  {state.phase==='failed'&&<p role="alert">{t(state.message||'')}</p>}
 </section>;
}
