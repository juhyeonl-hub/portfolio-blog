import {useEffect, useState} from 'react';
import {parseDpsSnapshot, type DpsSnapshot} from '../lib/live-dps';

export default function LiveDps() {
  const [key, setKey] = useState(''), [connection, setConnection] = useState('');
  const [data, setData] = useState<DpsSnapshot | null>(null);
  const [status, setStatus] = useState('연결 대기'), [updated, setUpdated] = useState('');
  useEffect(() => {
    if (!connection) return;
    let live = true;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController;
    async function poll() {
      controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      try {
        const response = await fetch('http://127.0.0.1:18732/snapshot', {
          headers: {'X-A2BC-Token': connection}, signal: controller.signal, cache: 'no-store', credentials: 'omit', redirect: 'error',
        });
        if (!response.ok) throw Error();
        const raw = await response.text();
        if (raw.length > 65536) throw Error();
        const next = parseDpsSnapshot(JSON.parse(raw));
        if (live) {setData(next); setUpdated(new Date().toLocaleTimeString()); setStatus('수집기 연결됨');}
      } catch {
        if (live) setStatus('갱신 중단 — 수집기·연결키·브라우저 로컬 네트워크 권한을 확인하세요.');
      } finally {
        clearTimeout(timeout);
        if (live) timer = setTimeout(poll, 1000);
      }
    }
    setStatus('연결 중');
    void poll();
    return () => {live = false; clearTimeout(timer); controller?.abort();};
  }, [connection]);
  return <section className="card" aria-label="실측 실시간 DPS">
    <h2>실측 실시간 DPS</h2>
    <p>같은 PC의 A2Tools 수집기가 측정한 누적 피해량과 DPS를 표시합니다. 스킬 순환이나 발동 확률을 가정해 계산하지 않습니다.</p>
    <p>실제 글로벌 전투와의 대조는 아직 완료되지 않은 연동 기능입니다.</p>
    <details><summary>로컬 수집기 연결 방법</summary><ol>
      <li><a href="https://github.com/taengu/A2Tools-DPS-Meter" target="_blank" rel="noreferrer">A2Tools</a>에서 Settings → Streaming을 켭니다.</li>
      <li>게임 PC에서 <a href="/shadowcraft/tools/dps-bridge.py" download>로컬 연결 도구</a>를 Python 3으로 실행하고 수집기 스트림 키를 입력합니다.</li>
      <li>도구가 보여주는 a2bc 연결키를 아래에 입력합니다. 브라우저가 로컬 네트워크 접근을 물으면 이 연결에 허용해야 합니다.</li>
    </ol><p>데이터는 게임 PC와 이 브라우저 사이에서만 전달됩니다. 연결키와 전투 기록은 저장하거나 블로그 서버에 업로드하지 않습니다. 연결 도구는 패킷을 직접 수집하지 않습니다.</p></details>
    <label>a2bc 로컬 연결키<input type="password" autoComplete="off" value={key} onChange={e => setKey(e.target.value)} disabled={!!connection}/></label>
    <button className="button primary" disabled={!!connection || !key.trim() || key.length > 256} onClick={() => {setData(null); setUpdated(''); setConnection(key.trim()); setKey('');}}>연결</button>
    <button className="button ghost" disabled={!connection} onClick={() => {setConnection(''); setStatus('연결 해제 — 마지막 수신값');}}>연결 해제</button>
    <p role="status">{status}{updated && ` · 마지막 수신 ${updated}`}</p>
    {data && <><p>대상: {data.target || '선택 없음'} · 수집기 모드: {data.mode} · 전투 시간 {(data.timeMs / 1000).toFixed(1)}초</p>
      {!data.rows.length ? <p>수집된 피해 기록이 없습니다.</p> : <div style={{overflowX: 'auto'}}><table><thead><tr><th>캐릭터</th><th>측정 DPS</th><th>누적 피해량</th></tr></thead><tbody>
        {data.rows.map((row, index) => <tr key={index}><td>{row.name}{row.you ? ' (나)' : ''}</td><td>{row.dps.toLocaleString()}</td><td>{row.dmg.toLocaleString()}</td></tr>)}
      </tbody></table></div>}
      <p>수집기가 선택한 대상·시간·표시 인원 기준입니다. 누락된 피해는 추정해 채우지 않습니다. 연결됨은 전투 진행 중이라는 뜻이 아닙니다.</p>
    </>}
  </section>;
}
