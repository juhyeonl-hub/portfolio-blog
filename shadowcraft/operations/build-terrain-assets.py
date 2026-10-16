"""Package reviewed Global terrain tiles; no world-marker projection.

Requires Pillow in the operator environment (not a runtime app dependency).
Usage: build-terrain-assets.py PNG_DIR WORLD_MAP_JSON OUTPUT_DIR [DISPLAY_METADATA_JSON]
This recipe is deliberately pinned to the reviewed Steam build 25926599.
"""
import hashlib
import json
from pathlib import Path
import statistics
import sys
import tempfile
from PIL import Image, ImageChops, ImageStat

GRID = 8  # World_L_A's reviewed SectorSize, not inferred from filenames.
PIXELS = 2048  # Reviewed SectorTextureSize.
MAPS = {'World_L_A': ('Verteron', 'verteron', 10),
        'World_D_A': ('Altgard', 'altgard', 11)}
# Reviewed maximum seam RGB difference: Verteron 7.935, Altgard 10.829.


def validate_settings(path):
    data = json.loads(Path(path).read_text())['Properties']['Data']
    if data['WorldMapDataTableKey'] not in MAPS or data['SectorSize'] != {'X': GRID, 'Y': GRID} or data['SectorTextureSize'] != PIXELS:
        raise ValueError('Map settings differ from the reviewed snapshot')
    return data['WorldMapDataTableKey']


def package(source, settings, output, display_metadata=None):
    source, output = Path(source), Path(output)
    map_key = validate_settings(settings)
    name, slug, seam_limit = MAPS[map_key]
    # Global Altgard's exported texture mip is 1024 despite SectorTextureSize=2048.
    source_pixels = 1024 if map_key == 'World_D_A' else PIXELS
    if output.exists():
        raise ValueError('Output must be a new directory; preserve the previous export')
    edges, files = {}, {}
    for x in range(GRID):
        for y in range(GRID):
            path = source / f'{map_key}_{x:02}_{y:02}.png'
            with Image.open(path) as im:
                if im.size != (source_pixels, source_pixels):
                    raise ValueError('Unexpected tile dimensions: '+path.name)
                rgb = im.convert('RGB')
                edges[x,y] = [rgb.crop(box) for box in [(0,0,1,source_pixels),(source_pixels-1,0,source_pixels,source_pixels),(0,0,source_pixels,1),(0,source_pixels-1,source_pixels,source_pixels)]]
            files[x,y] = path
    seams = []
    for (x,y), edge in edges.items():
        for direction, neighbor, a, b in [('right',(x+1,y),1,0),('below',(x,y+1),3,2)]:
            if neighbor in edges:
                error = statistics.mean(ImageStat.Stat(ImageChops.difference(edge[a],edges[neighbor][b])).mean)
                seams.append({'x':x,'y':y,'direction':direction,'rgbMeanAbsoluteDifference':round(error,6)})
    # A conservative review gate, not a universal definition of a correct map.
    if max(row['rgbMeanAbsoluteDifference'] for row in seams) > seam_limit:
        raise ValueError('Tile seam exceeds reviewed tolerance; inspect orientation and source')
    manifest = {'schema':'a2bc-terrain-v1','name':name,'mapKey':map_key,'gridSize':GRID,
                'source':{'kind':'installed-steam-client','appId':3393110,'buildId':'25926599','region':'global'},
                'basePath':'/shadowcraft/maps/steam-25926599/'+slug,
                'sourceTilePixels':source_pixels,'displayTilePixels':1024,
                'worldProjectionVerified':False,'markerSupport':False,
                'settingsSha256':hashlib.sha256(Path(settings).read_bytes()).hexdigest(),'seams':seams,'tiles':[]}
    output.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(dir=output.parent) as temporary:
        folder = Path(temporary)/'tiles'
        folder.mkdir()
        for (x,y), path in files.items():
            target = folder/f'{x}_{y}.webp'
            with Image.open(path) as im:
                im.convert('RGBA').resize((1024,1024),Image.Resampling.LANCZOS).save(target,'WEBP',quality=85,method=6)
            manifest['tiles'].append({'x':x,'y':y,'file':target.name,'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),
                                      'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size})
        (folder/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
        folder.rename(output)
    if display_metadata is not None:
        metadata = Path(display_metadata)
        metadata.parent.mkdir(parents=True, exist_ok=True)
        temporary_metadata = metadata.with_suffix('.tmp')
        temporary_metadata.write_text(json.dumps({key:manifest[key] for key in ['name','source','gridSize','basePath']},indent=2)+'\n')
        temporary_metadata.replace(metadata)
    return manifest

if __name__ == '__main__':
    if len(sys.argv) not in (4, 5):
        raise SystemExit('Expected PNG directory, decoded WorldMap JSON, new output directory, optional display metadata JSON')
    result=package(*sys.argv[1:])
    print(json.dumps({'tiles':len(result['tiles']),'seams':len(result['seams']),'bytes':sum(t['bytes'] for t in result['tiles'])}))
