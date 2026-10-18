"""Export opt-in candidate locations, never a verified world projection."""
import hashlib
import json
import math
from pathlib import Path
import sys

KINDS = {'EEnvObjectUsage::GatherSource': 'gather', 'EEnvObjectUsage::TeleportArtifact': 'teleport',
         'EEnvObjectUsage::Rift': 'rift', 'EEnvObjectUsage::EnterDungeon': 'dungeon',
         'EEnvObjectUsage::PartyDungeon': 'dungeon', 'EEnvObjectUsage::Monolith': 'monolith',
         'EEnvObjectUsage::OdEnergyCube': 'cube'}
MAPS = [('World_L_A', 'Verteron', 1010, 'World_L'), ('World_D_A', 'Altgard', 1110, 'World_D')]


def extract(data, objects, english, npcs=None):
    result, seen = [], set()
    skipped = {'missingName': 0, 'outOfBounds': 0, 'duplicateReferences': 0}
    for spawn in data['SpawnInfoList']:
        entries = []
        object_refs = {ref['Value']: ref for ref in spawn['EnvObjIdList']}
        skipped['duplicateReferences'] += len(spawn['EnvObjIdList']) - len(object_refs)
        for ref in object_refs.values():
            obj = objects.get(ref['Value'])
            if obj:
                kind = KINDS.get(obj['Usage'])
                # Reviewed resource ID shared by three localized Hidden Cube object rows.
                if obj.get('ResourceKey') == 'HiddenCube_01_V04':
                    kind = 'cube'
                if obj['Usage'] == 'EEnvObjectUsage::Normal' and obj.get('ResourceKey') in {'GodFragment_02', 'GodFragment_05'}:
                    kind = 'trace'
                if kind:
                    entries.append((ref, obj, kind, 'object'))
        for ref in spawn.get('NpcIdList', []):
            npc = (npcs or {}).get(ref['Value'])
            if not npc:
                continue
            kind = 'npc' if npc['NpcType'] == 'ENpcType::Citizen' else 'named' if npc['NpcType'] == 'ENpcType::Monster' and npc['bNamed'] is True else None
            if kind:
                entries.append((ref, npc, kind, 'npc'))
        for ref, obj, kind, entity in entries:
            desc = obj['Desc']['Key']
            name = english.get(desc) or english.get('String_' + desc + '_body')
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
                if entity == 'npc':
                    key += ':npc'
                if key in seen:
                    raise ValueError('Duplicate spawn identity')
                seen.add(key)
                result.append({'id': key, 'name': name, 'kind': kind, 'entity': entity,
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
    npc_rows = read('AION2/Content/Data/Table/NpcData.json')['Properties']['Data']
    npcs = {r['ID']['Value']: r for r in npc_rows}
    if len(npcs) != len(npc_rows):
        raise ValueError('Duplicate NPC ID')
    field_rows = read('AION2/Content/Data/Table/WorldMapFieldNamed.json')['Properties']['Data']
    english = read('English.json')['Entries']
    maps = []
    for key, name, map_id, folder in MAPS:
        data = read(f'AION2/Content/Data/Map/World/{folder}/{key}/MapData.json')['Properties']['Data']
        settings = read(f'AION2/Content/Data/WorldMap/{key}.json')['Properties']['Data']
        if data['MapId'] != map_id or settings['SectorSize'] != {'X': 8, 'Y': 8} or settings['SectorPlaneSize'] != 1024:
            raise ValueError('Unreviewed map identity or grid')
        # Unknown field names remain unresolved: audit the exact tuple match, do not
        # infer schedules, tiers or live boss state from these columns.
        named_pairs = [(spawn['Name'], npcs[ref['Value']]['Name'])
                       for spawn in data['SpawnInfoList'] for ref in spawn['NpcIdList']
                       if npcs[ref['Value']]['NpcType'] == 'ENpcType::Monster' and npcs[ref['Value']]['bNamed']]
        joined = sum(sum(row['Unknown1_Int'] == map_id and row['Unknown2_Name'] == npc_name
                         and row['Unknown3_Name'] == spawn_name for row in field_rows) == 1
                     for spawn_name, npc_name in named_pairs)
        maps.append({'name': name, 'mapKey': key,
                     'namedAudit': {'spawners': len(named_pairs), 'exactFieldTableMatches': joined},
                     **extract(data, objects, english, npcs)})
    return {'schema': 'a2bc-spawn-preview-v1', 'buildId': '25926599', 'region': 'global',
            'worldProjectionVerified': False, 'projection': 'candidate world/100, centered 8192 UI plane',
            'maps': maps, 'sourceSha256': hashes}


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Expected October decoded directory')
    print(json.dumps(build(sys.argv[1]), ensure_ascii=False, separators=(',', ':'), allow_nan=False))
