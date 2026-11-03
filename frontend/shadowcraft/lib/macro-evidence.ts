// Public guide observed 2026-11-01; not an in-game verification or a maximum-DPS claim.
export const TEMPLAR_BASIC={source:'https://aion2.gaming.tools/builds/templar/pve',checkedAt:'2026-11-01',generator:'12010000',columns:[{skills:['12100000','12350000']},{skills:['12240000','12340000','12040000']}],sequence:[0,1,0,1]} as const;
export function templarBasicAvailable(classKey:string,purpose:string,knownIds:ReadonlySet<string>){return classKey==='templar'&&purpose==='pve'&&[TEMPLAR_BASIC.generator,...TEMPLAR_BASIC.columns.flatMap(c=>c.skills)].every(id=>knownIds.has(id));}

// Review date of the site's data/layout audit, not a game patch or combat-test date.
export const MACRO_DATA_CHECKED_AT='2026-11-03';
export const RANGER_SCREEN_CHECKED_AT='2026-11-03';
export const GAME_CHECKS:Readonly<Record<string,string>>={
 gladiator:'넘어짐·그로기 조건부 공격이 조건 없이 실행되는 것으로 오해하지 마세요.',
 templar:'공개 반복 예시와 별개로 도발·막기·파티 보호 타이밍을 확인하세요.',
 ranger:'그로기·감속·속박 조건부 공격과 충전 중 회피를 확인하세요.',
 assassin:'치명타 후속기·문양 조건과 기습 포함 여부를 확인하세요. 지연값은 직접 시험하세요.',
 elementalist:'정령의 소환·해제, 협공 대상과 원소 중첩 조건을 확인하세요.',
 sorcerer:'화염 표식 조건부 공격과 충전 중 회피를 확인하세요.',
 cleric:'공격 중에도 회복·해제·부활을 필요한 순간에 사용할 수 있는지 확인하세요.',
 chanter:'파티 효과 중복과 회복·보호막 사용 시점을 확인하세요.'
};
export function macroEvidence(classKey:string,context:string){
 const known=Object.hasOwn(GAME_CHECKS,classKey);
 return {known,gameplay:'unverified' as const,screenCheckedAt:classKey==='ranger'?RANGER_SCREEN_CHECKED_AT:undefined,
  fixedOrigin:classKey==='ranger'?'screen':classKey==='templar'?'reference':'derived',
  repeatOrigin:classKey==='templar'&&context==='pve'?'reference':'derived',
  checkedAt:known?MACRO_DATA_CHECKED_AT:undefined,check:known?GAME_CHECKS[classKey]:undefined};
}
