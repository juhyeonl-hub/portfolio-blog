import {useEffect, useState} from 'react';
import {parseJournalIndex, type JournalIndex} from '../lib/journal-index';
const races: Record<string, string> = {All: '공통', Light: '천족', Dark: '마족'};
export default function JournalDatabase({active}: {active: boolean}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<JournalIndex | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [section, setSection] = useState<'quests' | 'dungeons' | 'pets'>('quests');
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState('');
  useEffect(() => {
    if (!active || !open || data) return;
    const controller = new AbortController(); let live = true;
    setError(false);
    fetch('/shadowcraft/data/journal-index.json', {signal: controller.signal}).then(async response => {
      if (!response.ok) throw Error();
      const next = parseJournalIndex(await response.json());
      if (live) setData(next);
    }).catch(() => {if (live) setError(true);});
    return () => {live = false; controller.abort();};
  }, [active, open, data, retry]);
  const rows = data?.[section] ?? [];
  const matches = rows.filter(row => (!kind || row.kind === kind) && `${row.name ?? ''} ${row.id}`.toLowerCase().includes(query.trim().toLowerCase()));
  const quest = section === 'quests' ? data?.quests.find(q => q.id === selected) : undefined;
  const dungeon = section === 'dungeons' ? data?.dungeons.find(d => d.id === selected) : undefined;
  const pet = section === 'pets' ? data?.pets.find(p => p.id === selected) : undefined;
  const next = quest?.nextId ? data?.quests.find(q => q.id === quest.nextId) : undefined;
  return <section aria-label="공식 퀘스트·던전·펫 목록">
    <h3>공식 퀘스트·던전·펫 목록</h3>
    <p>글로벌 클라이언트의 영문 이름·설명과 원본 분류입니다. 테스트용·비활성 항목이 포함될 수 있으며 실제 입장 조건과 보상은 확인되지 않았습니다.</p>
    <button className="button ghost" aria-expanded={open} onClick={() => setOpen(v => !v)}>{open ? '퀘스트·던전·펫 닫기' : '퀘스트·던전·펫 열기'}</button>
    {open && <>
      {!data && !error && <p role="status">퀘스트·던전·펫을 불러오는 중…</p>}
      {error && <p role="alert">퀘스트·던전·펫을 불러오지 못했습니다. <button className="button ghost" onClick={() => setRetry(v => v + 1)}>퀘스트·던전·펫 다시 불러오기</button></p>}
      {data && <>
        <p>Steam 빌드 {data.source.buildId} · 퀘스트 {data.quests.length.toLocaleString()}개 · 던전 {data.dungeons.length.toLocaleString()}개 · 펫 {data.pets.length.toLocaleString()}개</p>
        <div className="database-tabs">{(['quests', 'dungeons', 'pets'] as const).map(key => <button className="button ghost" key={key} aria-pressed={section === key} onClick={() => {setSection(key); setQuery(''); setKind(''); setPage(0); setSelected('');}}>{key === 'quests' ? '퀘스트' : key === 'dungeons' ? '던전' : '펫'}</button>)}</div>
        <div className="database-filters"><label>퀘스트·던전·펫 검색<input aria-label="퀘스트·던전·펫 검색" type="search" placeholder="영문 이름 또는 ID" value={query} onChange={e => {setQuery(e.target.value); setPage(0); setSelected('');}}/></label><label>원본 분류<select aria-label="퀘스트·던전·펫 분류" value={kind} onChange={e => {setKind(e.target.value); setPage(0); setSelected('');}}><option value="">전체</option>{[...new Set(rows.map(r => r.kind))].sort().map(k => <option key={k}>{k}</option>)}</select></label></div>
        <p>퀘스트·던전·펫 검색 결과 {matches.length.toLocaleString()}개</p>
        <div className="database-layout"><div><div className="database-list">{matches.slice(page * 30, page * 30 + 30).map(row => <button key={row.id} aria-pressed={selected === row.id} onClick={() => setSelected(row.id)}><strong>{row.name ?? '이름 미확인'}</strong><small>{row.kind} · {row.id}</small></button>)}</div>
          {!matches.length && <p role="status">퀘스트·던전·펫 검색 결과가 없습니다.</p>}
          <div className="database-pages"><button className="button ghost" disabled={page === 0} onClick={() => setPage(v => v - 1)}>목록 이전</button><span>{page + 1} / {Math.max(1, Math.ceil(matches.length / 30))}</span><button className="button ghost" disabled={(page + 1) * 30 >= matches.length} onClick={() => setPage(v => v + 1)}>목록 다음</button></div></div>
          <div className="database-detail" aria-label="퀘스트·던전·펫 상세">
            {!selected && <p>목록에서 항목을 선택하세요.</p>}
            {quest && <><h4>{quest.name ?? '이름 미확인'}</h4><p>ID {quest.id} · {quest.kind} · {races[quest.race]}</p><p>{quest.summary ?? '설명 미확인'}</p><p>원본 단계 레코드 {quest.stepCount}개</p>{quest.acquireNpc && <p>시작 NPC: {quest.acquireNpc.name ?? '이름 미확인'} · {quest.acquireNpc.id}</p>}{quest.completeNpc && <p>완료 NPC: {quest.completeNpc.name ?? '이름 미확인'} · {quest.completeNpc.id}</p>}{next ? <button className="button ghost" onClick={() => {setQuery(next.id); setKind(''); setPage(0); setSelected(next.id);}}>다음 퀘스트: {next.name ?? next.id}</button> : <p>등록된 다음 퀘스트 없음</p>}</>}
            {pet && <><h4>{pet.name ?? '이름 미확인'}</h4><p>ID {pet.id} · {pet.kind}</p><p>공식 펫 목록의 원본 분류입니다. 획득 경로·능력치·성장 확률은 검증되지 않았습니다.</p></>}
            {dungeon && <><h4>{dungeon.name ?? '이름 미확인'}</h4><p>ID {dungeon.id} · {dungeon.kind}</p><p>연결 맵: {dungeon.mapName ?? '이름 미확인'} · {dungeon.mapId}</p></>}
          </div></div>
      </>}
    </>}
  </section>;
}
