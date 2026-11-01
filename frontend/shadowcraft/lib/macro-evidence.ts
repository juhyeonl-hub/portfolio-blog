// Public guide observed 2026-11-01; not an in-game verification or a maximum-DPS claim.
export const TEMPLAR_BASIC={source:'https://aion2.gaming.tools/builds/templar/pve',checkedAt:'2026-11-01',generator:'12010000',columns:[{skills:['12100000','12350000']},{skills:['12240000','12340000','12040000']}],sequence:[0,1,0,1]} as const;
export function templarBasicAvailable(classKey:string,purpose:string,knownIds:ReadonlySet<string>){return classKey==='templar'&&purpose==='pve'&&[TEMPLAR_BASIC.generator,...TEMPLAR_BASIC.columns.flatMap(c=>c.skills)].every(id=>knownIds.has(id));}
