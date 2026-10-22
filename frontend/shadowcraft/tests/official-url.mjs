import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
const {isOfficialUrl}=await import(moduleUrl(readFileSync('lib/official-url.ts','utf8')));
for(const url of ['https://aion2.plaync.com/en-us/index','https://steamcommunity.com/openid/login','https://store.steampowered.com/app/'])assert.equal(isOfficialUrl(url),true,url);
for(const url of ['https://aion2.gaming.tools','https://a2tools.app','https://github.com/taengu','https://plaync.com.evil.test','https://evilplaync.com','https://plaync.com@evil.test','https://user@plaync.com','http://plaync.com','javascript:alert(1)','//plaync.com','https://plaync.com:9999'])assert.equal(isOfficialUrl(url),false,url);
const profiles=JSON.parse(readFileSync('lib/data/class-profiles.json')),notes=JSON.parse(readFileSync('lib/data/manual-skill-purpose.json'));
for(const profile of profiles)for(const id of [...profile.movement,...profile.manual])assert.ok(notes[id]?.length>15,profile.key+' '+id+' purpose');
console.log('Official navigation allowlist and manual skill purpose coverage PASS');

const messages=JSON.parse(readFileSync('lib/data/ui-translations.json'));for(const note of Object.values(notes))for(const language of ['en','ja','fi'])assert.ok(messages[note]?.[language],note+' '+language);
console.log('All manual skill purposes have en/ja/fi translations PASS');
