import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl,plannerUrl,classesUrl,planner,classes} from './modules.mjs';
const recommendationUrl=moduleUrl(readFileSync('lib/recommendation.ts','utf8').replace("'./planner'",JSON.stringify(plannerUrl)).replace("'./classes'",JSON.stringify(classesUrl)));
const {recommendTargetNodes}=await import(recommendationUrl);
const {rankerItemNeedsProfile,groupRankers,compareRankerSkills,compareRankerEquipment,previewRankerBoards,rankerObservationTime,rankerDisplaySkills,rankerSkillRows}=await import(moduleUrl(readFileSync('lib/ranker-builds.ts','utf8').replace("'./recommendation'",JSON.stringify(recommendationUrl)).replace("'./planner'",JSON.stringify(plannerUrl)).replace("'./classes'",JSON.stringify(classesUrl))));
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
const {ROSTER_TEXT,rosterKind}=await import(moduleUrl(readFileSync('lib/ranker-builds.ts','utf8').replace("'./recommendation'",JSON.stringify(recommendationUrl)).replace("'./planner'",JSON.stringify(plannerUrl)).replace("'./classes'",JSON.stringify(classesUrl))));
const dictionary=JSON.parse(readFileSync('lib/data/ui-translations.json','utf8'));
assert.deepEqual(Object.keys(ROSTER_TEXT),['combat','abyss','arenaOfSolitude','arenaOfCooperation']);
for(const [kind,text] of Object.entries(ROSTER_TEXT)){
 for(const [field,count] of [['name',0],['subtitle',0],['note',1],['score',2]]){assert.ok(dictionary[text[field]],`${kind} ${field} dictionary`);assert.equal((text[field].match(/\{\d\}/g)||[]).length,count,`${kind} ${field}`);}
}
assert.equal(rosterKind('combat-power'),'combat');assert.equal(rosterKind('abyss'),'abyss');assert.equal(rosterKind('arenaOfCooperation'),'arenaOfCooperation');assert.equal(rosterKind(undefined),'combat');
for(const kind of ['abyss','arenaOfSolitude','arenaOfCooperation'])assert.equal(rosterKind(JSON.parse(readFileSync(`lib/data/rankers-${kind}.json`,'utf8')).metric),kind);
console.log('Roster kinds: texts translated with placeholders, metric mapping PASS');

const poor={...p,level:1,pointBudget:{sp:0,stigma:0,crystal:0,battle:0}};
const poorBefore=JSON.stringify(poor);
assert(previewRankerBoards(c,poor,ranker,profile,{allowUnavailable:true}).nodes.includes(target.id));
assert.equal(JSON.stringify(poor),poorBefore);
assert.throws(()=>previewRankerBoards(c,poor,ranker,{...profile,nodes:['unknown']},{allowUnavailable:true}));
assert.throws(()=>previewRankerBoards(c,poor,ranker,{...profile,region:'as'},{allowUnavailable:true}));

