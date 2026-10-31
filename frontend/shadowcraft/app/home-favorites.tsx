import {useSettingsRefresh} from './use-settings-refresh';
import {settingsStorage} from '../lib/account-settings';
import {useRef,useState} from 'react';
import {Star,ArrowUpRight} from 'lucide-react';
import {useMember,useMemberReady} from './community';
import {useLocale} from './locale';
import {FAVORITE_TOOLS,favoritesKey,parseFavorites,type FavoriteId} from '../lib/home-favorites';

function MemberFavorites({memberId,onNavigate}:{memberId:string;onNavigate:(tab:string)=>void}){
 const {t}=useLocale();const details=useRef<HTMLDetailsElement>(null);
 const [saved,setSaved]=useState(()=>{try{const raw=settingsStorage.getItem(favoritesKey(memberId));return {ids:raw===null?[]:parseFavorites(raw),error:''};}catch{return {ids:[] as FavoriteId[],error:'즐겨찾기를 불러오지 못했습니다. 다시 선택해 주세요.'};}});
 useSettingsRefresh(favoritesKey(memberId),()=>{const raw=settingsStorage.getItem(favoritesKey(memberId));setSaved({ids:raw===null?[]:parseFavorites(raw),error:''});});
 function toggle(id:FavoriteId){const ids=saved.ids.includes(id)?saved.ids.filter(item=>item!==id):[...saved.ids,id];try{settingsStorage.setItem(favoritesKey(memberId),JSON.stringify(ids));setSaved({ids,error:''});}catch{setSaved({...saved,error:'즐겨찾기를 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.'});}}
 return <>
  <div className="home-favorite-links">{saved.ids.map(id=>{const tool=FAVORITE_TOOLS.find(item=>item.id===id)!;return <button className="button secondary" key={id} onClick={()=>onNavigate(id)}><Star size={15}/><span>{t(tool.title)}</span><ArrowUpRight size={15}/></button>;})}</div>
  {!saved.ids.length&&<p className="favorites-empty">{t('즐겨찾기에 원하는 도구를 추가해 보세요.')}</p>}
  <details ref={details} className="favorites-picker" onKeyDown={event=>{if(event.key==='Escape'&&details.current?.open){event.preventDefault();details.current.open=false;details.current.querySelector('summary')?.focus();}}}>
   <summary>{t('즐겨찾기 편집')}</summary>
   <fieldset><legend className="sr-only">{t('즐겨찾기에 표시할 도구')}</legend>{FAVORITE_TOOLS.map(tool=><label key={tool.id}><input type="checkbox" checked={saved.ids.includes(tool.id)} onChange={()=>toggle(tool.id)}/><span>{t(tool.title)}</span></label>)}</fieldset>
  </details>
  <p className="favorites-note">{t('로그인한 계정에 동기화됩니다. 연결이 끊기면 이 기기에 보관합니다.')}</p>
  {saved.error&&<p role="alert">{t(saved.error)}</p>}
 </>;
}
export default function HomeFavorites({onNavigate}:{onNavigate:(tab:string)=>void}){
 const {t}=useLocale(),member=useMember(),ready=useMemberReady();
 return <section className="home-favorites panel" aria-label={t('즐겨찾기')}><h2><Star size={17}/>{t('즐겨찾기')}</h2>{!ready?<p role="status">{t('로그인 확인 중…')}</p>:member?<MemberFavorites key={member.id} memberId={member.id} onNavigate={onNavigate}/>:<div className="favorites-signin"><p>{t('로그인하고 나만의 즐겨찾기를 만들어 보세요.')}</p><small>{t('로그인은 화면 위쪽에서 할 수 있습니다.')}</small></div>}</section>;
}
