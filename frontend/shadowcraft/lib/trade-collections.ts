import {WORKBOOK_KEY,parseWorkbook,type TradeWorkbook} from './trade-workbook';
import {parseCraft,type CraftDraft} from './craft-comparison';
export const CRAFT_PLANS_KEY='asbc-craft-plans-v1';
export type CraftPlan={id:string;name:string;draft:CraftDraft};
export type CraftPlans={version:1;selected:string;plans:CraftPlan[]};
export const emptyCraftPlans=():CraftPlans=>({version:1,selected:'',plans:[]});
export function parseCraftPlans(raw:string|null):CraftPlans{
 if(raw===null)return emptyCraftPlans();if(raw.length>1000000)throw Error('invalid');
 const v=JSON.parse(raw) as CraftPlans,ids=new Set<string>();
 if(!v||v.version!==1||typeof v.selected!=='string'||!Array.isArray(v.plans)||v.plans.length>20)throw Error('invalid');
 const plans=v.plans.map(p=>{if(!p||typeof p.id!=='string'||!p.id.trim()||p.id.length>80||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>80)throw Error('invalid');ids.add(p.id);return {id:p.id,name:p.name,draft:parseCraft(JSON.stringify(p.draft))};});
 if(v.selected&&!ids.has(v.selected))throw Error('invalid');return {version:1,selected:v.selected,plans};
}
export function isTradeCollection(key:string){return key===WORKBOOK_KEY||key===CRAFT_PLANS_KEY;}
export function parseTradeCollection(key:string,raw:string|null):TradeWorkbook|CraftPlans{
 if(key===WORKBOOK_KEY)return parseWorkbook(raw);if(key===CRAFT_PLANS_KEY)return parseCraftPlans(raw);throw Error('invalid');
}
export class TradeSyncConflict extends Error{constructor(readonly key:string){super('Trade records changed on both devices');}}
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
// A book's order affects its moving-average costs. Merge different books, never guess an order for concurrent trades.
export function mergeTradeCollection(key:string,base:string|undefined,local:string,remote:string|undefined):string{
 if(local===base)return remote??local;if(remote===base||local===remote)return local;
 const b=parseTradeCollection(key,base??null),l=parseTradeCollection(key,local),r=parseTradeCollection(key,remote??null);
 const items=(c:TradeWorkbook|CraftPlans):Array<{id:string}>=>'books' in c?c.books:c.plans;
 const bm=new Map(items(b).map(x=>[x.id,x])),lm=new Map(items(l).map(x=>[x.id,x])),rm=new Map(items(r).map(x=>[x.id,x]));
 const merged=[];
 for(const id of new Set([...rm.keys(),...lm.keys(),...bm.keys()])){
  const before=bm.get(id),mine=lm.get(id),theirs=rm.get(id);
  const chosen=same(mine,before)?theirs:same(theirs,before)||same(mine,theirs)?mine:undefined;
  if(!same(mine,before)&&!same(theirs,before)&&!same(mine,theirs))throw new TradeSyncConflict(key);
  if(chosen)merged.push(chosen);
 }
 const selected=merged.some(x=>x.id===l.selected)?l.selected:merged.some(x=>x.id===r.selected)?r.selected:merged[0]?.id||'';
 const out=key===WORKBOOK_KEY?{version:1,selected,legacyImported:(l as TradeWorkbook).legacyImported||(r as TradeWorkbook).legacyImported,books:merged}:{version:1,selected,plans:merged};
 try{return JSON.stringify(parseTradeCollection(key,JSON.stringify(out)));}catch{throw new TradeSyncConflict(key);}
}
export function tradeBackup(key:string,value:unknown){return JSON.stringify({schema:'asbc-trade-backup-v1',key,exportedAt:new Date().toISOString(),data:parseTradeCollection(key,JSON.stringify(value))},null,2);}
export function parseTradeBackup(key:string,raw:string){
 if(raw.length>5000000)throw Error('invalid');const v=JSON.parse(raw);
 if(v?.schema!=='asbc-trade-backup-v1'||v.key!==key||!v.data)throw Error('invalid');return parseTradeCollection(key,JSON.stringify(v.data));
}
