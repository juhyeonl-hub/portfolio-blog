import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {moduleUrl} from './modules.mjs';
const {visibleTerrainTiles: tiles, terrainLabelNames,searchTerrainLocations,terrainLocationView}=await import(moduleUrl(readFileSync('lib/terrain-map.ts','utf8')));
const closeLabels=[{id:'a',name:'First region',x:500,y:500},{id:'b',name:'Other region',x:550,y:500}];
assert.equal(terrainLabelNames(closeLabels,1).size,1);
assert.equal(terrainLabelNames(closeLabels,8).size,2);
const labels=JSON.parse(readFileSync('lib/data/terrain-labels.json'));
assert.deepEqual(labels.maps.map(m=>m.labels.length),[69,71,7,7]);
assert.deepEqual(labels.maps.map(m=>m.unresolvedLabels.length),[5,4,0,0]);
assert.equal(labels.worldProjectionVerified,false);assert.equal(labels.coordinateSpace,'map-local');
for(const map of labels.maps){
 assert.equal(new Set(map.labels.map(l=>l.id)).size,map.labels.length);
 for(const l of map.labels)assert.ok(l.name && l.x>=0 && l.x<=1000 && l.y>=0 && l.y<=1000);
}
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
const altRoot='../public/shadowcraft/maps/steam-25926599/altgard';
const alt=JSON.parse(readFileSync(altRoot+'/manifest.json'));
assert.deepEqual(JSON.parse(readFileSync('lib/data/terrain-altgard.json')),Object.fromEntries(['name','source','gridSize','basePath'].map(k=>[k,alt[k]])));
assert.equal(alt.mapKey,'World_D_A');assert.equal(alt.source.region,'global');
assert.equal(alt.tiles.length,64);assert.equal(alt.seams.length,112);assert.equal(alt.sourceTilePixels,1024);
assert.equal(alt.worldProjectionVerified,false);assert.equal(alt.markerSupport,false);
assert.ok(Math.max(...alt.seams.map(s=>s.rgbMeanAbsoluteDifference))<=11);
assert.deepEqual(new Set(alt.tiles.map(t=>`${t.x}_${t.y}`)),new Set(tiles({x:0,y:0,zoom:1},8).map(t=>`${t.x}_${t.y}`)));
for(const t of alt.tiles){const bytes=readFileSync(altRoot+'/'+t.file);assert.equal(createHash('sha256').update(bytes).digest('hex'),t.sha256);assert.equal(bytes.length,t.bytes);}
console.log('Altgard: 64 Global tiles, 112 seams, metadata and all hashes PASS');

for(const [slug,key,grid,limit] of [['poeta','World_L_Starter',4,16],['ishalgen','World_D_Starter',5,8],['reshanta-lower','Abyss_Reshanta_A',4,15],['reshanta-middle','Abyss_Reshanta_C',2,6]]){
 const root='../public/shadowcraft/maps/steam-25926599/'+slug;
 const m=JSON.parse(readFileSync(root+'/manifest.json'));
 assert.equal(m.mapKey,key);assert.equal(m.gridSize,grid);assert.equal(m.sourceTilePixels,1024);
 assert.equal(m.tiles.length,grid*grid);assert.equal(m.seams.length,2*grid*(grid-1));
 assert.equal(m.markerSupport,false);assert.equal(m.worldProjectionVerified,false);
 assert.ok(Math.max(...m.seams.map(s=>s.rgbMeanAbsoluteDifference))<=limit);
 assert.deepEqual(JSON.parse(readFileSync('lib/data/terrain-'+slug+'.json')),Object.fromEntries(['name','source','gridSize','basePath'].map(k=>[k,m[k]])));
 assert.deepEqual(new Set(m.tiles.map(t=>`${t.x}_${t.y}`)),new Set(tiles({x:0,y:0,zoom:1},grid).map(t=>`${t.x}_${t.y}`)));
 for(const tile of m.tiles){const bytes=readFileSync(root+'/'+tile.file);assert.equal(createHash('sha256').update(bytes).digest('hex'),tile.sha256);assert.equal(bytes.length,tile.bytes);}
}
console.log('Six Global terrain regions: 189 tile identities/hashes, dimensions, seams and metadata PASS');

