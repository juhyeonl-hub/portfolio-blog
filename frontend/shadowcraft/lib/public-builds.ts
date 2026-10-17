import {isClassKey} from './classes';
import {validateShare,type SharedBuild} from './build-share';
export const buildId=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);
export type PublicBuildSummary={id:string;authorId?:string|null;author?:string|null;votes?:number;title:string;description:string;classKey:string;catalogVersion:string;published:boolean;revision:number;updatedAt:string};
export type PublicBuildListing={items:PublicBuildSummary[];page:number;totalElements:number;totalPages:number};
export type PublicBuildDetail={id:string;authorId?:string|null;author?:string|null;votes?:number;title:string;description:string;published:boolean;revision:number;updatedAt:string;shared:SharedBuild};
function validMetadata(v:any){return v&&buildId(v.id)&&typeof v.title==='string'&&v.title.trim()&&v.title.length<=80&&typeof v.description==='string'&&v.description.length<=2000&&v.published===true&&Number.isSafeInteger(v.revision)&&v.revision>=0&&typeof v.updatedAt==='string'&&Number.isFinite(Date.parse(v.updatedAt));}
export function parseListing(v:any):PublicBuildListing {
 if(!v||!Array.isArray(v.items)||v.items.length>20||!Number.isSafeInteger(v.page)||v.page<0||!Number.isSafeInteger(v.totalElements)||v.totalElements<0||!Number.isSafeInteger(v.totalPages)||v.totalPages!==Math.ceil(v.totalElements/20)||new Set(v.items.map((x:any)=>x?.id)).size!==v.items.length||v.items.some((x:any)=>!validMetadata(x)||!isClassKey(x.classKey)||typeof x.catalogVersion!=='string'||!x.catalogVersion||x.catalogVersion.length>100))throw Error('공개 빌드 목록의 형식이 올바르지 않습니다.');
 return v;
}
export function parsePublicBuild(v:any,id:string):PublicBuildDetail {if(!validMetadata(v)||v.id!==id)throw Error('공개 빌드를 확인하지 못했습니다.');return {...v,shared:validateShare(v.shared)};}
