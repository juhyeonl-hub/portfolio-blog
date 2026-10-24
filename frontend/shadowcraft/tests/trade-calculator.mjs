import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
const {calculateTrade,minimumTradePrice,parseTradeDraft,parseTradeInteger,parseTradeRate,parsePurchaseDraft,tradeProfitExamples,tradeExample,MAX_TRADE_MONEY,parseTradeMoney,restoreTradeDraft,changePurchaseMode}=await import(moduleUrl(readFileSync('lib/trade-calculator.ts','utf8')));
const input=parseTradeDraft(tradeExample).value;
assert.ok(input);
for(const size of [25n,50n,100n]){
 const result=calculateTrade(input,size);
 assert.equal(result.cost,13_000_000n);assert.equal(result.gross,15_000_000n);assert.equal(result.tax,1_500_000n);assert.equal(result.profit,500_000n);
 assert.equal(result.full.profit,5000n*size);assert.equal(minimumTradePrice(input,size),144445n);assert.equal(minimumTradePrice(input,size,500000n),150000n);
}
for(const [size,profit] of [[25n,496000n],[50n,498000n],[100n,499000n]])assert.equal(calculateTrade({...input,fee:1000n},size).profit,profit);
const leftover=calculateTrade({...input,quantity:101n});assert.equal(leftover.listingCount,5n);assert.equal(leftover.remainder,1n);assert.equal(leftover.last.profit,5000n);assert.equal(leftover.profit,505000n);
assert.equal(calculateTrade({...input,quantity:3n,bundle:25n}).listingCount,1n);
assert.equal(calculateTrade({...input,sell:130000n}).profit,-1300000n);
assert.equal(minimumTradePrice({...input,taxBps:0n}),130001n);
assert.equal(minimumTradePrice({...input,taxBps:10000n}),null);
assert.equal(minimumTradePrice({...input,buy:0n,taxBps:0n},25n,0n),0n);
const large=calculateTrade({...input,buy:1_000_000_000_000n,sell:1_000_000_000_000n,quantity:1_000_000n,bundle:1_000_000n});assert.equal(large.cost,1_000_000_000_000_000_000n);assert.equal(large.profit,-100_000_000_000_000_000n);
assert.equal(parseTradeInteger('130,000',MAX_TRADE_MONEY),130000n);
for(const text of ['', '-1','1.5','1e6','Infinity','NaN','13만','13,00','1,','1000000000001'])assert.equal(parseTradeInteger(text,MAX_TRADE_MONEY),null,text);
assert.equal(parseTradeRate('10.25'),1025n);
for(const text of ['','-1','100.01','1e1','10.001'])assert.equal(parseTradeRate(text),null,text);
for(const [key,bad] of [['quantity','0'],['bundle','0'],['tax','101'],['buy','-1'],['sell',''],['target','-5'],['fee','1.2']])assert.ok(parseTradeDraft({...tradeExample,[key]:bad}).errors[key]);
assert.throws(()=>calculateTrade({...input,bundle:0n}));
// Independent small-number oracle enumerates every listing, including remainder.
let cases=0;
for(const rounding of ['up','down'])for(const taxBps of [0n,1n,1000n,1234n,9999n])for(const q of [1n,3n,8n])for(const bundle of [1n,2n,5n,100n]){
 const v={...input,buy:7n,sell:19n,fee:2n,quantity:q,bundle,taxBps,rounding};
 let tax=0,fees=0;
 for(let remaining=Number(q);remaining>0;remaining-=Number(bundle)){const amount=Math.min(remaining,Number(bundle));tax+=(rounding==='up'?Math.ceil:Math.floor)(amount*19*Number(taxBps)/10000);fees+=2;}
 const result=calculateTrade(v);assert.equal(result.tax,BigInt(tax));assert.equal(result.profit,BigInt(Number(q)*12-tax-fees));
 for(const target of [0n,1n,17n]){const price=minimumTradePrice(v,bundle,target);assert.notEqual(price,null);assert.ok(calculateTrade(v,bundle,price).profit>=target);if(price>0n)assert.ok(calculateTrade(v,bundle,price-1n).profit<target);}
 cases++;
}
const rounded={...input,buy:0n,sell:1n,quantity:10n,bundle:1n};
assert.equal(calculateTrade(rounded).tax,10n);assert.equal(calculateTrade(rounded,10n).tax,1n);
console.log(`PASS trade calculator: screenshot example, lots/remainders, fees, loss, exact large integers, validation, rounding and minimum-price boundaries (${cases} oracle cases)`);

