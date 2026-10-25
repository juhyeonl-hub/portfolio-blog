import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleUrl} from './modules.mjs';
const {calculateTrade,minimumTradePrice,parseTradeDraft,parseTradeInteger,parseTradeRate,parsePurchaseDraft,tradeProfitExamples,tradeExample,MAX_TRADE_MONEY,maximumTradePurchase,calculateTradeLedger,restoreTradeLedger,parseSaleDraft,tradeProfitTarget,parseTradeMoney,restoreTradeDraft,changePurchaseMode}=await import(moduleUrl(readFileSync('lib/trade-calculator.ts','utf8')));
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

const custom=tradeProfitTarget(input,750n);
assert.equal(custom.target,975000n);assert.equal(custom.price,155278n);assert.equal(custom.result.profit,975020n);
for(const rate of [0n,1n,750n,1234n,9999n,10000n])for(const cost of [0n,1n,100n,13000000n,1000000000000n])for(const quantity of [1n,3n,101n]){
 const v={...input,totalCost:cost,quantity,fee:100n},row=tradeProfitTarget(v,rate);
 assert.equal(row.target,(cost*rate+9999n)/10000n);
 assert.ok(row.result.profit>=row.target);
 if(row.price>0n)assert.ok(calculateTrade(v,v.bundle,row.price-1n).profit<row.target);
}
assert.throws(()=>tradeProfitTarget(input,-1n));assert.throws(()=>tradeProfitTarget(input,10001n));
assert.equal(tradeProfitTarget({...input,taxBps:10000n},750n).price,null);
assert.equal(minimumTradePrice({...input,taxBps:0n},input.bundle,0n),130000n);
assert.equal(minimumTradePrice({...input,taxBps:0n},input.bundle,1n),130001n);
for(const target of ['', 'bad', '-5', '50만']){
 const parsed=parseSaleDraft({...tradeExample,target});assert.ok(parsed.value);assert.deepEqual(parsed.errors,{});
 assert.equal(calculateTrade(parsed.value).profit,500000n);
}
assert.ok(parseSaleDraft({...tradeExample,sell:''}).errors.sell);
const previousDraft={...tradeExample,buy:'13만 5천'};delete previousDraft.profitRate;
assert.equal(restoreTradeDraft(previousDraft).profitRate,'10');
assert.equal(restoreTradeDraft({...tradeExample,profitRate:'7.5'}).profitRate,'7.5');
console.log('PASS custom ROI targets/boundaries, exact break-even, independent optional goal, and saved percentage migration');

const upper=maximumTradePurchase(input,1000n);
assert.equal(upper.total,12272727n);assert.equal(upper.unit,122727n);assert.equal(upper.profitAtUnit,1227300n);
assert.equal(maximumTradePurchase({...input,sell:0n,fee:1n},0n),null);
assert.throws(()=>maximumTradePurchase(input,-1n));
for(const rounding of ['up','down'])for(const quantity of [1n,3n,7n])for(const bundle of [1n,2n,10n])for(const taxBps of [0n,1234n,10000n])for(const rate of [0n,750n,10000n]){
 const v={...input,sell:17n,quantity,bundle,taxBps,fee:1n,rounding};
 let net=0n;for(let left=quantity;left>0n;){const count=left<bundle?left:bundle,gross=count*v.sell;net+=gross-(gross*taxBps+(rounding==='up'?9999n:0n))/10000n-1n;left-=count;}
 const cap=maximumTradePurchase(v,rate);
 if(net<0n)assert.equal(cap,null);else{assert.ok((net-cap.total)*10000n>=cap.total*rate);assert.ok((net-cap.total-1n)*10000n<(cap.total+1n)*rate);assert.equal(cap.unit,cap.total/quantity);}
}
const oneSale=[{id:'a',quantity:'25',received:'3375000'}],partial=calculateTradeLedger(input,oneSale);
assert.equal(partial.realizedProfit,125000n);assert.equal(partial.inventoryCost,9750000n);assert.equal(partial.remainingPrice,142593n);assert.equal(partial.remaining,75n);
const noSales=calculateTradeLedger(input,[]);assert.equal(noSales.realizedProfit,0n);assert.equal(noSales.remainingPrice,144445n);
const allSales=calculateTradeLedger(input,[...oneSale,{id:'b',quantity:'75',received:'10125000'}]);assert.equal(allSales.realizedProfit,500000n);assert.equal(allSales.remaining,0n);assert.equal(allSales.remainingPrice,null);assert.equal(allSales.inventoryCost,0n);
assert.throws(()=>calculateTradeLedger(input,[{id:'a',quantity:'101',received:'0'}]));
assert.throws(()=>calculateTradeLedger(input,[{id:'a',quantity:'-1',received:'0'}]));
const odd={...input,totalCost:100n,quantity:3n,taxBps:0n,fee:0n};
assert.equal(calculateTradeLedger(odd,[{id:'a',quantity:'1',received:'50'}]).soldCost,33n);
assert.equal(calculateTradeLedger(odd,[{id:'a',quantity:'1',received:'50'}]).inventoryCost,67n);
assert.equal(calculateTradeLedger(odd,[{id:'a',quantity:'1',received:'150'}]).remainingPrice,0n);
assert.equal(calculateTradeLedger({...odd,taxBps:10000n},[{id:'a',quantity:'1',received:'50'}]).remainingPrice,null);
for(const received of [0n,20n,100n,150n])for(const taxBps of [0n,1234n,10000n])for(const fee of [0n,10n,100n]){
 const v={...odd,taxBps,fee},row=calculateTradeLedger(v,[{id:'a',quantity:'1',received:String(received)}]);
 assert.equal(row.soldCost+row.inventoryCost,row.cost);assert.equal(row.sold+row.remaining,v.quantity);
 if(row.remainingPrice!==null){const future={...v,totalCost:0n,quantity:row.remaining};assert.ok(calculateTrade(future,future.bundle,row.remainingPrice).net+received>=100n);if(row.remainingPrice>0n)assert.ok(calculateTrade(future,future.bundle,row.remainingPrice-1n).net+received<100n);}
}
assert.deepEqual(restoreTradeLedger({draft:tradeExample,sales:oneSale}),{draft:tradeExample,sales:oneSale});
assert.equal(restoreTradeLedger({draft:tradeExample,sales:[...oneSale,...oneSale]}),null);
assert.equal(restoreTradeLedger({draft:tradeExample,sales:[{id:'a',quantity:'no',received:'1'}]}),null);
assert.equal(restoreTradeLedger(null),null);
console.log('PASS buy ceiling independent oracle, partial/full sales, allocation conservation, remainder break-even and safe ledger restoration');

assert.equal(restoreTradeLedger({draft:{...tradeExample,rounding:'broken'},sales:[]}),null);
assert.equal(restoreTradeLedger({draft:{...tradeExample,buy:'x'.repeat(81)},sales:[]}),null);
