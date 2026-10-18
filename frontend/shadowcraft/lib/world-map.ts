export type MapMarker = {id: string; name: string; categoryId: string; x: number; y: number};
export type MapDataset = {
  schema: 'a2bc-map-v1'; region: 'global'; coordinates: 'normalized-top-left';
  id: string; name: string; version: string;
  categories: {id: string; name: string}[]; markers: MapMarker[];
};
export const MAX_MAP_BYTES = 2_000_000;

export function parseMapDataset(text: string): MapDataset {
  if (new TextEncoder().encode(text).length > MAX_MAP_BYTES) throw new Error('지도 파일은 2 MB 이하여야 합니다.');
  const data = JSON.parse(text);
  const label = (v: unknown): v is string => typeof v === 'string' && !!v.trim() && v.length <= 160;
  if (!data || data.schema !== 'a2bc-map-v1' || data.region !== 'global' ||
      data.coordinates !== 'normalized-top-left' || !label(data.id) || !label(data.name) || !label(data.version)) {
    throw new Error('글로벌용 a2bc 지도 파일이 아니거나 좌표 형식이 다릅니다.');
  }
  if (!Array.isArray(data.categories) || !data.categories.length || data.categories.length > 50 ||
      !Array.isArray(data.markers) || data.markers.length > 5000) throw new Error('분류는 1~50개, 위치는 최대 5000개까지 지원합니다.');
  const categories = new Set<string>();
  for (const category of data.categories) {
    if (!category || !label(category.id) || !label(category.name) || categories.has(category.id)) throw new Error('지도 분류가 잘못되었거나 중복되었습니다.');
    categories.add(category.id);
  }
  const ids = new Set<string>();
  for (const marker of data.markers) {
    if (!marker || !label(marker.id) || !label(marker.name) || ids.has(marker.id) || !categories.has(marker.categoryId) ||
        ![marker.x, marker.y].every(v => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1)) {
      throw new Error('위치 ID·분류 또는 좌표가 올바르지 않습니다. 좌표는 0~1 범위여야 합니다.');
    }
    ids.add(marker.id);
  }
  // Deliberately strip external URLs and any self-declared verification flags.
  return {schema: 'a2bc-map-v1', region: 'global', coordinates: 'normalized-top-left',
    id: data.id, name: data.name, version: data.version,
    categories: data.categories.map((c: {id: string; name: string}) => ({id: c.id, name: c.name})),
    markers: data.markers.map((m: MapMarker) => ({id: m.id, name: m.name, categoryId: m.categoryId, x: m.x, y: m.y}))};
}

export async function mapProgressKey(dataset: MapDataset): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(dataset)));
  return 'a2bc-map-progress-v1:' + [...new Uint8Array(hash)].map(n => n.toString(16).padStart(2, '0')).join('');
}

type StoragePort = {getItem(key: string): string | null; setItem(key: string, value: string): void};
export function loadMapProgress(storage: StoragePort, key: string, dataset: MapDataset): {completed: string[]; writable: boolean} {
  try {
    const raw = storage.getItem(key);
    if (raw === null) return {completed: [], writable: true};
    if (raw.length > MAX_MAP_BYTES) throw new Error('Oversized progress');
    const value = JSON.parse(raw);
    const ids = new Set(dataset.markers.map(m => m.id));
    if (value?.schema !== 'a2bc-map-progress-v1' || !Array.isArray(value.completed) ||
        value.completed.length > ids.size || value.completed.some((id: unknown) => typeof id !== 'string' || !ids.has(id)) ||
        new Set(value.completed).size !== value.completed.length) throw new Error('Invalid progress');
    return {completed: value.completed, writable: true};
  } catch { return {completed: [], writable: false}; }
}

/** Read-only migration: a current record, even empty/corrupt, always takes precedence.
 * Legacy bytes remain untouched; the next explicit mark saves the new revision. */
export function loadMapProgressWithLegacy(storage: StoragePort, key: string, dataset: MapDataset, legacyKey?: string) {
  try {
    if(storage.getItem(key)!==null || !legacyKey || legacyKey===key) return loadMapProgress(storage,key,dataset);
    return loadMapProgress(storage,legacyKey,dataset);
  } catch {return {completed:[] as string[],writable:false};}
}

export function saveMapProgress(storage: StoragePort, key: string, completed: string[]): boolean {
  try { storage.setItem(key, JSON.stringify({schema: 'a2bc-map-progress-v1', completed})); return true; }
  catch { return false; }
}

export function filterMapMarkers(dataset: MapDataset, query: string, categories: Set<string>, completed: Set<string>, hideCompleted: boolean) {
  const search = query.trim().toLocaleLowerCase();
  return dataset.markers.filter(m => categories.has(m.categoryId) && (!hideCompleted || !completed.has(m.id)) &&
    `${m.name} ${m.id}`.toLocaleLowerCase().includes(search));
}

export type MapView = {x: number; y: number; zoom: number};
export function constrainMapView(view: MapView): MapView {
  if (![view.x, view.y, view.zoom].every(Number.isFinite)) throw new Error('Invalid viewport');
  const zoom = Math.min(8, Math.max(1, view.zoom));
  const max = 1000 - 1000 / zoom;
  return {x: Math.max(0, Math.min(max, view.x)), y: Math.max(0, Math.min(max, view.y)), zoom};
}
export function zoomMap(view: MapView, zoom: number): MapView {
  const next = Math.min(8, Math.max(1, zoom));
  const offset = 500 / view.zoom - 500 / next;
  return constrainMapView({x: view.x + offset, y: view.y + offset, zoom: next});
}
