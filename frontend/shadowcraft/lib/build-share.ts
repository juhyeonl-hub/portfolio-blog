import {validStoredPlan} from './plan-memory';
import {equipmentBonus, type Catalog, type Plan} from './planner';
import {isClassKey} from './classes';
export const GUIDE_SLOTS=['MainHand','SubHand','Helmet','Torso','Pants','Shoulder','Gloves','Boots','Cape','Belt','Necklace','Earring1','Earring2','Ring1','Ring2','Bracelet1','Bracelet2','Rune1','Rune2','Amulet','Arcana1','Arcana2','Arcana3','Arcana4','Arcana5'] as const;
export type GuideEquipment={slot:string;name:string;upgrade:string;options:string;reason:string};
export type BuildGuide={skills:string;daevanion:string;equipment:string;items:GuideEquipment[]};
export const emptyGuide=():BuildGuide=>({skills:'',daevanion:'',equipment:'',items:[]});
export type SharedBuild = {schema:'a2bc-share-v1';catalogVersion:string;plan:Plan;guide?:BuildGuide};
export function validateGuide(v:unknown):BuildGuide {
 if(!record(v)||!only(v,['skills','daevanion','equipment','items'])||!['skills','daevanion','equipment'].every(k=>typeof v[k]==='string'&&(v[k] as string).length<=600)||!Array.isArray(v.items)||v.items.length>GUIDE_SLOTS.length)throw Error('빌드 작성 내용을 확인하세요.');
 const seen=new Set<string>();
 for(const item of v.items){if(!record(item)||!only(item,['slot','name','upgrade','options','reason'])||typeof item.slot!=='string'||!GUIDE_SLOTS.includes(item.slot as any)||seen.has(item.slot)||!['name','upgrade','options','reason'].every(k=>typeof item[k]==='string'&&(item[k] as string).length<=(k==='name'||k==='upgrade'?80:240))||!(item.name as string).trim())throw Error('추천 장비 내용을 확인하세요.');seen.add(item.slot);}
 return v as unknown as BuildGuide;
}
// Keep links bounded for browsers and messengers. Larger builds use JSON export.
export const MAX_SHARE_LENGTH=24000;
const integer=(v:unknown):v is number=>Number.isInteger(v)&&Number(v)>=0&&Number(v)<=9999;
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const only=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).every(k=>keys.includes(k));
const numericId=(v:unknown):v is string=>typeof v==='string'&&/^\d{1,20}$/.test(v);
const ids=(v:unknown)=>Array.isArray(v)&&v.length<=1000&&v.every(numericId)&&new Set(v).size===v.length;
const levels=(v:unknown)=>record(v)&&Object.keys(v).length<=100&&Object.entries(v).every(([id,n])=>numericId(id)&&integer(n));
export function validateShare(value:unknown):SharedBuild {
 if(!record(value)||!only(value,['schema','catalogVersion','plan','guide'])||value.schema!=='a2bc-share-v1'||typeof value.catalogVersion!=='string'||!value.catalogVersion||value.catalogVersion.length>100)throw Error('지원하지 않는 공유 링크 형식입니다.');
 const p=value.plan;
 if(!record(p)||typeof p.classKey!=='string'||!isClassKey(p.classKey)||!only(p,['classKey','level','mode','base','bonus','specs','nodes','checked','character','extraSP','extraStigma','extraCrystal','extraBattle','pointBudget','ascensionGrade3Confirmed','stigmaSkills'])||!validStoredPlan(p,p.classKey)||p.character!==null||!Array.isArray(p.checked)||p.checked.length!==0||!(['extraSP','extraStigma','extraCrystal','extraBattle'] as const).every(k=>integer(p[k]))||!levels(p.base)||!levels(p.bonus)||!ids(p.nodes)||!record(p.specs)||Object.keys(p.specs).length>100||!Object.entries(p.specs).every(([id,list])=>numericId(id)&&ids(list)))throw Error('공유 빌드의 배분 형식이 올바르지 않습니다.');
 if(p.pointBudget!==undefined&&(!record(p.pointBudget)||!only(p.pointBudget,['sp','stigma','crystal','battle'])||!['sp','stigma','crystal','battle'].every(k=>integer((p.pointBudget as Record<string,unknown>)[k]))))throw Error('공유 포인트 예산이 올바르지 않습니다.');
 if(value.guide!==undefined)validateGuide(value.guide);
 return value as unknown as SharedBuild;
}
export function publicBuild(catalog:Catalog,plan:Plan):SharedBuild {
 const classKey=catalog.classKey||'assassin';
 if(!validStoredPlan(plan,classKey))throw Error('현재 직업의 올바른 계획이 필요합니다.');
 // Explicit projection: no character, gear labels/notes, history or unknown fields.
 const p:Plan={classKey,level:plan.level,mode:plan.mode,extraSP:plan.extraSP,extraStigma:plan.extraStigma,extraCrystal:plan.extraCrystal,extraBattle:plan.extraBattle,base:{},bonus:{},specs:{},nodes:[...plan.nodes],checked:[],character:null};
 for(const skill of catalog.skills){p.base[skill.id]=plan.base[skill.id]??(skill.stigma?0:1);p.bonus[skill.id]=equipmentBonus(plan,skill.id);p.specs[skill.id]=[...(plan.specs[skill.id]||[])];}
 if(plan.stigmaSkills)p.stigmaSkills=[...plan.stigmaSkills];
 if(plan.pointBudget)p.pointBudget={sp:plan.pointBudget.sp,stigma:plan.pointBudget.stigma,crystal:plan.pointBudget.crystal,battle:plan.pointBudget.battle};
 if(plan.ascensionGrade3Confirmed!==undefined)p.ascensionGrade3Confirmed=plan.ascensionGrade3Confirmed;
 const shared=validateShare({schema:'a2bc-share-v1',catalogVersion:catalog.version||'미확인',plan:p});
 validateReferences(shared,catalog);return shared;
}
export function validateReferences(shared:SharedBuild,catalog:Catalog) {
 if(shared.plan.classKey!==(catalog.classKey||'assassin'))throw Error('공유 빌드와 직업 데이터가 일치하지 않습니다.');
 if(shared.plan.stigmaSkills?.some(id=>!catalog.skills.some(s=>s.id===id&&s.stigma)))throw Error('스티그마 선택을 확인하세요.');
 const skills=new Map(catalog.skills.map(s=>[s.id,s]));const nodes=new Set(catalog.boards.flatMap(b=>b.nodes.map(n=>n.id)));
 if([...Object.keys(shared.plan.base),...Object.keys(shared.plan.bonus),...Object.keys(shared.plan.specs)].some(id=>!skills.has(id))||shared.plan.nodes.some(id=>!nodes.has(id))||Object.entries(shared.plan.specs).some(([id,list])=>list.some(spec=>!skills.get(id)?.specializations.some(s=>s.id===spec))))throw Error('현재 데이터에서 찾을 수 없는 스킬·특화·노드가 있습니다.');
}
export function encodeShare(shared:SharedBuild):string {
 const bytes=new TextEncoder().encode(JSON.stringify(validateShare(shared)));
 if(bytes.length>MAX_SHARE_LENGTH)throw Error('공유 링크가 너무 큽니다. 빌드 JSON 내보내기를 이용하세요.');
 const encoded=btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 if(encoded.length>MAX_SHARE_LENGTH)throw Error('공유 링크가 너무 큽니다. 빌드 JSON 내보내기를 이용하세요.');
 return '#build='+encoded;
}
export function decodeShare(hash:string):SharedBuild {
 const encoded=hash.slice(7);
 if(!hash.startsWith('#build=')||!encoded||encoded.length>MAX_SHARE_LENGTH||!/^[A-Za-z0-9_-]+$/.test(encoded))throw Error('공유 링크가 잘렸거나 지원하지 않는 형식입니다.');
 try {const bytes=Uint8Array.from(atob(encoded.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));return validateShare(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));}
 catch {throw Error('공유 링크 내용을 읽지 못했습니다. 원본 링크를 다시 확인하세요.');}
}
