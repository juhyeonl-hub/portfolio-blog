import {useEffect,useState,type ReactNode} from 'react';
import {AccountSettingsStore,SettingsSync,activateSettingsStore,AutomaticSettingsSync,publishSettingsChanges,type SyncState,type SyncMetadata} from '../lib/account-settings';
import {useMemberSession,settingsRequest,MemberAccount} from './community';
import {LocaleProvider,useLocale} from './locale';
import './account-settings.css';
import {AccountSyncContext} from './account-sync-panel';

export function AccountSettings({children}:{children:ReactNode}){
 const {session,ready}=useMemberSession();
 if(!ready)return <p role="status">ASBC…</p>;
 return <SettingsScope key={session?.member.id||'guest'} memberId={session?.member.id||null} token={session?.token||''}>{children}</SettingsScope>;
}
function SettingsScope({children,memberId,token}:{children:ReactNode;memberId:string|null;token:string}){
 const [initializationError,setInitializationError]=useState(false),[attempt,setAttempt]=useState(0);
 const [mounted,setMounted]=useState(false),[status,setStatus]=useState<SyncState>('loading'),[metadata,setMetadata]=useState<SyncMetadata|null>(null),[sync,setSync]=useState<SettingsSync|null>(null);
 useEffect(()=>{
  let controller:SettingsSync|null=null,store:AccountSettingsStore|null=null,automatic:AutomaticSettingsSync|null=null;
  setInitializationError(false);setMounted(false);setMetadata(null);
  const eligible=()=>!document.hidden&&navigator.onLine&&!document.activeElement?.matches('input,textarea,select,[contenteditable="true"]')&&!document.querySelector('#event-timer-settings');
  try{
   store=new AccountSettingsStore(()=>localStorage,memberId);activateSettingsStore(store);
   if(memberId){controller=new SettingsSync(store,(method,body)=>settingsRequest(token,method,body),publishSettingsChanges,(state,next)=>{setStatus(state);if(next)setMetadata(next);},eligible);setSync(controller);automatic=new AutomaticSettingsSync(controller,eligible);void controller.start().finally(()=>{setMounted(true);automatic?.start();});}
  }catch{activateSettingsStore(null);setInitializationError(true);setStatus('offline');}
  if(!controller)setMounted(true);
  const wake=()=>automatic?.wake();
  let blurTimer:ReturnType<typeof setTimeout>;const edited=()=>{clearTimeout(blurTimer);blurTimer=setTimeout(wake,0);};
  const changed=(e:StorageEvent)=>{if(store&&e.key===store.cacheKey){try{if(eligible()){store.reload();publishSettingsChanges();}wake();}catch{setStatus('offline');}}};
  window.addEventListener('online',wake);window.addEventListener('focus',wake);document.addEventListener('visibilitychange',wake);document.addEventListener('focusout',edited);window.addEventListener('storage',changed);
  return()=>{controller?.stop();automatic?.stop();clearTimeout(blurTimer);activateSettingsStore(null);window.removeEventListener('online',wake);window.removeEventListener('focus',wake);document.removeEventListener('visibilitychange',wake);document.removeEventListener('focusout',edited);window.removeEventListener('storage',changed);};
 },[memberId,token,attempt]);
 if(initializationError)return <LocaleProvider><InitializationNotice retry={()=>setAttempt(n=>n+1)}/><MemberAccount/></LocaleProvider>;
 if(!mounted)return <p role="status">ASBC…</p>;
 return <AccountSyncContext.Provider value={memberId?{status,metadata,refresh:()=>void sync?.retry()}:null}><LocaleProvider>{memberId&&<SyncNotice status={status} retry={()=>void sync?.retry()}/>}{children}</LocaleProvider></AccountSyncContext.Provider>;
}
function SyncNotice({status,retry}:{status:string;retry:()=>void}){
 const {t}=useLocale();
 return <aside className="account-sync-state" role="status"><span>{t(status==='offline'?'계정 설정 동기화에 실패했습니다. 이 기기의 설정을 유지합니다.':status==='loading'?'계정 설정 확인 중…':status==='pending'?'계정 설정 저장 중…':'계정 설정 저장됨')}</span><a href="#/account">{t('동기화 상태 보기')}</a>{status==='offline'&&<button className="button ghost" onClick={retry}>{t('설정 동기화 다시 시도')}</button>}</aside>;
}

function InitializationNotice({retry}:{retry:()=>void}){
 const {t}=useLocale();
 return <aside className="card" role="alert">{t('계정 설정을 읽지 못했습니다. 기존 데이터는 보존했습니다. 다시 시도하거나 로그아웃해 주세요.')} <button className="button ghost" onClick={retry}>{t('설정 동기화 다시 시도')}</button></aside>;
}
