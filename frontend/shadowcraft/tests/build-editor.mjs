import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl,planner,plannerUrl,classesUrl} from './modules.mjs';
const memoryUrl=moduleUrl(readFileSync('lib/plan-memory.ts','utf8'));
const share=await import(moduleUrl(readFileSync('lib/build-share.ts','utf8').replace("'./plan-memory'",JSON.stringify(memoryUrl)).replace("'./planner'",JSON.stringify(plannerUrl)).replace("'./classes'",JSON.stringify(classesUrl))));
const editor=await import(moduleUrl(readFileSync('lib/build-editor.ts','utf8').replace("'./planner'",JSON.stringify(plannerUrl))));
for(const key of ['assassin','gladiator','templar','ranger','elementalist','sorcerer','cleric','chanter']){
 const c=JSON.parse(readFileSync(`lib/data/catalogs/${key}.json`));
 const personal=planner.emptyPlan(c), before=JSON.stringify(personal);
 let p=share.publicBuild(c,personal).plan;const skill=c.skills.find(s=>!s.stigma&&planner.maxBase(s,45)>1);
 p=editor.editBuildDraft(c,p,{base:{...p.base,[skill.id]:1},specs:{...p.specs,[skill.id]:[]}});
 assert.equal(p.base[skill.id],1);assert.equal(JSON.stringify(personal),before);
 assert.deepEqual(p.specs[skill.id],[],'manual edit does not auto-select specs');
 const stigma=c.skills.filter(s=>s.stigma&&planner.maxBase(s,45)>0).slice(-2).map(s=>s.id);p={...p,stigmaSkills:stigma};
 assert.deepEqual(planner.equipped(p),stigma);p={...p,base:{...p.base,[stigma[0]]:1}};
 const guide={skills:'First skill, then passive.',daevanion:'Take the connecting route first.',equipment:'Save materials.',items:[{slot:'MainHand',name:'Author weapon',upgrade:'+7 target',options:'Skill +1',reason:'Temporary choice'}]};
 const shared={...share.publicBuild(c,p),guide};assert.deepEqual(share.decodeShare(share.encodeShare(shared)),shared);
 assert.deepEqual(shared.plan.stigmaSkills,stigma);share.validateReferences(shared,c);
 for(const mutate of [g=>g.secret='private',g=>g.items[0].owner='private',g=>g.skills='x'.repeat(601),g=>g.items.push(g.items[0]),g=>g.items[0].slot='bad',g=>g.items[0].name='',g=>g.items[0].options='x'.repeat(241)]){const bad=structuredClone(shared);mutate(bad.guide);assert.throws(()=>share.validateShare(bad));}
 const invalidStigma=structuredClone(shared);invalidStigma.plan.stigmaSkills=[skill.id];assert.throws(()=>share.validateReferences(invalidStigma,c));
 const board=c.boards.find(b=>b.requiredLevel<=p.level&&b.pointKind.code!=='battlecrystal');
 const clean={...p,nodes:c.boards.flatMap(b=>b.nodes.filter(n=>n.autoLearn).map(n=>n.id)),pointBudget:{sp:9999,stigma:9999,crystal:9999,battle:9999}};
 const target=board.nodes.find(n=>!n.autoLearn&&n.requiredLevel<=p.level&&planner.cheapestPath(board,clean.nodes,n.id).length>2);
 assert.ok(target,key+' connected target');const added=editor.changeDraftNode(c,clean,board,target.id);assert.ok(added.nodes.includes(target.id));assert.ok(added.nodes.length>clean.nodes.length+1);
 const removed=editor.changeDraftNode(c,added,board,target.id);assert.ok(!removed.nodes.includes(target.id));
 assert.deepEqual(editor.draftProblems(c,added),[],key);
 const low=editor.editBuildDraft(c,added,{level:1});assert.equal(low.pointBudget,undefined);assert.deepEqual(low.stigmaSkills,[]);assert.ok(editor.draftProblems(c,low).every(message=>message.startsWith('사용 포인트')), 'lowering level must clear locked skills and nodes; preserve explicit budget warning');
 const over={...added,pointBudget:{sp:0,stigma:0,crystal:0,battle:0}};assert.ok(editor.draftProblems(c,over).length);
 assert.equal(editor.changeDraftNode(c,low,board,target.id),low);
}
console.log('Build editor: 8 classes, isolated drafts, explicit stigma selection, guide roundtrip/privacy validation, node paths, locked levels and budgets PASS');
