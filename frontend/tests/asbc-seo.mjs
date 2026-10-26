import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {escapeHtml,renderGuide,sitemapXml} from '../asbc-seo.mjs';
import {origin,topics,guidePath} from '../asbc-pages/guides/content.mjs';
import ts from 'typescript';
const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const {calculateTrade,minimumTradePrice}=await import(moduleUrl(readFileSync('shadowcraft/lib/trade-calculator.ts','utf8')));
const known=new Set(['/',...['en','ko'].flatMap(locale=>['',...topics.map(t=>t.slug)].map(slug=>guidePath(locale,slug)))]);
const routes=readFileSync('shadowcraft/lib/navigation.ts','utf8');
const titles=new Set(),descriptions=new Set();
for(const locale of ['en','ko'])for(const topic of [null,...topics]){
 const html=renderGuide(locale,topic),path=guidePath(locale,topic?.slug||'');
 assert.ok(html.startsWith('<!doctype html>'));
 assert.ok(html.includes('<html lang="'+locale+'">'));
 assert.equal((html.match(/<h1>/g)||[]).length,1);
 assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
 assert.ok(html.includes('rel="canonical" href="'+origin+path+'"'));
 assert.ok(html.includes('property="og:url" content="'+origin+path+'"'));
 for(const language of ['en','ko','x-default'])assert.ok(html.includes('hreflang="'+language+'" href="'+origin+guidePath(language==='ko'?'ko':'en',topic?.slug||'')+'"'));
 assert.ok(!/noindex|onclick=|<script[^>]+src=/.test(html),'guide must work without JavaScript');
 const title=html.match(/<title>(.*?)<\/title>/)[1],description=html.match(/name="description" content="(.*?)"/)[1];
 assert.ok(!titles.has(title),'unique title');titles.add(title);assert.ok(!descriptions.has(description),'unique description');descriptions.add(description);
 const structured=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1]);
 assert.equal(structured.url,origin+path);assert.equal(structured.inLanguage,locale);assert.ok(!('aggregateRating' in structured));
 for(const [,href] of html.matchAll(/href="([^"]+)"/g)){
  if(href.startsWith('/#')){if(href!== '/#privacy')assert.ok(routes.includes("'"+href.slice(2)+"'"),'existing tool route '+href);}
  else if(href.startsWith('/')&&href!=='/guides.css'&&href!=='/asbc-icon-32.png')assert.ok(known.has(href),'static page target exists: '+href);
  else if(href.startsWith('https:'))assert.ok(href.startsWith(origin+'/')||href.startsWith('https://aion2.plaync.com/'),'no third-party outbound promotion');
 }
 if(topic){assert.ok(html.includes('href="/#'+topic.route+'"'));assert.equal((html.match(/<li>/g)||[]).length,3,'each tool has a usable three-step entry');assert.ok((html.match(/<h2>/g)||[]).length>=4,'steps, explanation and related guides are rendered');}
}
assert.equal(escapeHtml('<"&\''),'&lt;&quot;&amp;&#39;');
const xml=sitemapXml();assert.equal((xml.match(/<url>/g)||[]).length,known.size);assert.ok(!xml.includes('#'));for(const path of known)assert.ok(xml.includes('<loc>'+origin+path+'</loc>'));
assert.equal(readFileSync('asbc-pages/sitemap.xml','utf8'),xml,'checked sitemap must match generated pages');
const root=readFileSync('asbc.html','utf8');assert.ok(root.includes('<html lang="en">'));assert.ok(root.includes('<h1>'));for(const topic of topics)assert.ok(root.includes('href="'+guidePath('en',topic.slug)+'"'));assert.equal((root.match(/rel="canonical"/g)||[]).length,1);
assert.ok(readFileSync('shadowcraft/app/page.tsx','utf8').includes('/ko/guides/'),'guides remain visible after app mounts');
const example={buy:130000n,sell:150000n,quantity:100n,bundle:25n,taxBps:1000n,fee:0n,target:0n,rounding:'up'};
for(const bundle of [25n,50n,100n]){const r=calculateTrade(example,bundle);assert.equal(r.tax,1500000n);assert.equal(r.profit,500000n);}
assert.equal(minimumTradePrice(example,25n,0n),144445n);
assert.equal(calculateTrade({...example,fee:1000n},25n).profit,496000n);
assert.equal(calculateTrade({...example,fee:1000n},100n).profit,499000n);
assert.ok(root.includes('name="google-site-verification"'));
console.log('PASS SEO:',titles.size,'static guides,',known.size,'sitemap URLs; metadata, languages, links, no-JS content and trading examples');
