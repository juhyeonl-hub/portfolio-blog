import {readDraft,latestDraftLink} from '../lib/build-draft';
import BuildComposer from './build-composer';
import {AccountSyncPanel} from './account-sync-panel';
import {classProfile} from '../lib/classes';
import {useLocale} from './locale';
import {createContext,useContext,useEffect,useState,useRef,type ReactNode} from 'react';
import {publicBuild,type SharedBuild} from '../lib/build-share';
import type {Catalog,Plan} from '../lib/planner';
import type {PublicBuildDetail} from '../lib/public-builds';

type Member={id:string;username:string;steamLinked?:boolean};
type SteamState={pending:string;notice:string;error:string};
const STEAM_ERRORS:Record<string,string>={expired:'Steam 로그인이 만료되었습니다. 다시 시도하세요.',failed:'Steam 로그인을 확인하지 못했습니다. 다시 시도하세요.',taken:'이미 다른 계정에 연결된 Steam 계정입니다.',already:'이 계정에는 이미 Steam 계정이 연결되어 있습니다.'};
/** Reads the one-time Steam hand-back once and removes it from the address bar immediately. */
function readSteamHash():{kind:string;value:string}|null{const m=location.hash.match(/^#steam-(code|new|linked|error)=([A-Za-z0-9_-]{1,64})$/);if(!m)return null;try{history.replaceState(null,'',location.pathname+location.search+'#/account');}catch{}return {kind:m[1],value:m[2]};}
export const steamReturn=()=>/^#steam-(code|new|linked|error)=/.test(location.hash);
type Session={csrfToken:string;member:Member};
const LEGACY_STORAGE='a2bc-member-session-v1',STORAGE='a2bc-member-session-v2';
const REFRESH_AUTH='asbc-refresh-auth';
const Context=createContext<{session:Session|null;ready:boolean;setSession:(value:Session|null)=>void;request:(path:string,method?:string,body?:unknown)=>Promise<any>;steam:SteamState;setSteam:(value:SteamState)=>void}>(null!);
async function call(path:string,csrf:string,method='GET',body?:unknown,legacyToken?:string){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 try{const r=await fetch(path,{method,credentials:'same-origin',headers:{...(legacyToken?{Authorization:'Bearer '+legacyToken}:{}),...(csrf?{'X-ASBC-CSRF':csrf}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal});
 const data=await r.text();let json:any=null;try{json=data?JSON.parse(data):null;}catch{}
 if(!r.ok)throw Object.assign(Error(json?.error||(r.status===401||r.status===403?'로그인이 필요하거나 세션이 만료되었습니다. 다시 로그인하세요.':'요청을 처리하지 못했습니다.')),{status:r.status});
 return json;
 }catch(e){if(e instanceof Error&&e.name==='AbortError')throw Error('응답 시간이 초과되었습니다. 저장 여부를 확인한 뒤 다시 시도하세요.');throw e;}finally{clearTimeout(timeout);}
}
const isAuthFailure=(e:unknown)=>[401,403].includes((e as {status:number})?.status);
function cacheSession():Session|null{try{const raw=sessionStorage.getItem(STORAGE)||sessionStorage.getItem(LEGACY_STORAGE),saved=raw?JSON.parse(raw):null;return typeof saved?.member?.id==='string'?{member:saved.member,csrfToken:typeof saved.csrfToken==='string'?saved.csrfToken:''}:null;}catch{return null;}}
export function MemberProvider({children}:{children:ReactNode}){
 const [session,setValue]=useState<Session|null>(cacheSession),[ready,setReady]=useState(false),[steam,setSteam]=useState<SteamState>({pending:'',notice:'',error:''});
 const epoch=useRef(0),channel=useRef<BroadcastChannel|null>(null);
 // Only non-authenticating member metadata/CSRF proof is cached. Login tokens remain HttpOnly.
 function setSession(value:Session|null,announce=true){epoch.current++;setValue(value);try{sessionStorage.removeItem(LEGACY_STORAGE);if(value)sessionStorage.setItem(STORAGE,JSON.stringify({member:value.member,csrfToken:value.csrfToken}));else sessionStorage.removeItem(STORAGE);}catch{}if(announce)channel.current?.postMessage('changed');}
 useEffect(()=>{
  let live=true,pending=false;const returned=readSteamHash();
  async function refresh(){if(pending)return;pending=true;const current=++epoch.current;try{const {csrfToken,...member}=await call('/api/community/me','');if(live&&current===epoch.current)setSession({member,csrfToken},false);}catch(e){if(live&&current===epoch.current&&isAuthFailure(e))setSession(null,false);}finally{pending=false;if(live)setReady(true);}}
  async function restore(){pending=true;
   if(returned?.kind==='code'){const current=++epoch.current;try{const result=await call('/api/community/auth/steam/exchange','','POST',{code:returned.value});if(live&&current===epoch.current){setSession(result);setSteam({pending:'',notice:'Steam으로 로그인했습니다.',error:''});}}catch(e){if(live)setSteam({pending:'',notice:'',error:(e as Error).message});}finally{pending=false;if(live)setReady(true);}return;}
   if(returned?.kind==='new')setSteam({pending:returned.value,notice:'',error:''});if(returned?.kind==='error')setSteam({pending:'',notice:'',error:STEAM_ERRORS[returned.value]||STEAM_ERRORS.failed});if(returned?.kind==='linked')setSteam({pending:'',notice:'Steam 계정을 연결했습니다.',error:''});
   let token='';try{const saved=JSON.parse(sessionStorage.getItem(LEGACY_STORAGE)||'null');if(typeof saved?.token==='string'&&/^a2bc_[A-Za-z0-9_-]{43}$/.test(saved.token))token=saved.token;}catch{}
   if(token){const current=++epoch.current;try{const result=await call('/api/community/session','','POST',undefined,token);if(live&&current===epoch.current){setSession(result);setReady(true);}return;}catch(e){if(!isAuthFailure(e)&&(e as {status?:number}).status!==409){if(live)setReady(true);return;}}finally{pending=false;}}
   pending=false;await refresh();
  }
  const wake=()=>{if(!document.hidden&&navigator.onLine)void refresh();};
  if(typeof BroadcastChannel!=='undefined'){channel.current=new BroadcastChannel('asbc-member-session');channel.current.onmessage=wake;}
  window.addEventListener('focus',wake);window.addEventListener('online',wake);window.addEventListener(REFRESH_AUTH,wake);document.addEventListener('visibilitychange',wake);void restore();
  return()=>{live=false;epoch.current++;channel.current?.close();channel.current=null;window.removeEventListener('focus',wake);window.removeEventListener('online',wake);window.removeEventListener(REFRESH_AUTH,wake);document.removeEventListener('visibilitychange',wake);};
 },[]);
 return <Context.Provider value={{session,ready,setSession,steam,setSteam,request:async(path,method,body)=>{try{return await call(path,session?.csrfToken||'',method,body);}catch(e){if(isAuthFailure(e)){window.dispatchEvent(new Event(REFRESH_AUTH));if(path.startsWith('/api/community/builds'))setSteam({pending:'',notice:'',error:'로그인이 만료되었습니다. 다시 로그인한 뒤 작성 중인 빌드를 확인하세요.'});}throw e;}}}}>{children}</Context.Provider>;
}
export function useMemberSession(){const {session,ready}=useContext(Context);return {session,ready};}
export const settingsRequest=async(csrf:string,method:string,body?:unknown)=>{try{return await call('/api/community/settings',csrf,method,body);}catch(e){if(isAuthFailure(e))window.dispatchEvent(new Event(REFRESH_AUTH));throw e;}};
export function useMemberReady(){return useContext(Context).ready;}
export function useMember(){return useContext(Context).session?.member||null;}
export function MemberAccount(){
 const {t}=useLocale();
 const {session,ready,setSession,request,steam,setSteam}=useContext(Context);
 const [steamName,setSteamName]=useState('');
 const recoverLink=session?latestDraftLink(sessionStorage,session.member.id):null;
 async function steamRegister(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{const result=await request('/api/community/auth/steam/register','POST',{code:steam.pending,username:steamName});setSession(result);setSteam({pending:'',notice:'Steam으로 로그인했습니다.',error:''});}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function steamLink(){setBusy(true);setError('');try{const result=await request('/api/community/auth/steam/link','POST');if(typeof result?.url==='string'&&result.url.startsWith('https://steamcommunity.com/openid/login?'))location.href=result.url;else throw Error('요청을 처리하지 못했습니다.');}catch(e){setError((e as Error).message);setBusy(false);}}
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 return <section className="card community-account" aria-label={t('계정과 동기화')}><h2>{t('계정과 동기화')}</h2>{!ready?<p>{t('로그인 확인 중…')}</p>:session?<><p>{t('로그인 계정')}: {session.member.username}</p>{session.member.steamLinked?<p className="steam-linked">{t('Steam 계정 연결됨')}</p>:<button type="button" className="button ghost" disabled={busy} onClick={()=>void steamLink()}>{t('Steam 계정 연결')}</button>}{recoverLink&&<p><a className="button secondary" href={recoverLink}>{t('작성 중인 공개 빌드로 돌아가기')}</a></p>}<AccountSyncPanel/><button className="button ghost" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await request('/api/community/logout','POST');setSession(null);setSteam({pending:'',notice:'',error:''});}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>{t('로그아웃')}</button><DeleteAccount/></>:<><p>{t('Steam으로 로그인하면 설정을 다른 기기에서도 이어서 사용하고 공개 빌드 게시·좋아요를 이용할 수 있습니다.')}</p>{steam.pending?<form className="database-filters" onSubmit={steamRegister}><p>{t('Steam 계정으로 처음 로그인합니다. 커뮤니티에 작성자로 표시될 아이디를 정하세요.')}</p><label>{t('공개 작성자 아이디')}<small>{t('영문·숫자·밑줄(_)로 3~32자')}</small><input aria-label={t('공개 작성자 아이디')} autoComplete="username" required minLength={3} maxLength={32} pattern="[A-Za-z0-9_]+" value={steamName} onChange={e=>setSteamName(e.target.value)}/></label><button className="button primary" disabled={busy}>{t('아이디 정하고 가입')}</button><button type="button" className="button ghost" disabled={busy} onClick={()=>setSteam({pending:'',notice:'',error:''})}>{t('취소')}</button></form>:<a className="button secondary" href="/api/community/auth/steam/start">{t('Steam으로 로그인')}</a>}</>}{steam.notice&&<p role="status">{t(steam.notice)}</p>}{steam.error&&<p role="alert">{t(steam.error)}</p>}{error&&<p role="alert">{t(error)}</p>}</section>;
}
/** Account deletion: the username is typed again; the server deletes the account with its builds, comments, votes and reports. */
function DeleteAccount(){
 const {t}=useLocale();
 const {session,setSession,request}=useContext(Context),[typed,setTyped]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 if(!session)return null;
 const matches=typed.trim().toLowerCase()===session.member.username;
 async function remove(e:React.FormEvent){e.preventDefault();if(!matches)return;setBusy(true);setError('');try{await request('/api/community/me','DELETE',{username:typed.trim()});setSession(null);}catch(e){setError((e as Error).message);setBusy(false);}}
 return <details className="account-delete"><summary>{t('회원 탈퇴')}</summary><form className="database-filters" onSubmit={remove}>
  <p>{t('계정과 이 계정으로 올린 빌드·댓글·추천·신고가 모두 삭제되며 되돌릴 수 없습니다. 이 브라우저에 저장된 빌드 계획은 그대로 남습니다.')}</p>
  <label>{t('확인을 위해 아이디 {0}을 입력하세요',[session.member.username])}<input aria-label={t('탈퇴 확인용 아이디')} autoComplete="off" value={typed} onChange={e=>setTyped(e.target.value)}/></label>
  <button className="button danger" disabled={busy||!matches}>{t('계정 영구 삭제')}</button>
  {error&&<p role="alert">{t(error)}</p>}
 </form></details>;
}
export function PublishBuild({catalog,plan,onPublished}:{catalog:Catalog;plan:Plan;onPublished:()=>void}){
 const {t}=useLocale();const {session,request,steam}=useContext(Context);const [draft,setDraft]=useState<SharedBuild|null>(null),[saved,setSaved]=useState(''),[error,setError]=useState('');
 const recovery=session?{owner:session.member.id,scope:'new',revision:0}:undefined;
 const previous=recovery?readDraft(sessionStorage,recovery):null;
 return <section className="card"><div className="public-compose-entry"><h2>{t('나만의 빌드 공유')}</h2>{session?<button type="button" className="button primary" disabled={!!draft} onClick={()=>{try{setDraft(previous?.shared||publicBuild(catalog,plan));setError('');setSaved('')}catch(e){setError((e as Error).message)}}}>{t(previous?'작성 중인 빌드 이어쓰기':'빌드 글쓰기')}</button>:<a className="button secondary" href="#/account">{t('Steam으로 로그인')}</a>}</div><p>{t('현재 플래너를 초안으로 가져와 스킬·데바니온·장비 추천을 직접 작성합니다.')}</p>{error&&<p role="alert">{t(error)}</p>}{!session&&steam.error&&<p role="alert">{t(steam.error)}</p>}{draft&&<BuildComposer initial={draft} recovery={recovery} submitLabel={'빌드 공개 게시'} onCancel={()=>setDraft(null)} onSave={async value=>{const data=await request('/api/community/builds','POST',{...value,published:true});setSaved(data.id);setDraft(null);onPublished()}}/>}{saved&&<p role="status">{t('게시했습니다.')} <a href={'#published='+saved}>{t('게시한 빌드 보기')}</a></p>}</section>;
}
type Social={votes:number;voted:boolean};
const REPORT_REASONS:[string,string][]=[['spam','스팸·광고'],['abuse','욕설·괴롭힘'],['hate','혐오·차별'],['sexual','성적인 내용'],['other','기타']];
/** Report a build or comment to the administrator. Nothing is hidden automatically. */
function ReportControl({endpoint,label}:{endpoint:string;label:string}){
 const {t}=useLocale();const {request}=useContext(Context);
 const [open,setOpen]=useState(false),[reason,setReason]=useState('spam'),[detail,setDetail]=useState(''),[busy,setBusy]=useState(false),[done,setDone]=useState(''),[error,setError]=useState('');
 if(done)return <p role="status" className="report-done">{t(done)}</p>;
 if(!open)return <button type="button" className="button ghost small" onClick={()=>setOpen(true)}>{t(label)}</button>;
 return <form className="report-form" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{await request(endpoint,'POST',{reason,detail});setDone('신고했습니다. 관리자가 확인합니다.');}catch(err){setError((err as Error).message);}finally{setBusy(false);}}}>
  <label>{t('신고 사유')}<select aria-label={t('신고 사유')} value={reason} onChange={e=>setReason(e.target.value)}>{REPORT_REASONS.map(([value,name])=><option key={value} value={value}>{t(name)}</option>)}</select></label>
  <label>{t('설명 (선택)')}<input aria-label={t('설명 (선택)')} maxLength={300} value={detail} onChange={e=>setDetail(e.target.value)}/></label>
  <button className="button danger small" disabled={busy}>{t('신고 보내기')}</button><button type="button" className="button ghost small" disabled={busy} onClick={()=>{setOpen(false);setError('');}}>{t('취소')}</button>
  {error&&<p role="alert">{t(error)}</p>}
 </form>;
}
export function BuildDiscussion({build,onUpdated,onEditingChange}:{build:PublicBuildDetail;onUpdated:()=>void;onEditingChange?:(editing:boolean)=>void}){
 const {t}=useLocale();
 const {session,request,steam}=useContext(Context),[data,setData]=useState<Social|null>(null),[revision,setRevision]=useState(0),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [editing,setEditing]=useState(false),[deleting,setDeleting]=useState(false);
 const changeEditing=(value:boolean)=>{setEditing(value);onEditingChange?.(value)};
 useEffect(()=>{let live=true;setData(null);setError('');request('/api/public/shadowcraft/builds/'+build.id+'/community').then(d=>{if(!d||!Number.isSafeInteger(d.votes)||d.votes<0||typeof d.voted!=='boolean')throw Error('좋아요 반영 여부를 확인하지 못했습니다. ‘다시 불러오기’로 현재 상태를 확인해 주세요.');if(live)setData(d);}).catch(e=>{if(live)setError(e.message);});return()=>{live=false;};},[build.id,revision,session?.csrfToken]);
 async function run(action:()=>Promise<unknown>){setBusy(true);setError('');try{await action();setRevision(v=>v+1);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 const path='/api/community/builds/'+build.id;
 return <section className="community-discussion" aria-label={t("빌드 좋아요")}>{!session&&steam.error&&<p role="alert">{t(steam.error)} <a href="#/account">{t("Steam으로 로그인")}</a></p>}{error&&<p role="alert">{t(error)} <button className="button ghost" onClick={()=>setRevision(v=>v+1)}>{t("다시 불러오기")}</button></p>}
 {session&&session.member.id===build.authorId&&<div><button className="button ghost" disabled={busy||editing} onClick={()=>{setDeleting(false);changeEditing(true);}}>{t(readDraft(sessionStorage,{owner:build.authorId,scope:build.id,revision:build.revision})?'작성 중인 빌드 이어쓰기':'내 게시물 수정')}</button><button className="button danger" disabled={busy||editing} onClick={()=>setDeleting(!deleting)}>{t("내 게시물 삭제")}</button>{deleting&&<p>{t("이 공개 빌드를 삭제할까요? 게시물과 좋아요가 삭제되며 사이트에서 되돌릴 수 없습니다.")}{' '}<button className="button danger" disabled={busy} onClick={()=>void run(async()=>{await request(path+'?revision='+build.revision,'DELETE');location.hash='';})}>{t("게시물 삭제")}</button><button className="button ghost" onClick={()=>setDeleting(false)}>{t("취소")}</button></p>}</div>}
{editing&&<BuildComposer initial={build.shared} recovery={build.authorId?{owner:build.authorId,scope:build.id,revision:build.revision}:undefined} title={build.title} description={build.description} submitLabel={'게시물 수정 저장'} onCancel={()=>changeEditing(false)} onSave={async value=>{await request(path,'PUT',{...value,published:true,revision:build.revision});changeEditing(false);onUpdated();}}/>}
 {session&&session.member.id!==build.authorId&&<ReportControl endpoint={path+'/report'} label={'이 빌드 신고'}/>}{data?<><button className={'button like-button'+(data.voted?' liked':'')} disabled={!session||busy} aria-pressed={data.voted} aria-label={t(data.voted?'좋아요 취소':'좋아요')} onClick={()=>void run(()=>request(path+'/vote',data.voted?'DELETE':'PUT'))}><span aria-hidden="true">{data.voted?'♥':'♡'}</span> {data.votes}</button>{!session&&<p>{t("로그인하면 좋아요를 누를 수 있습니다.")}</p>}</>:!error&&<p role="status">{t("불러오는 중…")}</p>}</section>;
}
