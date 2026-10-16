"""Validate exported map-local tile placement and resolve explicit region labels.

Input packages must pass the strict package audit before use. This does not
establish any transform from gameplay/world coordinates to the terrain.
"""
import hashlib
from collections import Counter
import json
import math
from pathlib import Path
import re
import sys


def reference(objects, ref):
    name = ref['ObjectName']
    matches = [o for o in objects if name == o['Type'] + "'" +
               o.get('Outer', {}).get('ObjectName', "''").split("'", 1)[-1].rstrip("'") + '.' + o['Name'] + "'"]
    if len(matches) != 1:
        raise ValueError('Missing or ambiguous object reference')
    return matches[0]


def validate_layout(objects, key, grid):
    tiles = {}
    for actor in objects:
        if actor['Type'] != 'BP_WorldMapPlane_C':
            continue
        props = actor['Properties']
        texture = props['SectorTexture']['ObjectName']
        match = re.fullmatch(r"Texture2D'" + re.escape(key) + r"_(\d{2})_(\d{2})'", texture)
        if not match:
            raise ValueError('Unexpected tile texture')
        x, y = map(int, match.groups())
        if not 0 <= x < grid or not 0 <= y < grid or (x, y) in tiles:
            raise ValueError('Duplicate or out-of-grid tile')
        if props.get('RootComponent') != props['PlaneComponent']:
            raise ValueError('Tile plane is not the root component')
        plane = reference(objects, props['PlaneComponent'])['Properties']
        if plane.get('RelativeRotation', {}) or plane.get('AttachParent') or actor['Properties'].get('ActorTransform'):
            raise ValueError('Unreviewed transform')
        location = plane['RelativeLocation']
        expected = {'X': (x + .5 - grid / 2) * 1024, 'Y': (y + .5 - grid / 2) * 1024, 'Z': 0}
        if any(type(location[k]) not in (int, float) or not math.isfinite(location[k]) or abs(location[k] - v) > .001 for k, v in expected.items()):
            raise ValueError('Tile location differs from the reviewed grid')
        if plane['RelativeScale3D'] != {'X': 10.24, 'Y': 10.24, 'Z': 1.0}:
            raise ValueError('Unexpected tile scale')
        materials = plane['OverrideMaterials']
        if len(materials) != 1:
            raise ValueError('Unexpected tile materials')
        material = reference(objects, materials[0])['Properties']
        values = material['TextureParameterValues']
        if len(values) != 1 or values[0]['ParameterValue'] != props['SectorTexture']:
            raise ValueError('Material and actor textures disagree')
        tiles[x, y] = True
    if len(tiles) != grid * grid:
        raise ValueError('Incomplete tile grid')
    return len(tiles)


def labels(objects, regions, english, grid, map_id=1010):
    result, unresolved, seen = [], [], set()
    for actor in objects:
        if actor['Type'] != 'AionPreviewLocation':
            continue
        props = actor['Properties']
        key = props['LocationName']
        if key in seen:
            raise ValueError('Duplicate label')
        seen.add(key)
        rows = [r for r in regions if r['MapId']['Value'] == map_id and r['WorldMapNameActor'] == key]
        if len(rows) > 1:
            raise ValueError('Ambiguous region label')
        name = english.get('String_' + rows[0]['Desc']['Key'] + '_body') if rows else None
        if not isinstance(name, str) or not name.strip():
            unresolved.append(key)
            continue
        component = reference(objects, props['RootComponent'])['Properties']
        if component.get('AttachParent') or component.get('RelativeRotation'):
            raise ValueError('Unreviewed label transform')
        location = component['RelativeLocation']
        if any(type(location[axis]) not in (int, float) for axis in ('X', 'Y')):
            raise ValueError('Invalid label coordinate')
        x, y = [(location[axis] / (grid * 1024) + .5) * 1000 for axis in ('X', 'Y')]
        if not all(math.isfinite(v) and 0 <= v <= 1000 for v in (x, y)):
            raise ValueError('Label outside terrain')
        result.append({'id': key, 'name': name, 'x': round(x, 6), 'y': round(y, 6)})
    return sorted(result, key=lambda r: r['id']), sorted(unresolved)


def validate_audit(objects, log, package_count=1):
    if 'A2BC_OBJECT_ERROR' in log or sum(map(int, re.findall(r'exported: (\d+) packages', log))) != package_count:
        raise ValueError('Package audit did not complete')
    records = re.findall(r'^A2BC_OBJECT (\S+) (\S+) size=\d+ remaining=(-?\d+)\s*$', log, re.M)
    if not records or any(int(remaining) != 0 for _, _, remaining in records):
        raise ValueError('Package contains unread bytes')
    actual = Counter((kind, name) for kind, name, _ in records)
    expected = Counter((o['Type'], o['Name']) for o in objects)
    if expected - actual:
        raise ValueError('Incomplete package audit coverage')


MAPS = [('World_L_A', 'Verteron', 8, 1010), ('World_D_A', 'Altgard', 8, 1110),
        ('Abyss_Reshanta_A', 'Chaotic Lower Reshanta', 4, 20), ('Abyss_Reshanta_C', 'Chaotic Middle Reshanta', 2, 22)]


def build(package_dir, region_file, english_file, *audit_logs):
    files = sorted(Path(package_dir).rglob('WorldMap_*.json'))
    if len(files) != 12:
        raise ValueError('Expected six terrain packages and six linked design packages')
    packages = {p.stem: json.loads(p.read_text()) for p in files}
    if len(packages) != len(files):
        raise ValueError('Duplicate map package')
    validate_audit([o for objects in packages.values() for o in objects],
                   '\n'.join(Path(p).read_text() for p in audit_logs), 12)
    regions = json.loads(Path(region_file).read_text())['Properties']['Data']
    english = json.loads(Path(english_file).read_text())['Entries']
    maps = []
    for key, name, grid, map_id in MAPS:
        root = packages['WorldMap_' + key]
        design = packages['WorldMap_' + key + '_Design']
        links = [o['Properties']['WorldAsset']['AssetPathName'] for o in root if o['Type'] == 'LevelStreamingDynamic']
        expected = f'/Game/UI/Map/WorldMap/{key}/WorldMap_{key}_Design.WorldMap_{key}_Design'
        if links != [expected]:
            raise ValueError('Unexpected design package link')
        count = validate_layout(root, key, grid)
        resolved, unresolved = labels(root + design, regions, english, grid, map_id)
        maps.append({'name': name, 'mapKey': key, 'validatedTiles': count, 'labels': resolved, 'unresolvedLabels': unresolved})
    inputs = [('regions', region_file), ('english', english_file)] + [(p.stem, p) for p in files] + [('audit' + str(i), p) for i, p in enumerate(audit_logs)]
    return {'schema': 'a2bc-terrain-labels-v1',
            'source': {'kind': 'installed-steam-client', 'appId': 3393110, 'buildId': '25926599', 'region': 'global'},
            'coordinateSpace': 'map-local', 'worldProjectionVerified': False, 'maps': maps,
            'sourceSha256': {name: hashlib.sha256(Path(path).read_bytes()).hexdigest() for name, path in inputs}}


if __name__ == '__main__':
    if len(sys.argv) != 7:
        raise SystemExit('Expected exported map directory, WorldMapUIRegion, English localization, three package audit logs')
    print(json.dumps(build(*sys.argv[1:]), ensure_ascii=False, indent=2))
