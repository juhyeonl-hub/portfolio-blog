import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
const {validItemIndex, loadItemIndex, resetItemIndex, itemSummary, itemIconUrl, ITEM_INDEX_URL, ITEM_ICON_BASE} = await import(moduleUrl(readFileSync('lib/item-index.ts', 'utf8')));

// The committed export must validate, cover every ranker snapshot item and only name icons that exist.
const index = JSON.parse(readFileSync('../public/shadowcraft/data/item-index.json', 'utf8'));
assert.ok(validItemIndex(index), 'committed item index must validate');
assert.equal(index.steamBuild, '25926599');
assert.ok(Object.keys(index.items).length > 3000 && index.pools.length > 100);
const rankers = JSON.parse(readFileSync('lib/data/rankers.json', 'utf8'));
const ids = new Set();
const walk = value => {
  if (Array.isArray(value)) value.forEach(walk);
  else if (value && typeof value === 'object') {
    if ('exceedLevel' in value) ids.add(value.id);
    Object.values(value).forEach(walk);
  }
};
walk(rankers);
assert.ok(ids.size >= 100);
for (const id of ids) assert.ok(index.items[String(id)], 'ranker item missing from index: ' + id);
let icons = 0;
for (const item of Object.values(index.items)) {
  if (!item.i) continue;
  icons++;
  assert.ok(existsSync('../public/shadowcraft/icons/items/' + item.i + '.webp'), 'icon file missing: ' + item.i);
}
assert.ok(icons > 2000, 'most equipment should have an icon, got ' + icons);
const messages = JSON.parse(readFileSync('lib/data/ui-translations.json', 'utf8'));
for (const [key, names] of Object.entries(index.stats)) {
  assert.ok(messages[names.ko], 'stat ' + key + ' (' + names.ko + ') needs dictionary entries');
  assert.equal(messages[names.ko].en, names.en, 'English stat name for ' + key + ' must match the client string');
}
console.log('Item index: committed export validates, covers', ids.size, 'ranker items,', icons, 'icons present, stat names translated PASS');

// Validator rejections.
const bad = [
  {...index, schema: 'x'},
  {...index, pools: [[['Critical', 5, 1]]]},
  {...index, pools: [[['NotAStat', 1, 2]]]},
  {...index, items: {'0': index.items[Object.keys(index.items)[0]]}},
  {...index, items: {'1': {g: 'Unique', lv: 1, c: 'Torso', p: index.pools.length}}},
  {...index, items: {'1': {g: 'Unique', lv: 1, c: 'Torso', i: '../x'}}},
  {...index, items: {'1': {g: 'Unique', lv: 1, c: 'Torso', m: [['Critical', 1.5]]}}},
  {...index, stats: {...index.stats, Bad: {ko: '', en: 'x'}}},
  null, [], 'text',
];
for (const value of bad) assert.equal(validItemIndex(value), false, JSON.stringify(value).slice(0, 80));
assert.ok(validItemIndex({schema: 'asbc-item-index-v1', steamBuild: '1', stats: {}, pools: [], items: {}}));
console.log('Item index: validator rejects bad schema, ranges, unknown stats, ids, pool refs, icon names and values PASS');

// Loading: one fetch shared, failures return null and retry later, success is cached.
let calls = 0, mode = 'fail';
const fetchImpl = async url => {
  calls++;
  assert.equal(url, ITEM_INDEX_URL);
  if (mode === 'fail') return {ok: false, json: async () => ({})};
  if (mode === 'invalid') return {ok: true, json: async () => ({schema: 'nope'})};
  if (mode === 'throw') throw new Error('network');
  return {ok: true, json: async () => index};
};
resetItemIndex();
assert.equal(await loadItemIndex(fetchImpl), null);
mode = 'invalid'; assert.equal(await loadItemIndex(fetchImpl), null);
mode = 'throw'; assert.equal(await loadItemIndex(fetchImpl), null);
mode = 'ok';
const [a, b] = await Promise.all([loadItemIndex(fetchImpl), loadItemIndex(fetchImpl)]);
assert.equal(a, index); assert.equal(b, index); assert.equal(calls, 4, 'parallel loads share one fetch');
assert.equal(await loadItemIndex(fetchImpl), index); assert.equal(calls, 4, 'loaded index is cached');
resetItemIndex();

// Summaries.
const [sampleId, sample] = Object.entries(index.items).find(([, item]) => item.p !== undefined && item.m && item.i);
const summary = itemSummary(index, Number(sampleId));
assert.equal(summary.detail, sample);
assert.deepEqual(summary.main, sample.m);
assert.equal(summary.pool, index.pools[sample.p]);
assert.equal(itemIconUrl(summary.detail), ITEM_ICON_BASE + sample.i + '.webp');
assert.equal(itemSummary(index, 1), null);
assert.equal(itemSummary(null, Number(sampleId)), null);
assert.equal(itemIconUrl(undefined), null);
assert.equal(itemIconUrl({g: 'Rare', lv: 1, c: 'Torso'}), null);
console.log('Item index: shared fetch, failure retry, caching and summaries PASS');
