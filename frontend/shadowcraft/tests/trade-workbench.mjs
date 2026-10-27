import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
const tradeUrl=moduleUrl(readFileSync('lib/trade-calculator.ts','utf8'));
const load=file=>import(moduleUrl(readFileSync(file,'utf8').replace("'./trade-calculator'",JSON.stringify(tradeUrl))));
const {emptyWorkbook,workbookTotals,workbookRemainingPrice,parseWorkbook,parseEntryAmount,legacyItemBook}=await load('lib/trade-workbook.ts');
const {emptyCraft,calculateCraft,parseCraft}=await load('lib/craft-comparison.ts');
const {tradePriceCandidates,quantityFromPrices}=await load('lib/trade-screenshot.ts');
const {tradeExample,parsePurchaseDraft,calculateTrade}=await import(tradeUrl);
const at='2026-10-25T00:00:00.000Z';
const e=(kind,q,amount,id=Math.random().toString())=>({id,kind,quantity:String(q),amount:String(amount),at});
const entries=[e('buy',100,13000000),e('sale',25,3375000)];
let total=workbookTotals(entries);assert.equal(total.realizedProfit,125000n);assert.equal(total.remaining,75n);assert.equal(total.inventoryCost,9750000n);
entries.push(e('buy',25,3000000));total=workbookTotals(entries);assert.equal(total.realizedProfit,125000n);assert.equal(total.inventoryCost,12750000n);assert.equal(total.average,127500n);assert.equal(total.rows[1].profit,125000n);
entries.push(e('sale',100,13500000));total=workbookTotals(entries);assert.equal(total.realizedProfit,875000n);assert.equal(total.remaining,0n);assert.equal(total.inventoryCost,0n);
assert.equal(total.spent,total.soldCost+total.inventoryCost);assert.equal(total.received-total.spent,total.realizedProfit-total.inventoryCost);
const fractional=workbookTotals([e('buy',3,100),e('sale',1,40),e('sale',1,40),e('sale',1,40)]);assert.deepEqual(fractional.rows.slice(1).map(r=>r.assignedCost),[33n,33n,34n]);assert.equal(fractional.realizedProfit,20n);
assert.throws(()=>workbookTotals([e('sale',1,1)]));assert.throws(()=>workbookTotals([e('buy',1,100),e('sale',2,200)]));assert.throws(()=>workbookTotals([e('buy',1000000,1),e('buy',1,1)]));
assert.throws(()=>workbookTotals([e('buy',1,-1)]));assert.throws(()=>workbookTotals([e('wat',1,1)]));
assert.deepEqual(parseEntryAmount('13만','100','unit'),{quantity:100n,amount:13000000n});assert.deepEqual(parseEntryAmount('1300만','100','total'),{quantity:100n,amount:13000000n});assert.equal(parseEntryAmount('13x','1','unit'),null);
const partial=workbookTotals(entries.slice(0,2)),conditions=parsePurchaseDraft(tradeExample).value;
assert.equal(workbookRemainingPrice(partial,conditions),142593n);assert.equal(workbookRemainingPrice(partial,{...conditions,taxBps:10000n}),null);assert.equal(workbookRemainingPrice(total,conditions),null);
// Cash recovery supports aggregate receipts well above a single input's money limit.
const huge=workbookTotals([e('buy',1000000,1000000000000000000n),e('sale',500000,900000000000000000n)]);
const price=workbookRemainingPrice(huge,conditions);assert.ok(price>0n);const needed=huge.spent-huge.received,future={...conditions,buy:0n,totalCost:0n,quantity:huge.remaining};assert.ok(calculateTrade(future,future.bundle,price).net>=needed);assert.ok(calculateTrade(future,future.bundle,price-1n).net<needed);
const recovered=workbookTotals([e('buy',2,1),e('sale',1,100)]);assert.equal(workbookRemainingPrice(recovered,conditions),0n);
const book={version:1,selected:'x',legacyImported:false,books:[{id:'x',name:'오드',entries}]};assert.deepEqual(parseWorkbook(JSON.stringify(book)),book);assert.deepEqual(parseWorkbook(null),emptyWorkbook());
for(const value of [{...book,version:2},{...book,selected:'missing'},{...book,books:[book.books[0],book.books[0]]},{...book,books:[{...book.books[0],entries:[entries[0],entries[0]]}]},{...book,books:[{...book.books[0],entries:[{...entries[0],at:'bad'}]}]}])assert.throws(()=>parseWorkbook(JSON.stringify(value)));
assert.throws(()=>parseWorkbook('{bad'));assert.throws(()=>parseWorkbook(' '.repeat(4000001)));
const old={draft:{...tradeExample,buy:'13만'},sales:[{id:'old',quantity:'25',received:'337만5천'}]};const migrated=legacyItemBook(JSON.stringify(old),'import',at);assert.equal(workbookTotals(migrated.entries).realizedProfit,125000n);assert.equal(old.sales[0].received,'337만5천');assert.throws(()=>legacyItemBook('{}','bad',at));
// Deterministic transaction series checks conservation and no retroactive revaluation.
for(let seed=1;seed<=100;seed++){const rows=[];let previousProfit=0n;for(let j=0;j<20;j++){rows.push(e('buy',seed%7+3,seed*13+j+1));let v=workbookTotals(rows);assert.equal(v.realizedProfit,previousProfit);rows.push(e('sale',1,j+30));v=workbookTotals(rows);previousProfit=v.realizedProfit;assert.equal(v.spent,v.soldCost+v.inventoryCost);assert.equal(v.received-v.spent,v.realizedProfit-v.inventoryCost);}}
console.log('PASS workbook: sequential weighted cost, partial/additional purchases, oversold, limits, exact residuals, recovery boundary, migration, corrupt data, 2000 transaction pairs');
let craft={...emptyCraft(),materials:[{id:'a',name:'재료',quantity:'10',price:'100'}],cost:'100',output:'2',sell:'1000'};
let result=calculateCraft(craft);assert.equal(result.totalCost,1100n);assert.equal(result.profit,700n);assert.equal(result.materialNet,900n);assert.equal(result.craftNet,1700n);assert.equal(result.advantage,800n);
assert.deepEqual(parseCraft(JSON.stringify(craft)),craft);assert.deepEqual(parseCraft(null),emptyCraft());
assert.equal(calculateCraft({...craft,tax:'100'}).profit,-1100n);assert.equal(calculateCraft({...craft,sell:'100'}).advantage,-820n);assert.equal(calculateCraft({...craft,fee:'10'}).profit,690n);
for(const patch of [{output:'0'},{cost:'-1'},{sell:''},{tax:'100.01'},{materials:[]},{materials:[{id:'a',name:'',quantity:'0',price:'1'}]}])assert.equal(calculateCraft({...craft,...patch}),null);
assert.throws(()=>parseCraft(JSON.stringify({...craft,materials:[craft.materials[0],craft.materials[0]]})));assert.throws(()=>parseCraft('{bad'));
craft={...craft,materials:[{id:'a',name:'a',quantity:'1',price:'1'},{id:'b',name:'b',quantity:'1',price:'1'}],cost:'0',output:'2',sell:'1',tax:'10',fee:'0'};assert.equal(calculateCraft(craft).materialNet,0n);assert.equal(calculateCraft(craft).craftNet,1n);assert.equal(calculateCraft({...craft,rounding:'down'}).advantage,0n);
console.log('PASS crafting: acquired vs owned materials, fees per listing, rounding, loss, 100% tax, incomplete/invalid values');
assert.deepEqual(tradePriceCandidates('순수한 오드\n12만9998 38만9994\n2일 23시간\n현재 세율 10%').map(x=>x.value),['129998','389994']);
assert.deepEqual(tradePriceCandidates('129,998\n129,998\n100개\n150%\n0\n-').map(x=>x.value),['129998']);
assert.equal(quantityFromPrices('12만9998','38만9994'),'3');assert.equal(quantityFromPrices('13만','1300만'),'100');assert.equal(quantityFromPrices('3','10'),'');assert.equal(quantityFromPrices('0','0'),'');assert.equal(quantityFromPrices('1','1000001'),'');
assert.equal(tradePriceCandidates('아무 숫자도 없습니다').length,0);
console.log('PASS OCR parsing: Korean price candidates, quantity/time/percent exclusions, duplicates and exact quantity inference');

