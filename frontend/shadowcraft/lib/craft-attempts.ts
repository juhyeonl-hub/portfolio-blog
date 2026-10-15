type Ingredient = {itemId: string; enchant: number; quantity: number};
export const materialKey = (item: Pick<Ingredient, 'itemId' | 'enchant'>) => `${item.itemId}:${item.enchant}`;

/** Direct materials for a chosen number of attempts; no success/yield assumptions. */
export function calculateAttempts(ingredients: Ingredient[], attempts: number,
  inventory: Record<string, number> = {}, prices: Record<string, number> = {}) {
  const integer = (value: number, minimum = 0) => {
    if (!Number.isSafeInteger(value) || value < minimum) throw new Error('수량·단가가 잘못되었거나 계산 범위를 넘었습니다.');
    return value;
  };
  integer(attempts, 1);
  if (attempts > 10000) throw new Error('제작 시도 횟수는 1~10,000회로 입력하세요.');
  const materials = new Map<string, Ingredient>();
  for (const item of ingredients) {
    if (!/^[1-9][0-9]*$/.test(item.itemId)) throw new Error('잘못된 재료 ID입니다.');
    integer(item.enchant); integer(item.quantity, 1);
    const key = materialKey(item), previous = materials.get(key);
    materials.set(key, {...item, quantity: integer((previous?.quantity ?? 0) + item.quantity, 1)});
  }
  let knownPurchaseCost = 0;
  const rows = [...materials].map(([key, item]) => {
    const required = integer(item.quantity * attempts);
    const stock = integer(Object.hasOwn(inventory, key) ? inventory[key] : 0);
    const used = Math.min(stock, required), purchase = required - used;
    const unitPrice = Object.hasOwn(prices, key) ? integer(prices[key]) : null;
    const cost = purchase === 0 ? 0 : unitPrice === null ? null : integer(purchase * unitPrice);
    knownPurchaseCost = integer(knownPurchaseCost + (cost ?? 0));
    return {...item, key, required, used, purchase, unitPrice, cost};
  });
  return {rows, knownPurchaseCost, materialCost: rows.some(r => r.cost === null) ? null : knownPurchaseCost,
    totalCost: null, expectedOutput: null};
}
