import {MAX_TRADE_MONEY,MAX_TRADE_QUANTITY,parseTradeInteger,parseTradeMoney,parsePurchaseDraft,restoreTradeLedger,tradePurchaseCost,calculateTrade,type TradeInput} from './trade-calculator';
export const WORKBOOK_KEY='asbc-trade-workbook-v1';
export const MAX_BOOKS=50,MAX_ENTRIES=200;
export type TradeEntry={id:string;kind:'buy'|'sale';quantity:string;amount:string;at:string};
export type ItemBook={id:string;name:string;entries:TradeEntry[]};
export type TradeWorkbook={version:1;selected:string;legacyImported:boolean;books:ItemBook[]};
export const emptyWorkbook=():TradeWorkbook=>({version:1,selected:'',legacyImported:false,books:[]});
const maxTotal=MAX_TRADE_MONEY*MAX_TRADE_QUANTITY;
export function parseEntryAmount(price:string,quantity:string,mode:'unit'|'total'){
 const q=parseTradeInteger(quantity,MAX_TRADE_QUANTITY,1n),p=parseTradeMoney(price);
 return q===null||p===null?null:{quantity:q,amount:mode==='unit'?p*q:p};
}
// Moving-average cost: allocate whole Kinah on each sale, retain the fractional remainder in stock.
// Buying later never changes the cost already assigned to an earlier sale.
export function workbookTotals(entries:TradeEntry[]){
 if(entries.length>MAX_ENTRIES)throw Error('limit');
 let remaining=0n,inventoryCost=0n,spent=0n,received=0n,sold=0n,bought=0n,soldCost=0n;
 const rows=entries.map(entry=>{
  const q=parseTradeInteger(entry.quantity,MAX_TRADE_QUANTITY,1n),amount=parseTradeInteger(entry.amount,maxTotal);
  if(q===null||amount===null||!['buy','sale'].includes(entry.kind))throw Error('invalid');
  let assignedCost=0n;
  if(entry.kind==='buy'){
   bought+=q;if(bought>MAX_TRADE_QUANTITY)throw Error('limit');
   remaining+=q;inventoryCost+=amount;spent+=amount;
  }else{
   if(q>remaining)throw Error('oversold');
   assignedCost=inventoryCost*q/remaining;inventoryCost-=assignedCost;remaining-=q;sold+=q;soldCost+=assignedCost;received+=amount;
  }
  return {...entry,assignedCost,profit:entry.kind==='sale'?amount-assignedCost:null};
 });
 return {remaining,inventoryCost,spent,received,sold,bought,soldCost,realizedProfit:received-soldCost,cashBalance:received-spent,average:remaining?inventoryCost/remaining:null,averageHasFraction:remaining>0n&&inventoryCost%remaining!==0n,rows};
}
export function workbookRemainingPrice(total:ReturnType<typeof workbookTotals>,conditions:TradeInput){
 if(!total.remaining)return null;
 const needed=total.spent-total.received,future={...conditions,buy:0n,totalCost:0n,quantity:total.remaining};
 const net=(price:bigint)=>calculateTrade(future,future.bundle,price).net;
 if(net(0n)>=needed)return 0n;if(future.taxBps===10000n)return null;
 let low=0n,high=1n;while(net(high)<needed)high*=2n;
 while(low+1n<high){const mid=(low+high)/2n;if(net(mid)>=needed)high=mid;else low=mid;}
 return high;
}
export function parseWorkbook(raw:string|null):TradeWorkbook{
 if(raw===null)return emptyWorkbook();if(raw.length>4000000)throw Error('invalid');
 const value=JSON.parse(raw) as TradeWorkbook;
 if(!value||value.version!==1||typeof value.selected!=='string'||typeof value.legacyImported!=='boolean'||!Array.isArray(value.books)||value.books.length>MAX_BOOKS)throw Error('invalid');
 const ids=new Set<string>();
 const books=value.books.map(book=>{
  if(!book||typeof book.id!=='string'||!book.id.trim()||book.id.length>80||ids.has(book.id)||typeof book.name!=='string'||!book.name.trim()||book.name.length>80||!Array.isArray(book.entries)||book.entries.length>MAX_ENTRIES)throw Error('invalid');ids.add(book.id);
  const entryIds=new Set<string>();
  const entries=book.entries.map(row=>{
   if(!row||typeof row.id!=='string'||!row.id.trim()||row.id.length>80||entryIds.has(row.id)||typeof row.quantity!=='string'||typeof row.amount!=='string'||typeof row.at!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(row.at)||!Number.isFinite(Date.parse(row.at)))throw Error('invalid');entryIds.add(row.id);
   const q=parseTradeInteger(row.quantity,MAX_TRADE_QUANTITY,1n),a=parseTradeInteger(row.amount,maxTotal);if(q===null||a===null)throw Error('invalid');
   return {id:row.id,kind:row.kind,quantity:String(q),amount:String(a),at:new Date(row.at).toISOString()};
  });workbookTotals(entries);return {id:book.id,name:book.name,entries};
 });
 if(value.selected&&!ids.has(value.selected))throw Error('invalid');
 return {version:1,selected:value.selected,legacyImported:value.legacyImported,books};
}
export function legacyItemBook(raw:string|null,id:string,at:string):ItemBook|null{
 if(!raw)return null;if(raw.length>200000)throw Error('invalid');
 const legacy=restoreTradeLedger(JSON.parse(raw));if(!legacy)throw Error('invalid');
 const input=parsePurchaseDraft(legacy.draft).value;if(!input)throw Error('invalid');
 // A maximum-size legacy book leaves no room for the initial purchase row; preserve it rather than truncate.
 if(legacy.sales.length>=MAX_ENTRIES)throw Error('limit');
 const entries:TradeEntry[]=[{id:id+'-buy',kind:'buy',quantity:String(input.quantity),amount:String(tradePurchaseCost(input)),at},...legacy.sales.map((sale,i)=>({id:id+'-'+i,kind:'sale' as const,quantity:sale.quantity,amount:sale.received,at}))];
 // Old records may use Korean number expressions. Normalize before writing the new format.
 for(const entry of entries){entry.quantity=String(parseTradeInteger(entry.quantity,MAX_TRADE_QUANTITY,1n));if(entry.kind==='sale')entry.amount=String(parseTradeMoney(entry.amount));}
 workbookTotals(entries);return {id,name:legacy.draft.item.trim()||'이전 판매 기록',entries};
}