assert.deepEqual(searchTerrainLocations(closeLabels,'  FIRST region '),[closeLabels[0]]);
assert.deepEqual(searchTerrainLocations(closeLabels,'missing'),[]);
assert.equal(searchTerrainLocations(closeLabels,'   ').length,2);
assert.deepEqual(terrainLocationView(closeLabels[0]),{x:375,y:375,zoom:4});
assert.deepEqual(terrainLocationView({id:'edge',name:'Edge',x:0,y:1000}),{x:0,y:750,zoom:4});
for (const x of [-1,1001,NaN,Infinity]) assert.throws(()=>terrainLocationView({id:'bad',name:'Bad',x,y:0}));
console.log('Terrain search and location focus: bounds and invalid coordinates PASS');
const {previewMatches,visiblePreview,previewPage,previewProgressDataset}=await import(moduleUrl(readFileSync('lib/spawn-preview.ts','utf8')));
const preview=JSON.parse(readFileSync('lib/data/spawn-preview.json'));
assert.equal(preview.worldProjectionVerified,false);
assert.equal(preview.region,'global');
assert.deepEqual(preview.maps.map(m=>m.markers.length),[7253,7623,55,70,548,196]);
for(const map of preview.maps){
 assert.equal(new Set(map.markers.map(m=>m.id)).size,map.markers.length);
 for(const row of map.markers){assert.ok(['gather','teleport','named','npc','dungeon','rift','monolith','cube','trace','sealed','stronghold'].includes(row.kind));assert.ok(row.x>=0 && row.x<=1000 && row.y>=0 && row.y<=1000);assert.ok(row.world.every(Number.isFinite));}
 if(['Verteron','Altgard'].includes(map.name))assert.equal(previewMatches(map.markers,'teleport','').length,61);
 assert.equal(previewMatches(map.markers,'gather','no such item 12345').length,0);
 assert.equal(visiblePreview(map.markers,{x:0,y:0,zoom:1}).length,map.markers.length);
}
console.log('Experimental spawn data: identity, boundaries, explicit unverified status, categories, filters PASS');

for(const map of preview.maps){
 const named=previewMatches(map.markers,'named','');if(['Verteron','Altgard'].includes(map.name))assert.equal(named.length,24);
 assert.ok(named.every(row=>row.id.endsWith(':npc')));
 const first=previewPage(map.markers,0,'');const second=previewPage(map.markers,1,'');
 assert.equal(first.rows.length,Math.min(200,map.markers.length));
 if(map.markers.length>200)assert.ok(!first.rows.some(a=>second.rows.some(b=>a.id===b.id)));
 assert.equal(previewPage(map.markers,99999,'').current,Math.ceil(map.markers.length/200)-1);
 const selected=previewPage(map.markers,1,map.markers[0].id);assert.equal(selected.rows[0].id,map.markers[0].id);
 const progress=previewProgressDataset(map.name,map.markers);assert.equal(progress.markers.length,map.markers.length);
 assert.ok(progress.markers.every(row=>row.x>=0 && row.x<=1));
}
console.log('Official location categories, paging and progress identities PASS');
for (const map of preview.maps) {
 assert.equal(previewMatches(map.markers,'all','').length,map.markers.length);
 if(['Verteron','Altgard'].includes(map.name))assert.deepEqual(map.namedAudit,{spawners:24,exactFieldTableMatches:24});
 assert.equal(map.plane.worldUnitsPerPlaneUnit,102000/1024);
 assert.equal(map.plane.uiTileLayoutVerified,true);assert.equal(map.plane.worldProjectionVerified,false);
}

// Multi-select is a union, intersects text search, and an empty selection hides everything.
for (const map of preview.maps) {
 const enabled=new Set(['cube','teleport']);
 const selected=previewMatches(map.markers,enabled,'');
 assert.deepEqual(selected,map.markers.filter(row=>enabled.has(row.kind)));
 assert.equal(previewMatches(map.markers,new Set(),'').length,0);
 assert.deepEqual(previewMatches(map.markers,enabled,'HIDDEN CUBE'),
   map.markers.filter(row=>row.kind==='cube' && row.name.toLowerCase().includes('hidden cube')));
 // Canonical labels are versioned; previously deployed identities are independently checked below.
 const progress=previewProgressDataset(map.name,map.markers);
 assert.deepEqual(progress.categories.map(c=>c.name),
   ['이동 지점','채집물','네임드 몬스터','NPC','봉인던전','주둔지','던전 입구','균열','모노리스','큐브','Empyrean Trace']);
}

