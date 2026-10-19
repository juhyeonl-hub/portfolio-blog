import {useLocale} from './locale';
import {useEffect, useMemo, useState} from 'react';

import JournalDatabase from './journal-database';
import NpcDatabase from './npc-database';

import {parseClientIndex, type ClientIndex} from '../lib/client-index';

export default function ClientDatabase({active, initialSkillId = ''}: {active: boolean; initialSkillId?: string}) {
 const {t}=useLocale();
  const [data, setData] = useState<ClientIndex | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const [section, setSection] = useState<'items' | 'skills'>(initialSkillId ? 'skills' : 'items');
  const [query, setQuery] = useState(initialSkillId);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(initialSkillId);
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
    return data.skills.map(s => ({id: s.id, name: s.name, category: s.classKey, subtitle: s.classKey}));

  }, [data, section]);
  const categories = useMemo(() => [...new Set(rows.map(r => r.category))].sort(), [rows]);
  const matches = rows.filter(r => (!filter || r.category === filter) && `${r.name} ${r.id}`.toLowerCase().includes(query.trim().toLowerCase()));
  const item = section === 'items' ? items.get(selected) : undefined;
  const skill = section === 'skills' ? data?.skills.find(s => s.id === selected) : undefined;
  return <section className="client-database card" aria-label={t("글로벌 클라이언트 데이터베이스")}>
    <h2>{t("글로벌 클라이언트 데이터베이스")}</h2>
    <p>{t("설치된 Steam 클라이언트에서 읽은 아이템·스킬 정보입니다. 클라이언트에는 현재 서버에서 사용할 수 없는 항목도 포함될 수 있습니다.")}</p>
    <NpcDatabase active={active}/>
    <JournalDatabase active={active}/>
    {loading && <p role="status">{t("클라이언트 데이터를 불러오는 중…")}</p>}
    {error && <div role="alert">{t(error)} <button className="button ghost" onClick={() => setRetry(v => v + 1)}>{t("다시 불러오기")}</button></div>}
    {data && <>
      <p>{t('Steam 빌드 {0} · 공식 클라이언트 원본 · 영문 이름 · 구조 및 참조 검사 통과',[data.source.buildId])}</p>
      <p className="subtle">{t("서버 내 이용 가능 여부와 장비·레벨에 따른 최종 전투 수치를 검증한 것은 아닙니다.")}</p>
      <div className="database-tabs">{(['items', 'skills'] as const).map((kind, i) => <button className="button ghost" key={kind} aria-pressed={section === kind} onClick={() => {setSection(kind); setFilter(''); setPage(0); setSelected(''); setQuery('');}}>{t(['아이템', '플레이어 스킬'][i])} ({data[kind].length})</button>)}</div>
      <div className="database-filters"><label>{t("데이터 검색")}<input type="search" value={query} onChange={e => {setQuery(e.target.value); setPage(0);}} placeholder={t("영문 이름 또는 ID")}/></label>
        <label>{t("분류")}<select value={filter} onChange={e => {setFilter(e.target.value); setPage(0);}}><option value="">{t("전체")}</option>{categories.map(c => <option key={c}>{c}</option>)}</select></label></div>
      <p>{t('검색 결과 {0}개',[matches.length.toLocaleString()])}</p>
      <div className="database-layout"><div><div className="database-list">{matches.slice(page * 30, page * 30 + 30).map(row => <button key={row.id} aria-pressed={selected === row.id} onClick={() => {setSelected(row.id);}}><strong>{row.name}</strong><small>{row.subtitle} · {row.id}</small></button>)}</div>
        {!matches.length && <p role="status">{t("검색 결과가 없습니다.")}</p>}
        <div className="database-pages"><button className="button ghost" disabled={page === 0} onClick={() => setPage(v => v - 1)}>{t("이전")}</button><span>{page + 1} / {Math.max(1, Math.ceil(matches.length / 30))}</span><button className="button ghost" disabled={(page + 1) * 30 >= matches.length} onClick={() => setPage(v => v + 1)}>{t("다음")}</button></div></div>
        <div className="database-detail" aria-label={t("데이터 상세")}>
          {!selected && <p>{t("목록에서 항목을 선택하세요.")}</p>}
          {item && <><h3>{item.name}</h3><p>{t('ID {0} · {1} · {2} · 아이템 레벨 {3}',[item.id,item.kind,item.grade,item.level])}</p><p>{t("현재 서버의 획득 가능 여부는 확인되지 않았습니다.")}</p></>}
          {skill && <><h3>{skill.name}</h3><p>ID {skill.id} · {skill.classKey}</p>
            <div aria-label={t("공식 글로벌 스킬 설명")}><h4>{t("공식 글로벌 스킬 설명")}</h4>
              {skill.description?.valueScope === 'base-client-values' && <p className="subtle">{t("클라이언트 기본값 기준 · 레벨 성장·장비·특화 효과 미적용")}</p>}
              {skill.description ? <p style={{whiteSpace: 'pre-line'}}>{skill.description.text}</p> : <p>{t("이 데이터에는 영문 설명이 없습니다.")}</p>}
              {skill.traits && <p>{skill.traits.text}</p>}
              {!!((skill.description?.unresolvedValues ?? 0) + (skill.traits?.unresolvedValues ?? 0)) && <p className="subtle">{t("[unresolved value]는 아직 계산하지 않은 효과 수치입니다. 장비·레벨·특화에 따른 최종 수치는 반영하지 않습니다.")}</p>}
            </div>
            <h4>{t("레벨별 습득 조건")}</h4><p>{t("포인트는 해당 레벨을 배울 때 드는 비용입니다. 승급 조건은 클라이언트 원본 코드로 표시합니다.")}</p>
            {skill.learning ? <ol className="skill-learning-list">{skill.learning.map(row => <li key={row.level}>
              <strong>{t('스킬 Lv.{0}',[row.level])}</strong><span>{t('캐릭터 Lv.{0} · {1}',[row.requiredCharacterLevel,t(row.autoLearn ? '자동 습득' : '직접 습득')])}</span>
              <span>{t('SP {0} · 스티그마 {1}',[row.skillPoints,row.stigmaPoints])}</span>
              <span>{t('승급 조건: {0}',[row.ascensionRequirement === 'None' ? t('없음') : row.ascensionRequirement])}</span>
            </li>)}</ol> : <p>{t("이 데이터 버전에는 습득 조건이 없습니다.")}</p>}
            <p>{t("플래너의 승급 조건 확인 설정으로 신규 투자와 추천을 제한합니다. 게임에서 조건 충족 여부를 직접 확인하세요.")}</p></>}

        </div>
      </div>
    </>}
  </section>;
}
