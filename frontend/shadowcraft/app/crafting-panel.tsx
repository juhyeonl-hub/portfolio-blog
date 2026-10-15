import {useMemo, useRef, useState} from 'react';
import {calculateCraftPlan, type CraftPlan} from '../lib/crafting';
import {craftingInputCount, MAX_CRAFTING_FILE_BYTES, parseCraftingCatalog, type CraftingCatalog} from '../lib/crafting-catalog';
import OfficialCrafting from './official-crafting';

const inputValue = (values: Record<string, string>, id: string) => Object.hasOwn(values, id) ? values[id] : '';

export default function CraftingPanel() {
  const [catalog, setCatalog] = useState<CraftingCatalog | null>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [intermediates, setIntermediates] = useState(true);
  const [inventory, setInventory] = useState<Record<string, string>>({});
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState('');
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);
  const names = useMemo(() => new Map(catalog?.items.map(i => [i.id, i.name])), [catalog]);
  const name = (id: string) => names.get(id) ?? id;
  const root = catalog?.recipes.find(r => r.id === selected);
  const recipes = useMemo(() => root ? (intermediates ? catalog!.recipes : [root]) : [], [root, catalog, intermediates]);
  const relevant = useMemo(() => {
    if (!root) return [];
    const ids = new Set<string>();
    const byItem = new Map(recipes.map(r => [r.itemId, r]));
    function visit(id: string) {
      if (ids.has(id)) return;
      ids.add(id);
      byItem.get(id)?.ingredients.forEach(i => visit(i.itemId));
    }
    visit(root.itemId);
    return [...ids];
  }, [root, recipes]);
  const calculation = useMemo<{plan?: CraftPlan; error?: string}>(() => {
    if (!root) return {};
    try {
      const stock = Object.fromEntries(relevant.map(id => [id, craftingInputCount(inputValue(inventory, id) || '0')]));
      const costs = Object.fromEntries(relevant.filter(id => inputValue(prices, id) !== '')
        .map(id => [id, craftingInputCount(inputValue(prices, id))]));
      return {plan: calculateCraftPlan({itemId: root.itemId, quantity: craftingInputCount(quantity, 1), recipes, inventory: stock, prices: costs})};
    } catch (error) {
      return {error: error instanceof Error && /[가-힣]/.test(error.message) ? error.message : '수량이 너무 크거나 레시피를 계산할 수 없습니다. 입력을 확인하세요.'};
    }
  }, [root, relevant, recipes, inventory, prices, quantity]);
  async function importFile(file?: File) {
    if (!file) return;
    const token = ++requestId.current;
    setLoading(true);
    setFileError('');
    try {
      if (file.size > MAX_CRAFTING_FILE_BYTES) throw new Error('레시피 파일은 2 MB 이하여야 합니다.');
      const next = parseCraftingCatalog(await file.text());
      if (token !== requestId.current) return;
      setCatalog(next); setSelected(''); setQuery(''); setQuantity('1'); setInventory({}); setPrices({});
    } catch (error) {
      if (token === requestId.current) setFileError(error instanceof Error && /[가-힣]/.test(error.message) ? error.message : '파일을 읽을 수 없거나 레시피 값이 잘못되었습니다. 기존 입력을 유지합니다.');
    } finally { if (token === requestId.current) setLoading(false); }
  }
  const matches = catalog?.recipes.filter(r => `${name(r.itemId)} ${r.itemId}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())) ?? [];
  const plan = calculation.plan;
  const number = (n: number) => n.toLocaleString('ko-KR');
  return <section className="crafting-panel card" aria-label="제작 계산기">
    <h2>제작 재료 & 비용</h2>
    <p>필요한 재료를 합산하고 보유량을 뺀 구매 수량을 확인하세요. 공식 제작법은 시도 횟수 기준으로, 사용자 레시피는 확정 수량 기준으로 계산합니다.</p>
    <OfficialCrafting/>
    <h3>사용자 레시피로 확정 수량 계산</h3>
    <p>가져온 파일은 공식 데이터로 검증되지 않습니다.</p>
    <label className="crafting-upload">레시피 파일 가져오기
      <input type="file" accept=".json,application/json" aria-label="레시피 파일 가져오기" onChange={e => {void importFile(e.target.files?.[0]); e.target.value = '';}}/>
    </label>
    <p className="subtle">가져온 파일과 계산 입력은 서버로 전송되지 않습니다. 새로고침·직업 변경 시 초기화됩니다.</p>
    {loading && <p role="status">레시피 파일을 확인하는 중…</p>}
    {fileError && <p role="alert">{fileError}</p>}
    {!catalog ? <div className="gear-empty"><h3>계산할 제작법이 없습니다</h3><p>글로벌용 a2bc 레시피 파일을 가져오면 검색과 계산을 시작할 수 있습니다.</p></div> : <>
      <p>사용자 파일 · 공식 검증 안 됨 · {catalog.version} · {catalog.recipes.length}개 제작법</p>
      <label className="crafting-field">레시피 검색<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="아이템 이름 또는 ID"/></label>
      <div className="crafting-recipes" aria-label="레시피 검색 결과">{matches.slice(0, 50).map(r => <button type="button" className="button ghost" key={r.id} aria-pressed={selected === r.id} onClick={() => setSelected(r.id)}>{name(r.itemId)} · 1회 {r.outputQuantity}개</button>)}</div>
      {!matches.length && <p role="status">검색 결과가 없습니다.</p>}
      {matches.length > 50 && <p>검색 결과 {matches.length}개 중 50개 표시 · 검색어를 좁혀 주세요.</p>}
      {root && <>
        <h3>{name(root.itemId)} 제작 계획</h3>
        <div className="crafting-controls"><label className="crafting-field">목표 수량<input inputMode="numeric" value={quantity} onChange={e => setQuantity(e.target.value)}/></label>
          <label><input type="checkbox" checked={intermediates} onChange={e => setIntermediates(e.target.checked)}/> 중간 재료도 직접 제작</label></div>
        <p>단가를 비워 두면 가격 미확정으로 계산합니다. 단가와 수수료는 같은 통화의 정수 단위를 사용하세요.</p>
        <div className="crafting-table-scroll"><table className="allocation-table"><thead><tr><th>아이템</th><th>보유 수량</th><th>구매 단가</th></tr></thead><tbody>{relevant.map(id => <tr key={id}><th scope="row">{name(id)}</th>
          <td><input aria-label={`${name(id)} 보유 수량`} inputMode="numeric" value={inputValue(inventory, id)} placeholder="0" onChange={e => setInventory(v => ({...v, [id]: e.target.value}))}/></td>
          <td><input aria-label={`${name(id)} 구매 단가`} inputMode="numeric" value={inputValue(prices, id)} placeholder="미확정" onChange={e => setPrices(v => ({...v, [id]: e.target.value}))}/></td></tr>)}</tbody></table></div>
        {calculation.error && <p role="alert">{calculation.error}</p>}
        {plan && <div className="crafting-result" aria-label="제작 계산 결과">
          <p className="crafting-total">총비용: <strong>{plan.totalCost === null ? '미확정' : number(plan.totalCost)}</strong></p>
          <p>확인된 구매비 {number(plan.knownPurchaseCost)} + 제작 수수료 {number(plan.craftFees)}</p>
          {!!plan.unpricedItems.length && <p>단가 필요: {plan.unpricedItems.map(name).join(', ')}</p>}
          <h3>구매할 재료</h3>{plan.purchases.length ? <ul>{plan.purchases.map(p => <li key={p.itemId}>{name(p.itemId)} × {number(p.quantity)} · {p.cost === null ? '가격 미확정' : number(p.cost)}</li>)}</ul> : <p>추가 구매가 필요하지 않습니다.</p>}
          <h3>제작 순서</h3>{plan.crafts.length ? <ol>{plan.crafts.map(c => <li key={c.recipeId}>{name(c.itemId)} · {number(c.batches)}회 → {number(c.produced)}개 · 잉여 {number(c.surplus)}개</li>)}</ol> : <p>보유량으로 목표 수량을 충족합니다.</p>}
          {!!plan.inventoryUsed.length && <><h3>사용할 보유 재료</h3><ul>{plan.inventoryUsed.map(i => <li key={i.itemId}>{name(i.itemId)} × {number(i.quantity)}</li>)}</ul></>}
        </div>}
      </>}
    </>}
  </section>;
}
