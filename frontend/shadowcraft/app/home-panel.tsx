import {ArrowUpRight,BookOpen,Swords,Waypoints} from 'lucide-react';

export default function HomePanel({onNavigate}:{onNavigate:(tab:string)=>void}) {
  return <section className="a2bc-home" aria-label="a2bc 메인">
    <div className="panel home-intro"><span className="eyebrow">AION 2 · STEAM GLOBAL</span>
      <h1>aion2(Steam) build craft</h1>
      <p>내 직업의 빌드를 준비하고, 함께 공유하고, 지도를 탐험하세요.</p>
      <button className="button primary" onClick={()=>onNavigate('quick')}>내 빌드 시작하기 <ArrowUpRight size={16}/></button>
    </div>
    <div className="home-destinations">
      {[
        {id:'quick',title:'8직업 빌드 플래너',description:'직업을 고르고 스킬·특화·데바니온을 내 포인트에 맞게 구성하세요.',action:'빌드 선택하기',icon:Swords},
        {id:'map',title:'지도 & 수집',description:'채집물·히든큐브·깃털·던전과 주둔지를 골라 보고, 확인한 위치를 기록하세요.',action:'지도 열기',icon:Waypoints},
        {id:'public-builds',title:'빌드 커뮤니티',description:'공개 빌드를 살펴보고 내 빌드를 게시하세요. 로그인하면 추천과 댓글로 의견을 나눌 수 있습니다.',action:'공개 빌드 보기',icon:BookOpen},
      ].map(item=><article className="panel" key={item.id}><item.icon size={28}/><h2>{item.title}</h2><p>{item.description}</p><button className="button secondary" onClick={()=>onNavigate(item.id)}>{item.action} <ArrowUpRight size={16}/></button></article>)}
    </div>
    <div className="panel home-shortcuts"><h2>이어서 둘러보기</h2><div>
      <button className="button ghost" onClick={()=>onNavigate('builds')}>저장한 빌드</button>
      <button className="button ghost" onClick={()=>onNavigate('database')}>글로벌 데이터</button>
      <button className="button ghost" onClick={()=>onNavigate('updates')}>공식 업데이트</button>
    </div><p className="subtle">상단 타이머에서 서버와 국가를 설정할 수 있습니다. 빌드 계획과 지도 확인 기록은 이 브라우저에 보관됩니다.</p></div>
  </section>;
}