const purchase=parsePurchaseDraft({...tradeExample,sell:'',target:'not-a-number'});assert.ok(purchase.value);assert.deepEqual(purchase.errors,{});
const examples=tradeProfitExamples(purchase.value);
assert.deepEqual(examples.map(row=>row.price),[144445n,151667n,158889n,173334n]);
assert.equal(examples[2].result.profit,1300008n);
for(const buy of [0n,1n,130000n,200000n])for(const quantity of [1n,101n,100n])for(const fee of [0n,1000n]){
 const v={...purchase.value,buy,quantity,fee};
 for(const row of tradeProfitExamples(v)){
  assert.ok(row.result.profit>=row.target);assert.ok(row.target*100n>=buy*quantity*BigInt(row.percent));
  if(row.price>0n)assert.ok(calculateTrade(v,v.bundle,row.price-1n).profit<row.target);
 }
}
assert.ok(tradeProfitExamples({...purchase.value,taxBps:10000n}).every(row=>row.price===null&&row.result===null));
assert.ok(parsePurchaseDraft({...tradeExample,tax:'101'}).errors.tax);
assert.ok(parsePurchaseDraft({...tradeExample,quantity:''}).errors.quantity);
console.log('PASS purchase-only examples: hidden manual fields ignored, exact ROI targets, changing cost/quantity/fees, minimum price boundaries and impossible rates');

for(const [raw,expected] of [['13만',130000n],['13만 5천',135000n],['13.5만',135000n],['13만5천',135000n],['1억 5천만',150000000n],['1조',1000000000000n],['0.0001만',1n],['1천 2백 3십 4',1234n],['130,000',130000n],['0',0n],[' 13만  ',130000n]])assert.equal(parseTradeMoney(raw),expected,raw);
for(const raw of ['', '13 000', '13만 원', '13만?', '-13만', '1.2', '1e6', '1만 2억', '1만 2만', '1백 2천', '0.00001만','1.001천 0.5','13,00','1조 1','2조','1..5만','만','13만 5 2천','1'.repeat(41)])assert.equal(parseTradeMoney(raw),null,raw);
assert.equal(parsePurchaseDraft({...tradeExample,buy:'13만 5천'}).value.buy,135000n);
assert.equal(parseTradeDraft({...tradeExample,sell:'15만',fee:'1천',target:'50만'}).value.target,500000n);
const oldDraft={...tradeExample,buy:'20만',quantity:'3'};delete oldDraft.purchaseMode;
assert.deepEqual(restoreTradeDraft(oldDraft),{...oldDraft,purchaseMode:'unit'});
assert.deepEqual(restoreTradeDraft({...oldDraft,purchaseMode:'invalid'}),tradeExample);
assert.deepEqual(restoreTradeDraft(null),tradeExample);
const totalDraft=changePurchaseMode(tradeExample,'total');assert.equal(totalDraft.buy,'13000000');assert.equal(totalDraft.purchaseMode,'total');
assert.equal(changePurchaseMode(totalDraft,'unit').buy,'130000');
assert.equal(changePurchaseMode({...totalDraft,buy:'100',quantity:'3'},'unit').buy,'');
assert.equal(changePurchaseMode({...tradeExample,buy:'1조'},'total').buy,'');
const totalInput=parsePurchaseDraft({...tradeExample,purchaseMode:'total',buy:'1300만'}).value;
assert.equal(calculateTrade(totalInput,25n,150000n).profit,500000n);
assert.deepEqual(tradeProfitExamples(totalInput).map(row=>row.price),examples.map(row=>row.price));
// Non-divisible cost remains exact; don't invent a rounded per-item acquisition price.
for(const cost of [0n,1n,100n,1000000000000n])for(const quantity of [1n,3n,101n])for(const bundle of [1n,25n,100n]){
 const v={...input,totalCost:cost,quantity,bundle};
 const result=calculateTrade(v);assert.equal(result.cost,cost);assert.equal(result.profit,result.gross-result.tax-result.fees-cost);
 assert.equal(result.full.profit===null,cost%quantity!==0n);
 if(cost%quantity===0n)assert.equal(result.full.profit*result.fullCount+(result.last?.profit??0n),result.profit);
 for(const row of tradeProfitExamples(v)){
  assert.equal(row.target,(cost*BigInt(row.percent)+99n)/100n);
  assert.ok(row.result.profit>=row.target);
  if(row.price>0n)assert.ok(calculateTrade(v,bundle,row.price-1n).profit<row.target);
 }
}
assert.throws(()=>calculateTrade({...input,totalCost:-1n}));
console.log('PASS Korean money parsing, legacy draft migration, exact mode conversion, arbitrary total costs and ROI boundaries');
