import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl,plannerUrl,classesUrl,planner} from './modules.mjs';
const {groupRankers,compareRankerSkills,compareRankerEquipment,previewRankerBoards,rankerObservationTime,rankerDisplaySkills}=await import(moduleUrl(readFileSync('lib/ranker-builds.ts','utf8').replace("'./planner'",JSON.stringify(plannerUrl)).replace("'./classes'",JSON.stringify(classesUrl))));
const c=JSON.parse(readFileSync('lib/data/catalogs/assassin.json'));
c.classKey='assassin';
const p={...planner.emptyPlan(c),pointBudget:{sp:9999,stigma:9999,crystal:9999,battle:9999}};
const board=c.boards[0],target=board.nodes.find(n=>!n.autoLearn&&planner.cheapestPath(board,[],n.id).length);
const nodes=planner.cheapestPath(board,[],target.id);
const ranker={classKey:'assassin',region:'eu',serverId:2301,characterId:'public-test'};
const profile={classKey:'assassin',region:'eu',profile:{serverId:2301,characterId:'public-test',pcId:17},nodes,failedBoards:[],boards:[{id:board.id,open:1}]};
const before=JSON.stringify(p),next=previewRankerBoards(c,p,ranker,profile);
assert.equal(JSON.stringify(p),before);assert(next.nodes.includes(target.id));
assert.deepEqual(next.base,p.base);assert.deepEqual(next.gear,p.gear);assert.equal(next.character,p.character);
for(const patch of [{failedBoards:['1']},{nodes:['unknown']},{region:'as'},{boards:[]},{profile:{...profile.profile,pcId:11}},{profile:{...profile.profile,characterId:'other'}}])assert.throws(()=>previewRankerBoards(c,p,ranker,{...profile,...patch}));
assert.throws(()=>previewRankerBoards(c,{...p,pointBudget:{sp:0,stigma:0,crystal:0,battle:0}},ranker,profile));
const rows=[{skills:[{id:1,category:'Dp',equip:1},{id:2,category:'Active',equip:1}]},{skills:[{id:1,category:'Dp',equip:1}]},{skills:[{id:3,category:'Dp',equip:1}]}];
const groups=groupRankers(rows);assert.equal(groups.length,2);assert.equal(groups[0].members.length,2);
console.log('Ranker follow: identity, missing/unknown boards, budgets, immutable preview and observed-skill grouping PASS');
const guides=JSON.parse(readFileSync('lib/data/ranker-skill-guides.json'));
const client=JSON.parse(readFileSync('../public/shadowcraft/data/client-index.json'));
const snapshot=JSON.parse(readFileSync('lib/data/rankers.json'));
const {createHash}=await import('node:crypto');
assert.equal(guides.source.buildId,client.source.buildId);
assert.equal(new Set(guides.skills.map(s=>s.id)).size,guides.skills.length);
for(const guide of guides.skills){
 const source=client.skills.find(s=>s.id===guide.id);
 assert.equal(guide.classKey,source.classKey);
 assert.equal(guide.evidence,source.description.text);
 assert.equal(guide.evidenceSha256,createHash('sha256').update(guide.evidence).digest('hex'));
 for(const field of ['advantage','situation','caution'])assert(guide[field].length>5);
 assert(snapshot.entries.some(r=>r.classKey===guide.classKey&&r.skills.some(s=>String(s.id)===guide.id&&s.category==='Dp'&&s.equip===1)));
}
for(const key of new Set(snapshot.entries.map(r=>r.classKey)))assert(guides.skills.filter(s=>s.classKey===key).length>=3);
console.log('Ranker guidance: all eight classes, equipped IDs and exact Global source evidence PASS');

