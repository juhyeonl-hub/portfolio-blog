import type {EquippedDetail} from './equipment-advice';
export type EquipmentIdentity={id:string;server:string;region:string};
export type EquipmentItem={id:number;slotPos:number;enchantLevel:number};
export type EquipmentTask={key:string;identity:EquipmentIdentity;item:EquipmentItem};
export type EquipmentOption={status:'queued'|'loading'|'ready'|'error';detail?:EquippedDetail;checkedAt?:string;error?:string};
export function equipmentKey(identity:EquipmentIdentity|null,item:EquipmentItem|undefined){
 return identity&&item?JSON.stringify([identity.region,identity.server,identity.id,item.slotPos,item.id,item.enchantLevel]):'';
}
// One comparison owns this queue. Never put actual rolls in a global/browser-persistent cache.
export class EquipmentOptions {
 readonly entries=new Map<string,EquipmentOption>();
 readonly tasks=new Map<string,EquipmentTask>();
 readonly controller=new AbortController();
 private queue:string[]=[];
 private active=0;
 private started=false;
 private disposed=false;
 private listeners=new Set<()=>void>();
 private revision=0;
 readonly subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
 readonly getVersion=()=>this.revision;
 constructor(tasks:EquipmentTask[],private fetchItem:(task:EquipmentTask,signal:AbortSignal)=>Promise<EquippedDetail>){
  for(const task of tasks)if(!this.tasks.has(task.key)){this.tasks.set(task.key,task);this.entries.set(task.key,{status:'queued'});this.queue.push(task.key);}
 }
 private changed(){if(!this.disposed){this.revision++;for(const fn of this.listeners)fn();}}
 start(){if(this.started||this.disposed)return;this.started=true;this.pump();}
 prioritize(keys:string[]){
  const first=keys.filter((key,i)=>keys.indexOf(key)===i&&this.queue.includes(key));
  this.queue=[...first,...this.queue.filter(key=>!first.includes(key))];
 }
 retry(key:string){
  if(this.disposed||this.entries.get(key)?.status!=='error')return;
  this.entries.set(key,{status:'queued'});this.queue.unshift(key);this.changed();this.pump();
 }
 dispose(){this.disposed=true;this.queue=[];this.controller.abort();this.listeners.clear();}
 private pump(){
  // Two requests at a time, including both characters. Existing server guards still apply.
  while(!this.disposed&&this.active<2&&this.queue.length){
   const key=this.queue.shift()!,task=this.tasks.get(key)!;
   this.active++;this.entries.set(key,{status:'loading'});this.changed();
   Promise.resolve().then(()=>{if(this.disposed)throw new DOMException('Aborted','AbortError');return this.fetchItem(task,this.controller.signal);}).then(detail=>{
    if(!this.disposed){this.entries.set(key,{status:'ready',detail,checkedAt:new Date().toISOString()});this.changed();}
   }).catch(error=>{
    if(this.disposed)return;
    const message=error instanceof Error?error.message:'공식 조회 실패';
    this.entries.set(key,{status:'error',error:message});
    // Do not hammer a busy server with the rest of the prefetch queue. Retry is explicit.
    if(error?.status===429){for(const waiting of this.queue)this.entries.set(waiting,{status:'error',error:message});this.queue=[];}
    this.changed();
   }).finally(()=>{this.active--;this.pump();});
  }
 }
}
