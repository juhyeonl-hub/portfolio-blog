import {useLocale} from './locale';
import {useEffect, useMemo, useState} from 'react';
import {parseClientIndex, type ClientIndex} from '../lib/client-index';
import {calculateAttempts, materialKey} from '../lib/craft-attempts';
import {craftingInputCount} from '../lib/crafting-catalog';
import CraftProbability from './craft-probability';

export default function OfficialCrafting() {
 const {t,locale}=useLocale();
  const [open, setOpen] = useState(false), [retry, setRetry] = useState(0);
  const [data, setData] = useState<ClientIndex | null>(null), [error, setError] = useState('');
  const [loading, setLoading] = useState(false), [query, setQuery] = useState('');
  const [selected, setSelected] = useState(''), [attempts, setAttempts] = useState('1');
  const [stock, setStock] = useState<Record<string, string>>({}), [prices, setPrices] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!open || data) return;
    const controller = new AbortController(); let live = true;
    setLoading(true); setError('');
    fetch('/shadowcraft/data/client-index.json', {signal: controller.signal}).then(async response => {
      if (!response.ok) throw Error();
      const next = parseClientIndex(await response.json());
      if (live) setData(next);
    }).catch(() => {if (live) setError('공식 제작법을 불러오지 못했습니다.');})
      .finally(() => {if (live) setLoading(false);});
    return () => {live = false; controller.abort();};
  }, [open, data, retry]);
  const names = useMemo(() => new Map(data?.items.map(i => [i.id, i.name])), [data]);
  const name = (id: string) => names.get(id) ?? id;
  const recipe = data?.recipes.find(r => r.id === selected);
  const result = useMemo(() => {
    if (!recipe) return {};
    try {
      const keys = [...new Set(recipe.ingredients.map(materialKey))];
      const inventory = Object.fromEntries(keys.map(k => [k, craftingInputCount(stock[k] || '0')]));
      const quotes = Object.fromEntries(keys.filter(k => prices[k] !== undefined && prices[k] !== '')
        .map(k => [k, craftingInputCount(prices[k])]));
      return {plan: calculateAttempts(recipe.ingredients, craftingInputCount(attempts, 1), inventory, quotes)};
    } catch (e) {return {error: e instanceof Error ? e.message : '입력을 확인하세요.'};}
  }, [recipe, attempts, stock, prices]);
  const materials = [...new Map(recipe?.ingredients.map(i => [materialKey(i), i])).values()];
  const matches = data?.recipes.filter(r => `${name(r.itemId)} ${r.itemId} ${r.id}`.toLowerCase().includes(query.trim().toLowerCase())) ?? [];
  const number = (value: number) => value.toLocaleString(locale);
  return <section aria-label={t("공식 제작 시도 계산")} className="card">
    <h3>{t("공식 글로벌 제작 재료 계산")}</h3>
    <p>{t("정한 횟수만큼 제작을 시도할 때 필요한 직접 재료와 기본 예상 성공 확률을 확인합니다. 수수료·연속 제작 결과는 미확인입니다.")}</p>
    {!open && <button className="button ghost" onClick={() => setOpen(true)}>{t("공식 제작법 열기")}</button>}
    {loading && <p role="status">{t("공식 제작법을 불러오는 중…")}</p>}
    {error && <p role="alert">{t(error)} <button className="button ghost" onClick={() => setRetry(v => v + 1)}>{t("공식 제작법 다시 불러오기")}</button></p>}
    {data && <>
      <p>{t('Steam 빌드 {0} · {1}개 제작법 · 영문 이름',[data.source.buildId,data.recipes.length])}</p>
      <p className="subtle">{t("서버 내 이용 가능 여부는 미확인입니다. 입력은 이 화면에서만 유지되며 새로고침·직업 변경 시 초기화됩니다.")}</p>
      <label className="crafting-field">{t("공식 제작법 검색")}<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={t("영문 아이템 이름 또는 ID")}/></label>
      <p>{t('검색 결과 {0}개',[matches.length])}{matches.length > 50 ? ' · '+t('처음 50개 표시, 검색어를 좁혀 주세요.') : ''}</p>
      <div className="crafting-recipes">{matches.slice(0, 50).map(r => <button className="button ghost" key={r.id} aria-pressed={selected === r.id}
        onClick={() => {setSelected(r.id); setAttempts('1'); setStock({}); setPrices({});}}>{t('{0} · {1} · 숙련도 {2} · #{3}',[name(r.itemId),r.race,r.masteryLevel,r.id])}</button>)}</div>
      {recipe && <>
        <h4>{t('{0} · 제작법 #{1}',[name(recipe.itemId),recipe.id])}</h4>
        <CraftProbability key={recipe.id} recipe={recipe} grades={data?.craftMasteryGrades}/>
        {recipe.hasCombo && <p>{t("연속 제작 조건이 있는 제작법입니다. 후속 단계와 추가 결과는 계산에 포함되지 않습니다.")}</p>}
        <label className="crafting-field">{t("제작 시도 횟수")}<input inputMode="numeric" value={attempts} onChange={e => setAttempts(e.target.value)}/></label>
        <p>{t("같은 아이템도 요구 강화 수치별로 보유량·단가를 구분합니다. 강화 수치의 충족 여부는 게임에서 확인하세요.")}</p>
        <div className="crafting-table-scroll"><table className="allocation-table"><thead><tr><th>{t("재료 / 요구 강화")}</th><th>{t("보유량")}</th><th>{t("구매 단가")}</th></tr></thead><tbody>{materials.map(i => {
          const key = materialKey(i), label = `${name(i.itemId)} (+${i.enchant})`;
          return <tr key={key}><th scope="row">{label}</th>
            <td><input aria-label={t('{0} 공식 재료 보유량',[label])} inputMode="numeric" value={stock[key] ?? ''} placeholder="0" onChange={e => setStock(s => ({...s, [key]: e.target.value}))}/></td>
            <td><input aria-label={t('{0} 공식 재료 단가',[label])} inputMode="numeric" value={prices[key] ?? ''} placeholder={t("미확정")} onChange={e => setPrices(s => ({...s, [key]: e.target.value}))}/></td></tr>;
        })}</tbody></table></div>
        {result.error && <p role="alert">{t(result.error)}</p>}
        {result.plan && <div aria-label={t("공식 제작 계산 결과")}>
          <p>{t('구매 재료비: {0} · 확인된 구매비: {1}',[result.plan.materialCost === null ? t('미확정') : number(result.plan.materialCost),number(result.plan.knownPurchaseCost)])}</p>
          <p>{t("수수료 포함 총비용: 미확정 · 성공 결과 수량: 미확정")}</p>
          <ul>{result.plan.rows.map(i => <li key={i.key}>{t('{0} (+{1}) · 필요 {2} · 보유 사용 {3} · 구매 {4} · 비용 {5}',[name(i.itemId),i.enchant,number(i.required),number(i.used),number(i.purchase),i.cost === null ? t('미확정') : number(i.cost)])}</li>)}</ul>
        </div>}
      </>}
    </>}
  </section>;
}
