"""Validate decoded official UI tile geometry; does not certify world projection."""
import hashlib
import json
import math
from pathlib import Path
import re
import sys


def number(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError('Invalid numeric coordinate')
    return value


def audit(settings, exports):
    key = settings['WorldMapDataTableKey']
    if not re.fullmatch(r'[A-Za-z0-9_]+', key):
        raise ValueError('Invalid map key')
    dims = [number(settings['SectorSize'][axis]) for axis in ('X', 'Y')]
    if any(n != int(n) or not 1 <= n <= 64 for n in dims):
        raise ValueError('Invalid grid size')
    size = number(settings['SectorPlaneSize'])
    if size <= 0:
        raise ValueError('Invalid plane size')
    actors = [row for row in exports if row['Type'] == 'BP_WorldMapPlane_C']
    seen = set()
    for actor in actors:
        props = actor['Properties']
        texture = props['SectorTexture']['ObjectPath']
        match = re.search(r'/' + re.escape(key) + r'_(\d+)_(\d+)\.0$', texture)
        if not match:
            raise ValueError('Unexpected tile texture')
        xy = tuple(map(int, match.groups()))
        if xy in seen or any(n < 0 or n >= dim for n, dim in zip(xy, dims)):
            raise ValueError('Duplicate or out-of-range tile')
        seen.add(xy)
        # Unreal omits the zero-valued struct on the first tile.
        index = props.get('SectorIndex', {'X': 0, 'Y': 0})
        if tuple(number(index.get(axis, 0)) for axis in ('X', 'Y')) != xy:
            raise ValueError('Sector index differs from texture')
        reference = props['PlaneComponent']['ObjectPath']
        if reference != props['RootComponent']['ObjectPath']:
            raise ValueError('Unexpected root component')
        component = exports[int(reference.rsplit('.', 1)[1])]
        if component['Type'] != 'StaticMeshComponent':
            raise ValueError('Invalid component reference')
        cp = component['Properties']
        if 'AttachParent' in cp or any(number(v) != 0 for v in cp.get('RelativeRotation', {}).values()):
            raise ValueError('Unsupported component transform')
        for axis, tile, dim in zip(('X', 'Y'), xy, dims):
            expected = (tile + .5 - dim / 2) * size
            if abs(number(cp['RelativeLocation'][axis]) - expected) > .01:
                raise ValueError('Displaced tile')
        for ref in cp['OverrideMaterials']:
            material = exports[int(ref['ObjectPath'].rsplit('.', 1)[1])]
            if material['Type'] != 'MaterialInstanceDynamic':
                raise ValueError('Unexpected tile material')
            textures = [r['ParameterValue']['ObjectPath'] for r in material['Properties']['TextureParameterValues']
                        if r['ParameterInfo']['Name'] == 'Texture']
            if textures != [texture]:
                raise ValueError('Material texture mismatch')
        if not cp['OverrideMaterials']:
            raise ValueError('Missing material')
    if len(seen) != dims[0] * dims[1]:
        raise ValueError('Incomplete tile grid')
    return {'mapKey': key, 'tileCount': len(seen), 'grid': dims, 'planeSize': size,
            'uiTileLayoutVerified': True, 'worldProjectionVerified': False}


def from_directories(data, packages):
    results = []
    hashes = {}
    for path in sorted((Path(data) / 'WorldMap').glob('*.json')):
        key = path.stem
        package = Path(packages) / key / ('WorldMap_' + key + '.json')
        if not package.is_file():
            raise ValueError('Missing UI package: ' + key)
        raw, ui = path.read_bytes(), package.read_bytes()
        try:
            results.append(audit(json.loads(raw)['Properties']['Data'], json.loads(ui)))
        except (ValueError, KeyError, IndexError, TypeError) as error:
            results.append({'mapKey': key, 'uiTileLayoutVerified': False,
                            'worldProjectionVerified': False, 'failure': str(error)})
        hashes[key] = {'settings': hashlib.sha256(raw).hexdigest(), 'package': hashlib.sha256(ui).hexdigest()}
    if not results:
        raise ValueError('No settings found')
    return {'format': 'a2bc-map-tile-audit-v1', 'maps': results, 'inputSha256': hashes,
            'scope': 'UI tile centers, indices and texture references only; no world spawn projection or UV verification.'}


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('Expected decoded Data and UI WorldMap directories')
    print(json.dumps(from_directories(*sys.argv[1:]), indent=2, allow_nan=False))
