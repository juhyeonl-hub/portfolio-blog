import {calculateTrade,parseTradeMoney,parseTradeInteger,parseTradeRate,MAX_TRADE_QUANTITY} from './trade-calculator';
export const CRAFT_KEY='asbc-craft-comparison-v1';
export type CraftMaterial={id:string;name:string;quantity:string;price:string};
export type CraftDraft={item:string;materials:CraftMaterial[];cost:string;output:string;sell:string;tax:string;fee:string;rounding:'up'|'down'};
export const emptyCraft=():CraftDraft=>({item:'',materials:[{id:'first',name:'',quantity:'',price:''}],cost:'0',output:'1',sell:'',tax:'10',fee:'0',rounding:'up'});
export function parseCraft(raw:string|null):CraftDraft{
 if(raw===null)return emptyCraft();if(raw.length>50000)throw Error('invalid');const d=JSON.parse(raw) as CraftDraft;
 if(!d||!Array.isArray(d.materials)||!d.materials.length||d.materials.length>20||!['up','down'].includes(d.rounding)||!['item','cost','output','sell','tax','fee'].every(k=>typeof d[k as keyof CraftDraft]==='string'&&String(d[k as keyof CraftDraft]).length<=80))throw Error('invalid');
 const ids=new Set<string>();for(const m of d.materials){if(!m||!['id','name','quantity','price'].every(k=>typeof m[k as keyof CraftMaterial]==='string'&&m[k as keyof CraftMaterial].length<=80)||!m.id||ids.has(m.id))throw Error('invalid');ids.add(m.id);}
 return {item:d.item,materials:d.materials.map(({id,name,quantity,price})=>({id,name,quantity,price})),cost:d.cost,output:d.output,sell:d.sell,tax:d.tax,fee:d.fee,rounding:d.rounding};
}
export function calculateCraft(d:CraftDraft){
 const cost=parseTradeMoney(d.cost),output=parseTradeInteger(d.output,MAX_TRADE_QUANTITY,1n),sell=parseTradeMoney(d.sell),taxBps=parseTradeRate(d.tax),fee=parseTradeMoney(d.fee);
 if(cost===null||output===null||sell===null||taxBps===null||fee===null||!d.materials.length||d.materials.length>20)return null;
 const materials=d.materials.map(m=>({quantity:parseTradeInteger(m.quantity,MAX_TRADE_QUANTITY,1n),price:parseTradeMoney(m.price)}));
 if(materials.some(m=>m.quantity===null||m.price===null))return null;
 const net=(quantity:bigint,price:bigint)=>calculateTrade({buy:0n,sell:price,quantity,bundle:quantity,fee,taxBps,target:0n,rounding:d.rounding}).net;
 const materialCost=materials.reduce((n,m)=>n+m.quantity!*m.price!,0n),materialNet=materials.reduce((n,m)=>n+net(m.quantity!,m.price!),0n),outputNet=net(output,sell),craftNet=outputNet-cost;
 return {materialCost,totalCost:materialCost+cost,materialNet,outputNet,craftNet,profit:craftNet-materialCost,advantage:craftNet-materialNet,output};
}
