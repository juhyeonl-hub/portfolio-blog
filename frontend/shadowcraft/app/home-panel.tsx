import {useLocale} from './locale';
import PopulationPanel from './population-panel';
import HomeFavorites from './home-favorites';
import {ArrowUpRight,Archive,Database,History} from 'lucide-react';

export default function HomePanel({onNavigate}:{onNavigate:(tab:string)=>void}) {
  const {t}=useLocale();
  return <section className="a2bc-home" aria-label="ASBC">
    <header className="home-heading"><div><span className="eyebrow">AION 2 · STEAM GLOBAL</span></div></header>
    <section className="home-start" aria-labelledby="home-start-title"><h1 id="home-start-title">{t('무엇을 하고 싶으세요?')}</h1><div className="home-start-grid">{[
      {id:'quick',title:'빌드 바로 보기',note:'직업과 레벨에 맞는 스킬·데바니온을 확인하세요.'},
      {id:'compare',title:'다른 캐릭터와 비교하기',note:'내 장비와 랭커 장비를 나란히 확인하세요.'},
      {id:'map',title:'지도에서 위치 찾기',note:'수집물과 NPC를 검색하고 위치를 확인하세요.'},
    ].map((item,i)=><button key={item.id} onClick={()=>onNavigate(item.id)}><span className="start-number" aria-hidden="true">{i+1}</span><strong>{t(item.title)}</strong><span>{t(item.note)}</span><ArrowUpRight size={20} aria-hidden="true"/></button>)}</div></section>
    <div className="home-public-entry"><button className="button secondary" onClick={()=>onNavigate('people')}>{t('캐릭터 빌드 찾기')}</button><button className="button secondary" onClick={()=>onNavigate('public-builds')}>{t('다른 유저의 빌드 찾기')}</button><p>{t('로그인 없이 빌드를 둘러보고 내 플래너에서 수정할 수 있습니다.')}</p></div>
    <HomeFavorites onNavigate={onNavigate}/>
    <div className="home-utility-links" aria-label={t('추가 도구')}>{[
      {id:'builds',title:'저장한 빌드',note:'내 세팅 이어서 편집',icon:Archive},
      {id:'database',title:'글로벌 데이터',note:'스킬과 게임 정보 찾기',icon:Database},
      {id:'updates',title:'공식 업데이트',note:'최근 변경 사항 확인',icon:History},
    ].map(item=><button key={item.id} onClick={()=>onNavigate(item.id)}><item.icon size={19}/><span><b>{t(item.title)}</b><small>{t(item.note)}</small></span><ArrowUpRight size={15}/></button>)}</div>
    <details className="activity-disclosure"><summary>{t('접속 현황 보기')}</summary><PopulationPanel/></details>
    <div className="home-footer-ad" aria-hidden="true"><span>{t('광고')}</span></div>
  </section>;
}
