import {useEffect,useRef,useState,type MouseEvent} from 'react';
import {Menu,X,ChevronDown,Home,CheckCircle2,UserRound,BookOpen,Trophy,Waypoints,Timer,Calculator,Archive,Database,History,ArrowUpRight} from 'lucide-react';
import {AsbcMark} from './asbc-mark';
import {LanguageSelect,useLocale} from './locale';
import {useMember} from './community';
import {screenHash} from '../lib/navigation';
import {SITE_NAV,navActive,type SiteLink} from '../lib/site-navigation';

const icons={population:UserRound,home:Home,quick:CheckCircle2,people:UserRound,'public-builds':BookOpen,rankers:Trophy,map:Waypoints,timers:Timer,trade:Calculator,builds:Archive,database:Database,updates:History};

/** Same destinations and drawer behavior in the planner and shared-build readers. */
export default function TopNav({active,onSelect}:{active:string;onSelect?:(id:string)=>void}){
 const {t}=useLocale(),member=useMember(),[mobileNav,setMobileNav]=useState(false);
 const root=useRef<HTMLElement>(null),sidebarRef=useRef<HTMLElement>(null),menuRef=useRef<HTMLButtonElement>(null),navOpener=useRef<HTMLButtonElement|null>(null);
 useEffect(()=>{
  if(!mobileNav)return;
  const sidebar=sidebarRef.current,header=root.current;if(!sidebar||!header)return;
  const viewport=window.matchMedia('(max-width:1279px)');
  if(!viewport.matches){setMobileNav(false);return;}
  const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  // Preserve the existing drawer trap; include timers and reader content in the inert boundary.
  const outside:HTMLElement[]=[];let branch:HTMLElement|null=header;
  while(branch?.parentElement&&branch.id!=='root'){
   for(const sibling of Array.from(branch.parentElement.children))if(sibling!==branch&&sibling instanceof HTMLElement)outside.push(sibling);
   branch=branch.parentElement;
  }
  // Also hide the header controls from virtual-cursor navigation; keep the backdrop clickable.
  for(const child of Array.from(header.children))if(child instanceof HTMLElement&&!child.contains(sidebar)&&!child.classList.contains('portal-menu-scrim'))outside.push(child);
  const oldInert=outside.map(el=>el.inert);outside.forEach(el=>{el.inert=true;});
  const focusable=()=>Array.from(sidebar.querySelectorAll<HTMLElement>('button,a[href],select,[tabindex="0"]')).filter(el=>el.getClientRects().length&&!el.hasAttribute('disabled'));
  focusable()[0]?.focus();
  const keydown=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();setMobileNav(false);}
   if(event.key==='Tab'){const items=focusable(),first=items[0],last=items[items.length-1];
    if(!sidebar.contains(document.activeElement)){event.preventDefault();first?.focus();}
    else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
   }
  };
  const resize=()=>{if(!viewport.matches)setMobileNav(false);};
  document.addEventListener('keydown',keydown);viewport.addEventListener('change',resize);
  return()=>{document.body.style.overflow=previousOverflow;outside.forEach((el,i)=>{el.inert=oldInert[i];});document.removeEventListener('keydown',keydown);viewport.removeEventListener('change',resize);if(viewport.matches){const target=navOpener.current?.isConnected?navOpener.current:menuRef.current;target?.focus({preventScroll:true});}};
 },[mobileNav]);
 useEffect(()=>{
  const close=(event:PointerEvent)=>root.current?.querySelectorAll<HTMLDetailsElement>('details[open]').forEach(item=>{if(!item.contains(event.target as Node))item.open=false;});
  document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);
 },[]);
 useEffect(()=>{
  const element=root.current;if(!element)return;
  const observer=new ResizeObserver(()=>document.documentElement.style.setProperty('--asbc-nav-height',`${element.getBoundingClientRect().height}px`));observer.observe(element);
  return()=>{observer.disconnect();document.documentElement.style.removeProperty('--asbc-nav-height');};
 },[]);
 function select(event:MouseEvent<HTMLAnchorElement>,id:string){
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  if(onSelect){event.preventDefault();onSelect(id);}
  setMobileNav(false);root.current?.querySelectorAll<HTMLDetailsElement>('details[open]').forEach(item=>{item.open=false;});
 }
 function link(item:SiteLink,compact=false){const Icon=icons[item.id as keyof typeof icons];return <a key={item.id} href={screenHash(item.id)} onClick={event=>select(event,item.id)} aria-current={navActive(active,item.id)?'page':undefined} className={compact?'portal-nav-link':'portal-menu-link'}><Icon size={17} aria-hidden="true"/><span>{t(item.label)}</span></a>;}
 return <header className="portal-topnav" ref={root}>
  <button type="button" className="skip-link" onClick={()=>{document.getElementById('asbc-main')?.focus();document.getElementById('asbc-main')?.scrollIntoView();}}>{t('본문으로 건너뛰기')}</button>
  <a className="portal-brand" href={screenHash('home')} onClick={event=>select(event,'home')} aria-label="ASBC · Aion2 Steam Build Craft"><AsbcMark/><span><b>ASBC</b><small>AION 2 · GLOBAL</small></span></a>
  <nav className="portal-desktop-nav" aria-label={t('주 메뉴')}>
   {SITE_NAV.map(group=>'id' in group?link(group,true):<details key={group.label} className="portal-nav-group" onKeyDown={event=>{if(event.key==='Escape'&&event.currentTarget.open){event.preventDefault();event.currentTarget.open=false;event.currentTarget.querySelector('summary')?.focus();}}} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))event.currentTarget.open=false;}}><summary className={group.items.some(item=>navActive(active,item.id))?'current':''}>{t(group.label)}<ChevronDown size={14} aria-hidden="true"/></summary><div className="portal-dropdown">{group.items.map(item=>link(item))}</div></details>)}
  </nav>
  <div className="portal-account"><LanguageSelect/>{active!=='account'&&!mobileNav&&<a className="button secondary small" href={screenHash('account')} onClick={event=>select(event,'account')}>{t(member?'내 계정':'로그인')}</a>}</div>
  <button ref={menuRef} type="button" className="portal-menu-toggle icon-button" aria-expanded={mobileNav} aria-controls={mobileNav?"asbc-navigation":undefined} onClick={event=>{navOpener.current=event.currentTarget;setMobileNav(!mobileNav);}} aria-label={t('메뉴')}><Menu size={22}/></button>
  {mobileNav&&<div className="portal-menu-scrim" aria-hidden="true" onClick={()=>setMobileNav(false)}/>}
  {mobileNav&&<aside id="asbc-navigation" ref={sidebarRef} role="dialog" aria-modal="true" aria-label={t('주 메뉴')} className="portal-drawer">
   <div className="portal-drawer-heading"><b>ASBC</b><button type="button" className="icon-button" onClick={()=>setMobileNav(false)} aria-label={t('메뉴 닫기')}><X size={22}/></button></div>
   <nav aria-label={t('주 메뉴')}>{SITE_NAV.map(group=>'id' in group?link(group):<section key={group.label}><h2>{t(group.label)}</h2>{group.items.map(item=>link(item))}</section>)}</nav>
   <a className="portal-menu-link" href={screenHash('account')} onClick={event=>select(event,'account')}><UserRound size={17}/>{t(member?'내 계정':'로그인')}<ArrowUpRight size={15}/></a>
  </aside>}
 </header>;
}
