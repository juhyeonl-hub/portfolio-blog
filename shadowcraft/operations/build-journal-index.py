"""Normalize official Global quest text and dungeon identities, without inferred rules."""
import hashlib
import json
import re
import sys
from pathlib import Path


def unique(rows, key):
    result = {}
    for row in rows:
        value = row[key]
        if isinstance(value, dict): value = value['Value']
        if value in result: raise ValueError(f'Duplicate {key}: {value}')
        result[value] = row
    return result


def identifier(value):
    if type(value) is not int or value <= 0: raise ValueError('Invalid ID')
    return str(value)


def enum(value, prefix):
    if not isinstance(value, str) or not re.fullmatch(re.escape(prefix) + r'::[A-Za-z][A-Za-z0-9_]*', value): raise ValueError('Invalid classification')
    return value.split('::')[1]


def count(value, maximum=1_000_000_000):
    if type(value) is not int or not 0 <= value <= maximum: raise ValueError('Invalid reward quantity')
    return value


def build(tables, entries, build_id):
    if not re.fullmatch(r'[1-9][0-9]*', build_id): raise ValueError('Invalid build')
    def text(key):
        value = entries.get(key)
        if value is not None and (not isinstance(value, str) or len(value) > 20000): raise ValueError('Invalid text')
        return value.strip() or None if value is not None else None
    def body(key): return text(f'String_{key}_body')
    quests = unique(tables['Quest'], 'Name')
    unique(tables['Quest'], 'ID')
    rewards = unique(tables.get('QuestReward', []), 'Group')
    quest_ids = {identifier(row['ID']['Value']) for row in quests.values()}
    if any(key not in quest_ids for key in rewards): raise ValueError('Unknown reward quest')
    items = unique(tables.get('Item', []), 'Name')
    class_rewards = {}
    for row in tables.get('QuestClassReward', []):
        group = row['Group']
        cls = enum(row['Class'], 'ECharacterClass')
        if cls not in ('Gladiator', 'Templar', 'Assassin', 'Ranger', 'Sorcerer', 'Elementalist', 'Cleric', 'Chanter'): raise ValueError('Unknown reward class')
        if group not in rewards or cls in class_rewards.setdefault(group, {}): raise ValueError('Broken or duplicate class reward')
        class_rewards[group][cls] = row
    def reward_items(rows):
        if not isinstance(rows, list) or len(rows) > 100: raise ValueError('Invalid reward list')
        result = []
        for row in rows:
            if row['Item'] not in items: raise ValueError('Broken reward item reference')
            item = items[row['Item']]
            quantity = count(row['Count'])
            if quantity == 0: raise ValueError('Zero reward quantity')
            result.append({'id': identifier(item['ID']['Value']), 'name': body(item['Desc']['Key']),
                           'count': quantity, 'enchantLevel': count(row['EnchantedLevel'], 100)})
        return result
    def reward_content(row):
        random = row['RandomReward']
        if not isinstance(random, str) or not re.fullmatch(r'[A-Za-z0-9_]{1,200}', random): raise ValueError('Invalid random reward group')
        return {'items': reward_items(row['ItemRewards']),
                'normalItems': reward_items(row['ItemNormalRewards']),
                'selectionItems': reward_items(row['ItemSelectRewards']),
                'randomGroup': None if random == 'None' else random}
    def reward_for(key):
        row = rewards.get(key)
        if row is None: return None
        return {'experience': count(row['ExpReward']), **reward_content(row),
                **({'classRewards': [{'classKey': cls.lower(), **reward_content(value)}
                                    for cls, value in sorted(class_rewards.get(key, {}).items())]} if 'QuestClassReward' in tables else {})}
    strings = unique(tables['QuestString'], 'Name')
    maps = unique(tables['Map'], 'ID')
    npcs = unique(tables['NpcData'], 'Name')
    def npc_ref(row, prefix):
        if row[prefix+'Type'] != f'EQuest{prefix}Type::Npc': return None
        key = row[prefix+'Value']
        if key not in npcs: raise ValueError('Broken quest NPC reference')
        npc = npcs[key]
        return {'id': identifier(npc['ID']['Value']), 'name': body(npc['Desc']['Key'])}
    unique(tables['Dungeon'], 'ID')
    step_counts = {}
    step_ids = set()
    for row in tables['QuestStep']:
        key = row['QuestName']
        sid = identifier(row['ID']['Value'])
        if key not in quests or sid in step_ids: raise ValueError('Invalid quest step reference')
        step_ids.add(sid)
        step_counts[key] = step_counts.get(key, 0) + 1
    result = []
    for row in quests.values():
        if 'UnlockLevel' in row and (not isinstance(row['AcquirableConditions'], list) or len(row['AcquirableConditions']) > 100): raise ValueError('Invalid quest conditions')
        strings_row = strings[row['QuestText']]
        following = row['NextQuestName']
        if following != 'None' and following not in quests: raise ValueError('Broken next quest')
        race = enum(row['Race'], 'ERace')
        if race not in ('All', 'Light', 'Dark'): raise ValueError('Unknown race')
        result.append({'id': identifier(row['ID']['Value']), 'name': text(strings_row['Title']['Key']), 'kind': enum(row['Type'], 'EQuestType'), 'race': race,
                       'acquireNpc': npc_ref(row, 'Acquire'), 'completeNpc': npc_ref(row, 'Complete'),
                       'summary': text(strings_row['ShortSummary']['Key']), 'stepCount': step_counts.get(row['Name'], 0),
                       'nextId': identifier(quests[following]['ID']['Value']) if following != 'None' else None,
                       **({'rewards': reward_for(identifier(row['ID']['Value']))} if 'QuestReward' in tables else {}),
                       **({'levels': {'unlock': count(row['UnlockLevel'], 100), 'recommended': count(row['RecommendedLevel'], 100),
                                      'additionalConditions': len(row['AcquirableConditions'])}} if 'UnlockLevel' in row else {})})
    dungeons = []
    for row in tables['Dungeon']:
        mid = row['MapId']['Value']
        if mid not in maps: raise ValueError('Broken dungeon map reference')
        dungeons.append({'id': identifier(row['ID']['Value']), 'name': body(row['Title']['Key']), 'kind': enum(row['DungeonType'], 'EDungeonType'),
                         'mapId': identifier(mid), 'mapName': body(maps[mid]['Desc']['Key']),
                         **({'recommendation': {'level': count(row['RecommendLevel'], 100),
                                                'minMembers': count(row['RecommendMinMember'], 100),
                                                'maxMembers': count(row['RecommendMaxMember'], 100),
                                                'difficulty': enum(row['DungeonDifficulty'], 'EDungeonDifficulty')}} if 'RecommendLevel' in row else {})})
        recommendation = dungeons[-1].get('recommendation')
        if recommendation and recommendation['minMembers'] > recommendation['maxMembers']: raise ValueError('Reversed member range')
    pets = []
    unique(tables['VehicleList'], 'ID')
    for row in tables['VehicleList']:
        pets.append({'id': identifier(row['ID']['Value']), 'name': body(row['Desc']['Key']), 'kind': enum(row['CreatureType'], 'ECreatureType')})
    if not pets: raise ValueError('Empty pet list')
    if not result or not dungeons or len(result) > 100000 or len(dungeons) > 100000: raise ValueError('Invalid coverage')
    return {'schema': 'a2bc-journal-index-v1', 'source': {'kind': 'installed-steam-client', 'appId': '3393110', 'region': 'global', 'language': 'en-US', 'buildId': build_id, 'liveAvailabilityVerified': False}, 'quests': result, 'dungeons': dungeons, 'pets': pets}


if __name__ == '__main__':
    table_dir, english, build_id, output = sys.argv[1:]
    files = {name: Path(table_dir)/(name+'.json') for name in ['Quest', 'QuestString', 'QuestStep', 'QuestReward', 'QuestClassReward', 'Item', 'Dungeon', 'Map', 'NpcData', 'VehicleList']}
    data = build({name: json.loads(path.read_text())['Properties']['Data'] for name, path in files.items()}, json.loads(Path(english).read_text())['Entries'], build_id)
    data['source']['sha256'] = {name: hashlib.sha256(path.read_bytes()).hexdigest() for name, path in {**files, 'English': Path(english)}.items()}
    target = Path(output)
    temporary = target.with_suffix('.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':'))+'\n')
    temporary.replace(target)
    print(f"Quests {len(data['quests'])}, dungeons {len(data['dungeons'])}")
