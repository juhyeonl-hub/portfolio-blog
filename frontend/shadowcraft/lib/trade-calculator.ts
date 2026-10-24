// Kinah arithmetic stays integer-exact, including values above Number.MAX_SAFE_INTEGER.
export const MAX_TRADE_MONEY=1_000_000_000_000n;
export const MAX_TRADE_QUANTITY=1_000_000n;
export type TradeField='buy'|'sell'|'quantity'|'bundle'|'tax'|'fee'|'target';
export type TradeDraft=Record<TradeField,string> & {item:string;rounding:'up'|'down'};
export type TradeInput={buy:bigint;sell:bigint;quantity:bigint;bundle:bigint;taxBps:bigint;fee:bigint;target:bigint;rounding:'up'|'down'};
export const tradeExample:TradeDraft={item:'순수한 오드',buy:'130000',sell:'150000',quantity:'100',bundle:'25',tax:'10',fee:'0',target:'500000',rounding:'up'};
export function parseTradeInteger(raw:string,max:bigint,min=0n):bigint|null{
 const text=raw.trim();
 if(text.length>24||! /^(?:[0-9]+|[0-9]{1,3}(?:,[0-9]{3})+)$/.test(text))return null;
 const value=BigInt(text.replaceAll(',',''));return value>=min&&value<=max?value:null;
}
export function parseTradeRate(raw:string):bigint|null{
 const text=raw.trim();if(!/^[0-9]{1,3}(?:\.[0-9]{1,2})?$/.test(text))return null;
 const [whole,fraction='']=text.split('.');const value=BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));
 return value<=10000n?value:null;
}
export function parseTradeDraft(draft:TradeDraft):{value:TradeInput|null;errors:Partial<Record<TradeField,'money'|'quantity'|'rate'>>}{
 const errors:Partial<Record<TradeField,'money'|'quantity'|'rate'>>={};
 const money=(field:'buy'|'sell'|'fee'|'target')=>{const value=parseTradeInteger(draft[field],MAX_TRADE_MONEY);if(value===null)errors[field]='money';return value??0n;};
 const count=(field:'quantity'|'bundle')=>{const value=parseTradeInteger(draft[field],MAX_TRADE_QUANTITY,1n);if(value===null)errors[field]='quantity';return value??1n;};
 const taxBps=parseTradeRate(draft.tax);if(taxBps===null)errors.tax='rate';
 const value={buy:money('buy'),sell:money('sell'),fee:money('fee'),target:money('target'),quantity:count('quantity'),bundle:count('bundle'),taxBps:taxBps??0n,rounding:draft.rounding};
 return {value:Object.keys(errors).length?null:value,errors};
}
function check(input:TradeInput,bundle:bigint){
 if(input.buy<0n||input.sell<0n||input.quantity<1n||bundle<1n||input.fee<0n||input.target<0n||input.taxBps<0n||input.taxBps>10000n||!['up','down'].includes(input.rounding))throw Error('Invalid trade input');
}
export function calculateTrade(input:TradeInput,bundle=input.bundle,sell=input.sell){
 check(input,bundle);if(sell<0n)throw Error('Invalid sale price');
 const size=bundle<input.quantity?bundle:input.quantity;
 const fullCount=input.quantity/size,remainder=input.quantity%size,listingCount=fullCount+(remainder?1n:0n);
 const listing=(quantity:bigint)=>{const gross=sell*quantity,numerator=gross*input.taxBps;
  const tax=(numerator+(input.rounding==='up'?9999n:0n))/10000n;
  return {quantity,gross,tax,fee:input.fee,net:gross-tax-input.fee,profit:gross-tax-input.fee-input.buy*quantity};};
 const full=listing(size),last=remainder?listing(remainder):null;
 const gross=full.gross*fullCount+(last?.gross??0n),tax=full.tax*fullCount+(last?.tax??0n),fees=input.fee*listingCount,cost=input.buy*input.quantity;
 return {size,fullCount,remainder,listingCount,full,last,gross,tax,fees,cost,net:gross-tax-fees,profit:gross-tax-fees-cost};
}
// The net of one percentage tax is monotonic even with per-listing rounding.
// Search the integer unit price, not a rounded floating-point formula.
export function minimumTradePrice(input:TradeInput,bundle=input.bundle,target=1n):bigint|null{
 check(input,bundle);if(target<0n)throw Error('Invalid profit target');
 if(calculateTrade(input,bundle,0n).profit>=target)return 0n;
 if(input.taxBps===10000n)return null;
 let low=0n,high=1n;
 while(calculateTrade(input,bundle,high).profit<target)high*=2n;
 while(low+1n<high){const mid=(low+high)/2n;if(calculateTrade(input,bundle,mid).profit>=target)high=mid;else low=mid;}
 return high;
}
