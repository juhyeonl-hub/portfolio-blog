// Kinah arithmetic stays integer-exact, including values above Number.MAX_SAFE_INTEGER.
export const MAX_TRADE_MONEY=1_000_000_000_000n;
export const MAX_TRADE_QUANTITY=1_000_000n;
export type TradeField='buy'|'sell'|'quantity'|'bundle'|'tax'|'fee'|'target'|'profitRate';
export type PurchaseMode='unit'|'total';
export type TradeDraft=Record<TradeField,string> & {item:string;rounding:'up'|'down';purchaseMode:PurchaseMode};
export type TradeInput={totalCost?:bigint;buy:bigint;sell:bigint;quantity:bigint;bundle:bigint;taxBps:bigint;fee:bigint;target:bigint;rounding:'up'|'down'};
export const tradeExample:TradeDraft={profitRate:'10',purchaseMode:'unit',item:'순수한 오드',buy:'130000',sell:'150000',quantity:'100',bundle:'25',tax:'10',fee:'0',target:'500000',rounding:'up'};
export function parseTradeInteger(raw:string,max:bigint,min=0n):bigint|null{
 const text=raw.trim();
 if(text.length>24||! /^(?:[0-9]+|[0-9]{1,3}(?:,[0-9]{3})+)$/.test(text))return null;
 const value=BigInt(text.replaceAll(',',''));return value>=min&&value<=max?value:null;
}
// Parse complete Korean money expressions without floating-point arithmetic.
// Large units form descending groups; each group may contain 천/백/십.
export function parseTradeMoney(raw:string):bigint|null{
 const text=raw.trim();if(text.length>40)return null;
 const integer=parseTradeInteger(text,MAX_TRADE_MONEY);if(integer!==null)return integer;
 if(!/[조억만천백십]/.test(text)||/[^0-9.조억만천백십\s]/.test(text))return null;
 const scaled=(number:string,unit:bigint):bigint|null=>{
  if(!/^[0-9]+(?:\.[0-9]+)?$/.test(number))return null;
  const [whole,fraction='']=number.split('.'),denominator=10n**BigInt(fraction.length);
  const numerator=BigInt(whole+fraction)*unit;
  return numerator%denominator===0n?numerator/denominator:null;
 };
 const small=(part:string,scale:bigint):bigint|null=>{
  let rest=part.trim(),sum=0n,previous=10000n;
  if(!rest)return null;
  while(rest){
   const match=/^([0-9]+(?:\.[0-9]+)?)\s*([천백십]?)/.exec(rest);
   if(!match)return null;
   const unit=({'천':1000n,'백':100n,'십':10n} as Record<string,bigint>)[match[2]]??1n;
   if(unit>=previous)return null;
   const amount=scaled(match[1],unit*scale);if(amount===null)return null;
   sum+=amount;previous=unit;rest=rest.slice(match[0].length).trim();
   if(!match[2]&&rest)return null;
  }
  return sum;
 };
 let remaining=text,sum=0n,previous=10_000_000_000_000_000n;
 while(/[조억만]/.test(remaining)){
  const match=/^([^조억만]+)([조억만])/.exec(remaining);if(!match)return null;
  const unit=({'조':1_000_000_000_000n,'억':100_000_000n,'만':10_000n} as Record<string,bigint>)[match[2]];
  if(unit>=previous)return null;
  const amount=small(match[1],unit);if(amount===null)return null;
  sum+=amount;previous=unit;remaining=remaining.slice(match[0].length).trim();
 }
 if(remaining){const amount=small(remaining,1n);if(amount===null)return null;sum+=amount;}
 return sum<=MAX_TRADE_MONEY?sum:null;
}
export function restoreTradeDraft(value:unknown):TradeDraft{
 if(!value||typeof value!=='object')return {...tradeExample};
 const record=value as Record<string,unknown>;
 const candidate={...record,purchaseMode:record.purchaseMode??'unit',profitRate:record.profitRate??'10'};
 if(!Object.keys(tradeExample).every(key=>typeof candidate[key as keyof typeof candidate]==='string'&&String(candidate[key as keyof typeof candidate]).length<=80)||!['up','down'].includes(String(record.rounding))||!['unit','total'].includes(String(candidate.purchaseMode)))return {...tradeExample};
 return Object.fromEntries(Object.keys(tradeExample).map(key=>[key,candidate[key as keyof typeof candidate]])) as TradeDraft;
}
// Convert only when exact; ask for an integer unit price rather than silently rounding.
export function changePurchaseMode(draft:TradeDraft,purchaseMode:PurchaseMode):TradeDraft{
 if(draft.purchaseMode===purchaseMode)return draft;
 const buy=parseTradeMoney(draft.buy),quantity=parseTradeInteger(draft.quantity,MAX_TRADE_QUANTITY,1n);
 let converted:bigint|null=null;
 if(buy!==null&&quantity!==null)converted=purchaseMode==='total'?buy*quantity:buy%quantity===0n?buy/quantity:null;
 return {...draft,purchaseMode,buy:converted!==null&&converted<=MAX_TRADE_MONEY?String(converted):''};
}
export const tradePurchaseCost=(input:TradeInput)=>input.totalCost??input.buy*input.quantity;
export function parseTradeRate(raw:string):bigint|null{
 const text=raw.trim();if(!/^[0-9]{1,3}(?:\.[0-9]{1,2})?$/.test(text))return null;
 const [whole,fraction='']=text.split('.');const value=BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));
 return value<=10000n?value:null;
}
export function parseTradeDraft(draft:TradeDraft):{value:TradeInput|null;errors:Partial<Record<TradeField,'money'|'quantity'|'rate'>>}{
 const errors:Partial<Record<TradeField,'money'|'quantity'|'rate'>>={};
 const money=(field:'buy'|'sell'|'fee'|'target')=>{const value=parseTradeMoney(draft[field]);if(value===null)errors[field]='money';return value??0n;};
 const count=(field:'quantity'|'bundle')=>{const value=parseTradeInteger(draft[field],MAX_TRADE_QUANTITY,1n);if(value===null)errors[field]='quantity';return value??1n;};
 const taxBps=parseTradeRate(draft.tax);if(taxBps===null)errors.tax='rate';
 const value={buy:money('buy'),sell:money('sell'),fee:money('fee'),target:money('target'),quantity:count('quantity'),bundle:count('bundle'),taxBps:taxBps??0n,rounding:draft.rounding};
 return {value:Object.keys(errors).length?null:{...value,...(draft.purchaseMode==='total'?{totalCost:value.buy}:{})},errors};
}
function check(input:TradeInput,bundle:bigint){
 if((input.totalCost??0n)<0n||input.buy<0n||input.sell<0n||input.quantity<1n||bundle<1n||input.fee<0n||input.target<0n||input.taxBps<0n||input.taxBps>10000n||!['up','down'].includes(input.rounding))throw Error('Invalid trade input');
}
export function calculateTrade(input:TradeInput,bundle=input.bundle,sell=input.sell){
 check(input,bundle);if(sell<0n)throw Error('Invalid sale price');
 const size=bundle<input.quantity?bundle:input.quantity;
 const fullCount=input.quantity/size,remainder=input.quantity%size,listingCount=fullCount+(remainder?1n:0n);
 const cost=tradePurchaseCost(input),unitCost=cost%input.quantity===0n?cost/input.quantity:null;
 const listing=(quantity:bigint)=>{const gross=sell*quantity,numerator=gross*input.taxBps;
  const tax=(numerator+(input.rounding==='up'?9999n:0n))/10000n;
  return {quantity,gross,tax,fee:input.fee,net:gross-tax-input.fee,profit:unitCost===null?null:gross-tax-input.fee-unitCost*quantity};};
 const full=listing(size),last=remainder?listing(remainder):null;
 const gross=full.gross*fullCount+(last?.gross??0n),tax=full.tax*fullCount+(last?.tax??0n),fees=input.fee*listingCount;
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

// Purchase-only mode ignores stale or unfinished manual sale/target drafts.
export function parsePurchaseDraft(draft:TradeDraft){return parseTradeDraft({...draft,sell:'0',target:'0'});}
// A manual sale remains calculable while the optional profit goal is edited.
export function parseSaleDraft(draft:TradeDraft){return parseTradeDraft({...draft,target:'0'});}
export function tradeProfitTarget(input:TradeInput,rateBps:bigint){
 if(rateBps<0n||rateBps>10000n)throw Error('Invalid profit rate');
 const target=(tradePurchaseCost(input)*rateBps+9999n)/10000n;
 const price=minimumTradePrice(input,input.bundle,target);
 return {target,price,result:price===null?null:calculateTrade(input,input.bundle,price)};
}
export function tradeProfitExamples(input:TradeInput){
 return [0,5,10,20].map(percent=>({percent,...tradeProfitTarget(input,BigInt(percent)*100n)}));
}
