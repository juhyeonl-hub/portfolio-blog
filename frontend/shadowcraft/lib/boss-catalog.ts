import data from './data/boss-catalog.json';
import {pinnedTimers,type TimerSettings,type TimerId} from './event-timers';
export type CatalogBoss={id:string;side:string|null;level?:number;names:Record<string,string>;maps:Record<string,string>};
export const BOSS_CATALOG:CatalogBoss[]=data;
export const legacyBossIds=(race:number):Partial<Record<TimerId,string>>=>race===2?{gartua:'111021',lagta:'111022',kashapa:'111023',tartan:'111024'}:{gartua:'101021',lagta:'101024',kashapa:'101023',tartan:'101022'};
export function selectedBossIds(settings:TimerSettings,race:number){const aliases=legacyBossIds(race);return [...new Set([...pinnedTimers(settings).flatMap(id=>aliases[id]?[aliases[id]!]:[]),...settings.pinnedBosses||[]])];}
export function setBossPinned(settings:TimerSettings,race:number,id:string,checked:boolean):TimerSettings{
 const aliases=legacyBossIds(race);
 return {...settings,pinned:pinnedTimers(settings).filter(key=>aliases[key]!==id),pinnedBosses:[...(settings.pinnedBosses||[]).filter(key=>key!==id),...(checked?[id]:[])]};
}
export const bossName=(boss:CatalogBoss,locale:string)=>boss.names[locale]||boss.names.en||boss.id;
export const bossMap=(boss:CatalogBoss,locale:string)=>boss.maps[locale]||boss.maps.en||'';
