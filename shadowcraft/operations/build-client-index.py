"""Build a narrow, read-only index from locally decoded Global client records.

No decoder implementation or third-party database is bundled. Unknown fields,
combat scaling and inferred fees are deliberately omitted. Optional raw crafting
curves support a separately labelled client-table estimate, not a live success rate.
Usage: python3 build-client-index.py DECODED_TABLE_DIR ENGLISH_JSON STEAM_BUILD_ID OUTPUT_JSON [EFFECT_TABLE_DIR]
"""
import hashlib
import json
import re
import sys
from decimal import Decimal
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


def resolve_effect(token, effects):
    """Interpret explicit localization field/formatter references at base values.

    Array indexes are the one-based field numbers in the client localization.
    No damage formulas, level overrides, stat context or expression evaluation.
    """
    match = re.fullmatch(r'(se|abe):([1-9][0-9]*):(effect_value[0-9]{2}|value[0-9]{2}|aggro_absolute)(?::(divide100|divide100abs|divide1000|noneabs|time))?', token)
    if not match or effects is None:
        return None
    kind, key, field, formatter = match.groups()
    table = 'SkillEffect' if kind == 'se' else 'SkillAbnormalEffect'
    row = effects[table].get(key)
    if row is None:
        raise ValueError('Missing effect reference: ' + token)
    if field == 'aggro_absolute' and kind == 'se':
        raw = str(row['AggroAbsolute'])
    elif field.startswith('effect_value' if kind == 'se' else 'value'):
        index = int(field[-2:]) - 1
        values = row['EffectValueList' if kind == 'se' else 'Values']
        if index < 0 or index >= len(values):
            raise ValueError('Effect value index out of range: ' + token)
        raw = values[index]
    else:
        return None
    # Values can contain formulas or symbolic names; never eval them.
    if not isinstance(raw, str) or not re.fullmatch(r'-?[0-9]{1,12}(?:\.[0-9]{1,8})?', raw):
        return None
    value = Decimal(raw)
    if formatter in ('divide100', 'divide100abs'):
        value /= 100
    elif formatter in ('divide1000', 'time'):
        value /= 1000
    if formatter in ('divide100abs', 'noneabs'):
        value = abs(value)
    result = format(value, 'f')
    if '.' in result:
        result = result.rstrip('0').rstrip('.')
    if result == '-0':
        result = '0'
    return result + ('s' if formatter == 'time' else '')


def description(value, effects=None):
    """Keep literal official prose; never present unresolved formulas as numbers."""
    text = plain(value)
    resolved = []
    unresolved = []
    def replace(match):
        token = match.group(0)[1:-1]
        result = resolve_effect(token, effects)
        if result is None:
            unresolved.append(token)
            return '[unresolved value]'
        resolved.append({'reference': token, 'value': result})
        return result
    text = re.sub(r'\{[^{}]+\}', replace, text)
    if '{' in text or '}' in text:
        raise ValueError('Malformed skill description placeholder')
    result = {'text': text, 'unresolvedValues': len(unresolved)}
    if effects is not None:
        result.update(valueScope='base-client-values', resolvedReferences=resolved)
    return result


def craft_curves(records):
    """Keep integer source values; the UI labels the observed scale as an estimate."""
    curves = {}
    for row in records:
        name, rates = row['Name'], row['Rates']
        if not isinstance(name, str) or not name or name in curves:
            raise ValueError('Invalid or duplicate rate group')
        if not isinstance(rates, list) or not 1 <= len(rates) <= 128:
            raise ValueError('Invalid rate curve')
        for gap, rate in enumerate(rates):
            if type(rate['Gap']) is not int or rate['Gap'] != gap or type(rate['Rate']) is not int or not 0 <= rate['Rate'] <= 100_000_000:
                raise ValueError('Invalid rate or discontinuous gap')
        curves[name] = [r['Rate'] for r in rates]
    if not curves:
        raise ValueError('Missing rate curves')
    return curves


