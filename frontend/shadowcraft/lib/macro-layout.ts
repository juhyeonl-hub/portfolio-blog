import type {ClassProfile} from './classes';
import {TEMPLAR_BASIC,templarBasicAvailable} from './macro-evidence';

// Fixed basic evidence: Ranger14020000 user AION2 configuration screenshot (2026-11-03);
// Templar12010000 public guide (2026-11-01); other6 classes use internal profile bindings.
// None of these establish live execution, timing or DPS; Ranger repeat columns are site-derived.
export const FIXED_LEFT:Readonly<Record<string,string>>={gladiator:'11020000',templar:'12010000',ranger:'14020000',assassin:'13010000',elementalist:'16010000',sorcerer:'15210000',cleric:'17010000',chanter:'18010000'};
export const QUICK_KEYS=['1','2','3','4','5','6','7','8','Q','E'] as const;
export type MacroInput={key:string;skills:string[];fixed:boolean};
export function macroLayout(profile:ClassProfile,known:ReadonlySet<string>,context='pve',extra=false){
 const fixedId=FIXED_LEFT[profile.key];
 const templar=templarBasicAvailable(profile.key,context,known);
 const raw:ReadonlyArray<{skills:readonly string[]}>=templar?TEMPLAR_BASIC.columns:profile.key==='assassin'?[{skills:['13010000']},{skills:['13130000','13350000',...(extra?['13060000']:[])]}]:profile.macroColumns||[];
 let keyIndex=0;
 const inputs:MacroInput[]=raw.map(c=>{const fixed=c.skills.length===1&&c.skills[0]===fixedId;return {key:fixed?'LMB':QUICK_KEYS[4+keyIndex++]||'',skills:c.skills.filter(id=>known.has(id)&&(fixed||id!==fixedId)),fixed}});
 const columns=inputs.filter(c=>!c.fixed&&c.key&&c.skills.length);
 const order=templar?TEMPLAR_BASIC.sequence:profile.key==='assassin'?[1,0]:inputs.map((_,i)=>i);
 const steps=order.map(i=>inputs[i]).filter(c=>c?.key&&c.skills.length);
 const automatic=new Set(columns.flatMap(c=>c.skills));
 const manual=[...new Set([...profile.movement,...profile.manual,...(profile.key==='assassin'?['13100000',...(!extra?['13060000']:[])]:[])])].filter(id=>known.has(id)&&id!==fixedId&&!automatic.has(id));
 const manualKeys=['1','2','3','4','Q','E','5','6','7','8'].filter(key=>!columns.some(c=>c.key===key));
 return {fixedId:known.has(fixedId)?fixedId:undefined,templar,columns,steps,manual,manualKeys};
}
