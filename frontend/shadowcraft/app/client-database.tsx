import {useEffect, useMemo, useState} from 'react';

import {parseClientIndex, type ClientIndex} from '../lib/client-index';

export default function ClientDatabase({active}: {active: boolean}) {
  const [data, setData] = useState<ClientIndex | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const [section, setSection] = useState<'items' | 'skills' | 'recipes'>('items');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState('');
  const [attempts, setAttempts] = useState('1');
  useEffect(() => {
    if (!active || data) return;
    const controller = new AbortController();
    let live = true;
    setLoading(true); setError('');
    fetch('/shadowcraft/data/client-index.json', {signal: controller.signal}).then(async response => {
      if (!response.ok) throw Error();
      const next = parseClientIndex(await response.json());
      if (live) setData(next);
    }).catch(() => {if (live) setError('클라이언트 데이터 목록을 불러오지 못했습니다.');})
      .finally(() => {if (live) setLoading(false);});
    return () => {live = false; controller.abort();};
  }, [active, data, retry]);
  const items = useMemo(() => new Map(data?.items.map(i => [i.id, i])), [data]);
  const rows = useMemo(() => {
    if (!data) return [];
    if (section === 'items') return data.items.map(i => ({id: i.id, name: i.name, category: i.kind, subtitle: `${i.grade} · Lv.${i.level}`}));
    if (section === 'skills') return data.skills.map(s => ({id: s.id, name: s.name, category: s.classKey, subtitle: s.classKey}));
    return data.recipes.map(r => ({id: r.id, name: items.get(r.itemId)?.name ?? r.itemId, category: r.category, subtitle: `${r.race} · 숙련도 ${r.masteryLevel}`}));
  }, [data, section, items]);
  const categories = useMemo(() => [...new Set(rows.map(r => r.category))].sort(), [rows]);
  const matches = rows.filter(r => (!filter || r.category === filter) && `${r.name} ${r.id}`.toLowerCase().includes(query.trim().toLowerCase()));
  const recipe = section === 'recipes' ? data?.recipes.find(r => r.id === selected) : undefined;
  const item = section === 'items' ? items.get(selected) : undefined;
  const skill = section === 'skills' ? data?.skills.find(s => s.id === selected) : undefined;
  const count = /^\d+$/.test(attempts) ? Number(attempts) : NaN;
  const validCount = Number.isSafeInteger(count) && count >= 1 && count <= 10000;
  return <section className="client-database card" aria-label="글로벌 클라이언트 데이터베이스">
    <h2>글로벌 클라이언트 데이터베이스</h2>
    <p>설치된 Steam 클라이언트에서 읽은 아이템·스킬·제작 재료입니다. 클라이언트에는 현재 서버에서 사용할 수 없는 항목도 포함될 수 있습니다.</p>
    {loading && <p role="status">클라이언트 데이터를 불러오는 중…</p>}
    {error && <div role="alert">{error} <button className="button ghost" onClick={() => setRetry(v => v + 1)}>다시 불러오기</button></div>}
    {data && <>
      <p>Steam 빌드 {data.source.buildId} · 공식 클라이언트 원본 · 영문 이름 · 구조 및 참조 검사 통과</p>
      <p className="subtle">모든 필드의 의미와 서버 내 이용 가능 여부를 검증한 것은 아닙니다. 성공 확률·수수료·미확인 수치는 표시하지 않습니다.</p>
      <div className="database-tabs">{(['items', 'skills', 'recipes'] as const).map((kind, i) => <button className="button ghost" key={kind} aria-pressed={section === kind} onClick={() => {setSection(kind); setFilter(''); setPage(0); setSelected(''); setQuery('');}}>{['아이템', '플레이어 스킬', '제작법'][i]} ({data[kind].length})</button>)}</div>
      <div className="database-filters"><label>데이터 검색<input type="search" value={query} onChange={e => {setQuery(e.target.value); setPage(0);}} placeholder="영문 이름 또는 ID"/></label>
        <label>분류<select value={filter} onChange={e => {setFilter(e.target.value); setPage(0);}}><option value="">전체</option>{categories.map(c => <option key={c}>{c}</option>)}</select></label></div>
      <p>검색 결과 {matches.length.toLocaleString()}개</p>
      <div className="database-layout"><div><div className="database-list">{matches.slice(page * 30, page * 30 + 30).map(row => <button key={row.id} aria-pressed={selected === row.id} onClick={() => {setSelected(row.id); setAttempts('1');}}><strong>{row.name}</strong><small>{row.subtitle} · {row.id}</small></button>)}</div>
        {!matches.length && <p role="status">검색 결과가 없습니다.</p>}
        <div className="database-pages"><button className="button ghost" disabled={page === 0} onClick={() => setPage(v => v - 1)}>이전</button><span>{page + 1} / {Math.max(1, Math.ceil(matches.length / 30))}</span><button className="button ghost" disabled={(page + 1) * 30 >= matches.length} onClick={() => setPage(v => v + 1)}>다음</button></div></div>
        <div className="database-detail" aria-label="데이터 상세">
          {!selected && <p>목록에서 항목을 선택하세요.</p>}
          {item && <><h3>{item.name}</h3><p>ID {item.id} · {item.kind} · {item.grade} · 아이템 레벨 {item.level}</p></>}
          {skill && <><h3>{skill.name}</h3><p>ID {skill.id} · {skill.classKey}</p><h4>레벨별 습득 조건</h4><p>포인트는 해당 레벨을 배울 때 드는 비용입니다. 승급 조건은 클라이언트 원본 코드로 표시합니다.</p>
            {skill.learning ? <ol className="skill-learning-list">{skill.learning.map(row => <li key={row.level}>
              <strong>스킬 Lv.{row.level}</strong><span>캐릭터 Lv.{row.requiredCharacterLevel} · {row.autoLearn ? '자동 습득' : '직접 습득'}</span>
              <span>SP {row.skillPoints} · 스티그마 {row.stigmaPoints}</span>
              <span>승급 조건: {row.ascensionRequirement === 'None' ? '없음' : row.ascensionRequirement}</span>
            </li>)}</ol> : <p>이 데이터 버전에는 습득 조건이 없습니다.</p>}
            <p>플래너의 승급 조건 확인 설정으로 신규 투자와 추천을 제한합니다. 게임에서 조건 충족 여부를 직접 확인하세요.</p></>}
          {recipe && <><h3>{items.get(recipe.itemId)?.name}</h3><p>레시피 {recipe.id} · {recipe.category} · {recipe.race}</p>
            <p>기본 생산 수량 {recipe.outputQuantity}개 · 요구 숙련도 {recipe.masteryLevel}</p>
            <p>{recipe.hasCombo ? '연속 제작 결과가 존재합니다. ' : ''}성공 확률과 수수료는 미확정입니다. 아래는 입력한 시도 횟수에 필요한 재료이며 성공 수량 예측이 아닙니다.</p>
            <label>제작 시도 횟수<input inputMode="numeric" value={attempts} onChange={e => setAttempts(e.target.value)}/></label>
            {!validCount ? <p role="alert">시도 횟수는 1~10000의 정수로 입력하세요.</p> : <ul>{recipe.ingredients.map((ingredient, i) => <li key={`${ingredient.itemId}-${i}`}>{items.get(ingredient.itemId)?.name ?? ingredient.itemId} × {(ingredient.quantity * count).toLocaleString()}{ingredient.enchant > 0 ? ` (강화 +${ingredient.enchant})` : ''}</li>)}</ul>}
          </>}
        </div>
      </div>
    </>}
  </section>;
}