def mastery_grades(records, entries):
    groups = []
    seen = set()
    for level, row in enumerate(records, 1):
        if type(row['CraftMasteryLevel']) is not int or row['CraftMasteryLevel'] != level:
            raise ValueError('Discontinuous mastery levels')
        key = row['CraftMasteryGrade'].removeprefix('ECraftMasteryGrade::')
        if not key or not row['CraftMasteryGrade'].startswith('ECraftMasteryGrade::'):
            raise ValueError('Invalid mastery grade')
        if not groups or groups[-1]['key'] != key:
            if key in seen:
                raise ValueError('Discontinuous mastery grade')
            seen.add(key)
            groups.append({'key': key, 'name': plain(entries['String_UI_MASTERYGRADE_' + key.upper() + '_body']), 'min': level, 'max': level})
        groups[-1]['max'] = level
    if not groups or len(groups) > 16 or len(records) > 10000:
        raise ValueError('Invalid mastery table')
    return groups


def build(tables, localization, build_id, effect_tables=None):
    if not isinstance(build_id, str) or not re.fullmatch(r'[1-9][0-9]*', build_id):
        raise ValueError('Explicit Steam build ID required')
    tables = Path(tables)
    entries = read(localization)['Entries']
    rows = {}
    hashes = {}
    curves = None
    rate_path = tables / 'CraftRecipeRate.json'
    if rate_path.exists():
        curves = craft_curves(read(rate_path)['Properties']['Data'])
        hashes['CraftRecipeRate'] = hashlib.sha256(rate_path.read_bytes()).hexdigest()
    grades = None
    mastery_path = tables / 'CraftMastery.json'
    if mastery_path.exists():
        grades = mastery_grades(read(mastery_path)['Properties']['Data'], entries)
        hashes['CraftMastery'] = hashlib.sha256(mastery_path.read_bytes()).hexdigest()
    effects = None
    if effect_tables is not None:
        effects = {}
        for name in ('SkillEffect', 'SkillAbnormalEffect'):
            path = Path(effect_tables) / (name + '.json')
            records = read(path)['Properties']['Data']
            if not isinstance(records, list) or not records:
                raise ValueError('Missing effect rows: ' + name)
            effects[name] = {}
            for row in records:
                key = identifier(row['ID']['Value'])
                if key in effects[name]:
                    raise ValueError('Duplicate effect ID')
                effects[name][key] = row
            hashes[name] = hashlib.sha256(path.read_bytes()).hexdigest()
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
        if curves is not None:
            group = row['CraftRateGroup']
            if group != 'None' and group not in curves:
                raise ValueError('Missing explicit rate group')
            recipes[-1]['baseRateCurve'] = None if group == 'None' else {
                'group': group, 'rawRates': curves[group],
                'scope': 'client-table-estimate', 'percentDivisor': 1_000_000}
        # Optional for older reviewed snapshots; only explicit reflected fields qualify.
        if 'Type' in row:
            if row['Type'] not in ('ECraftType::Common', 'ECraftType::Succession'):
                raise ValueError('Unknown craft type')
            candidates = row['SuccessionComponentCandidateList']
            if not isinstance(candidates, list) or len(candidates) > 100 or any(not isinstance(c, str) for c in candidates) or len(set(candidates)) != len(candidates):
                raise ValueError('Invalid succession candidates')
            if candidates and row['Type'] != 'ECraftType::Succession':
                raise ValueError('Candidates on non-succession recipe')
            recipes[-1].update(craftType=row['Type'].removeprefix('ECraftType::'),
                               successionCandidateItemIds=[item_names[c] for c in candidates])
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
                       'description': description(effect, effects) if effect else None,
                       'traits': description(traits, effects) if traits else None})
    if len(skills) != 280 or any(sum(s['classKey'] == c.lower() for s in skills) != 35 for c in active_classes):
        raise ValueError('Unexpected playable class roster')
    hashes['English'] = hashlib.sha256(Path(localization).read_bytes()).hexdigest()
    return {'schema': 'a2bc-client-index-v1',
            'source': {'kind': 'installed-steam-client', 'appId': 3393110, 'buildId': build_id,
                       'region': 'global', 'language': 'en-US', 'validation': 'structural-and-reference-checks',
                       'liveAvailabilityVerified': False, 'inputSha256': hashes},
            'items': items, 'skills': skills, 'recipes': recipes,
            **({'craftMasteryGrades': grades} if grades is not None else {})}


if __name__ == '__main__':
    if len(sys.argv) not in (5, 6):
        raise SystemExit('Expected table directory, English localization JSON, Steam build ID, output JSON, optional effect table directory')
    result = build(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[5] if len(sys.argv) == 6 else None)
    output = Path(sys.argv[4])
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix('.tmp')
    temporary.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    temporary.replace(output)
    print(json.dumps({key: len(result[key]) for key in ('items', 'skills', 'recipes')}))
