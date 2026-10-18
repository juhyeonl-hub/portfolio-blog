import type {MapView} from './world-map';
export type SpawnPreview = {id:string;name:string;kind:string;x:number;y:number;world:number[];spawnId:string;objectId:number;locationType?:string;questId?:number};
export function previewMatches(rows: SpawnPreview[], kind: string | ReadonlySet<string>, query: string) {
  const words=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return rows.filter(row=>(typeof kind === 'string' ? kind==='all' || row.kind===kind : kind.has(row.kind)) && words.every(word=>row.name.toLowerCase().includes(word)));
}
export function visiblePreview(rows: SpawnPreview[], view: MapView) {
  const size=1000/view.zoom;
  return rows.filter(row=>row.x>=view.x && row.x<=view.x+size && row.y>=view.y && row.y<=view.y+size);
}

export const previewKinds: Record<string, {name:string;color:string}> = {
  teleport:{name:'이동 지점',color:'#5eead4'}, gather:{name:'채집물',color:'#fbbf24'},
  named:{name:'네임드 몬스터',color:'#fb7185'}, npc:{name:'NPC',color:'#a5b4fc'},
  sealed:{name:'봉인던전',color:'#e879f9'}, stronghold:{name:'주둔지',color:'#f97316'},
  dungeon:{name:'던전 입구',color:'#c084fc'}, rift:{name:'균열',color:'#38bdf8'},
  monolith:{name:'모노리스',color:'#fb923c'}, cube:{name:'큐브',color:'#f9a8d4'}, trace:{name:'Empyrean Trace',color:'#bef264'},
};
export function previewKindLabel(kind: string) {
  if(kind==='cube')return '히든큐브';
  if(kind==='trace')return '깃털 (Empyrean Trace)';
  if(kind==='dungeon')return '기타 던전 입구';
  return previewKinds[kind]?.name ?? kind;
}
/** Separate from planner/user-imported maps; hashing the canonical dataset isolates revisions. */
export function previewProgressDataset(name: string, rows: SpawnPreview[]) {
  return {schema:'a2bc-map-v1' as const,region:'global' as const,coordinates:'normalized-top-left' as const,
    id:name,name,version:'25926599-preview',categories:Object.entries(previewKinds).map(([id,c])=>({id,name:c.name})),
    markers:rows.map(row=>({id:row.id,name:row.name,categoryId:row.kind,x:row.x/1000,y:row.y/1000}))};
}
export function previewPage(rows: SpawnPreview[], page: number, selected: string) {
  const pages=Math.max(1,Math.ceil(rows.length/200));
  const current=Math.min(Math.max(0,page),pages-1);
  const result=rows.slice(current*200,(current+1)*200);
  const picked=rows.find(row=>row.id===selected);
  return {pages,current,rows:picked && !result.some(row=>row.id===selected)?[picked,...result]:result};
}