const observedCatalog={skills:[{id:'2'},{id:'1'},{id:'3'}]};
const obs=(id,skillLevel,category='Active',equip=0)=>({id,name:'Observed',category,skillLevel,equip});
const observedRows=rankerSkillRows(observedCatalog,[obs(1,0),obs(2,8)],[obs(2,15),obs(1,0,'Dp',1)]);
assert.deepEqual(observedRows.map(r=>r.skill.id),['2','1','3'],'catalog order stays fixed');
assert.deepEqual(observedRows.map(r=>r.difference),[7,0,null]);
assert.equal(observedRows[1].ranker,0,'observed zero is valid');
assert.equal(observedRows[1].equipped,true);
assert.equal(observedRows[2].ranker,null,'missing never becomes zero');
assert.equal(observedRows[2].equipped,null,'missing never becomes unequipped');
assert(rankerSkillRows(observedCatalog,undefined,[obs(2,-1)]).every(r=>r.ranker===null));
assert(rankerSkillRows(observedCatalog,[obs(2,8),obs(2,9)],[obs(2,15)]).every(r=>r.mine===null));
assert.equal(rankerSkillRows(observedCatalog,[],[obs(1,0,'Dp',0)])[1].equipped,false);
const scopedCopy=readFileSync('lib/ranker-comparison-text.ts','utf8');
const {rankerText}=await import(moduleUrl(scopedCopy));
const copyKeys=[...scopedCopy.matchAll(/^ (\w+): \[/gm)].map(m=>m[1]);
assert(copyKeys.length>15);
for(const key of copyKeys)for(const language of ['ko','en','ja','fi']){const value=rankerText(language,key);assert(value.length>0);if(language!=='ko')assert(!/[가-힣]/.test(value),language+' '+key);}
console.log('Ranker visual: catalog order, final observations, missing/zero/malformed/equipped distinctions and four locales PASS');

assert(rankerItemNeedsProfile('장비가 바뀌었거나 조회 정보가 일치하지 않습니다. 캐릭터를 다시 조회하세요.'));
assert(rankerItemNeedsProfile('실제 장비 옵션을 확인하지 못했습니다. 캐릭터를 다시 조회하세요.'));
for(const error of ['', '조회 연결이 차단되었거나 끊겼습니다.', '조회 응답이 지연되고 있습니다. 잠시 후 다시 시도하세요.'])assert.equal(rankerItemNeedsProfile(error),false);
console.log('Ranker item recovery: stale item identity reloads profile; transient lookup errors retain retry PASS');

// Fitting cannot bypass observation validation or silently replace any non-Daevanion field.
for(const patch of [{failedBoards:['1']},{nodes:['unknown']},{region:'as'},{boards:[]},{profile:{...profile.profile,pcId:11}},{profile:{...profile.profile,characterId:'other'}}])assert.throws(()=>previewRankerBoards(c,p,ranker,{...profile,...patch},{fitToBudget:true}));
const isolated=board.nodes.find(n=>!n.autoLearn&&!planner.connected(board,[n.id]).includes(n.id));
assert(isolated);assert.throws(()=>previewRankerBoards(c,p,ranker,{...profile,nodes:[isolated.id]},{fitToBudget:true}));
const full=previewRankerBoards(c,p,ranker,profile),fittedFull=previewRankerBoards(c,p,ranker,profile,{fitToBudget:true});
assert.deepEqual(new Set(fittedFull.nodes),new Set(full.nodes),'affordable short path stays complete');
let budgetCases=0;
for(const key of ['assassin','gladiator','templar','ranger','elementalist','sorcerer','cleric','chanter']){
 const catalog={...JSON.parse(readFileSync(`lib/data/catalogs/${key}.json`)),classKey:key};
 const row={...ranker,classKey:key};
 const observed={...profile,classKey:key,profile:{...profile.profile,pcId:classes.classProfile(key).pcIds[0]},boards:catalog.boards.map(b=>({id:b.id,open:1})),nodes:catalog.boards.flatMap(b=>b.nodes.map(n=>n.id))};
 for(const [level,crystal,battle] of [[1,0,0],[20,40,0],[30,80,0],[36,114,0],[45,316,0],[45,370,10],[45,9999,9999]]){
  const original={...planner.emptyPlan(catalog),classKey:key,level,pointBudget:{sp:383,stigma:29,crystal,battle},checked:['preserve'],character:{marker:'keep observed data'},searchPrefs:{region:'eu',server:'Ludra',name:'GreenOrc'}};
  // Keep explicitly chosen specs, rather than accepting the recommender's different choices.
  original.specs=Object.fromEntries(catalog.skills.map(skill=>[skill.id,skill.specializations.map(s=>s.id).reverse()]));
  const before=JSON.stringify(original);
  const raw=previewRankerBoards(catalog,original,row,observed,{allowUnavailable:true});
  const fitted=previewRankerBoards(catalog,original,row,observed,{fitToBudget:true}),used=planner.totals(catalog,fitted);
  assert.equal(JSON.stringify(original),before,'input plan is immutable');
  assert.deepEqual(new Set(fitted.nodes),new Set(recommendTargetNodes(catalog,original,raw)),'applied nodes are the displayed guide');
  const {nodes:oldNodes,specs:oldSpecs,...restBefore}=original,{nodes:newNodes,specs:newSpecs,...restAfter}=fitted;
  assert.deepEqual(restAfter,restBefore,'only Daevanion and newly locked specs may change');
  assert(used.crystal<=crystal&&used.battle<=battle,'separate point budgets');
  for(const b of catalog.boards){const connected=new Set(planner.connected(b,fitted.nodes));for(const n of b.nodes.filter(n=>fitted.nodes.includes(n.id)&&!n.autoLearn)){assert(b.requiredLevel<=level&&n.requiredLevel<=level);assert(connected.has(n.id));assert(observed.nodes.includes(n.id));}}
  for(const skill of catalog.skills){const kept=fitted.specs[skill.id],lv=planner.finalLevel(catalog,fitted,skill);assert(kept.every(id=>original.specs[skill.id].includes(id)),'never invent specializations');assert(kept.every(id=>skill.specializations.some(s=>s.id===id&&s.requiredParentLevel<=lv)));assert(kept.length<=planner.slots(skill,lv));}
  budgetCases++;
 }
}
console.log(`Ranker budget apply: ${budgetCases} class/level/budget cases, exact guide nodes, independent currencies, connected unlocked target paths, spec pruning and preservation PASS`);

// Personal skill guide: final observations are targets, never ranker base/spec claims.
const rankerModuleUrl=moduleUrl(readFileSync('lib/ranker-builds.ts','utf8').replace("'./recommendation'",JSON.stringify(recommendationUrl)).replace("'./planner'",JSON.stringify(plannerUrl)).replace("'./classes'",JSON.stringify(classesUrl)));
const {previewRankerSkills}=await import(moduleUrl(readFileSync('lib/ranker-skills.ts','utf8').replace("'./ranker-builds'",JSON.stringify(rankerModuleUrl)).replace("'./planner'",JSON.stringify(plannerUrl)).replace("'./classes'",JSON.stringify(classesUrl))));
let skillCases=0;
for(const key of new Set(snapshot.entries.map(r=>r.classKey))){
 const cat={...JSON.parse(readFileSync(`lib/data/catalogs/${key}.json`)),classKey:key};const rank=snapshot.entries.find(r=>r.classKey===key);
 const live={classKey:key,region:rank.region,profile:{characterId:rank.characterId,serverId:rank.serverId,pcId:classes.classProfile(key).pcIds[0]},skills:rank.skills};
 for(const level of [1,20,22,27,36,45])for(const ascension of [false,true])for(const [sp,stigma] of [[0,0],[1,0],[10,1],[70,5],[383,29],[9999,9999]]){
  const plan={...planner.emptyPlan(cat),level,ascensionGrade3Confirmed:ascension,pointBudget:{sp,stigma,crystal:316,battle:0}};
  const before=JSON.stringify(plan),out=previewRankerSkills(cat,plan,rank,live),total=planner.totals(cat,out.plan);
  assert.equal(JSON.stringify(plan),before);assert(total.sp<=sp);assert(total.stigma<=stigma);
  for(const field of Object.keys(plan).filter(k=>!['base','specs','stigmaSkills'].includes(k)))assert.deepEqual(out.plan[field],plan[field],field);
  assert(out.plan.stigmaSkills.length<=[22,27,32,37].filter(x=>level>=x).length);
  for(const id of out.plan.stigmaSkills)assert(rank.skills.some(s=>String(s.id)===id&&s.category==='Dp'&&s.equip===1));
  for(const s of cat.skills){const base=out.plan.base[s.id],final=planner.finalLevel(cat,out.plan,s),choices=out.plan.specs[s.id];
   assert(base<=planner.maxBase(s,level,ascension));assert(base===0||s.learning.some(l=>l.level===base&&l.requiredCharacterLevel<=level));
   assert(choices.length<=planner.slots(s,final));assert(choices.every(id=>s.specializations.some(x=>x.id===id&&x.requiredParentLevel<=final)));
   if(s.stigma&&!out.plan.stigmaSkills.includes(s.id))assert.equal(base,0);
  }
  skillCases++;
 }
 const plan={...planner.emptyPlan(cat),ascensionGrade3Confirmed:true,pointBudget:{sp:9999,stigma:9999,crystal:316,battle:0}};
 const plain=previewRankerSkills(cat,plan,rank,live);
 const active=cat.skills.find(s=>!s.stigma&&rank.skills.find(x=>String(x.id)===s.id)?.skillLevel>1);
 const bonus={...plan,bonus:{...plan.bonus,[active.id]:30}};const withBonus=previewRankerSkills(cat,bonus,rank,live);assert(withBonus.plan.base[active.id]<plain.plan.base[active.id]);assert.equal(withBonus.plan.base[active.id],1);
 const kept=previewRankerSkills(cat,plain.plan,rank,live,'keep');assert.deepEqual(kept.plan.specs,plain.plan.specs);
 for(const patch of [{skills:null},{skills:[]},{skills:rank.skills.slice(1)},{skills:[...rank.skills,rank.skills[0]]},{skills:rank.skills.map((s,i)=>i? s:{...s,id:999})},{skills:rank.skills.map((s,i)=>i? s:{...s,skillLevel:999})},{region:'wrong'},{classKey:'wrong'},{profile:{...live.profile,characterId:'other'}},{profile:{...live.profile,serverId:0}},{profile:{...live.profile,pcId:0}}])assert.throws(()=>previewRankerSkills(cat,plan,rank,{...live,...patch}));
 const beforeFull=JSON.stringify(live);previewRankerSkills(cat,plan,rank,live);assert.equal(JSON.stringify(live),beforeFull);
 const missingSpec={...plain.plan,specs:{...plain.plan.specs,[active.id]:['unknown']}};assert.deepEqual(previewRankerSkills(cat,missingSpec,rank,live,'keep').plan.specs[active.id],[]);
}
console.log(`Ranker personal skill guide: ${skillCases} class/level/ascension/budget cases; slots, bonus subtraction, valid specs, missing/identity rejection, immutability PASS`);
