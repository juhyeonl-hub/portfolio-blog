import {validateShare,validateGuide,type SharedBuild} from './build-share';

export type DraftScope={owner:string;scope:string;revision:number};
export type PostDraft={title:string;description:string;shared:SharedBuild};
type StoragePort=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export const DRAFT_TTL=24*60*60*1000;
const PREFIX='asbc-public-draft-v1:';
export function draftKey(context:DraftScope){return PREFIX+encodeURIComponent(context.owner)+':'+encodeURIComponent(context.scope);}
function validate(value:any):PostDraft {
 if(!value||typeof value.title!=='string'||value.title.length>80||typeof value.description!=='string'||value.description.length>2000)throw Error('Invalid draft');
 const shared=validateShare({...value.shared,guide:undefined});
 // Unfinished equipment names are valid in a recovery draft, but still block publication.
 if(value.shared.guide){const guide=value.shared.guide;if(!Array.isArray(guide.items))throw Error('Invalid draft');validateGuide({...guide,items:guide.items.map((i:any)=>({...i,name:typeof i.name==='string'&&!i.name.trim()?'Draft':i.name}))});shared.guide=guide;}
 return {title:value.title,description:value.description,shared};
}
export function writeDraft(storage:StoragePort,context:DraftScope,draft:PostDraft,now=Date.now()):boolean {
 try{const value=validate(draft);const raw=JSON.stringify({version:1,revision:context.revision,savedAt:now,draft:value});if(raw.length>160000)return false;storage.setItem(draftKey(context),raw);return true;}catch{return false;}
}
export function readDraft(storage:StoragePort,context:DraftScope,now=Date.now()):PostDraft|null {
 try{const raw=storage.getItem(draftKey(context));if(!raw||raw.length>160000)return null;const x=JSON.parse(raw);
  if(x.version!==1||x.revision!==context.revision||!Number.isFinite(x.savedAt)||x.savedAt>now||now-x.savedAt>DRAFT_TTL)return null;
  return validate(x.draft);
 }catch{return null;}
}
export function clearDraft(storage:StoragePort,context:DraftScope){try{storage.removeItem(draftKey(context));}catch{}}
export function latestDraftLink(storage:Storage,owner:string,now=Date.now()):string|null {
 try{let latest=0,href:string|null=null;const prefix=PREFIX+encodeURIComponent(owner)+':';
  for(let i=0;i<storage.length;i++){const key=storage.key(i);if(!key?.startsWith(prefix))continue;const scope=decodeURIComponent(key.slice(prefix.length));if(scope!=='new'&&!/^[0-9a-f-]{36}$/i.test(scope))continue;
   const raw=storage.getItem(key);if(!raw||raw.length>160000)continue;let x;try{x=JSON.parse(raw)}catch{continue;}
   if(!Number.isInteger(x.revision)||!readDraft(storage,{owner,scope,revision:x.revision},now))continue;
   if(x.savedAt>=latest){latest=x.savedAt;href=scope==='new'?'#/public-builds':'#published='+scope;}
  }return href;
 }catch{return null;}
}
