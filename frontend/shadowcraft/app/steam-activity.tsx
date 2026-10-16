import {useEffect,useState} from 'react';
type Activity={appId:string;scope:string;players:number;checkedAt:string;stale:boolean};
export default function SteamActivity({active}:{active:boolean}) {
  const [data,setData]=useState<Activity|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[retry,setRetry]=useState(0);
  useEffect(()=>{
    if(!active)return;
    let live=true;const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);
    setLoading(true);setError('');
    fetch('/api/public/shadowcraft/activity',{signal:controller.signal}).then(async r=>{
      if(!r.ok)throw Error();const next=await r.json();
      if(next.appId!=='3393110'||next.scope!=='steam-global-total'||!Number.isSafeInteger(next.players)||next.players<0||next.players>1000000000||typeof next.checkedAt!=='string'||!Number.isFinite(Date.parse(next.checkedAt))||typeof next.stale!=='boolean')throw Error();
      if(live)setData(next);
    }).catch(()=>{if(live)setError('Steam 접속자 수 갱신 실패 · 마지막 확인값이 있으면 유지합니다.');}).finally(()=>{clearTimeout(timeout);if(live)setLoading(false);});
    return()=>{live=false;controller.abort();clearTimeout(timeout);};
  },[active,retry]);
  useEffect(()=>{if(!active)return;const timer=setInterval(()=>{if(document.visibilityState==='visible')setRetry(v=>v+1);},60000);return()=>clearInterval(timer);},[active]);
  return <section className="card" aria-label="Steam 글로벌 접속 현황"><h2>Steam 글로벌 접속 현황</h2><p>공식 Steam API가 집계한 전체 접속자 수입니다. 서버별 온라인 상태·혼잡도·인원은 제공하지 않습니다.</p>
    {data&&<><p><strong>{data.players.toLocaleString()}명</strong></p><p>마지막 확인: {new Date(data.checkedAt).toLocaleString('ko-KR')}</p>{(data.stale||error)&&<p role="status">최신 갱신을 확인하지 못한 이전 값입니다.</p>}</>}
    {loading&&<p role="status">Steam 정보를 확인하는 중…</p>}{error&&<p role="alert">{error}</p>}
    <button className="button ghost" disabled={loading} onClick={()=>setRetry(v=>v+1)}>접속 현황 다시 확인</button><p>화면을 보는 동안 1분마다 확인합니다. 서버는 최대 1분간 조회 결과를 재사용합니다.</p><a href="https://store.steampowered.com/app/3393110/" target="_blank" rel="noreferrer">공식 Steam 페이지</a>
  </section>;
}
