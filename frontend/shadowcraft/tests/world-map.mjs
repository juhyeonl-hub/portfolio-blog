import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
const {parseMapDataset: parse, mapProgressKey, loadMapProgress, saveMapProgress, filterMapMarkers, constrainMapView, zoomMap} =
  await import(moduleUrl(readFileSync('lib/world-map.ts', 'utf8')));
const fixture = {schema: 'a2bc-map-v1', region: 'global', coordinates: 'normalized-top-left',
  id: 'synthetic', name: 'Test map', version: 'Test version',
  categories: [{id: 'gather', name: 'Gather'}, {id: 'boss', name: 'Boss'}],
  markers: [{id: 'a', name: 'Test ore', categoryId: 'gather', x: 0.2, y: 0.3},
    {id: 'b', name: 'Test boss', categoryId: 'boss', x: 1, y: 0}]};
const data = parse(JSON.stringify(fixture));
assert.deepEqual(data, fixture);
assert.equal(parse(JSON.stringify({...fixture, verified: true, imageUrl: 'https://untrusted.invalid'})).verified, undefined);
for (const patch of [{region: 'kr'}, {coordinates: 'world'}, {categories: []}, {name: ''},
  {markers: [{...fixture.markers[0], x: -0.1}]}, {markers: [{...fixture.markers[0], y: 1.1}]},
  {markers: [{...fixture.markers[0], x: '0.5'}]}, {markers: [{...fixture.markers[0], y: null}]},
  {markers: [{...fixture.markers[0], categoryId: 'missing'}]}, {markers: [fixture.markers[0], fixture.markers[0]]},
  {categories: [fixture.categories[0], fixture.categories[0]]}, {markers: Array(5001).fill(fixture.markers[0])}]) {
  assert.throws(() => parse(JSON.stringify({...fixture, ...patch})));
}
assert.throws(() => parse('{invalid'));
assert.throws(() => parse(' '.repeat(2_000_001)), /2 MB/);
assert.equal(parse(JSON.stringify({...fixture, markers: []})).markers.length, 0);
const key = await mapProgressKey(data);
assert.equal(key, await mapProgressKey(parse(JSON.stringify({...fixture, verified: true}))));
assert.notEqual(key, await mapProgressKey({...data, version: 'New version'}));
assert.notEqual(key, await mapProgressKey({...data, markers: [{...data.markers[0], x: 0.8}]}));
const contents = new Map([['shadowcraft-plan-v1', 'KEEP']]);
const storage = {getItem: k => contents.get(k) ?? null, setItem: (k, v) => contents.set(k, v)};
assert.deepEqual(loadMapProgress(storage, key, data), {completed: [], writable: true});
assert.equal(saveMapProgress(storage, key, ['a']), true);
assert.deepEqual(loadMapProgress(storage, key, data), {completed: ['a'], writable: true});
assert.equal(contents.get('shadowcraft-plan-v1'), 'KEEP');
for (const raw of ['{broken', JSON.stringify({schema: 'wrong', completed: []}),
  JSON.stringify({schema: 'a2bc-map-progress-v1', completed: ['missing']}),
  JSON.stringify({schema: 'a2bc-map-progress-v1', completed: ['a', 'a']})]) {
  contents.set(key, raw);
  assert.deepEqual(loadMapProgress(storage, key, data), {completed: [], writable: false});
  assert.equal(contents.get(key), raw, 'bad stored data is preserved');
}
const blocked = {getItem() {throw Error('blocked');}, setItem() {throw Error('blocked');}};
assert.equal(loadMapProgress(blocked, key, data).writable, false);
assert.equal(saveMapProgress(blocked, key, ['a']), false);
assert.deepEqual(filterMapMarkers(data, 'ORE', new Set(['gather', 'boss']), new Set(), false).map(m => m.id), ['a']);
assert.deepEqual(filterMapMarkers(data, '', new Set(['gather']), new Set(['a']), true), []);
assert.deepEqual(filterMapMarkers(data, '', new Set(), new Set(), false), []);
assert.deepEqual(constrainMapView({x: -100, y: 9000, zoom: 2}), {x: 0, y: 500, zoom: 2});
assert.deepEqual(zoomMap({x: 0, y: 0, zoom: 1}, 2), {x: 250, y: 250, zoom: 2});
assert.deepEqual(zoomMap({x: 250, y: 250, zoom: 2}, 1), {x: 0, y: 0, zoom: 1});
assert.throws(() => constrainMapView({x: NaN, y: 0, zoom: 1}));
assert.throws(() => zoomMap({x: 0, y: 0, zoom: 1}, NaN));
console.log('Map: global schema, bounded coordinates, references, provenance, scoped progress, corrupt/blocked storage, search, layers and viewport limits PASS');
