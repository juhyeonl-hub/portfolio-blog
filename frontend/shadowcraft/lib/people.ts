import type {Catalog} from './planner';
import {isClassKey} from './classes';
export const REGIONS=['eu','nae','naw','la','as'];
export const personId=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(v);
export type CharacterTarget={region:string;classKey:string;server:string;id:string};
export function characterTarget(v:CharacterTarget):boolean{return REGIONS.includes(v.region)&&isClassKey(v.classKey)&&/^\d{1,6}$/.test(v.server)&&typeof v.id==='string'&&v.id.length>=5&&v.id.length<=200;}
export function characterHref(v:CharacterTarget){return '#/people?'+new URLSearchParams({kind:'character',region:v.region,class:v.classKey,server:v.server,id:v.id});}
export function authorHref(id:string){return personId(id)?'#/people?kind=author&author='+id:'#/people?kind=author';}
export function readPeopleRoute(hash:string){
 const p=new URLSearchParams(hash.split('?')[1]||'');const kind=p.get('kind')==='author'?'author':'character';
 const target={region:p.get('region')||'eu',classKey:p.get('class')||'templar',server:p.get('server')||'',id:p.get('id')||''};
 const id=p.get('author')||'';
 return {kind,author:personId(id)?id:'',target:characterTarget(target)?target:null,invalid:kind==='author'?!!id&&!personId(id):!!p.get('id')&&!characterTarget(target)};
}
export type BuildAuthor={id:string;name:string;builds:number};
export type AuthorListing={items:BuildAuthor[];page:number;totalElements:number;totalPages:number};
export function parseAuthors(v:any):AuthorListing{
 if(!v||!Array.isArray(v.items)||v.items.length>20||!Number.isSafeInteger(v.page)||v.page<0||!Number.isSafeInteger(v.totalElements)||v.totalElements<0||v.totalPages!==Math.ceil(v.totalElements/20)||v.items.some((a:any)=>!a||!personId(a.id)||typeof a.name!=='string'||!a.name.trim()||a.name.length>32||!Number.isSafeInteger(a.builds)||a.builds<1)||new Set(v.items.map((a:any)=>a.id)).size!==v.items.length)throw Error('검색 응답의 형식을 확인하지 못했습니다.');
 return v;
}
export function checkedCharacter(v:any,target:CharacterTarget){
 if(!v||v.classKey!==target.classKey||v.region!==target.region||String(v.profile?.serverId)!==target.server||v.profile?.characterId!==target.id||typeof v.profile?.characterName!=='string'||!v.profile.characterName||!Number.isFinite(Date.parse(v.importedAt)))throw Error('선택한 캐릭터와 조회 결과가 다릅니다. 다시 검색하세요.');
 return v;
}

// A missing/failed board response is unknown, never a board with no selected nodes.
export function observedBoards(catalog:Catalog,character:any):Catalog|null{
 if(!Array.isArray(character.boards)||!Array.isArray(character.nodes)||character.nodes.length>2000||!Array.isArray(character.failedBoards)||character.failedBoards.length)return null;
 const ids=new Set(character.boards.filter((b:any)=>b&&(b.open===true||b.open===1)).map((b:any)=>String(b.id)));
 const boards=catalog.boards.filter(b=>ids.has(b.id)),known=new Set(boards.flatMap(b=>b.nodes.map(n=>n.id)));
 if(character.nodes.some((id:unknown)=>typeof id!=='string'||!known.has(id)))return null;
 return {...catalog,boards};
}
