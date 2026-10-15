/** Pure calculation over caller-selected, deterministic recipes.
 * Quantities are item counts; prices and fees use integer smallest currency units.
 * Random outcomes, byproducts and automatic recipe selection are not modeled.
 */
export type CraftIngredient = { itemId: string; quantity: number };
export type CraftRecipe = {
  id: string;
  itemId: string;
  outputQuantity: number;
  ingredients: CraftIngredient[];
  feePerCraft: number;
};
export type CraftRequest = {
  itemId: string;
  quantity: number;
  recipes: CraftRecipe[];
  inventory?: Record<string, number>;
  prices?: Record<string, number>;
};
export type CraftPlan = {
  crafts: { recipeId: string; itemId: string; batches: number; produced: number; surplus: number }[];
  purchases: { itemId: string; quantity: number; unitPrice: number | null; cost: number | null }[];
  inventoryUsed: CraftIngredient[];
  knownPurchaseCost: number;
  craftFees: number;
  unpricedItems: string[];
  totalCost: number | null;
};

function id(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Item and recipe IDs must be nonempty strings');
}

function count(value: unknown, minimum = 0): asserts value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum) {
    throw new Error('Counts and currency must be safe integers within range');
  }
}

function checked(value: number): number {
  count(value);
  return value;
}

function amounts(values: Record<string, number> | undefined): Map<string, number> {
  if (values === undefined) return new Map();
  if (!values || typeof values !== 'object' || Array.isArray(values)) throw new Error('Expected item amount object');
  return new Map(Object.entries(values).map(([key, value]) => {
    id(key);
    count(value);
    return [key, value];
  }));
}

export function calculateCraftPlan(request: CraftRequest): CraftPlan {
  if (!request || typeof request !== 'object') throw new Error('Expected crafting request');
  id(request.itemId);
  count(request.quantity, 1);
  if (!Array.isArray(request.recipes)) throw new Error('Expected selected recipes');
  const inventory = amounts(request.inventory);
  const prices = amounts(request.prices);
  const recipes = new Map<string, CraftRecipe>();
  const recipeIds = new Set<string>();
  for (const recipe of request.recipes) {
    if (!recipe || typeof recipe !== 'object') throw new Error('Invalid recipe');
    id(recipe.id);
    id(recipe.itemId);
    count(recipe.outputQuantity, 1);
    count(recipe.feePerCraft);
    if (recipes.has(recipe.itemId) || recipeIds.has(recipe.id)) throw new Error('Select one unique recipe per output item');
    if (!Array.isArray(recipe.ingredients)) throw new Error('Expected ingredient list');
    const ingredients = new Set<string>();
    for (const ingredient of recipe.ingredients) {
      if (!ingredient || typeof ingredient !== 'object') throw new Error('Invalid ingredient');
      id(ingredient.itemId);
      count(ingredient.quantity, 1);
      if (ingredients.has(ingredient.itemId)) throw new Error('Duplicate ingredient');
      ingredients.add(ingredient.itemId);
    }
    recipeIds.add(recipe.id);
    recipes.set(recipe.itemId, recipe);
  }

  // Reverse postorder processes every consumer before a shared ingredient, so
  // its total demand is known before inventory subtraction and batch rounding.
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const order: string[] = [];
  function visit(itemId: string) {
    if (visiting.has(itemId)) throw new Error(`Recipe cycle at ${itemId}`);
    if (visited.has(itemId)) return;
    if (visiting.size >= 256) throw new Error('Recipe dependency depth exceeds 256');
    visiting.add(itemId);
    for (const ingredient of recipes.get(itemId)?.ingredients ?? []) visit(ingredient.itemId);
    visiting.delete(itemId);
    visited.add(itemId);
    order.push(itemId);
  }
  visit(request.itemId);
  const needed = new Map([[request.itemId, request.quantity]]);
  const result: CraftPlan = {
    crafts: [], purchases: [], inventoryUsed: [], knownPurchaseCost: 0,
    craftFees: 0, unpricedItems: [], totalCost: null,
  };
  for (const itemId of order.reverse()) {
    const demand = needed.get(itemId) ?? 0;
    const used = Math.min(demand, inventory.get(itemId) ?? 0);
    if (used) result.inventoryUsed.push({ itemId, quantity: used });
    const remaining = demand - used;
    if (!remaining) continue;
    const recipe = recipes.get(itemId);
    if (!recipe) {
      const unitPrice = prices.get(itemId) ?? null;
      const cost = unitPrice === null ? null : checked(remaining * unitPrice);
      result.purchases.push({ itemId, quantity: remaining, unitPrice, cost });
      if (cost === null) result.unpricedItems.push(itemId);
      else result.knownPurchaseCost = checked(result.knownPurchaseCost + cost);
      continue;
    }
    const batches = Math.ceil(remaining / recipe.outputQuantity);
    const produced = checked(batches * recipe.outputQuantity);
    result.crafts.push({ recipeId: recipe.id, itemId, batches, produced, surplus: produced - remaining });
    result.craftFees = checked(result.craftFees + checked(batches * recipe.feePerCraft));
    for (const ingredient of recipe.ingredients) {
      needed.set(ingredient.itemId, checked((needed.get(ingredient.itemId) ?? 0) + checked(batches * ingredient.quantity)));
    }
  }
  // Return crafts in executable order: intermediates before their consumers.
  result.crafts.reverse();
  const byId = (a: { itemId: string }, b: { itemId: string }) => a.itemId < b.itemId ? -1 : a.itemId > b.itemId ? 1 : 0;
  result.purchases.sort(byId);
  result.inventoryUsed.sort(byId);
  result.unpricedItems.sort();
  const knownCost = checked(result.knownPurchaseCost + result.craftFees);
  result.totalCost = result.unpricedItems.length ? null : knownCost;
  return result;
}