// New price-first crafting guide: auxiliary materials, yield, rounding, and
// partial input must never depend on knowing a sale price or owning materials.
const {craftSalePrices}=await load('lib/craft-sale.ts');
const wood={...emptyCraft(),materials:[{id:'wood',name:'wood',quantity:'2',price:'5254'},{id:'paper',name:'sandpaper',quantity:'1',price:'400'}]};
let guide=craftSalePrices(wood);
assert.equal(guide.totalCost,10908n);assert.deepEqual(guide.lines,[10508n,400n]);assert.equal(guide.breakEven,12120n);assert.equal(guide.firstProfit,12122n);
assert.deepEqual(guide.examples.map(x=>x.price),[12120n,12727n,13333n,14545n]);
assert.deepEqual(guide.examples.map(x=>x.target),[0n,546n,1091n,2182n]);
assert.equal(guide.target.result.profit,1091n);assert.equal(guide.target.result.net,11999n);
assert.equal(craftSalePrices({...wood,sell:'13000'}).actual.profit,792n);
assert.equal(craftSalePrices({...wood,sell:'bad'}).breakEven,12120n);
assert.equal(craftSalePrices({...wood,materials:wood.materials.map(m=>({...m,owned:'100'}))}).totalCost,10908n);
assert.equal(craftSalePrices(wood,'').target,null);assert.equal(craftSalePrices(wood,'100.01').target,null);
assert.equal(craftSalePrices({...wood,tax:'0'}).breakEven,10908n);
assert.equal(craftSalePrices({...wood,tax:'100'}).breakEven,null);
assert.equal(craftSalePrices({...wood,output:'2'}).breakEven,6060n);
assert.equal(craftSalePrices({...wood,output:'2',fee:'100'}).breakEven,6116n);
assert.equal(craftSalePrices({...wood,cost:'100'}).totalCost,11008n);
for(const patch of [{output:'0'},{output:'1000001'},{tax:'100.01'},{cost:'-1'},{fee:''},{rounding:'invalid'},{materials:[]},{materials:[{...wood.materials[0],quantity:''}]},{materials:[{...wood.materials[0],price:'bad'}]}])assert.equal(craftSalePrices({...wood,...patch}),null);
let checked=0;
for(const rounding of ['up','down'])for(const tax of ['0','10','99.99','100'])for(const output of ['1','2','100'])for(const fee of ['0','400']){
 const g=craftSalePrices({...wood,rounding,tax,output,fee});
 for(const x of g.examples){if(x.price===null){assert.equal(tax,'100');continue;}assert.ok(calculateTrade(g.input,g.quantity,x.price).profit>=x.target);if(x.price>0n)assert.ok(calculateTrade(g.input,g.quantity,x.price-1n).profit<x.target);checked++;}
}
const hugeGuide=craftSalePrices({...wood,materials:[{id:'huge',name:'',quantity:'1000000',price:'1000000000000'}]});assert.equal(hugeGuide.totalCost,1000000000000000000n);assert.ok(hugeGuide.target.price>1000000000000n);
const zero=craftSalePrices({...wood,materials:[{id:'z',name:'',quantity:'1',price:'0'}],tax:'100'});assert.equal(zero.breakEven,0n);assert.equal(zero.firstProfit,null);
assert.deepEqual(parseCraft(JSON.stringify(wood)),wood);assert.equal(calculateCraft(wood),null); // Legacy behavior preserved.
const {craftSaleCopy,craftSaleText}=await import(moduleUrl(readFileSync('lib/craft-sale-text.ts','utf8')));
for(const [key,variants] of Object.entries(craftSaleCopy)){assert.equal(variants.length,4);const placeholders=v=>[...v.matchAll(/\{(\d+)\}/g)].map(m=>m[1]).sort();for(const [i,lang] of ['ko','en','ja','fi'].entries()){assert.ok(variants[i]);assert.deepEqual(placeholders(variants[i]),placeholders(variants[0]));assert.equal(craftSaleText(lang,key,['A','B','C','D']),variants[i].replace(/\{(\d+)\}/g,(_,n)=>['A','B','C','D'][Number(n)]));}}
console.log('PASS material-sale guide: 10908 example, exact minimum boundaries '+checked+', yield, fees, unknown sale, invalid inputs, huge costs, legacy draft compatibility, four-language parity');
