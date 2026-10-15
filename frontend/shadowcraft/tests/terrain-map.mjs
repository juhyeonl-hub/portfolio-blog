import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {moduleUrl} from './modules.mjs';
const {visibleTerrainTiles: tiles}=await import(moduleUrl(readFileSync('lib/terrain-map.ts','utf8')));
assert.equal(tiles({x:0,y:0,zoom:1},8).length,64);
assert.deepEqual(tiles({x:500,y:500,zoom:8},8),[{x:4,y:4,left:500,top:500,width:125}]);
assert.equal(tiles({x:510,y:510,zoom:8},8).length,4);
assert.deepEqual(tiles({x:875,y:875,zoom:8},8).map(t=>[t.x,t.y]),[[7,7]]);
for(const view of [{x:-1,y:0,zoom:1},{x:1,y:0,zoom:1},{x:0,y:0,zoom:0},{x:NaN,y:0,zoom:1}])assert.throws(()=>tiles(view,8));
for(const size of [0,17,1.5])assert.throws(()=>tiles({x:0,y:0,zoom:1},size));
const root='../public/shadowcraft/maps/steam-25926599/verteron';
const manifest=JSON.parse(readFileSync(root+'/manifest.json'));
assert.deepEqual(JSON.parse(readFileSync('lib/data/terrain-catalog.json')),Object.fromEntries(['name','source','gridSize','basePath'].map(k=>[k,manifest[k]])));
assert.equal(manifest.tiles.length,64);assert.equal(manifest.seams.length,112);
assert.equal(manifest.worldProjectionVerified,false);assert.equal(manifest.markerSupport,false);
assert.deepEqual(new Set(manifest.tiles.map(t=>`${t.x}_${t.y}`)),new Set(tiles({x:0,y:0,zoom:1},8).map(t=>`${t.x}_${t.y}`)));
for(const t of manifest.tiles){const bytes=readFileSync(root+'/'+t.file);assert.equal(createHash('sha256').update(bytes).digest('hex'),t.sha256);assert.equal(bytes.length,t.bytes);assert.equal(bytes.subarray(8,12).toString(),'WEBP');}
console.log('Terrain: viewport bounds, all 64 assets/hashes, 112 seam records and explicit marker/projection limits PASS');
