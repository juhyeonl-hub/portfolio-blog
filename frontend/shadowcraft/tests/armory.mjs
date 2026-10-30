import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const moduleOf=async source=>import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const client=await moduleOf(readFileSync('lib/armory-client.ts','utf8'));
const directory=JSON.parse(readFileSync('lib/data/servers.json','utf8'));
for(const region of ['eu','nae','naw','la','as']){
 assert(directory[region].length>0);
 assert(directory[region].every(s=>Number.isInteger(s.serverId)&&s.serverName&&[1,2].includes(s.raceId)));
}
let called;
globalThis.fetch=async (url,options)=>{called={url,options};return Response.json({servers:directory.eu})};
assert.equal((await client.queryArmory({action:'servers',region:'eu'})).servers.length,46);
assert.equal(called.url,'/api/public/shadowcraft/armory');assert.equal(called.options.method,'POST');assert.equal(JSON.parse(called.options.body).region,'eu');
globalThis.fetch=async()=>new Response('<html>login</html>',{headers:{'Content-Type':'text/html'}});
await assert.rejects(client.queryArmory({action:'search'}),/페이지를 새로고침/);
globalThis.fetch=async()=>Response.json({error:'공개 전투정보실 응답 502'},{status:502});
await assert.rejects(client.queryArmory({action:'search'}),/502/);
globalThis.fetch=async()=>{throw new TypeError('Failed to fetch')};
await assert.rejects(client.queryArmory({action:'search'}),/인터넷 연결을 확인/);
console.log('PASS: selectable regions and lookup client failure handling');
