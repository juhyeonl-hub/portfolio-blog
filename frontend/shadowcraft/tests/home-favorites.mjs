import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
const {parseFavorites,favoritesKey}=await import(moduleUrl(readFileSync('lib/home-favorites.ts','utf8')));
assert.deepEqual(parseFavorites('[]'),[]);
assert.deepEqual(parseFavorites('["map","map","quick"]'),['map','quick']);
for(const raw of ['null','{}','bad','[1]','["unknown"]','["map","map","map","map","map","map","map"]'])assert.throws(()=>parseFavorites(raw));
assert.notEqual(favoritesKey('a'),favoritesKey('b'));
console.log('PASS favorites validation, empty selection, dedupe and account keys');