const left=['b','a','b'],right=['c','b'];
assert.deepEqual(compareRankerSkills(left,right),{shared:['b'],leftOnly:['a'],rightOnly:['c']});
assert.deepEqual(left,['b','a','b']);assert.deepEqual(right,['c','b']);
assert.deepEqual(compareRankerSkills([],[]),{shared:[],leftOnly:[],rightOnly:[]});
assert.deepEqual(compareRankerSkills(['a'],['a']),{shared:['a'],leftOnly:[],rightOnly:[]});
assert.deepEqual(compareRankerSkills([],['b','a']),{shared:[],leftOnly:[],rightOnly:['a','b']});
const observedIds=new Set(snapshot.entries.flatMap(r=>r.skills.filter(s=>s.category==='Dp'&&s.equip===1).map(s=>String(s.id))));
assert.deepEqual(new Set(guides.skills.map(s=>s.id)),observedIds);
console.log('Ranker comparison: overlap, duplicates, empty/identical sets, immutability and complete observed guidance coverage PASS');
const ring={id:100,name:'Ring',slotPos:1,slotPosName:'Ring 1',enchantLevel:10,exceedLevel:2};
const rings=[ring,{...ring,slotPos:2,slotPosName:'Ring 2'}];
const saved=JSON.stringify(rings);
assert.deepEqual(compareRankerEquipment(rings,rings).rows.map(r=>r.status),['same','same']);
assert.equal(compareRankerEquipment([ring],[{...ring,enchantLevel:11}]).rows[0].status,'different');
assert.equal(compareRankerEquipment([ring],[{...ring,exceedLevel:3}]).rows[0].status,'different');
assert.equal(compareRankerEquipment([ring],[{...ring,id:101}]).rows[0].status,'different');
assert.equal(compareRankerEquipment([ring],[]).rows[0].status,'unknown');
for(const bad of [null,{},[ring,ring],[{...ring,enchantLevel:-1}],[{...ring,slotPos:0}],[{...ring,id:NaN}],[{...ring,name:null}]]){
 const result=compareRankerEquipment(bad,rings);assert.equal(result.leftValid,false);assert(result.rows.every(r=>r.status==='unknown'));
}
assert.deepEqual(compareRankerEquipment([],[]).rows,[]);
assert.equal(JSON.stringify(rings),saved);
console.log('Ranker equipment: slot identity, repeated item IDs, level differences, missing/malformed inputs and nonmutation PASS');

assert.equal(rankerObservationTime(undefined),'시각 미확인');
assert.equal(rankerObservationTime('invalid'),'시각 미확인');
assert.equal(rankerObservationTime('2026-10-19T12:00:00'),'시각 미확인');
assert.notEqual(rankerObservationTime('2026-10-19T12:00:00Z'),'시각 미확인');
const liveSkill={id:123,name:'live skill',category:'Active',skillLevel:40,equip:1};
assert.deepEqual(rankerDisplaySkills([liveSkill]),[liveSkill]);
assert.deepEqual(rankerDisplaySkills([]),[]);
for(const bad of [null,{},[liveSkill,liveSkill],[{...liveSkill,skillLevel:-1}],[{...liveSkill,category:'unknown'}]])assert.equal(rankerDisplaySkills(bad),null);
console.log('Ranker observation: timezone-aware timestamps and live skill schema validation PASS');

// Official Abyss/Arena roster files exist as empty placeholders until the rankings are published; when filled by
// import_official_rankers.py they must carry the same entry shape as rankers.json.
for(const kind of ['abyss','arenaOfSolitude','arenaOfCooperation']){
 const file=JSON.parse(readFileSync(`lib/data/rankers-${kind}.json`,'utf8'));
 assert.equal(file.metric,kind);assert.ok(Array.isArray(file.entries),kind+' entries');
 for(const row of file.entries)for(const key of ['classKey','rank','name','region','serverId','characterId','equipment','skills'])assert.ok(key in row,`${kind}: ${key}`);
}
console.log('Official ranker placeholders: metric and entry shape PASS');
// Every roster kind has translated subtitle/note/score texts with the right placeholders, and metrics map to kinds.
const {ROSTER_TEXT,rosterKind}=await import(moduleUrl(readFileSync('lib/ranker-builds.ts','utf8').replace("'./planner'",JSON.stringify(plannerUrl)).replace("'./classes'",JSON.stringify(classesUrl))));
const dictionary=JSON.parse(readFileSync('lib/data/ui-translations.json','utf8'));
assert.deepEqual(Object.keys(ROSTER_TEXT),['combat','abyss','arenaOfSolitude','arenaOfCooperation']);
for(const [kind,text] of Object.entries(ROSTER_TEXT)){
 for(const [field,count] of [['name',0],['subtitle',0],['note',1],['score',2]]){assert.ok(dictionary[text[field]],`${kind} ${field} dictionary`);assert.equal((text[field].match(/\{\d\}/g)||[]).length,count,`${kind} ${field}`);}
}
assert.equal(rosterKind('combat-power'),'combat');assert.equal(rosterKind('abyss'),'abyss');assert.equal(rosterKind('arenaOfCooperation'),'arenaOfCooperation');assert.equal(rosterKind(undefined),'combat');
for(const kind of ['abyss','arenaOfSolitude','arenaOfCooperation'])assert.equal(rosterKind(JSON.parse(readFileSync(`lib/data/rankers-${kind}.json`,'utf8')).metric),kind);
console.log('Roster kinds: texts translated with placeholders, metric mapping PASS');
