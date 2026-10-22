import {classProfile} from '../lib/classes';
import {useLocale} from './locale';
import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {publicBuild,encodeShare,type SharedBuild} from '../lib/build-share';
import {loadBundledCatalog} from '../lib/catalog-loaders';
import {validStoredPlan} from '../lib/plan-memory';
import type {Catalog,Plan} from '../lib/planner';
import type {PublicBuildDetail} from '../lib/public-builds';

type Member={id:string;username:string;steamLinked?:boolean};
type SteamState={pending:string;notice:string;error:string};
const STEAM_ERRORS:Record<string,string>={expired:'Steam 로그인이 만료되었습니다. 다시 시도하세요.',failed:'Steam 로그인을 확인하지 못했습니다. 다시 시도하세요.',taken:'이미 다른 계정에 연결된 Steam 계정입니다.',already:'이 계정에는 이미 Steam 계정이 연결되어 있습니다.'};
/** Reads the one-time Steam hand-back once and removes it from the address bar immediately. */
function readSteamHash():{kind:string;value:string}|null{const m=location.hash.match(/^#steam-(code|new|linked|error)=([A-Za-z0-9_-]{1,64})$/);if(!m)return null;try{history.replaceState(null,'',location.pathname+location.search);}catch{}return {kind:m[1],value:m[2]};}
export const steamReturn=()=>/^#steam-(code|new|linked|error)=/.test(location.hash);
type Session={token:string;member:Member};
const STORAGE='a2bc-member-session-v1';
const Context=createContext<{session:Session|null;ready:boolean;setSession:(value:Session|null)=>void;request:(path:string,method?:string,body?:unknown)=>Promise<any>;steam:SteamState;setSteam:(value:SteamState)=>void}>(null!);
async function call(path:string,token:string,method='GET',body?:unknown){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 try{const r=await fetch(path,{method,headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal});
 const data=await r.text();let json:any=null;try{json=data?JSON.parse(data):null;}catch{}
 if(!r.ok)throw Object.assign(Error(json?.error||(r.status===401||r.status===403?'로그인이 필요하거나 세션이 만료되었습니다. 다시 로그인하세요.':'요청을 처리하지 못했습니다.')),{status:r.status});
 return json;
 }catch(e){if(e instanceof Error&&e.name==='AbortError')throw Error('응답 시간이 초과되었습니다. 저장 여부를 확인한 뒤 다시 시도하세요.');throw e;}finally{clearTimeout(timeout);}
}
export function MemberProvider({children}:{children:ReactNode}){
 const [session,setValue]=useState<Session|null>(null),[ready,setReady]=useState(false),[steam,setSteam]=useState<SteamState>({pending:'',notice:'',error:''});
 function setSession(value:Session|null){setValue(value);try{if(value)sessionStorage.setItem(STORAGE,JSON.stringify(value));else sessionStorage.removeItem(STORAGE);}catch{}}
 useEffect(()=>{let live=true;const returned=readSteamHash();async function restore(){if(returned?.kind==='code'){try{const result=await call('/api/community/auth/steam/exchange','','POST',{code:returned.value});if(live){setSession(result);setSteam({pending:'',notice:'Steam으로 로그인했습니다.',error:''});}}catch(e){if(live)setSteam({pending:'',notice:'',error:(e as Error).message});}finally{if(live)setReady(true);}return;}if(returned?.kind==='new'&&live)setSteam({pending:returned.value,notice:'',error:''});if(returned?.kind==='error'&&live)setSteam({pending:'',notice:'',error:STEAM_ERRORS[returned.value]||STEAM_ERRORS.failed});if(returned?.kind==='linked'&&live)setSteam({pending:'',notice:'Steam 계정을 연결했습니다.',error:''});try{const raw=sessionStorage.getItem(STORAGE);if(raw){const saved=JSON.parse(raw);if(typeof saved.token==='string'){const member=await call('/api/community/me',saved.token);if(live)setValue({token:saved.token,member});}}}catch{try{sessionStorage.removeItem(STORAGE);}catch{}}finally{if(live)setReady(true);}}void restore();return()=>{live=false;};},[]);
 return <Context.Provider value={{session,ready,setSession,steam,setSteam,request:async(path,method,body)=>{try{return await call(path,session?.token||'',method,body);}catch(e){if((e as any).status===401||(e as any).status===403)setSession(null);throw e;}}}}>{children}</Context.Provider>;
}
export function useMemberReady(){return useContext(Context).ready;}
export function useMember(){return useContext(Context).session?.member||null;}
export function MemberAccount(){
 const {t}=useLocale();
 const {session,ready,setSession,request,steam,setSteam}=useContext(Context);
 const [steamName,setSteamName]=useState('');
 async function steamRegister(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{const result=await request('/api/community/auth/steam/register','POST',{code:steam.pending,username:steamName});setSession(result);setSteam({pending:'',notice:'Steam으로 로그인했습니다.',error:''});}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function steamLink(){setBusy(true);setError('');try{const result=await request('/api/community/auth/steam/link','POST');if(typeof result?.url==='string'&&result.url.startsWith('https://steamcommunity.com/openid/login?'))location.href=result.url;else throw Error('요청을 처리하지 못했습니다.');}catch(e){setError((e as Error).message);setBusy(false);}}
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 return <section className="card community-account" aria-label={t('커뮤니티 로그인')}><h2>{t('빌드 커뮤니티 계정')}</h2>{!ready?<p>{t('로그인 확인 중…')}</p>:session?<><p>{t('로그인 계정')}: {session.member.username}</p>{session.member.steamLinked?<p className="steam-linked">{t('Steam 계정 연결됨')}</p>:<button type="button" className="button ghost" disabled={busy} onClick={()=>void steamLink()}>{t('Steam 계정 연결')}</button>}<button className="button ghost" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await request('/api/community/logout','POST');setSession(null);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>{t('회원 로그아웃')}</button><DeleteAccount/></>:<><p>{t('빌드 열람은 자유입니다. 게시·좋아요는 로그인 후 이용하세요.')}</p>{steam.pending?<form className="database-filters" onSubmit={steamRegister}><p>{t('Steam 계정으로 처음 로그인합니다. 커뮤니티에 작성자로 표시될 아이디를 정하세요.')}</p><label>{t('표시할 아이디')}<input aria-label={t('표시할 아이디')} autoComplete="username" required minLength={3} maxLength={32} pattern="[A-Za-z0-9_]+" value={steamName} onChange={e=>setSteamName(e.target.value)}/></label><button className="button primary" disabled={busy}>{t('아이디 정하고 가입')}</button><button type="button" className="button ghost" disabled={busy} onClick={()=>setSteam({pending:'',notice:'',error:''})}>{t('취소')}</button></form>:<a className="button secondary" href="/api/community/auth/steam/start">{t('Steam으로 로그인')}</a>}</>}{steam.notice&&<p role="status">{t(steam.notice)}</p>}{steam.error&&<p role="alert">{t(steam.error)}</p>}{error&&<p role="alert">{t(error)}</p>}</section>;
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
 const {t}=useLocale();
 const {session,request}=useContext(Context),[title,setTitle]=useState(''),[description,setDescription]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState('');
 if(!session)return null;
 return <details className="card"><summary>{t("현재 플래너 배분 게시하기")}</summary><p>{t("빌드 직업")}: <strong>{t(classProfile(plan.classKey).name)}</strong> · <a href="#/build">{t("내 플래너 열기")}</a></p><p>{t("현재 직업의 스킬·특화·데바니온 배분을 공개합니다. 캐릭터·검색 기록·장비 이름·개인 메모는 제외됩니다. 설명에는 공개할 내용만 입력하세요.")}</p><form onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');setSaved('');try{const data=await request('/api/community/builds','POST',{title,description,published:true,shared:publicBuild(catalog,plan)});setSaved(data.id);setTitle('');setDescription('');onPublished();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}><label>{t("게시 제목")}<input aria-label={t("게시 제목")} required maxLength={80} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>{t("빌드 설명")}<textarea aria-label={t("빌드 설명")} maxLength={2000} value={description} onChange={e=>setDescription(e.target.value)}/></label><button className="button primary" disabled={busy}>{t("현재 배분 공개 게시")}</button></form>{error&&<p role="alert">{t(error)}</p>}{saved&&<p role="status">{t("게시했습니다.")}{' '}<a href={'#published='+saved}>{t("게시한 빌드 보기")}</a></p>}</details>;
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
export function BuildDiscussion({build,onUpdated}:{build:PublicBuildDetail;onUpdated:()=>void}){
 const {t}=useLocale();
 const {session,request}=useContext(Context),[data,setData]=useState<Social|null>(null),[revision,setRevision]=useState(0),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [editing,setEditing]=useState(false),[title,setTitle]=useState(build.title),[description,setDescription]=useState(build.description),[deleting,setDeleting]=useState(false);
 const [replacement,setReplacement]=useState<SharedBuild|null>(null);
 async function loadReplacement(){setBusy(true);setError('');try{const key=build.shared.plan.classKey||'assassin';const raw=localStorage.getItem(key==='assassin'?'shadowcraft-plan-v1':'shadowcraft-plan-v1:'+key);if(!raw)throw Error('이 직업의 저장된 배분이 없습니다. 플래너에서 먼저 배분을 저장하세요.');const plan=JSON.parse(raw);if(!validStoredPlan(plan,key))throw Error('저장된 배분을 읽지 못했습니다. 플래너에서 확인하세요.');setReplacement(publicBuild(await loadBundledCatalog(key),plan));}catch(e){setError(e instanceof Error?e.message:'배분을 불러오지 못했습니다.');}finally{setBusy(false);}}
 useEffect(()=>{let live=true;setData(null);setError('');request('/api/public/shadowcraft/builds/'+build.id+'/community').then(d=>{if(!d||!Number.isSafeInteger(d.votes)||d.votes<0||typeof d.voted!=='boolean')throw Error('좋아요 응답을 확인하지 못했습니다.');if(live)setData(d);}).catch(e=>{if(live)setError(e.message);});return()=>{live=false;};},[build.id,revision,session?.token]);
 async function run(action:()=>Promise<unknown>){setBusy(true);setError('');try{await action();setRevision(v=>v+1);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 const path='/api/community/builds/'+build.id;
 return <section className="community-discussion" aria-label={t("빌드 좋아요")}>{error&&<p role="alert">{t(error)} <button className="button ghost" onClick={()=>setRevision(v=>v+1)}>{t("다시 불러오기")}</button></p>}
 {session&&session.member.id===build.authorId&&<div><button className="button ghost" disabled={busy} onClick={()=>{setEditing(!editing);setReplacement(null);}}>{t("내 게시물 수정")}</button><button className="button danger" disabled={busy} onClick={()=>setDeleting(!deleting)}>{t("내 게시물 삭제")}</button>{deleting&&<p>{t("게시물과 좋아요를 삭제할까요?")}{' '}<button className="button danger" disabled={busy} onClick={()=>void run(async()=>{await request(path+'?revision='+build.revision,'DELETE');location.hash='';})}>{t("삭제 확인")}</button><button className="button ghost" onClick={()=>setDeleting(false)}>{t("취소")}</button></p>}{editing&&<form onSubmit={e=>{e.preventDefault();void run(async()=>{await request(path,'PUT',{title,description,published:true,revision:build.revision,shared:replacement||build.shared});setEditing(false);onUpdated();});}}><p>{t("제목·설명을 수정하거나 이 기기에 저장된 같은 직업의 배분으로 교체하세요. 저장 전에는 게시물이 바뀌지 않습니다.")}</p><button type="button" className="button ghost" disabled={busy} onClick={()=>void loadReplacement()}>{t("저장된 내 배분 불러오기")}</button>{replacement&&<div role="status"><p>{t('교체할 배분: Lv.{0} · 특화 {1}개 · 데바니온 {2}개. 캐릭터·검색 기록·장비 이름·개인 메모는 제외됩니다.',[replacement.plan.level,Object.values(replacement.plan.specs).reduce((n,x)=>n+x.length,0),replacement.plan.nodes.length])}</p><a className="button ghost" href={encodeShare(replacement)} target="_blank" rel="noreferrer">{t("교체 배분 미리보기")}</a><button type="button" className="button ghost" onClick={()=>setReplacement(null)}>{t("기존 배분 유지")}</button></div>}<label>{t("수정 제목")}<input aria-label={t("수정 제목")} required maxLength={80} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>{t("수정 설명")}<textarea aria-label={t("수정 설명")} maxLength={2000} value={description} onChange={e=>setDescription(e.target.value)}/></label><button className="button primary" disabled={busy}>{t("게시물 수정 저장")}</button></form>}</div>}
 {session&&session.member.id!==build.authorId&&<ReportControl endpoint={path+'/report'} label={'이 빌드 신고'}/>}{data?<><button className={'button like-button'+(data.voted?' liked':'')} disabled={!session||busy} aria-pressed={data.voted} aria-label={t(data.voted?'좋아요 취소':'좋아요')} onClick={()=>void run(()=>request(path+'/vote',data.voted?'DELETE':'PUT'))}><span aria-hidden="true">{data.voted?'♥':'♡'}</span> {data.votes}</button>{!session&&<p>{t("로그인하면 좋아요를 누를 수 있습니다.")}</p>}</>:!error&&<p role="status">{t("불러오는 중…")}</p>}</section>;
}
