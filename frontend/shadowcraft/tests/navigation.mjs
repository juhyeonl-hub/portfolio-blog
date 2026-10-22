import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
const {screenHash,screenFromHash}=await import(moduleUrl(readFileSync('lib/navigation.ts','utf8')));
for(const screen of ['home','quick','skills','daevanion','gear','macro','rotation','compare','rankers','public-builds','map','builds','database','updates','account']){
 assert.equal(screenFromHash(screenHash(screen)),screen);
}
for(const hash of ['#privacy','#published=123','#build=payload','#transfer','#steam-code=abc','#steam-new=abc','#steam-linked=abc','#steam-error=expired','#/invalid'])assert.equal(screenFromHash(hash),null,hash);
assert.equal(screenFromHash(''),'home');assert.equal(screenFromHash('#'),'home');
console.log('PASS screen routes: roundtrips and no overlap with reserved shared/auth/transfer hashes');
