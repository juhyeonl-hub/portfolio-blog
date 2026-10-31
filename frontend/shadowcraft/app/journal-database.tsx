import {ClientItemName} from './client-names';
import {useLocale} from './locale';
import {useEffect, useState} from 'react';
import {parseJournalIndex, type JournalIndex, type QuestRewards, type RewardContent} from '../lib/journal-index';
const races: Record<string, string> = {All: '공통', Light: '천족', Dark: '마족'};
function Rewards({rewards}: {rewards: QuestRewards | null | undefined}) {
 const {t}=useLocale();
  if (rewards === undefined) return <p>{t("이 데이터 버전에는 퀘스트 보상 정보가 없습니다.")}</p>;
  if (rewards === null) return <p>{t("이 퀘스트의 보상 정보를 찾지 못했습니다. 보상이 없다는 뜻은 아닙니다.")}</p>;
  return <section aria-label={t("퀘스트 보상")}><h4>{t("클라이언트에 등록된 보상")}</h4>
    <p>{t('경험치 {0}',[rewards.experience.toLocaleString()])}</p>
    <RewardLists rewards={rewards}/>
    {!!rewards.classRewards?.length && <div aria-label={t("직업별 퀘스트 보상")}><h5>{t("직업별 보상 · 해당 직업만")}</h5>{rewards.classRewards.map(entry => <details key={entry.classKey}><summary>{t(classNames[entry.classKey])}</summary><RewardLists rewards={entry}/></details>)}</div>}
  </section>;
}
const classNames: Record<string, string> = {gladiator: '검성', templar: '수호성', assassin: '살성', ranger: '궁성', sorcerer: '마도성', elementalist: '정령성', cleric: '치유성', chanter: '호법성'};
function RewardLists({rewards}: {rewards: RewardContent}) {
 const {t}=useLocale();
  return <>
    {([{label: '기본 보상', items: rewards.items}, {label: '일반 아이템 보상', items: rewards.normalItems}, {label: '선택 보상 후보', items: rewards.selectionItems}]).map(group => <div key={group.label}><h5>{t(group.label)}</h5>{group.items.length ? <ul>{group.items.map((item, index) => <li key={`${item.id}:${index}`}><ClientItemName id={item.id} name={item.name ?? t('아이템 {0}',[item.id])}/> × {item.count.toLocaleString()}{item.enchantLevel > 0 ? ' · '+t('강화 +{0}',[item.enchantLevel]) : ''}</li>)}</ul> : <p>{t("등록된 항목 없음")}</p>}</div>)}
    {!!rewards.selectionItems.length && <p>{t("선택 후보 목록이며 모든 아이템을 함께 받는다는 뜻은 아닙니다.")}</p>}
    {rewards.randomGroup && <p>{t("무작위 보상 그룹이 추가로 연결돼 있습니다. 구성과 확률은 아직 확인되지 않았습니다.")}</p>}
  </>;
}
export default function JournalDatabase({active}: {active: boolean}) {
 const {t}=useLocale();
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
  return <section aria-label={t("공식 퀘스트·던전·펫 목록")}>
    <h3>{t("공식 퀘스트·던전·펫 목록")}</h3>
    <p>{t("글로벌 클라이언트의 영문 이름·설명과 등록된 퀘스트 보상입니다. 테스트용·비활성 항목이 포함될 수 있으며 실제 서버의 지급 여부와 추가 조건은 확인되지 않았습니다.")}</p>
    <button className="button ghost" aria-expanded={open} onClick={() => setOpen(v => !v)}>{t(open ? '퀘스트·던전·펫 닫기' : '퀘스트·던전·펫 열기')}</button>
    {open && <>
      {!data && !error && <p role="status">{t("퀘스트·던전·펫을 불러오는 중…")}</p>}
      {error && <p role="alert">{t("퀘스트·던전·펫을 불러오지 못했습니다.")} <button className="button ghost" onClick={() => setRetry(v => v + 1)}>{t("퀘스트·던전·펫 다시 불러오기")}</button></p>}
      {data && <>
        <p>{t('Steam 빌드 {0} · 퀘스트 {1}개 · 던전 {2}개 · 펫 {3}개',[data.source.buildId,data.quests.length.toLocaleString(),data.dungeons.length.toLocaleString(),data.pets.length.toLocaleString()])}</p>
        <div className="database-tabs">{(['quests', 'dungeons', 'pets'] as const).map(key => <button className="button ghost" key={key} aria-pressed={section === key} onClick={() => {setSection(key); setQuery(''); setKind(''); setPage(0); setSelected('');}}>{t(key === 'quests' ? '퀘스트' : key === 'dungeons' ? '던전' : '펫')}</button>)}</div>
        <div className="database-filters"><label>{t("퀘스트·던전·펫 검색")}<input aria-label={t("퀘스트·던전·펫 검색")} type="search" placeholder={t("영문 이름 또는 ID")} value={query} onChange={e => {setQuery(e.target.value); setPage(0); setSelected('');}}/></label><label>{t("원본 분류")}<select aria-label={t("퀘스트·던전·펫 분류")} value={kind} onChange={e => {setKind(e.target.value); setPage(0); setSelected('');}}><option value="">{t("전체")}</option>{[...new Set(rows.map(r => r.kind))].sort().map(k => <option key={k}>{k}</option>)}</select></label></div>
        <p>{t('퀘스트·던전·펫 검색 결과 {0}개',[matches.length.toLocaleString()])}</p>
        <div className="database-layout"><div><div className="database-list">{matches.slice(page * 30, page * 30 + 30).map(row => <button key={row.id} aria-pressed={selected === row.id} onClick={() => setSelected(row.id)}><strong>{row.name ?? t('이름 미확인')}</strong><small>{row.kind} · {row.id}</small></button>)}</div>
          {!matches.length && <p role="status">{t("퀘스트·던전·펫 검색 결과가 없습니다.")}</p>}
          <div className="database-pages"><button className="button ghost" disabled={page === 0} onClick={() => setPage(v => v - 1)}>{t("목록 이전")}</button><span>{page + 1} / {Math.max(1, Math.ceil(matches.length / 30))}</span><button className="button ghost" disabled={(page + 1) * 30 >= matches.length} onClick={() => setPage(v => v + 1)}>{t("목록 다음")}</button></div></div>
          <div className="database-detail" aria-label={t("퀘스트·던전·펫 상세")}>
            {!selected && <p>{t("목록에서 항목을 선택하세요.")}</p>}
            {quest && <><h4>{quest.name ?? t('이름 미확인')}</h4><p>ID {quest.id} · {quest.kind} · {t(races[quest.race])}</p><p>{quest.summary ?? t('설명 미확인')}</p><p>{t('원본에 등록된 퀘스트 단계 {0}개',[quest.stepCount])}</p>{quest.acquireNpc && <p>{t('시작 NPC: {0} · {1}',[quest.acquireNpc.name ?? t('이름 미확인'),quest.acquireNpc.id])}</p>}{quest.completeNpc && <p>{t('완료 NPC: {0} · {1}',[quest.completeNpc.name ?? t('이름 미확인'),quest.completeNpc.id])}</p>}{next ? <button className="button ghost" onClick={() => {setQuery(next.id); setKind(''); setPage(0); setSelected(next.id);}}>{t('다음 퀘스트: {0}',[next.name ?? next.id])}</button> : <p>{t("등록된 다음 퀘스트 없음")}</p>}</>}
            {quest?.levels && <div aria-label={t("퀘스트 레벨 조건")}><p>{t('시작 레벨 {0} · 권장 레벨 {1}',[quest.levels.unlock || t('미지정'),quest.levels.recommended || t('미지정')])}</p>{quest.levels.additionalConditions > 0 && <p>{t('추가 시작 조건 {0}개가 있습니다. 레벨만으로 시작 가능 여부를 판단할 수 없습니다.',[quest.levels.additionalConditions])}</p>}</div>}
            {quest && <Rewards rewards={quest.rewards}/>}
            {pet && <><h4>{pet.name ?? t('이름 미확인')}</h4><p>ID {pet.id} · {pet.kind}</p><p>{t("공식 펫 목록의 원본 분류입니다. 획득 경로·능력치·성장 확률은 검증되지 않았습니다.")}</p></>}
            {dungeon?.recommendation && <div aria-label={t("던전 권장 정보")}><p>{t('권장 레벨 {0} · 난이도 {1}',[dungeon.recommendation.level || t('미지정'),dungeon.recommendation.difficulty === 'None' ? t('미지정') : dungeon.recommendation.difficulty])}</p><p>{dungeon.recommendation.maxMembers > 0 ? t('권장 인원 {0}–{1}명',[dungeon.recommendation.minMembers,dungeon.recommendation.maxMembers]) : t('권장 인원 미지정')}</p><p>{t("권장 정보이며 입장 가능 여부나 입장 제한을 뜻하지 않습니다.")}</p></div>}
            {dungeon && <><h4>{dungeon.name ?? t('이름 미확인')}</h4><p>ID {dungeon.id} · {dungeon.kind}</p><p>{t('연결 맵: {0} · {1}',[dungeon.mapName ?? t('이름 미확인'),dungeon.mapId])}</p></>}
          </div></div>
      </>}
    </>}
  </section>;
}
