// Equipment details exported from the Global client (shadowcraft/operations/build-item-index.py). Loaded once,
// only when an equipment grid is shown; a failed load is retried on the next grid.
export type ItemStat=[string,number];
export type ItemSubStat=[string,number,number];
export type ItemDetail={g:string;lv:number;c:string;i?:string;m?:ItemStat[];p?:number;sc?:[number,number];rs?:number;ms?:number;gs?:number};
export type ItemIndex={schema:string;steamBuild:string;stats:Record<string,{ko:string;en:string}>;pools:ItemSubStat[][];items:Record<string,ItemDetail>};
export const ITEM_INDEX_URL='/shadowcraft/data/item-index.json';
export const ITEM_ICON_BASE='/shadowcraft/icons/items/';
const KEY=/^[A-Za-z]{1,40}$/,ICON=/^[A-Za-z0-9_]{1,120}$/;
const integer=(value:unknown,max=1e9):value is number=>Number.isSafeInteger(value)&&(value as number)>=0&&(value as number)<=max;

export function validItemIndex(value:unknown):value is ItemIndex{
 if(!value||typeof value!=='object')return false;
 const index=value as ItemIndex;
 if(index.schema!=='asbc-item-index-v1'||typeof index.steamBuild!=='string'||!index.stats||typeof index.stats!=='object'||!Array.isArray(index.pools)||!index.items||typeof index.items!=='object')return false;
 if(index.pools.length>5000||Object.keys(index.items).length>50000)return false;
 for(const [key,names] of Object.entries(index.stats))if(!KEY.test(key)||!names||typeof names.ko!=='string'||!names.ko||typeof names.en!=='string'||!names.en)return false;
 for(const pool of index.pools){
  if(!Array.isArray(pool)||pool.length>64)return false;
  for(const sub of pool)if(!Array.isArray(sub)||sub.length!==3||!(sub[0] in index.stats)||!integer(sub[1])||!integer(sub[2])||sub[1]>sub[2])return false;
 }
 for(const [id,item] of Object.entries(index.items)){
  if(!/^[1-9]\d{0,15}$/.test(id)||!item||typeof item!=='object')return false;
  if(!KEY.test(item.g)||!integer(item.lv,10000)||!KEY.test(item.c))return false;
  if(item.i!==undefined&&!ICON.test(item.i))return false;
  if(item.m!==undefined&&(!Array.isArray(item.m)||item.m.length>32||!item.m.every(s=>Array.isArray(s)&&s.length===2&&s[0] in index.stats&&Number.isSafeInteger(s[1]))))return false;
  if(item.p!==undefined&&(!integer(item.p)||item.p>=index.pools.length))return false;
  if(item.sc!==undefined&&(!Array.isArray(item.sc)||item.sc.length!==2||!integer(item.sc[0],64)||!integer(item.sc[1],64)))return false;
  for(const key of ['rs','ms','gs'] as const)if(item[key]!==undefined&&!integer(item[key],64))return false;
 }
 return true;
}

let loaded:ItemIndex|null=null;
let pending:Promise<ItemIndex|null>|null=null;
export function loadItemIndex(fetchImpl:typeof fetch=fetch):Promise<ItemIndex|null>{
 if(loaded)return Promise.resolve(loaded);
 pending??=fetchImpl(ITEM_INDEX_URL).then(async response=>{
  if(!response.ok)return null;
  const data:unknown=await response.json();
  return validItemIndex(data)?(loaded=data):null;
 }).catch(()=>null).finally(()=>{pending=null;});
 return pending;
}
/** Test hook: forget the loaded index so the next load fetches again. */
export function resetItemIndex(){loaded=null;pending=null;}

export type ItemSummary={detail:ItemDetail;main:ItemStat[];pool:ItemSubStat[]};
export function itemSummary(index:ItemIndex|null,id:number):ItemSummary|null{
 const detail=index?.items[String(id)];
 if(!detail)return null;
 return {detail,main:detail.m||[],pool:detail.p===undefined?[]:index!.pools[detail.p]||[]};
}
export const itemIconUrl=(detail:ItemDetail|undefined)=>detail?.i?ITEM_ICON_BASE+detail.i+'.webp':null;
