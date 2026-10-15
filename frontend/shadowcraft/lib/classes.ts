import data from './data/class-profiles.json';
export type ClassProfile={key:string;slug:string;name:string;role?:string;pcIds:number[];boardIds:number[];core:string[];activePriority:string[];passivePriority:string[];safeStigmas:string[];damageStigmas:string[];movement:string[];manual:string[];specPriority:Record<string,number[]>;roles:Record<string,string>;macroColumns?:{slot:number;skills:string[]}[];skillSteps?:{learned:number;skills:string[]}[];stigmaSteps?:{skill:string;level:number}[];sourceBoardWeights?:Record<string,number>;summary:string;rotation:{title:string;body:string;ids:string[]}[];macro:string;};
export const CLASSES=data as unknown as ClassProfile[];
export function isClassKey(key:string):boolean{return CLASSES.some(p=>p.key===key)}
export function classProfile(key='assassin'):ClassProfile{return CLASSES.find(p=>p.key===key)||CLASSES.find(p=>p.key==='assassin')!}
export function classFromPcId(id:number):ClassProfile|undefined{return CLASSES.find(p=>p.pcIds.includes(id))}
