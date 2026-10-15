import type {MapView} from './world-map';

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
