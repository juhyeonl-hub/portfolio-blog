import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
const {calculateCraftPlan: calculate} = await import(moduleUrl(readFileSync('lib/crafting.ts', 'utf8')));

// Synthetic recipes, not AION2 game data.
const recipe = (itemId, outputQuantity, ingredients, feePerCraft = 0) => ({
  id: `recipe-${itemId}`, itemId, outputQuantity, feePerCraft,
  ingredients: Object.entries(ingredients).map(([itemId, quantity]) => ({itemId, quantity})),
});
const recipes = [recipe('tool', 1, {left: 1, right: 1}, 5),
  recipe('left', 1, {bar: 1}), recipe('right', 1, {bar: 1}), recipe('bar', 3, {ore: 2}, 2)];
const request = {itemId: 'tool', quantity: 2, recipes, inventory: {bar: 1, ore: 1}, prices: {ore: 7}};
const before = JSON.stringify(request);
const plan = calculate(request);
assert.deepEqual(plan.purchases, [{itemId: 'ore', quantity: 1, unitPrice: 7, cost: 7}]);
assert.deepEqual(plan.inventoryUsed, [{itemId: 'bar', quantity: 1}, {itemId: 'ore', quantity: 1}]);
assert.equal(plan.crafts.find(x => x.itemId === 'bar').batches, 1);
assert.equal(plan.crafts.find(x => x.itemId === 'bar').surplus, 0);
assert.equal(plan.craftFees, 12);
assert.equal(plan.totalCost, 19);
assert.equal(JSON.stringify(request), before, 'input inventory/recipes must not be mutated');

// Both consumers together require 2 bars: one 3-bar batch, not two batches.
const shared = calculate({itemId: 'tool', quantity: 1, recipes, prices: {ore: 7}});
assert.equal(shared.crafts.find(x => x.itemId === 'bar').batches, 1);
assert.equal(shared.crafts.find(x => x.itemId === 'bar').surplus, 1);
assert.equal(shared.purchases[0].quantity, 2);
const positions = new Map(shared.crafts.map((x, i) => [x.itemId, i]));
assert.ok(positions.get('bar') < positions.get('left'));
assert.ok(positions.get('bar') < positions.get('right'));
assert.ok(positions.get('left') < positions.get('tool'));

const stocked = calculate({...request, inventory: {tool: 2}});
assert.deepEqual(stocked.crafts, []);
assert.deepEqual(stocked.purchases, []);
assert.equal(stocked.totalCost, 0);

const unknown = calculate({...request, prices: {}});
assert.equal(unknown.totalCost, null);
assert.equal(unknown.purchases[0].cost, null);
assert.deepEqual(unknown.unpricedItems, ['ore']);
assert.equal(unknown.craftFees, 12);
assert.equal(calculate({...request, prices: {ore: 0}}).totalCost, 12);
assert.equal(calculate({itemId: '__proto__', quantity: 3, recipes: [],
  prices: JSON.parse('{"__proto__":2}')}).totalCost, 6);

assert.throws(() => calculate({itemId: 'a', quantity: 1,
  recipes: [recipe('a', 1, {b: 1}), recipe('b', 1, {a: 1})]}), /cycle/);
assert.throws(() => calculate({itemId: 'a', quantity: 1,
  recipes: [recipe('a', 1, {a: 1})], inventory: {a: 1}}), /cycle/);
assert.throws(() => calculate({...request, recipes: [recipes[0], {...recipes[0], id: 'alternative'}]}), /unique recipe/);
assert.throws(() => calculate({...request, recipes: [recipes[0], {...recipes[1], id: recipes[0].id}]}), /unique recipe/);
assert.throws(() => calculate({...request, recipes: [{...recipes[0],
  ingredients: [{itemId: 'ore', quantity: 1}, {itemId: 'ore', quantity: 2}]}]}), /Duplicate ingredient/);
for (const quantity of [0, -1, 1.5, NaN, Infinity, '2', true, Number.MAX_SAFE_INTEGER + 1]) {
  assert.throws(() => calculate({...request, quantity}), /safe integers/);
}
for (const invalid of [{prices: {ore: -1}}, {prices: {ore: NaN}}, {inventory: {ore: 0.5}},
  {inventory: null}, {recipes: null}, {itemId: ' '},
  {recipes: [{...recipes[0], outputQuantity: 0}]},
  {recipes: [{...recipes[0], feePerCraft: undefined}]}]) {
  assert.throws(() => calculate({...request, ...invalid}));
}
assert.throws(() => calculate({itemId: 'ore', quantity: 2, recipes: [],
  prices: {ore: Number.MAX_SAFE_INTEGER}}), /safe integers/);
assert.throws(() => calculate({itemId: 'a', quantity: Number.MAX_SAFE_INTEGER,
  recipes: [recipe('a', 1, {ore: 2})]}), /safe integers/);

// Execute a range of plans against a stock ledger: every intermediate must be
// available when its craft executes, final stock must cover the requested amount.
for (let quantity = 1; quantity <= 20; quantity++) {
  for (let stock = 0; stock <= 5; stock++) {
    const result = calculate({...request, quantity, inventory: {bar: stock}});
    const ledger = new Map([['bar', stock]]);
    for (const purchase of result.purchases) ledger.set(purchase.itemId, (ledger.get(purchase.itemId) ?? 0) + purchase.quantity);
    for (const craft of result.crafts) {
      const selected = recipes.find(x => x.id === craft.recipeId);
      for (const ingredient of selected.ingredients) {
        const remaining = (ledger.get(ingredient.itemId) ?? 0) - craft.batches * ingredient.quantity;
        assert.ok(remaining >= 0, `insufficient ${ingredient.itemId}`);
        ledger.set(ingredient.itemId, remaining);
      }
      ledger.set(craft.itemId, (ledger.get(craft.itemId) ?? 0) + craft.produced);
    }
    assert.ok(ledger.get('tool') >= quantity);
  }
}
console.log('Crafting: shared dependencies, batches, inventory, costs, unknown prices, cycles, invalid inputs, overflow and 120 execution ledgers PASS');
