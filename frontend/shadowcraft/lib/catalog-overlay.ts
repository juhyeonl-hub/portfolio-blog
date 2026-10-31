import type {Catalog} from './planner';
export function withBundledBoards(remote:Catalog,bundled:Catalog):Catalog {
 if(remote.classKey!==bundled.classKey||!Array.isArray(remote.boards))return bundled;
 const ids=new Set(remote.boards.map(b=>b.id));
 return {...remote,boards:[...remote.boards,...bundled.boards.filter(b=>!ids.has(b.id))].sort((a,b)=>Number(a.id)-Number(b.id))};
}
