import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planner,recommendBuild,classes} from './modules.mjs';
const c=JSON.parse(readFileSync('lib/data/catalogs/templar.json','utf8'));
const original={...planner.emptyPlan(c),pointBudget:{sp:999,stigma:99,crystal:370,battle:63},extraSP:50,extraCrystal:200,character:{profile:{characterId:'green',serverId:'hadala'}}};
for(const level of [1,12,20,27,28,30,40,44]){
 const p=planner.updatePlan(c,original,{level});
 const expected=planner.pointLimits(c,{...original,level,pointBudget:undefined,extraSP:0,extraCrystal:0});
 assert.deepEqual(planner.pointLimits(c,p),expected);
 assert.equal(p.pointBudget,undefined);
 const t=planner.totals(c,recommendBuild(c,p));
 for(const k of ['sp','stigma','crystal','battle'])assert(t[k]<=t[k+'Max']);
 console.log('PASS level',level,JSON.stringify(expected));
}
assert.deepEqual(planner.updatePlan(c,original,{mode:'damage'}).pointBudget,original.pointBudget);
assert.deepEqual(planner.updatePlan(c,original,{level:45}).pointBudget,original.pointBudget);
assert.deepEqual(planner.updatePlan(c,original,{character:{profile:{characterId:'green',serverId:'hadala'}}}).pointBudget,original.pointBudget);
assert.equal(planner.updatePlan(c,original,{character:{profile:{characterId:'other',serverId:'hadala'}}}).pointBudget,undefined);
const manual={sp:1,stigma:2,crystal:3,battle:4};
assert.deepEqual(planner.updatePlan(c,original,{level:28,pointBudget:manual}).pointBudget,manual);
const sparse={...c,characterLevels:[{level:1,skillPoints:0,stigmaPoints:0,daevanionPoints:[]},{level:45,skillPoints:203,stigmaPoints:29,daevanionPoints:[]}]};
assert.equal(planner.pointLimits(sparse,{...original,level:28,pointBudget:undefined,extraSP:0}).sp,0,'missing level must not use endgame row');
console.log('PASS manual preservation, character switching and absent level fallback');

// Public progression tables agree on these leveling-only totals (2026-10-22).
for(const [level,sp,stigma,crystal] of [[20,61,0,36],[25,86,3,56],[28,101,6,68],[30,111,8,76],[35,141,13,96],[39,165,17,112],[40,171,19,116],[44,196,27,132]]){
 const p={...planner.emptyPlan(c),level};
 assert.deepEqual(planner.pointLimits(c,p),{sp,stigma,crystal,battle:0});
}
console.log('PASS leveling baseline table; no unearned extra points');

// Character progression is not a universal reward grant for everyone at that level.
for(const {key:classKey} of classes.CLASSES){
 const catalog=JSON.parse(readFileSync('lib/data/catalogs/'+classKey+'.json','utf8'));
 const minimum={...planner.emptyPlan(catalog),level:39};
 assert.deepEqual(planner.pointLimits(catalog,minimum),{sp:165,stigma:17,crystal:112,battle:0});
 assert.equal(planner.hasCustomPointBudget(minimum),false);
 const linked={...minimum,character:{profile:{characterLevel:39},skills:[],nodes:[]}};
 assert.deepEqual(planner.pointLimits(catalog,linked),planner.pointLimits(catalog,minimum));
 const personal={...linked,pointBudget:{sp:179,stigma:18,crystal:126,battle:0}};
 assert.equal(planner.hasCustomPointBudget(personal),true);
 assert.deepEqual(planner.pointLimits(catalog,personal),personal.pointBudget);
 assert.deepEqual(planner.pointLimits(catalog,planner.updatePlan(catalog,personal,{pointBudget:undefined,extraSP:0,extraStigma:0,extraCrystal:0,extraBattle:0})),planner.pointLimits(catalog,minimum));
 assert.equal(planner.hasCustomPointBudget({...minimum,extraSP:14}),true,'legacy extras must not be labelled as a minimum');
}
console.log('PASS eight-class minimum defaults, separate personal totals, explicit reset and legacy source labels');

// Global endgame assumes the requested one-time content rewards, not shop/event extras.
for(const {key:classKey} of classes.CLASSES){
 const catalog=JSON.parse(readFileSync('lib/data/catalogs/'+classKey+'.json','utf8'));
 const endgame=planner.emptyPlan(catalog),expected={sp:383,stigma:29,crystal:316,battle:0};
 assert.deepEqual(planner.pointLimits(catalog,endgame),expected);
 assert.equal(planner.pointBudgetSourceLabel(endgame),'총량: 45레벨 콘텐츠 완료 기준');
 const leveling=planner.updatePlan(catalog,endgame,{level:44});
 assert.deepEqual(planner.pointLimits(catalog,leveling),{sp:196,stigma:27,crystal:132,battle:0});
 assert.deepEqual(planner.pointLimits(catalog,planner.updatePlan(catalog,leveling,{level:45})),expected);
 const personal={...endgame,pointBudget:{sp:250,stigma:30,crystal:370,battle:5}};
 assert.deepEqual(planner.pointLimits(catalog,personal),personal.pointBudget,'no completion rewards added to entered total');
 assert.equal(planner.pointBudgetSourceLabel(personal),'총량: 직접 입력한 값');
 assert.deepEqual(planner.pointLimits(catalog,{...personal,pointBudget:undefined}),expected,'reset restores completion baseline');
 const legacy={...endgame,extraSP:180,extraCrystal:180,extraStigma:1};
 assert.deepEqual(planner.pointLimits(catalog,legacy),{sp:383,stigma:30,crystal:316,battle:0},'legacy extras already include rewards; never double count');
 const t=planner.totals(catalog,recommendBuild(catalog,endgame));
 for(const k of ['sp','stigma','crystal','battle'])assert(t[k]<=expected[k],classKey+' endgame overspent '+k);
 assert.equal(planner.isEndgamePointLevel({...endgame,level:46}),false,'future caps need new verified rewards');
}
console.log('PASS eight-class endgame baseline, level boundary, personal budgets, legacy extras, reset and recommendation limits');
