import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
const engine = moduleUrl(readFileSync('lib/crafting.ts', 'utf8'));
const {parseCraftingCatalog: parse, craftingInputCount: count} = await import(moduleUrl(
  readFileSync('lib/crafting-catalog.ts', 'utf8').replace("'./crafting'", JSON.stringify(engine))));
const fixture = {
  schema: 'a2bc-crafting-v1', region: 'global', version: 'Synthetic test',
  items: [{id: 'tool', name: 'Test tool'}, {id: 'ore', name: 'Test ore'}],
  recipes: [{id: 'tool-recipe', itemId: 'tool', outputQuantity: 1,
    ingredients: [{itemId: 'ore', quantity: 2}], feePerCraft: 3}],
};
assert.deepEqual(parse(JSON.stringify(fixture)), fixture);
assert.equal(parse(JSON.stringify({...fixture, official: true})).official, undefined);
for (const patch of [{region: 'kr'}, {schema: 'other'}, {version: ''}, {items: []}, {recipes: []},
  {items: [...fixture.items, fixture.items[0]]},
  {recipes: [{...fixture.recipes[0], ingredients: [{itemId: 'missing', quantity: 2}]}]},
  {recipes: [{...fixture.recipes[0], outputQuantity: -1}]},
  {recipes: [{...fixture.recipes[0], ingredients: [{itemId: 'tool', quantity: 1}]}]},
  {recipes: [...fixture.recipes, {...fixture.recipes[0], id: 'other'}]},
  {recipes: [{...fixture.recipes[0], feePerCraft: null}]}]) {
  assert.throws(() => parse(JSON.stringify({...fixture, ...patch})));
}
assert.throws(() => parse('{invalid'));
assert.throws(() => parse(' '.repeat(2_000_001)), /2 MB/);
assert.throws(() => parse(JSON.stringify({...fixture, recipes: Array(501).fill(fixture.recipes[0])})), /500/);
for (const value of ['', '-1', '1.5', '1e3', 'NaN', 'Infinity', ' ', '9007199254740992']) assert.throws(() => count(value));
assert.equal(count('0'), 0);
assert.equal(count('012'), 12);
assert.throws(() => count('0', 1));
console.log('Crafting catalog: global scope, references, schema, cycles, duplicates, limits, untrusted provenance and numeric inputs PASS');
