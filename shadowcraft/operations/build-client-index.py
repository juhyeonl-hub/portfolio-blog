"""Build a narrow, read-only index from locally decoded Global client records.

No decoder implementation or third-party database is bundled. Unknown fields,
combat scaling, success probabilities and inferred fees are deliberately omitted.
Usage: python3 build-client-index.py DECODED_TABLE_DIR ENGLISH_JSON STEAM_BUILD_ID OUTPUT_JSON
"""
import hashlib
import json
import re
import sys
from pathlib import Path


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def identifier(value):
    if type(value) is not int or value <= 0:
        raise ValueError('Expected positive client ID')
    return str(value)


def amount(value):
    if type(value) is not int or not 0 < value <= 1_000_000:
        raise ValueError('Invalid material/output count')
    return value


def plain(value):
    if not isinstance(value, str):
        raise ValueError('Expected localized text')
    result = re.sub(r'<[^>]*>', '', value).strip()
    if not result or len(result) > 2000:
        raise ValueError('Missing or oversized localized text')
    return result


def description(value):
    """Keep literal official prose; never present unresolved formulas as numbers."""
    text = plain(value)
    tokens = re.findall(r'\{[^{}]+\}', text)
    text = re.sub(r'\{[^{}]+\}', '[unresolved value]', text)
    if '{' in text or '}' in text:
        raise ValueError('Malformed skill description placeholder')
    return {'text': text, 'unresolvedValues': len(tokens)}


