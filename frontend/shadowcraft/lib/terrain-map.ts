import type {MapView} from './world-map';

/** Keep anchored labels apart; zooming reveals names hidden by dense placement. */
export function terrainLabelNames(labels: {id: string; name: string; x: number; y: number}[], zoom: number) {
  const boxes: {left: number; right: number; top: number; bottom: number}[] = [];
  const visible = new Set<string>();
  const font = 12 / Math.sqrt(zoom);
  for (const label of labels) {
    const half = (label.name.length * font * .65 + 8 / zoom) / 2;
    const box = {left: label.x - half, right: label.x + half, top: label.y - font, bottom: label.y + 4 / zoom};
    if (boxes.some(b=>box.left < b.right && box.right > b.left && box.top < b.bottom && box.bottom > b.top)) continue;
    boxes.push(box); visible.add(label.id);
  }
  return visible;
}

/** Terrain coordinates are local to the image; this does not project game coordinates. */
export function visibleTerrainTiles(view: MapView, gridSize: number) {
  if (!Number.isInteger(gridSize) || gridSize < 1 || gridSize > 16 ||
      !Number.isFinite(view.x) || !Number.isFinite(view.y) || !Number.isFinite(view.zoom) ||
      view.zoom < 1 || view.zoom > 8 || view.x < 0 || view.y < 0 ||
      view.x + 1000 / view.zoom > 1000 + 1e-6 || view.y + 1000 / view.zoom > 1000 + 1e-6) throw Error('Invalid terrain viewport');
  const width = 1000 / gridSize, size = 1000 / view.zoom;
  const result = [];
  for (let y = Math.floor(view.y / width); y < Math.min(gridSize, Math.ceil((view.y + size) / width)); y++) {
    for (let x = Math.floor(view.x / width); x < Math.min(gridSize, Math.ceil((view.x + size) / width)); x++) {
      result.push({x, y, left: x * width, top: y * width, width});
    }
  }
  return result;
}

export type TerrainLocation = {id: string; name: string; x: number; y: number};

export function searchTerrainLocations(labels: TerrainLocation[], query: string) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return labels.filter(label => words.every(word => label.name.toLocaleLowerCase().includes(word)));
}

/** Center a verified map-local location without panning beyond the terrain. */
export function terrainLocationView(location: TerrainLocation): MapView {
  if (![location.x, location.y].every(v => Number.isFinite(v) && v >= 0 && v <= 1000)) {
    throw Error('Invalid terrain location');
  }
  const zoom = 4, size = 1000 / zoom;
  return {x: Math.max(0, Math.min(1000 - size, location.x - size / 2)),
    y: Math.max(0, Math.min(1000 - size, location.y - size / 2)), zoom};
}
