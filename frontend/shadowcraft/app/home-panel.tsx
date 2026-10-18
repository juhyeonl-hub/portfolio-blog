import {ArrowUpRight,BookOpen,Swords,Waypoints,Archive,Database,History} from 'lucide-react';
import {CLASSES} from '../lib/classes';

export default function HomePanel({onNavigate,onChooseClass,classKey}:{onNavigate:(tab:string)=>void;onChooseClass:(key:string)=>void;classKey:string}) {
  return <section className="a2bc-home" aria-label="a2bc 메인">
    <header className="home-heading"><div><span className="eyebrow">AION 2 · STEAM GLOBAL</span><h1>빌드부터 탐험까지.</h1><p>내 직업의 세팅을 준비하고, 아트레이아를 둘러보세요.</p></div><button className="button primary" onClick={()=>onNavigate('quick')}>내 빌드 시작하기 <ArrowUpRight size={16}/></button></header>
    <section className="home-professions" aria-label="직업별 빌드 바로가기"><div className="home-section-title"><h2>어떤 직업으로 시작할까요?</h2><span>8직업 빌드 플래너</span></div>
      <div className="home-class-grid">{CLASSES.map(item=><button key={item.key} aria-label={item.name+' 빌드 시작'} aria-current={classKey===item.key?'true':undefined} className={classKey===item.key?'selected':''} onClick={()=>onChooseClass(item.key)}><img src={'/shadowcraft/game/images/ui/resource/texture/icon/ut_class_'+item.key+'_large.webp'} alt=""/><span>{item.name}</span></button>)}</div>
    </section>
    <div className="home-section-title"><h2>자주 쓰는 도구</h2><span>계획 · 탐험 · 공유</span></div>
    <div className="home-destinations">
      {[
        {id:'quick',title:'빌드 플래너',description:'스킬·특화·데바니온을 내 포인트에 맞게.',action:'빌드 선택하기',icon:Swords,label:'BUILD'},
        {id:'map',title:'지도 & 수집',description:'필요한 위치만 골라 보고 수집을 기록하세요.',action:'지도 열기',icon:Waypoints,label:'EXPLORE'},
        {id:'public-builds',title:'빌드 커뮤니티',description:'다른 세팅을 살펴보고 내 빌드를 공유하세요.',action:'공개 빌드 보기',icon:BookOpen,label:'COMMUNITY'},
      ].map(item=><article className="panel" key={item.id}><div className="home-card-label"><item.icon size={23}/><span>{item.label}</span></div><h2>{item.title}</h2><p>{item.description}</p><button className="button secondary" onClick={()=>onNavigate(item.id)}>{item.action} <ArrowUpRight size={16}/></button></article>)}
    </div>
    <div className="home-utility-links" aria-label="추가 도구">{[
      {id:'builds',title:'저장한 빌드',note:'내 세팅 이어서 편집',icon:Archive},
      {id:'database',title:'글로벌 데이터',note:'스킬과 게임 정보 찾기',icon:Database},
      {id:'updates',title:'공식 업데이트',note:'최근 변경 사항 확인',icon:History},
    ].map(item=><button key={item.id} onClick={()=>onNavigate(item.id)}><item.icon size={19}/><span><b>{item.title}</b><small>{item.note}</small></span><ArrowUpRight size={15}/></button>)}</div>
  </section>;
}
