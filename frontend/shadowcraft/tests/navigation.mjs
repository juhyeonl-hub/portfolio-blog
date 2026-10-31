import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
const {screenHash,screenFromHash}=await import(moduleUrl(readFileSync('lib/navigation.ts','utf8')));
for(const screen of ['save','people','home','quick','skills','daevanion','gear','macro','rotation','compare','rankers','public-builds','map','timers','population','trade','builds','database','updates','account']){
 assert.equal(screenFromHash(screenHash(screen)),screen);
}
for(const hash of ['#privacy','#published=123','#build=payload','#transfer','#steam-code=abc','#steam-new=abc','#steam-linked=abc','#steam-error=expired','#/invalid'])assert.equal(screenFromHash(hash),null,hash);
assert.equal(screenFromHash('#/people?kind=author&author=123'),'people');
assert.equal(screenFromHash(''),'home');assert.equal(screenFromHash('#'),'home');
console.log('PASS screen routes: roundtrips and no overlap with reserved shared/auth/transfer hashes');

// Shared nav must expose every top-level tool in both planner and public readers.
const {SITE_NAV,navActive}=await import(moduleUrl(readFileSync('lib/site-navigation.ts','utf8')));
const links=SITE_NAV.flatMap(group=>'id' in group?[group]:group.items);
assert.equal(new Set(links.map(link=>link.id)).size,links.length);
assert.deepEqual(links.map(link=>link.id).sort(),['home','quick','people','public-builds','rankers','map','timers','population','trade','builds','database','updates'].sort());
for(const link of links)assert.equal(screenFromHash(screenHash(link.id)),link.id);
for(const screen of ['quick','skills','daevanion','gear','macro','rotation','compare','save'])assert.equal(navActive(screen,'quick'),true);
for(const screen of ['home','people','public-builds','rankers','map','timers','population','trade','builds','database','updates']){
 assert.equal(navActive(screen,'quick'),false);assert.equal(navActive(screen,screen),true);
}
console.log('PASS shared navigation: all tools reachable once, planner sections highlight Build');
