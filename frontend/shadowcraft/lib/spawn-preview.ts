import type {MapView} from './world-map';
export type SpawnPreview = {id:string;name:string;kind:string;x:number;y:number;world:number[];spawnId:string;objectId:number};
export function previewMatches(rows: SpawnPreview[], kind: string, query: string) {
  const words=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return rows.filter(row=>row.kind===kind && words.every(word=>row.name.toLowerCase().includes(word)));
}
export function visiblePreview(rows: SpawnPreview[], view: MapView) {
  const size=1000/view.zoom;
  return rows.filter(row=>row.x>=view.x && row.x<=view.x+size && row.y>=view.y && row.y<=view.y+size);
}
