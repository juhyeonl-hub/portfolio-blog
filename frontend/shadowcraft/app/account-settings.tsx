import {useEffect,useState,type ReactNode} from 'react';
import {AccountSettingsStore,SettingsSync,activateSettingsStore} from '../lib/account-settings';
import {useMemberSession,settingsRequest,MemberAccount} from './community';
import {LocaleProvider,useLocale} from './locale';
import './account-settings.css';

export function AccountSettings({children}:{children:ReactNode}){
 const {session,ready}=useMemberSession();
 if(!ready)return <p role="status">ASBC…</p>;
 return <SettingsScope key={session?.member.id||'guest'} memberId={session?.member.id||null} token={session?.token||''}>{children}</SettingsScope>;
}
function SettingsScope({children,memberId,token}:{children:ReactNode;memberId:string|null;token:string}){
 const [initializationError,setInitializationError]=useState(false),[attempt,setAttempt]=useState(0);
 const [mounted,setMounted]=useState(false),[epoch,setEpoch]=useState(0),[status,setStatus]=useState(''),[sync,setSync]=useState<SettingsSync|null>(null);
 useEffect(()=>{
  let controller:SettingsSync|null=null,store:AccountSettingsStore|null=null;
  setInitializationError(false);setMounted(false);
  try{
   store=new AccountSettingsStore(()=>localStorage,memberId);activateSettingsStore(store);
   if(memberId){controller=new SettingsSync(store,(method,body)=>settingsRequest(token,method,body),()=>setEpoch(n=>n+1),setStatus);setSync(controller);void controller.start().finally(()=>setMounted(true));}
  }catch{activateSettingsStore(null);setInitializationError(true);setStatus('offline');}
  if(!controller)setMounted(true);
  const retry=()=>void controller?.retry();
  const changed=(e:StorageEvent)=>{if(store&&e.key===store.cacheKey){try{store.reload();setEpoch(n=>n+1);retry();}catch{setStatus('offline');}}};
  window.addEventListener('online',retry);window.addEventListener('storage',changed);
  return()=>{controller?.stop();activateSettingsStore(null);window.removeEventListener('online',retry);window.removeEventListener('storage',changed);};
 },[memberId,token,attempt]);
 if(initializationError)return <LocaleProvider><InitializationNotice retry={()=>setAttempt(n=>n+1)}/><MemberAccount/></LocaleProvider>;
 if(!mounted)return <p role="status">ASBC…</p>;
 return <LocaleProvider key={epoch}>{memberId&&<SyncNotice status={status} retry={()=>void sync?.retry()}/>}{children}</LocaleProvider>;
}
function SyncNotice({status,retry}:{status:string;retry:()=>void}){
 const {t}=useLocale();
 return <aside className="account-sync-state" role="status"><span>{t(status==='offline'?'계정 설정 동기화에 실패했습니다. 이 기기의 설정을 유지합니다.':status==='pending'?'계정 설정 저장 중…':'계정 설정 저장됨')}</span>{status==='offline'&&<button className="button ghost" onClick={retry}>{t('설정 동기화 다시 시도')}</button>}</aside>;
}

function InitializationNotice({retry}:{retry:()=>void}){
 const {t}=useLocale();
 return <aside className="card" role="alert">{t('계정 설정을 읽지 못했습니다. 기존 데이터는 보존했습니다. 다시 시도하거나 로그아웃해 주세요.')} <button className="button ghost" onClick={retry}>{t('설정 동기화 다시 시도')}</button></aside>;
}
