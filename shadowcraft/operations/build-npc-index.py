"""Export identity fields only from reviewed Global Steam NPC records."""
import hashlib
import json
import re
import sys
from pathlib import Path


def build(rows, entries, build_id):
    if not re.fullmatch(r'[1-9][0-9]*', build_id):
        raise ValueError('Invalid build ID')
    result, seen = [], set()
    for row in rows:
        identifier = row['ID']['Value']
        kind = row['NpcType']
        if type(identifier) is not int or identifier <= 0 or identifier in seen:
            raise ValueError('Invalid or duplicate NPC ID')
        if kind not in {'ENpcType::Monster', 'ENpcType::Citizen', 'ENpcType::Summon', 'ENpcType::Bot', 'ENpcType::Etc'}:
            raise ValueError('Unknown NPC type')
        key = row['Desc']['Key']
        if not isinstance(key, str):
            raise ValueError('Invalid localization key')
        name = entries.get(f'String_{key}_body')
        if name is not None and (not isinstance(name, str) or len(name) > 1000):
            raise ValueError('Invalid localized name')
        seen.add(identifier)
        result.append({'id': str(identifier), 'name': name.strip() or None if name is not None else None, 'kind': kind.split('::')[1]})
    if not 0 < len(result) <= 100000:
        raise ValueError('Invalid NPC count')
    result.sort(key=lambda row: int(row['id']))
    return {'schema': 'a2bc-npc-index-v1', 'source': {'kind': 'installed-steam-client', 'appId': '3393110', 'region': 'global', 'language': 'en-US', 'buildId': build_id, 'liveAvailabilityVerified': False}, 'npcs': result}


if __name__ == '__main__':
    table, english, build_id, output = sys.argv[1:]
    table, english, output = Path(table), Path(english), Path(output)
    data = build(json.loads(table.read_text())['Properties']['Data'], json.loads(english.read_text())['Entries'], build_id)
    data['source']['sha256'] = {name: hashlib.sha256(path.read_bytes()).hexdigest() for name, path in [('NpcData', table), ('English', english)]}
    temporary = output.with_suffix('.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n')
    temporary.replace(output)
    print(f"NPCs: {len(data['npcs'])}; missing English names: {sum(row['name'] is None for row in data['npcs'])}")