const {mapProgressKey,loadMapProgressWithLegacy,saveMapProgress}=await import(moduleUrl(readFileSync('lib/world-map.ts','utf8')));
const legacy=JSON.parse(readFileSync('lib/data/map-progress-legacy.json'));
// Python's round(...,5) uses ties-to-even. Exact binary halfway values have
// a denominator dividing 64; JS toFixed otherwise agrees on these inputs.
const legacyRound=value=>{
 const scaled=value*100000;
 return Number.isInteger(value*64) && scaled%1===.5
   ? (Math.floor(scaled)%2===0?Math.floor(scaled):Math.ceil(scaled))/100000
   : Number(value.toFixed(5));
};
for(const map of preview.maps) {
 const current=previewProgressDataset(map.name,map.markers);
 // Reconstruct the exact previous dataset, verifying migration keys against shipped source.
 const old=previewProgressDataset(map.name,map.markers.filter(r=>r.kind!=='stronghold').map(r=>({...r,kind:r.kind==='sealed'?'dungeon':r.kind,
   x:legacyRound((r.world[0]/100-map.plane.planeOrigin[0])/(map.plane.grid[0]*map.plane.planeSize)*1000),
   y:legacyRound((r.world[1]/100-map.plane.planeOrigin[1])/(map.plane.grid[1]*map.plane.planeSize)*1000)})));
 old.categories=old.categories.filter(c=>!['sealed','stronghold'].includes(c.id));
 assert.equal(await mapProgressKey(old),legacy[map.name]);
 const key=await mapProgressKey(current);
 assert.notEqual(key,legacy[map.name]);
 const bytes=new Map();
 const storage={getItem:k=>bytes.get(k)??null,setItem:(k,v)=>bytes.set(k,v)};
 const id=current.markers[0].id;
 saveMapProgress(storage,legacy[map.name],[id]);
 const prior=bytes.get(legacy[map.name]);
 assert.deepEqual(loadMapProgressWithLegacy(storage,key,current,legacy[map.name]),{completed:[id],writable:true});
 assert.equal(bytes.has(key),false);assert.equal(bytes.get(legacy[map.name]),prior);
 saveMapProgress(storage,key,[]);
 assert.deepEqual(loadMapProgressWithLegacy(storage,key,current,legacy[map.name]),{completed:[],writable:true});
 bytes.set(key,'broken');
 assert.equal(loadMapProgressWithLegacy(storage,key,current,legacy[map.name]).writable,false);
 bytes.delete(key);bytes.set(legacy[map.name],'broken');
 assert.equal(loadMapProgressWithLegacy(storage,key,current,legacy[map.name]).writable,false);
 if(['Verteron','Altgard'].includes(map.name)) {
   assert.equal(map.markers.filter(r=>r.kind==='sealed').length,61);
   assert.equal(map.markers.filter(r=>r.kind==='stronghold').length,15);
   assert.ok(map.markers.filter(r=>r.kind==='stronghold').every(r=>r.questId && r.locationType==='area-center'));
 }
}
console.log('Sealed/stronghold coverage and lossless legacy progress migration PASS');

const {previewGatherKinds}=await import(moduleUrl(readFileSync('lib/spawn-preview.ts','utf8')));
for(const map of preview.maps) {
 const kinds=previewGatherKinds(map.markers);
 assert.equal(kinds.reduce((n,row)=>n+row.count,0),map.markers.filter(r=>r.kind==='gather').length);
 assert.equal(kinds.length,new Set(map.markers.filter(r=>r.kind==='gather').map(r=>r.name)).size);
 if(['Verteron','Altgard'].includes(map.name))assert.equal(kinds.length,13);
 const excluded=new Set(kinds.filter(r=>r.name!=='Ruby').map(r=>r.name));
 const matches=previewMatches(map.markers,new Set(['gather','teleport']),'',excluded);
 assert.ok(matches.every(r=>r.kind==='teleport' || r.name==='Ruby'));
 assert.equal(matches.filter(r=>r.kind==='teleport').length,map.markers.filter(r=>r.kind==='teleport').length);
 assert.equal(previewMatches(map.markers,new Set(['gather']),'',new Set(kinds.map(r=>r.name))).length,0);
 assert.equal(previewMatches(map.markers,new Set(['gather']),'no such resource',excluded).length,0);
}
console.log('Gathering resource counts and independent exact-name filters PASS');

const {nearestTeleports}=await import(moduleUrl(readFileSync('lib/spawn-preview.ts','utf8')));
const target={id:'self',kind:'teleport',x:0,y:0};
const points=[target,{id:'z',kind:'teleport',x:2,y:0},{id:'a',kind:'teleport',x:0,y:2},{id:'b',kind:'teleport',x:1,y:0},{id:'far',kind:'teleport',x:9,y:9},{id:'npc',kind:'npc',x:0,y:0}];
assert.deepEqual(nearestTeleports(points,target).map(row=>row.id),['b','a','z']);
assert.equal(points.length,6);
assert.deepEqual(nearestTeleports([target],target),[]);
assert.deepEqual(nearestTeleports([],target),[]);

const mapIcons=JSON.parse(readFileSync('lib/data/map-icons.json'));
for(const kind of ['teleport','gather','named','npc','sealed','stronghold','dungeon','rift','monolith','cube','trace'])assert.ok(mapIcons[kind],kind);
for(const icon of Object.values(mapIcons)){
 const bytes=readFileSync('../public'+icon.src);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),icon.sha256);
 assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 assert.equal(bytes.readUInt32BE(16),icon.width);assert.equal(bytes.readUInt32BE(20),icon.height);
 const [x,y,w,h]=icon.viewBox;assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=icon.width&&y+h<=icon.height);
}
