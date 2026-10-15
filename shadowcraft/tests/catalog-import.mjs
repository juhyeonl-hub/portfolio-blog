import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseCatalog,importCatalog,CLASSES} from '../operations/catalog-import.mjs';
for (const key of CLASSES) {
 const raw=readFileSync(new URL(`../../backend/src/main/resources/shadowcraft/${key}.json`,import.meta.url),'utf8');
 const catalog=parseCatalog(raw,key);assert.equal(catalog.classKey,key);
 const original=JSON.stringify(catalog);let called;
 const result=await importCatalog({origin:'http://127.0.0.1:8081',apiKey:'test-only',key,catalog,
  fetchImpl:async(url,options)=>{called={url,options};return Response.json({catalog:{...catalog,reviewRequired:true}})}});
 assert.equal(called.url.pathname,`/api/admin/shadowcraft/catalog/${key}`);assert.equal(called.options.headers['X-API-Key'],'test-only');
 assert.equal(result.catalog.reviewRequired,true);assert.equal(JSON.stringify(catalog),original);
 await assert.rejects(importCatalog({origin:'https://example.com',token:'test-only',key,catalog,fetchImpl:async()=>Response.json({error:'bad'},{status:400})}),/previous catalog retained/);
}
const catalog=parseCatalog(readFileSync(new URL('../../backend/src/main/resources/shadowcraft/assassin.json',import.meta.url),'utf8'),'assassin');
for(const origin of ['http://example.com','https://user:pass@example.com','https://example.com/path','file:///tmp/catalog'])await assert.rejects(importCatalog({origin,token:'test-only',key:'assassin',catalog}));
await assert.rejects(importCatalog({origin:'https://example.com',key:'assassin',catalog}));
assert.throws(()=>parseCatalog('{}','assassin'));assert.throws(()=>parseCatalog(JSON.stringify(catalog),'sorcerer'));assert.throws(()=>parseCatalog('x'.repeat(3_000_001),'assassin'));
console.log('Manual catalog import: all classes, authentication, origin validation, schema/size failures and no local mutation passed');
