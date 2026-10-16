import {useEffect, useState} from 'react';
import {parseJournalIndex, type JournalIndex, type QuestRewards, type RewardContent} from '../lib/journal-index';
const races: Record<string, string> = {All: '공통', Light: '천족', Dark: '마족'};
function Rewards({rewards}: {rewards: QuestRewards | null | undefined}) {
  if (rewards === undefined) return <p>이 데이터 버전에는 퀘스트 보상 정보가 없습니다.</p>;
  if (rewards === null) return <p>연결된 보상 레코드가 없습니다. 보상이 없다는 뜻은 아닙니다.</p>;
  return <section aria-label="퀘스트 보상"><h4>클라이언트에 등록된 보상</h4>
    <p>경험치 {rewards.experience.toLocaleString()}</p>
    <RewardLists rewards={rewards}/>
    {!!rewards.classRewards?.length && <div aria-label="직업별 퀘스트 보상"><h5>직업별 보상 · 해당 직업만</h5>{rewards.classRewards.map(entry => <details key={entry.classKey}><summary>{classNames[entry.classKey]}</summary><RewardLists rewards={entry}/></details>)}</div>}
  </section>;
}
const classNames: Record<string, string> = {gladiator: '검성', templar: '수호성', assassin: '살성', ranger: '궁성', sorcerer: '마도성', elementalist: '정령성', cleric: '치유성', chanter: '호법성'};
function RewardLists({rewards}: {rewards: RewardContent}) {
  return <>
    {([{label: '기본 보상', items: rewards.items}, {label: '일반 아이템 보상', items: rewards.normalItems}, {label: '선택 보상 후보', items: rewards.selectionItems}]).map(group => <div key={group.label}><h5>{group.label}</h5>{group.items.length ? <ul>{group.items.map((item, index) => <li key={`${item.id}:${index}`}>{item.name ?? `아이템 ${item.id}`} × {item.count.toLocaleString()}{item.enchantLevel > 0 ? ` · 강화 +${item.enchantLevel}` : ''}</li>)}</ul> : <p>등록된 항목 없음</p>}</div>)}
    {!!rewards.selectionItems.length && <p>선택 후보 목록이며 모든 아이템을 함께 받는다는 뜻은 아닙니다.</p>}
    {rewards.randomGroup && <p>무작위 보상 그룹이 추가로 연결돼 있습니다. 구성과 확률은 아직 확인되지 않았습니다.</p>}
  </>;
}
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
    <p>글로벌 클라이언트의 영문 이름·설명과 등록된 퀘스트 보상입니다. 테스트용·비활성 항목이 포함될 수 있으며 실제 서버의 지급 여부와 추가 조건은 확인되지 않았습니다.</p>
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
            {quest?.levels && <div aria-label="퀘스트 레벨 조건"><p>시작 레벨 {quest.levels.unlock || '미지정'} · 권장 레벨 {quest.levels.recommended || '미지정'}</p>{quest.levels.additionalConditions > 0 && <p>추가 시작 조건 {quest.levels.additionalConditions}개가 있습니다. 레벨만으로 시작 가능 여부를 판단할 수 없습니다.</p>}</div>}
            {quest && <Rewards rewards={quest.rewards}/>}
            {pet && <><h4>{pet.name ?? '이름 미확인'}</h4><p>ID {pet.id} · {pet.kind}</p><p>공식 펫 목록의 원본 분류입니다. 획득 경로·능력치·성장 확률은 검증되지 않았습니다.</p></>}
            {dungeon?.recommendation && <div aria-label="던전 권장 정보"><p>권장 레벨 {dungeon.recommendation.level || '미지정'} · 난이도 {dungeon.recommendation.difficulty === 'None' ? '미지정' : dungeon.recommendation.difficulty}</p><p>{dungeon.recommendation.maxMembers > 0 ? `권장 인원 ${dungeon.recommendation.minMembers}–${dungeon.recommendation.maxMembers}명` : '권장 인원 미지정'}</p><p>권장 정보이며 입장 가능 여부나 입장 제한을 뜻하지 않습니다.</p></div>}
            {dungeon && <><h4>{dungeon.name ?? '이름 미확인'}</h4><p>ID {dungeon.id} · {dungeon.kind}</p><p>연결 맵: {dungeon.mapName ?? '이름 미확인'} · {dungeon.mapId}</p></>}
          </div></div>
      </>}
    </>}
  </section>;
}
