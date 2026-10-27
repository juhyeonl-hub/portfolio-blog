import type {CraftDraft} from './craft-comparison';
import {calculateTrade,minimumTradePrice,tradeProfitExamples,tradeProfitTarget,parseTradeMoney,parseTradeInteger,parseTradeRate,MAX_TRADE_QUANTITY,MAX_TRADE_MONEY,type TradeInput} from './trade-calculator';

// A selling-price guide must work before a sale price is known. Existing craft
// drafts and legacy comparison semantics remain unchanged.
export function craftSalePrices(d:CraftDraft,goal='10'){
 const cost=parseTradeMoney(d.cost),quantity=parseTradeInteger(d.output,MAX_TRADE_QUANTITY,1n);
 const taxBps=parseTradeRate(d.tax),fee=parseTradeMoney(d.fee);
 if(cost===null||quantity===null||taxBps===null||fee===null||!['up','down'].includes(d.rounding)||!d.materials.length||d.materials.length>20)return null;
 const lines=d.materials.map(m=>{const count=parseTradeInteger(m.quantity,MAX_TRADE_QUANTITY,1n),price=parseTradeMoney(m.price);return count===null||price===null?null:count*price;});
 if(lines.some(line=>line===null))return null;
 const materialCost=lines.reduce<bigint>((sum,line)=>sum+line!,0n),totalCost=materialCost+cost;
 const input:TradeInput={buy:0n,totalCost,sell:0n,quantity,bundle:quantity,taxBps,fee,target:0n,rounding:d.rounding};
 const rate=parseTradeRate(goal),breakEven=minimumTradePrice(input,quantity,0n),firstProfit=minimumTradePrice(input,quantity,1n);
 const actualPrice=parseTradeMoney(d.sell);
 return {lines:lines as bigint[],materialCost,totalCost,extraCost:cost,quantity,input,breakEven,firstProfit,
  examples:tradeProfitExamples(input),target:rate===null?null:tradeProfitTarget(input,rate),
  actual:actualPrice===null?null:calculateTrade(input,quantity,actualPrice)};
}

// Explicitly grow the entered batch; prices, owned inventory and one-listing fees stay fixed.
export function multiplyCraftBatch(d:CraftDraft,multiplier:bigint):CraftDraft|null{
 if(multiplier<1n||!d.materials.length||d.materials.length>20)return null;
 const output=parseTradeInteger(d.output,MAX_TRADE_QUANTITY,1n),cost=parseTradeMoney(d.cost);
 const counts=d.materials.map(m=>parseTradeInteger(m.quantity,MAX_TRADE_QUANTITY,1n));
 if(output===null||cost===null||output*multiplier>MAX_TRADE_QUANTITY||cost*multiplier>MAX_TRADE_MONEY||counts.some(q=>q===null||q*multiplier>MAX_TRADE_QUANTITY))return null;
 return {...d,output:String(output*multiplier),cost:String(cost*multiplier),materials:d.materials.map((m,i)=>({...m,quantity:String(counts[i]!*multiplier)}))};
}
