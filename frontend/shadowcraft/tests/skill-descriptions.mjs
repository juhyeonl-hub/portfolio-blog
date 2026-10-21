import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// Every playable skill of every class has an official English description for the hover card; no stray ids.
const descriptions=JSON.parse(readFileSync('lib/data/skill-descriptions.json','utf8'));
const ids=new Set();
for(const key of ['gladiator','templar','ranger','assassin','elementalist','sorcerer','cleric','chanter']){
 const c=JSON.parse(readFileSync(`lib/data/catalogs/${key}.json`,'utf8'));
 for(const s of c.skills){ids.add(s.id);assert.ok(descriptions[s.id]?.en?.trim(),`${key}: ${s.id} ${s.name} has no description`);}
}
for(const [id,entry] of Object.entries(descriptions)){assert.ok(ids.has(id),'description for unknown skill '+id);assert.ok(entry.en.length<2000&&!/<\/?script/i.test(entry.en),id);}
console.log('Skill descriptions: all',ids.size,'catalog skills covered, no stray ids PASS');
