import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
const {calculateAttempts: calculate} = await import(moduleUrl(readFileSync('lib/craft-attempts.ts', 'utf8')));
const ingredients = [{itemId:'1', enchant:0, quantity:2}, {itemId:'1', enchant:0, quantity:3}, {itemId:'1', enchant:1, quantity:1}];
const before = JSON.stringify(ingredients);
const result = calculate(ingredients, 2, {'1:0':3}, {'1:0':7, '1:1':0});
assert.equal(result.rows[0].required, 10);
assert.equal(result.rows[0].purchase, 7);
assert.equal(result.rows[1].required, 2);
assert.equal(result.materialCost, 49);
assert.equal(result.totalCost, null);
assert.equal(result.expectedOutput, null);
assert.equal(JSON.stringify(ingredients), before);
assert.equal(calculate(ingredients, 2).materialCost, null);
assert.equal(calculate(ingredients, 2, {'1:0':10, '1:1':2}).materialCost, 0);
for (const count of [0,-1,1.5,10001,NaN,Infinity]) assert.throws(() => calculate(ingredients, count));
assert.throws(() => calculate(ingredients, 2, {'1:0':-1}));
assert.throws(() => calculate(ingredients, 2, {}, {'1:0':Number.MAX_SAFE_INTEGER}));
assert.throws(() => calculate([{itemId:'1', enchant:0, quantity:Number.MAX_SAFE_INTEGER}], 2));
assert.throws(() => calculate([{itemId:'1', enchant:-1, quantity:1}], 1));
const index = JSON.parse(readFileSync('../public/shadowcraft/data/client-index.json','utf8'));
for (const recipe of index.recipes) {
  const plan = calculate(recipe.ingredients, 10000);
  assert.equal(plan.totalCost, null);
  assert.equal(plan.expectedOutput, null);
  assert.equal(plan.rows.reduce((n,r)=>n+r.required,0), recipe.ingredients.reduce((n,r)=>n+r.quantity*10000,0));
}
console.log(`Official attempts: quantities, enchant isolation, stock, zero/unknown prices, overflow and ${index.recipes.length} shipped recipes PASS`);
