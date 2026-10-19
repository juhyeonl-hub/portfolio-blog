import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {onRequest}=await import(pathToFileURL('../asbc-pages/functions/api/[[path]].js').href);
const calls=[];globalThis.fetch=async(url,init)=>{calls.push({url,init});return new Response('ok',{status:302,headers:{Location:'https://steamcommunity.com/openid/login?x'}});};
// GET keeps path and query, forwards headers (cookies, Origin), passes redirects through untouched.
let res=await onRequest({request:new Request('https://asbc.test/api/community/auth/steam/start?a=1',{headers:{Cookie:'asbc_steam=s',Origin:'https://asbc.test'}}),env:{}});
assert.equal(calls[0].url,'https://api.juhyeonl.dev/api/community/auth/steam/start?a=1');
assert.equal(calls[0].init.method,'GET');assert.equal(calls[0].init.body,undefined);assert.equal(calls[0].init.redirect,'manual');
assert.equal(calls[0].init.headers.get('cookie'),'asbc_steam=s');assert.equal(calls[0].init.headers.get('origin'),'https://asbc.test');
assert.equal(res.status,302);assert.equal(res.headers.get('location'),'https://steamcommunity.com/openid/login?x');
// POST forwards the body; the backend origin can be overridden in the Pages settings.
res=await onRequest({request:new Request('https://asbc.test/api/community/builds',{method:'POST',body:'{"t":1}',headers:{'Content-Type':'application/json'}}),env:{ASBC_API_ORIGIN:'https://api.asbc.test'}});
assert.equal(calls[1].url,'https://api.asbc.test/api/community/builds');assert.equal(calls[1].init.method,'POST');
assert.equal(await new Response(calls[1].init.body).text(),'{"t":1}');
console.log('Pages API proxy: path/query, headers and cookies, POST body, manual redirects and backend override PASS');
