"""Build a small object-ID icon sidecar without changing map/progress identities.
Usage: python3 build-map-npc-icons.py NpcData.json spawn-preview.json > output.json
Only reviewed role aliases and explicitly named monster subtypes are accepted.
"""
import json
import sys
from pathlib import Path


def build(npcs, maps):
    by_id = {}
    for row in npcs:
        key = row['ID']['Value']
        if key in by_id:
            raise ValueError('Duplicate NPC identity')
        by_id[key] = row
    used = {row['objectId'] for region in maps for row in region['markers'] if row['kind'] in ('npc', 'named')}
    result = {}
    for key in sorted(used):
        row = by_id[key]
        if row['NpcType'] == 'ENpcType::Monster' and row['NpcSubType'] in ('ENpcSubType::HeroMonster', 'ENpcSubType::LegendMonster'):
            result[str(key)] = 'named'
        elif row['NpcType'] == 'ENpcType::Citizen':
            icon = {'ENpcFuncType::BuySell': 'shop', 'ENpcFuncType::Storage': 'storage'}.get(row['FunctionType'])
            if icon:
                result[str(key)] = icon
    return result


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('Expected NPC table and map preview')
    table = json.loads(Path(sys.argv[1]).read_text())['Properties']['Data']
    maps = json.loads(Path(sys.argv[2]).read_text())['maps']
    print(json.dumps(build(table, maps), indent=2, sort_keys=True))