def build(tables, localization, build_id):
    if not isinstance(build_id, str) or not re.fullmatch(r'[1-9][0-9]*', build_id):
        raise ValueError('Explicit Steam build ID required')
    tables = Path(tables)
    entries = read(localization)['Entries']
    rows = {}
    hashes = {}
    for name in ('Item', 'CraftRecipe', 'Skill', 'SkillList', 'SkillAcquireData'):
        path = tables / (name + '.json')
        rows[name] = read(path)['Properties']['Data']
        if not isinstance(rows[name], list) or not rows[name]:
            raise ValueError('Missing rows: ' + name)
        hashes[name] = hashlib.sha256(path.read_bytes()).hexdigest()
    items = []
    item_names = {}
    item_ids = set()
    for row in rows['Item']:
        key = identifier(row['ID']['Value'])
        if key in item_ids or row['Name'] in item_names:
            raise ValueError('Duplicate item ID or internal name')
        item_ids.add(key)
        item_names[row['Name']] = key
        name = plain(entries['String_' + row['Desc']['Key'] + '_body'])
        kind = row['ItemType'].removeprefix('EItemType::')
        grade = row['ItemGrade'].removeprefix('EItemGrade::')
        level = row['ItemLevel']
        if not kind or not grade or type(level) is not int or not 0 <= level <= 10000:
            raise ValueError('Invalid item classification')
        items.append({'id': key, 'name': name, 'kind': kind, 'grade': grade, 'level': level})
    recipes = []
    recipe_ids = set()
    recipe_names = {}
    for row in rows['CraftRecipe']:
        name = row['Name']
        if not isinstance(name, str) or not name or name in recipe_names:
            raise ValueError('Invalid or duplicate recipe name')
        recipe_names[name] = identifier(row['ID']['Value'])
    for row in rows['CraftRecipe']:
        key = identifier(row['ID']['Value'])
        if key in recipe_ids:
            raise ValueError('Duplicate recipe ID')
        recipe_ids.add(key)
        ingredients = [{'itemId': item_names[i['Item']], 'quantity': amount(i['Count']),
                        'enchant': i['Enchant']} for i in row['ComponentList']]
        if any(type(i['enchant']) is not int or i['enchant'] < 0 for i in ingredients):
            raise ValueError('Invalid ingredient enchant requirement')
        if type(row['MasteryLevel']) is not int or not 0 <= row['MasteryLevel'] <= 1_000_000:
            raise ValueError('Invalid mastery requirement')
        if not row['Category'].startswith('ECraftCategory::') or not row['QualificationRace'].startswith('ERace::'):
            raise ValueError('Invalid recipe classification')
        recipes.append({'id': key, 'itemId': item_names[row['Product']], 'outputQuantity': amount(row['ProductCount']),
                        'category': row['Category'].removeprefix('ECraftCategory::'),
                        'race': row['QualificationRace'].removeprefix('ERace::'),
                        'masteryLevel': row['MasteryLevel'], 'ingredients': ingredients,
                        'hasCombo': row['ComboRecipe'] not in ('', 'None'),
                        'comboRecipeId': recipe_names[row['ComboRecipe']] if row['ComboRecipe'] not in ('', 'None') else None,
                        'successRate': None, 'feePerAttempt': None})
    active_classes = {'Assassin', 'Gladiator', 'Templar', 'Ranger', 'Elementalist', 'Sorcerer', 'Cleric', 'Chanter'}
    roster = {}
    for row in rows['SkillList']:
        cls = row['ClassType'].removeprefix('ECharacterClass::')
        if cls in active_classes:
            for value in row['SkillIdList']:
                key = identifier(value)
                if key in roster:
                    raise ValueError('Duplicate playable skill ID')
                roster[key] = cls.lower()
    skill_rows = {}
    for row in rows['Skill']:
        key = identifier(row['ID']['Value'])
        if key in skill_rows:
            raise ValueError('Duplicate skill ID')
        skill_rows[key] = row
    learning = {key: [] for key in roster}
    seen_learning = set()
    for row in rows['SkillAcquireData']:
        key = identifier(row['SkillId']['Value'])
        if key not in roster:
            continue
        level = row['SkillLevel']
        if type(level) is not int or not 1 <= level <= 100 or (key, level) in seen_learning:
            raise ValueError('Invalid or duplicate learning level')
        seen_learning.add((key, level))
        if row['ClassType'].removeprefix('ECharacterClass::').lower() != roster[key]:
            raise ValueError('Learning class does not match roster')
        if type(row['bAutoLearn']) is not bool:
            raise ValueError('Invalid auto-learn flag')
        for field in ('NeedCharacterLevel', 'CostSkillPoint', 'CostStigmaPoint'):
            if type(row[field]) is not int or not 0 <= row[field] <= 10000:
                raise ValueError('Invalid learning cost or requirement')
        ascension = row['NeedAscensionGrade']
        if not isinstance(ascension, str) or not re.fullmatch(r'EAscensionGrade::(?:None|AscensionGrade_[1-9][0-9]*)', ascension):
            raise ValueError('Unsupported ascension requirement')
        # Do not silently drop newly introduced item or prerequisite requirements.
        if row['NeedPrevSkillDataList'] or row['CostItemDataList']:
            raise ValueError('Additional learning requirements need explicit support')
        learning[key].append({'level': level, 'autoLearn': row['bAutoLearn'],
                              'requiredCharacterLevel': row['NeedCharacterLevel'],
                              'skillPoints': row['CostSkillPoint'], 'stigmaPoints': row['CostStigmaPoint'],
                              'ascensionRequirement': ascension.removeprefix('EAscensionGrade::')})
    for values in learning.values():
        values.sort(key=lambda v: v['level'])
        if not values or [v['level'] for v in values] != list(range(1, len(values) + 1)):
            raise ValueError('Missing or discontinuous learning levels')
    skills = []
    for key, cls in sorted(roster.items()):
        row = skill_rows[key]
        name = plain(entries['SkillString_' + row['SkillString_Key'] + '_skill_name'])
        prefix = 'SkillString_' + row['SkillString_Key']
        effect = entries.get(prefix + '_skill_desc_effect')
        traits = entries.get(prefix + '_skill_spec_effect')
        skills.append({'id': key, 'name': name, 'classKey': cls, 'learning': learning[key],
                       'description': description(effect) if effect else None,
                       'traits': description(traits) if traits else None})
    if len(skills) != 280 or any(sum(s['classKey'] == c.lower() for s in skills) != 35 for c in active_classes):
        raise ValueError('Unexpected playable class roster')
    hashes['English'] = hashlib.sha256(Path(localization).read_bytes()).hexdigest()
    return {'schema': 'a2bc-client-index-v1',
            'source': {'kind': 'installed-steam-client', 'appId': 3393110, 'buildId': build_id,
                       'region': 'global', 'language': 'en-US', 'validation': 'structural-and-reference-checks',
                       'liveAvailabilityVerified': False, 'inputSha256': hashes},
            'items': items, 'skills': skills, 'recipes': recipes}


if __name__ == '__main__':
    if len(sys.argv) != 5:
        raise SystemExit('Expected table directory, English localization JSON, Steam build ID, output JSON')
    result = build(sys.argv[1], sys.argv[2], sys.argv[3])
    output = Path(sys.argv[4])
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix('.tmp')
    temporary.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    temporary.replace(output)
    print(json.dumps({key: len(result[key]) for key in ('items', 'skills', 'recipes')}))
