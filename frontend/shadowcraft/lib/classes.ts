import data from './data/class-profiles.json';
export type PvePreset='group'|'single'|'farm';
export type ClassProfile={pvePresets?:Partial<Record<PvePreset,Partial<ClassProfile>>>;pvePresetSource?:{url:string;checkedAt:string;basis:string};key:string;slug:string;name:string;role?:string;pcIds:number[];boardIds:number[];core:string[];activePriority:string[];passivePriority:string[];safeStigmas:string[];damageStigmas:string[];movement:string[];manual:string[];specPriority:Record<string,number[]>;roles:Record<string,string>;macroColumns?:{slot:number;skills:string[]}[];skillSteps?:{learned:number;skills:string[]}[];stigmaSteps?:{skill:string;level:number}[];sourceBoardWeights?:Record<string,number>;summary:string;rotation:{title:string;body:string;ids:string[]}[];macro:string;};
export const CLASSES=data as unknown as ClassProfile[];
export function isClassKey(key:string):boolean{return CLASSES.some(p=>p.key===key)}
export function classProfile(key='assassin'):ClassProfile{return CLASSES.find(p=>p.key===key)||CLASSES.find(p=>p.key==='assassin')!}
export function classFromPcId(id:number):ClassProfile|undefined{return CLASSES.find(p=>p.pcIds.includes(id))}

const presetProfiles=new Map<string,ClassProfile>();
/** A purpose choice changes recommendation inputs only, never the saved allocation. */
export function recommendationProfile(key:string|undefined,p:{level:number;mode:string;pvePreset?:PvePreset}):ClassProfile {
 const original=classProfile(key),preset=p.level>=45&&p.mode!=='pvp'?p.pvePreset:undefined;
 if(!preset||!original.pvePresets?.[preset])return original;
 const cacheKey=key+':'+preset;let value=presetProfiles.get(cacheKey);
 if(!value){const patch=original.pvePresets[preset]!;value={...original,...patch,specPriority:{...original.specPriority,...patch.specPriority}};presetProfiles.set(cacheKey,value)}
 return value;
}
