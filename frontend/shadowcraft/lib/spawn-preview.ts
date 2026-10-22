import type {MapView} from './world-map';
export type SpawnPreview = {id:string;name:string;kind:string;x:number;y:number;world:number[];spawnId:string;objectId:number;locationType?:string;questId?:number};
export function previewMatches(rows: SpawnPreview[], kind: string | ReadonlySet<string>, query: string, excludedGatherNames: ReadonlySet<string> = new Set()) {
  const words=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return rows.filter(row=>(typeof kind === 'string' ? kind==='all' || row.kind===kind : kind.has(row.kind)) && (row.kind!=='gather' || !excludedGatherNames.has(row.name)) && words.every(word=>row.name.toLowerCase().includes(word)));
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

export function previewGatherKinds(rows: SpawnPreview[]) {
  const counts=new Map<string,number>();
  for(const row of rows)if(row.kind==='gather')counts.set(row.name,(counts.get(row.name) ?? 0)+1);
  return [...counts].sort(([a],[b])=>a.localeCompare(b,'en')).map(([name,count])=>({name,count}));
}

/** Same-map, planar proximity only; caller supplies the full region, not filtered layers. */
export function nearestTeleports(rows: SpawnPreview[], target: SpawnPreview) {
  return rows.filter(row=>row.kind==='teleport' && row.id!==target.id)
    .map(row=>({row,distance:(row.x-target.x)**2+(row.y-target.y)**2}))
    .sort((a,b)=>a.distance-b.distance || a.row.id.localeCompare(b.row.id))
    .slice(0,3).map(item=>item.row);
}

/** All visible candidates remain represented; dense layers never consume another layer's quota. */
export function groupPreviewMarkers(rows:SpawnPreview[],view:MapView,width:number,selected:string){
 const step=28/Math.max(240,width)*1000/view.zoom;
 const groups=new Map<string,SpawnPreview[]>();
 for(const row of rows){
  const dense=view.zoom<8&&['gather','npc','cube','trace'].includes(row.kind);
  const key=row.id===selected||!dense?row.id:[row.kind,row.kind==='gather'?row.name:'',Math.floor(row.x/step),Math.floor(row.y/step)].join(':');
  const group=groups.get(key)||[];group.push(row);groups.set(key,group);
 }
 return [...groups].map(([key,members])=>({key,members,row:members[0],x:members.reduce((n,r)=>n+r.x,0)/members.length,y:members.reduce((n,r)=>n+r.y,0)/members.length}))
  .sort((a,b)=>Number(a.row.id===selected)-Number(b.row.id===selected)||Number(!['gather','npc','cube','trace'].includes(a.row.kind))-Number(!['gather','npc','cube','trace'].includes(b.row.kind)));
}
/** Tint only cells containing supplied candidate coordinates, never invent a full biome boundary. */
export function gatheringCells(rows:SpawnPreview[],name:string){
 const cells=new Map<string,{x:number;y:number;count:number}>();
 for(const row of rows){if(row.kind!=='gather'||row.name!==name)continue;const x=Math.min(39,Math.floor(row.x/25))*25,y=Math.min(39,Math.floor(row.y/25))*25,key=x+':'+y;
  const cell=cells.get(key)||{x,y,count:0};cell.count++;cells.set(key,cell);
 }
 return [...cells.values()];
}
export function progressPercent(done:number,total:number){return total?Number((done/total*100).toFixed(2)):0;}
