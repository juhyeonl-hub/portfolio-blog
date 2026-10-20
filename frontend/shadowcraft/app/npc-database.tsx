import {useLocale} from './locale';
import {useEffect, useState} from 'react';
import {parseNpcIndex, type NpcIndex} from '../lib/npc-index';
const kinds: Record<string, string> = {Monster: '몬스터', Citizen: '주민', Summon: '소환체', Bot: 'Bot', Etc: '기타'};
export default function NpcDatabase({active}: {active: boolean}) {
 const {t}=useLocale();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NpcIndex | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState('');
  useEffect(() => {
    if (!active || !open || data) return;
    const controller = new AbortController();
    let live = true;
    setError(false);
    fetch('/shadowcraft/data/npc-index.json', {signal: controller.signal}).then(async response => {
      if (!response.ok) throw Error();
      const next = parseNpcIndex(await response.json());
      if (live) setData(next);
    }).catch(() => {if (live) setError(true);});
    return () => {live = false; controller.abort();};
  }, [active, open, data, retry]);
  const matches = data?.npcs.filter(npc => (!kind || npc.kind === kind) && `${npc.name ?? ''} ${npc.id}`.toLowerCase().includes(query.trim().toLowerCase())) ?? [];
  // Developer/test placeholders in the client data (training dummies, specimen monsters, bots) go last; unnamed NPCs after named ones.
  const testName = (name: string | null) => !name || /punching bag|specimen|\bbot\b|\btest\b|dummy/i.test(name);
  matches.sort((a, b) => Number(testName(a.name)) - Number(testName(b.name)));
  const npc = data?.npcs.find(row => row.id === selected);
  return <section aria-label={t("공식 NPC 목록")}>
    <h3>{t("공식 NPC 목록")}</h3>
    <p>{t("영문 이름과 원본 분류를 조회합니다. 테스트용 항목도 포함되어 있으며 실제 등장 여부·위치·전투 능력치는 확인되지 않았습니다.")}</p>
    <button className="button ghost" aria-expanded={open} onClick={() => setOpen(v => !v)}>{t(open ? 'NPC 목록 닫기' : 'NPC 목록 열기')}</button>
    {open && <>
      {!data && !error && <p role="status">{t("NPC 목록을 불러오는 중…")}</p>}
      {error && <p role="alert">{t("NPC 목록을 불러오지 못했습니다.")} <button className="button ghost" onClick={() => setRetry(v => v + 1)}>{t("NPC 다시 불러오기")}</button></p>}
      {data && <>
        <p>{t('Steam 빌드 {0} · {1}개 · 영문 이름 미확인 {2}개',[data.source.buildId,data.npcs.length.toLocaleString(),data.npcs.filter(row => row.name === null).length.toLocaleString()])}</p>
        <div className="database-filters"><label>{t("NPC 검색")}<input aria-label={t("NPC 검색")} type="search" placeholder={t("영문 이름 또는 ID")} value={query} onChange={e => {setQuery(e.target.value); setPage(0); setSelected('');}}/></label>
          <label>{t("NPC 분류")}<select aria-label={t("NPC 분류")} value={kind} onChange={e => {setKind(e.target.value); setPage(0); setSelected('');}}><option value="">{t("전체")}</option>{Object.entries(kinds).map(([key, label]) => <option key={key} value={key}>{t(label)}</option>)}</select></label></div>
        <p>{t('NPC 검색 결과 {0}개',[matches.length.toLocaleString()])}</p>
        <div className="database-layout"><div><div className="database-list">{matches.slice(page * 30, page * 30 + 30).map(row => <button key={row.id} aria-pressed={selected === row.id} onClick={() => setSelected(row.id)}><strong>{row.name ?? t('이름 미확인')}</strong><small>{t(kinds[row.kind])} · {row.id}</small></button>)}</div>
          {!matches.length && <p role="status">{t("NPC 검색 결과가 없습니다.")}</p>}
          <div className="database-pages"><button className="button ghost" disabled={page === 0} onClick={() => setPage(v => v - 1)}>{t("NPC 이전")}</button><span>{page + 1} / {Math.max(1, Math.ceil(matches.length / 30))}</span><button className="button ghost" disabled={(page + 1) * 30 >= matches.length} onClick={() => setPage(v => v + 1)}>{t("NPC 다음")}</button></div></div>
          <div className="database-detail" aria-label={t("NPC 상세")}>{npc ? <><h4>{npc.name ?? t('이름 미확인')}</h4><p>ID {npc.id} · {t(kinds[npc.kind])} ({npc.kind})</p><p>{t("공식 글로벌 클라이언트에 포함된 항목입니다. 서버의 실제 등장 목록과 다를 수 있습니다.")}</p></> : <p>{t("NPC를 선택하세요.")}</p>}</div>
        </div>
      </>}
    </>}
  </section>;
}
