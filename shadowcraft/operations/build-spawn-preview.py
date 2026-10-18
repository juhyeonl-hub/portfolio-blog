"""Export opt-in candidate locations, never a verified world projection."""
import hashlib
import json
import math
from pathlib import Path
import sys

KINDS = {'EEnvObjectUsage::GatherSource': 'gather', 'EEnvObjectUsage::TeleportArtifact': 'teleport'}
MAPS = [('World_L_A', 'Verteron', 1010, 'World_L'), ('World_D_A', 'Altgard', 1110, 'World_D')]


def extract(data, objects, english):
    result, seen = [], set()
    skipped = {'missingName': 0, 'outOfBounds': 0}
    for spawn in data['SpawnInfoList']:
        for ref in spawn['EnvObjIdList']:
            obj = objects.get(ref['Value'])
            if not obj or obj['Usage'] not in KINDS:
                continue
            name = english.get(obj['Desc']['Key'])
            if not isinstance(name, str) or not name.strip():
                skipped['missingName'] += len(spawn['Positions'])
                continue
            for i, pos in enumerate(spawn['Positions']):
                xyz = [pos['Location'][axis] for axis in ('X', 'Y', 'Z')]
                if any(type(v) not in (float, int) or not math.isfinite(v) for v in xyz):
                    raise ValueError('Invalid spawn coordinate')
                # Candidate only: external methodology corroborates /100; not independently validated.
                x, y = [(v / 100 / 8192 + .5) * 1000 for v in xyz[:2]]
                if not (0 <= x <= 1000 and 0 <= y <= 1000):
                    skipped['outOfBounds'] += 1
                    continue
                key = f"{data['MapId']}:{spawn['UniqueKey']}:{ref['Value']}:{i}"
                if key in seen:
                    raise ValueError('Duplicate spawn identity')
                seen.add(key)
                result.append({'id': key, 'name': name, 'kind': KINDS[obj['Usage']],
                               'x': round(x, 5), 'y': round(y, 5), 'world': xyz,
                               'spawnId': str(spawn['UniqueKey']), 'objectId': ref['Value']})
    return {'markers': result, 'skipped': skipped}


def build(root):
    root = Path(root)
    hashes = {}
    def read(rel):
        raw = (root / rel).read_bytes()
        hashes[rel] = hashlib.sha256(raw).hexdigest()
        return json.loads(raw)
    rows = read('AION2/Content/Data/Table/EnvObjData.json')['Properties']['Data']
    objects = {r['ID']['Value']: r for r in rows}
    if len(objects) != len(rows):
        raise ValueError('Duplicate object ID')
    english = read('English.json')['Entries']
    maps = []
    for key, name, map_id, folder in MAPS:
        data = read(f'AION2/Content/Data/Map/World/{folder}/{key}/MapData.json')['Properties']['Data']
        settings = read(f'AION2/Content/Data/WorldMap/{key}.json')['Properties']['Data']
        if data['MapId'] != map_id or settings['SectorSize'] != {'X': 8, 'Y': 8} or settings['SectorPlaneSize'] != 1024:
            raise ValueError('Unreviewed map identity or grid')
        maps.append({'name': name, 'mapKey': key, **extract(data, objects, english)})
    return {'schema': 'a2bc-spawn-preview-v1', 'buildId': '25926599', 'region': 'global',
            'worldProjectionVerified': False, 'projection': 'candidate world/100, centered 8192 UI plane',
            'maps': maps, 'sourceSha256': hashes}


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Expected October decoded directory')
    print(json.dumps(build(sys.argv[1]), ensure_ascii=False, separators=(',', ':'), allow_nan=False))
