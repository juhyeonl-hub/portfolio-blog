import {useEffect,useState} from 'react';
import {useLocale} from './locale';
import {CLASSES,classProfile} from '../lib/classes';
import {loadBundledCatalog} from '../lib/catalog-loaders';
import {queryArmory} from '../lib/armory-client';
import serverDirectory from '../lib/data/servers.json';
import {authorHref,characterHref,readPeopleRoute,parseAuthors,checkedCharacter,type CharacterTarget,type AuthorListing} from '../lib/people';
import {parseListing,type PublicBuildListing} from '../lib/public-builds';
import type {Catalog} from '../lib/planner';
import CharacterBuildView from './person-character';
import './people-builds.css';

const savedServers=serverDirectory as Record<string,{serverId:number;serverName:string;raceId:number}[]>;
async function readJson(url:string,signal:AbortSignal){const r=await fetch(url,{signal,cache:'no-store'});if(!r.ok)throw Error('검색 결과를 불러오지 못했습니다. 다시 시도하세요.');return r.json();}
function useHash(){const [hash,setHash]=useState(location.hash);useEffect(()=>{const f=()=>setHash(location.hash);window.addEventListener('hashchange',f);return()=>window.removeEventListener('hashchange',f)},[]);return hash;}
export default function PeopleBuilds(){
 const {t}=useLocale();const hash=useHash(),route=readPeopleRoute(hash);
 return <section className="panel people-page" aria-label={t('사람별 빌드')}><h1>{t('사람별 빌드')}</h1><p>{t('캐릭터의 현재 세팅을 조회하거나, 작성자가 공개한 빌드를 찾아보세요.')}</p>
 <nav className="preview-tabs" aria-label={t('사람 검색 종류')}><a className={'button '+(route.kind==='character'?'primary':'secondary')} aria-current={route.kind==='character'?'page':undefined} href="#/people">{t('캐릭터 세팅 조회')}</a><a className={'button '+(route.kind==='author'?'primary':'secondary')} aria-current={route.kind==='author'?'page':undefined} href="#/people?kind=author">{t('작성자 공개 빌드')}</a></nav>
 <p className="subtle">{t('게임 캐릭터 이름과 사이트 작성자 이름은 서로 다를 수 있습니다.')}</p>
 {route.invalid?<p role="alert">{t('사람 검색 주소가 올바르지 않습니다. 위에서 다시 선택하세요.')}</p>:route.kind==='author'?<AuthorBuilds key={route.author} author={route.author}/>:<CharacterSearch target={route.target}/>}
 </section>;
}
function AuthorBuilds({author}:{author:string}){
 const {t,locale}=useLocale();const [input,setInput]=useState(''),[query,setQuery]=useState(''),[page,setPage]=useState(0),[retry,setRetry]=useState(0),[error,setError]=useState('');
 const [authors,setAuthors]=useState<AuthorListing|null>(null),[builds,setBuilds]=useState<PublicBuildListing|null>(null);
 useEffect(()=>{let live=true;const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);setAuthors(null);setBuilds(null);setError('');
 const url=author?'/api/public/shadowcraft/builds?'+new URLSearchParams({author,page:String(page)}):'/api/public/shadowcraft/build-authors?'+new URLSearchParams({q:query,page:String(page)});
 readJson(url,ctl.signal).then(raw=>{const value=author?parseListing(raw):parseAuthors(raw);if(value.page!==page||(author&&(value as PublicBuildListing).items.some(x=>x.authorId!==author)))throw Error('검색 응답의 형식을 확인하지 못했습니다.');if(live){if(author)setBuilds(value as PublicBuildListing);else setAuthors(value as AuthorListing)}}).catch(e=>{if(live)setError(e.name==='AbortError'?'조회 시간이 초과되었습니다. 다시 시도하세요.':e.message)}).finally(()=>clearTimeout(timer));
 return()=>{live=false;ctl.abort();clearTimeout(timer)};
 },[author,query,page,retry]);
 const data=author?builds:authors;
 return <section aria-label={t('작성자 공개 빌드')}><h2>{author?(builds?.items[0]?.author||t('작성자 공개 빌드')):t('작성자 찾기')}</h2>
 {author?<a className="button ghost" href="#/people?kind=author">{t('다른 작성자 찾기')}</a>:<form className="people-search" onSubmit={e=>{e.preventDefault();setQuery(input.trim());setPage(0);setRetry(n=>n+1)}}><label>{t('사이트 작성자 이름')}<input value={input} maxLength={32} onChange={e=>setInput(e.target.value)} placeholder={t('이름의 일부로도 검색할 수 있습니다')}/></label><button className="button primary">{t('작성자 검색')}</button></form>}
 <p className="subtle">{t('공개한 빌드만 표시됩니다. 비공개 글과 개인 플래너는 보이지 않습니다.')}</p>
 {error?<div role="alert"><p>{t(error)}</p><button className="button secondary" onClick={()=>setRetry(n=>n+1)}>{t('다시 시도')}</button></div>:!data?<p role="status">{t('검색 결과를 불러오는 중…')}</p>:<><p role="status">{t('{0}개 결과',[data.totalElements])}</p>{!data.items.length&&<p>{t(author?'이 작성자가 공개한 빌드가 없습니다.':'공개 빌드를 작성한 사람이 없습니다. 이름을 바꿔 검색해 보세요.')}</p>}
 <div className="public-board">{authors?.items.map(a=><article key={a.id}><h3><a href={authorHref(a.id)}>{a.name}</a></h3><p>{t('공개 빌드 {0}개',[a.builds])}</p><a href={authorHref(a.id)}>{t('이 사람의 빌드 보기')}</a></article>)}{builds?.items.map(b=><article key={b.id}><h3><a href={'#published='+b.id}>{b.title}</a></h3><p>{t(classProfile(b.classKey).name)} · {new Date(b.updatedAt).toLocaleDateString(locale)}</p><p>{b.description}</p></article>)}</div>
 {data.totalPages>1&&<div className="database-pages"><button className="button ghost" disabled={!page} onClick={()=>setPage(p=>p-1)}>{t('이전 페이지')}</button><span>{page+1} / {data.totalPages}</span><button className="button ghost" disabled={page+1>=data.totalPages} onClick={()=>setPage(p=>p+1)}>{t('다음 페이지')}</button></div>}</>}
 </section>;
}
function CharacterSearch({target}:{target:CharacterTarget|null}){
 const {t}=useLocale();const [region,setRegion]=useState(target?.region||'eu'),[key,setKey]=useState(target?.classKey||'templar'),[server,setServer]=useState(target?.server||''),[name,setName]=useState('');
 const [servers,setServers]=useState(savedServers[region]||[]),[serverError,setServerError]=useState(false),[serverRetry,setServerRetry]=useState(0);
 const [search,setSearch]=useState<{region:string;key:string;server:string;name:string;retry:number}|null>(null),[results,setResults]=useState<any[]|null>(null),[searchError,setSearchError]=useState(''),[searching,setSearching]=useState(false);
 const [detail,setDetail]=useState<{character:any;catalog:Catalog}|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{let live=true;const ctl=new AbortController();setServers(savedServers[region]||[]);setServerError(false);queryArmory({action:'servers',region},ctl.signal).then(d=>{if(!Array.isArray(d.servers)||!d.servers.length)throw Error();if(live)setServers(d.servers)}).catch(()=>{if(live)setServerError(true)});return()=>{live=false;ctl.abort()};},[region,serverRetry]);
 useEffect(()=>{if(!search)return;let live=true;const ctl=new AbortController();setResults(null);setSearchError('');setSearching(true);queryArmory({action:'search',class:search.key,region:search.region,server:search.server,name:search.name},ctl.signal).then(d=>{if(!Array.isArray(d.characters))throw Error('검색 응답의 형식을 확인하지 못했습니다.');if(live)setResults(d.characters.filter((x:any)=>typeof x.name==='string'&&typeof x.characterId==='string'&&/^\d{1,6}$/.test(String(x.serverId))))}).catch(e=>{if(live)setSearchError(e.message)}).finally(()=>{if(live)setSearching(false)});return()=>{live=false;ctl.abort()};},[search]);
 useEffect(()=>{if(!target)return;let live=true;const ctl=new AbortController();setDetail(null);setError('');Promise.all([queryArmory({action:'profile',class:target.classKey,region:target.region,server:target.server,id:target.id},ctl.signal),loadBundledCatalog(target.classKey)]).then(([data,catalog])=>{checkedCharacter(data,target);if(live)setDetail({character:data,catalog})}).catch(e=>{if(live)setError(e.message)});return()=>{live=false;ctl.abort()};},[target?.region,target?.classKey,target?.server,target?.id,retry]);
 const reset=()=>{setSearch(null);setResults(null);setSearchError('');setSearching(false)};
 if(target)return <><a className="button ghost" href="#/people">{t('다른 캐릭터 찾기')}</a>{error?<div role="alert"><p>{t(error)}</p><button className="button secondary" onClick={()=>setRetry(v=>v+1)}>{t('다시 조회')}</button></div>:!detail?<p role="status">{t('공식 프로필과 데바니온을 조회하고 있습니다…')}</p>:<><CharacterBuildView catalog={detail.catalog} character={detail.character}/><button className="button secondary" onClick={()=>setRetry(v=>v+1)}>{t('새로 조회')}</button></>}</>;
 return <><h2>{t('캐릭터 이름으로 찾기')}</h2><form className="people-search" onSubmit={e=>{e.preventDefault();setSearch({region,key,server,name:name.trim(),retry:Date.now()})}}><label>{t('글로벌 지역')}<select value={region} onChange={e=>{reset();setRegion(e.target.value);setServer('')}}>{[['eu','유럽 EU'],['nae','북미 동부'],['naw','북미 서부'],['la','남미'],['as','아시아']].map(([v,n])=><option key={v} value={v}>{t(n)}</option>)}</select></label><label>{t('직업')}<select value={key} onChange={e=>{reset();setKey(e.target.value)}}>{CLASSES.map(c=><option key={c.key} value={c.key}>{t(c.name)}</option>)}</select></label><label>{t('서버')}<select value={server} onChange={e=>{reset();setServer(e.target.value)}}><option value="">{t('모든 서버')}</option>{servers.map(s=><option key={s.serverId} value={s.serverId}>{s.serverName} · {t(s.raceId===1?'천족':'마족')}</option>)}</select></label><label className="people-name">{t('캐릭터 이름')}<input value={name} required maxLength={40} placeholder={t('정확한 이름을 입력하세요')} onChange={e=>setName(e.target.value)}/></label><button className="button primary" disabled={searching||!name.trim()}>{t(searching?'검색 중…':'캐릭터 검색')}</button></form>
 {serverError&&<p role="status">{t('저장된 서버 목록으로 검색할 수 있습니다.')} <button className="button ghost" onClick={()=>setServerRetry(n=>n+1)}>{t('목록 다시 확인')}</button></p>}
 {searchError&&<p role="alert">{t(searchError)}</p>}{searching&&<p role="status">{t('검색 결과를 불러오는 중…')}</p>}{results&&<><p role="status">{t('{0}개 결과',[results.length])}</p>{!results.length&&<p>{t('검색 결과가 없습니다. 이름·지역·직업·서버를 확인하세요.')}</p>}<div className="people-results">{results.map(x=><a className="button secondary" key={String(x.serverId)+':'+x.characterId} href={characterHref({region:search!.region,classKey:search!.key,server:String(x.serverId),id:x.characterId})}><strong>{x.name}</strong><span>Lv.{x.level} · {x.serverName} · {t(classProfile(search!.key).name)}</span></a>)}</div>{results.length>=20&&<p>{t('최대 20명까지 표시됩니다. 서버를 선택하거나 이름을 더 정확히 입력하세요.')}</p>}</>}
 </>;
}
