import {useLocale} from './locale';
import {AsbcMark} from './asbc-mark';
import HomeFavorites from './home-favorites';
import {CLASSES} from '../lib/classes';
import {ArrowUpRight,Archive,Database,History,UserRound,BookOpen,Waypoints,Timer,Calculator} from 'lucide-react';

const classIcon=(key:string)=>'/shadowcraft/game/images/ui/resource/texture/icon/ut_class_'+key+'_large.webp';
export default function HomePanel({onNavigate,onClassChange,classKey}:{onNavigate:(tab:string)=>void;onClassChange:(key:string)=>void;classKey:string}){
 const {t}=useLocale();
 return <section className="portal-home" aria-label="ASBC">
  <header className="portal-hero">
   <div className="portal-hero-copy"><span className="eyebrow">AION 2 · STEAM GLOBAL</span><h1>{t('AION 2 플레이 도구')}</h1><p>{t('빌드·지도·타이머·거래소를 한곳에서 이용하세요.')}</p><div className="portal-hero-note"><span aria-hidden="true"/>{t('로그인 없이 빌드를 둘러보고 내 플래너에서 수정할 수 있습니다.')}</div></div>
   <div className="portal-emblem" aria-hidden="true"><svg viewBox="0 0 500 270"><defs><linearGradient id="wing-glow"><stop stopColor="#b69d73"/><stop offset="1" stopColor="#54d6ec"/></linearGradient></defs><g fill="none" stroke="url(#wing-glow)" strokeWidth="1.5"><path d="M250 155L40 40 90 137 220 188M250 155L460 40 410 137 280 188M250 155L60 80 120 169 231 194M250 155L440 80 380 169 269 194M250 155L80 121 158 191 240 202M250 155L420 121 342 191 260 202"/><circle cx="250" cy="135" r="83" strokeDasharray="3 8"/><path d="M250 15L365 135 250 255 135 135Z" opacity=".35"/></g></svg><div className="portal-emblem-mark"><AsbcMark size={72}/><b>ASBC</b><span>YOUR ADVENTURE, YOUR BUILD</span></div></div>
  </header>
  <div className="portal-home-columns"><div className="portal-home-main">
   <section className="portal-discovery" aria-label={t('빌드 찾기')}>
    {[{id:'people',title:'캐릭터 찾기',note:'이름으로 캐릭터를 찾아 세팅을 살펴보세요.',icon:UserRound},{id:'public-builds',title:'공개 빌드',note:'다른 유저의 빌드를 내 플래너에서 수정해 보세요.',icon:BookOpen}].map(item=><button key={item.id} type="button" className="portal-discovery-card" onClick={()=>onNavigate(item.id)}><item.icon size={25} aria-hidden="true"/><div><strong className="portal-card-title">{t(item.title)}</strong><p>{t(item.note)}</p></div><ArrowUpRight size={19} aria-hidden="true"/></button>)}
   </section>
   <section className="portal-section" aria-labelledby="portal-class-title"><div className="portal-section-heading"><div><h2 id="portal-class-title">{t('직업별 빌드')}</h2><p>{t('직업을 선택하면 해당 직업의 플래너가 열립니다.')}</p></div></div>
    <div className="portal-class-grid">{CLASSES.map(profile=><button type="button" key={profile.key} className={profile.key===classKey?'selected':''} onClick={()=>{onClassChange(profile.key);onNavigate('quick');}}><img src={classIcon(profile.key)} alt="" width={48} height={48}/><strong>{t(profile.name)}</strong><ArrowUpRight size={15} aria-hidden="true"/></button>)}</div>
   </section>
   <section className="portal-section" aria-labelledby="portal-tools-title"><div className="portal-section-heading"><h2 id="portal-tools-title">{t('게임 도구')}</h2></div><div className="portal-tool-grid">
    {[{id:'map',title:'지도 & 수집',note:'수집물과 NPC를 검색하고 위치를 확인하세요.',icon:Waypoints},{id:'timers',title:'콘텐츠 타이머',note:'필요한 콘텐츠의 시간을 한눈에 확인하세요.',icon:Timer},{id:'trade',title:'거래소 계산기',note:'재료비와 세율을 넣고 판매가를 계산하세요.',icon:Calculator},{id:'population',title:'접속 현황',note:'Steam 접속자와 서버별 직업 분포를 확인하세요.',icon:UserRound}].map(item=><button key={item.id} type="button" className={'portal-tool-card '+item.id} onClick={()=>onNavigate(item.id)}><div><item.icon size={25} aria-hidden="true"/><ArrowUpRight size={17} aria-hidden="true"/></div><strong className="portal-card-title">{t(item.title)}</strong><p>{t(item.note)}</p></button>)}
   </div></section>
  </div><aside className="portal-home-rail" aria-label={t('추가 도구')}>
   <HomeFavorites onNavigate={onNavigate}/>
   <section className="portal-quick-links" aria-labelledby="portal-quick-title"><h2 id="portal-quick-title">{t('빠른 이동')}</h2>{[{id:'builds',title:'저장한 빌드',note:'내 세팅 이어서 편집',icon:Archive},{id:'database',title:'글로벌 데이터',note:'스킬과 게임 정보 찾기',icon:Database},{id:'updates',title:'공식 업데이트',note:'최근 변경 사항 확인',icon:History}].map(item=><button type="button" key={item.id} onClick={()=>onNavigate(item.id)}><item.icon size={19} aria-hidden="true"/><span><strong>{t(item.title)}</strong><small>{t(item.note)}</small></span><ArrowUpRight size={15} aria-hidden="true"/></button>)}</section>
  </aside></div>
 </section>;
}
