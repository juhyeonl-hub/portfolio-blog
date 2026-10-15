import {calculateCraftPlan, type CraftRecipe} from './crafting';

export type CraftingCatalog = {
  schema: 'a2bc-crafting-v1';
  region: 'global';
  version: string;
  items: {id: string; name: string}[];
  recipes: CraftRecipe[];
};
export const MAX_CRAFTING_FILE_BYTES = 2_000_000;

/** User-provided metadata is a label, never proof of official provenance. */
export function parseCraftingCatalog(text: string): CraftingCatalog {
  if (new TextEncoder().encode(text).length > MAX_CRAFTING_FILE_BYTES) throw new Error('레시피 파일은 2 MB 이하여야 합니다.');
  const data = JSON.parse(text);
  const label = (v: unknown, max = 160): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
  if (!data || data.schema !== 'a2bc-crafting-v1' || data.region !== 'global' || !label(data.version)) {
    throw new Error('글로벌용 a2bc 제작 레시피 파일이 아닙니다.');
  }
  if (!Array.isArray(data.items) || !data.items.length || data.items.length > 3000 ||
      !Array.isArray(data.recipes) || !data.recipes.length || data.recipes.length > 500) {
    throw new Error('아이템 1~3000개, 레시피 1~500개가 필요합니다.');
  }
  const itemIds = new Set<string>();
  for (const item of data.items) {
    if (!item || !label(item.id, 80) || !label(item.name) || itemIds.has(item.id)) throw new Error('아이템 이름·ID가 잘못되었거나 중복되었습니다.');
    itemIds.add(item.id);
  }
  for (const recipe of data.recipes) {
    if (!recipe || !label(recipe.id, 80) || !itemIds.has(recipe.itemId) || !Array.isArray(recipe.ingredients) ||
        recipe.ingredients.length > 100 || recipe.ingredients.some((i: {itemId?: string} | null) => !i || !itemIds.has(i.itemId as string))) {
      throw new Error('레시피에서 참조하는 아이템이나 재료 목록이 올바르지 않습니다.');
    }
  }
  // Bound the catalog size above; validate every recipe as a root, including
  // disconnected cycles and overflow, before replacing the current catalog.
  for (const recipe of data.recipes) {
    calculateCraftPlan({itemId: recipe.itemId, quantity: 1, recipes: data.recipes});
  }
  return {
    schema: 'a2bc-crafting-v1', region: 'global', version: data.version,
    items: data.items.map((i: {id: string; name: string}) => ({id: i.id, name: i.name})),
    recipes: data.recipes.map((r: CraftRecipe) => ({id: r.id, itemId: r.itemId,
      outputQuantity: r.outputQuantity, feePerCraft: r.feePerCraft,
      ingredients: r.ingredients.map(i => ({itemId: i.itemId, quantity: i.quantity}))})),
  };
}

export function craftingInputCount(value: string, minimum = 0): number {
  if (!/^\d+$/.test(value)) throw new Error('수량과 단가는 0 이상의 정수로 입력하세요.');
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < minimum) throw new Error('목표 수량은 1 이상이어야 하며, 입력값이 너무 크면 계산할 수 없습니다.');
  return number;
}
