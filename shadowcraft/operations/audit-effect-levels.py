"""Audit explicit effect growth links; never infer a combat formula or fallback.

Usage: python3 audit-effect-levels.py CLIENT_INDEX SKILL_TABLE ENGLISH EFFECT_DIR OUTPUT
Shared inputs are hash checked against CLIENT_INDEX. Growth tables have their
own recorded hashes; their build provenance must be established at extraction.
"""
import hashlib
import json
from pathlib import Path
import re
import sys


SPECS = {
    'se': ('SkillEffect', 'SkillEffectLv', 'SkillEffectLvGroupId',
           'SkillEffectLvGroupId', 'SkillEffectLv', 'ID'),
    'abe': ('SkillAbnormalEffect', 'SkillAbnormalEffectLv', 'AbnormalEffectLvGroupId',
            'AbnormalEffectLevelGroupId', 'AbnormalEffectLevel', 'AbnormalEffectLevelId'),
}


def unique(rows, field):
    result = {}
    for row in rows:
        key = row[field]['Value']
        if type(key) is not int or key <= 0 or key in result:
            raise ValueError('Invalid or duplicate ID: ' + field)
        result[key] = row
    return result


def growth_index(rows, group_field, level_field, id_field):
    unique(rows, id_field)
    groups = {}
    for row in rows:
        group, level = row[group_field], row[level_field]
        if not isinstance(group, str) or group in ('', 'None'):
            raise ValueError('Invalid growth group')
        if type(level) is not int or not 1 <= level <= 100:
            raise ValueError('Invalid growth level')
        levels = groups.setdefault(group, [])
        if level in levels:
            raise ValueError('Duplicate growth group/level')
        levels.append(level)
    return {key: sorted(value) for key, value in groups.items()}


def audit(references, base, growth, group_field):
    records = []
    for key in sorted(set(references)):
        if key not in base:
            raise ValueError('Missing base effect reference: ' + str(key))
        group = base[key][group_field]
        if not isinstance(group, str) or not group:
            raise ValueError('Invalid base growth group')
        levels = growth.get(group, [])
        records.append({'effectId': key, 'group': group,
                        'status': 'no-explicit-group' if group == 'None' else
                                  'linked' if levels else 'missing-group',
                        'levelCount': len(levels),
                        'firstLevel': min(levels) if levels else None,
                        'lastLevel': max(levels) if levels else None,
                        'internalGaps': sorted(set(range(min(levels), max(levels) + 1)) - set(levels)) if levels else []})
    return records


def build(index_path, skill_path, english_path, effect_dir):
    hashes = {}

    def read(path, name):
        data = Path(path).read_bytes()
        hashes[name] = hashlib.sha256(data).hexdigest()
        return json.loads(data)

    index = read(index_path, 'ClientIndex')
    skills = unique(read(skill_path, 'Skill')['Properties']['Data'], 'ID')
    english = read(english_path, 'English')['Entries']
    tables = {}
    for spec in SPECS.values():
        for name in spec[:2]:
            tables[name] = read(Path(effect_dir) / (name + '.json'), name)['Properties']['Data']
    for name in ('Skill', 'English', 'SkillEffect', 'SkillAbnormalEffect'):
        if hashes[name] != index['source']['inputSha256'].get(name):
            raise ValueError('Snapshot hash mismatch: ' + name)
    refs = {'se': [], 'abe': []}
    for skill in index['skills']:
        prefix = 'SkillString_' + skills[int(skill['id'])]['SkillString_Key']
        for suffix in ('_skill_desc_effect', '_skill_spec_effect'):
            for kind, key in re.findall(r'\{(se|se_dmg|abe):([1-9][0-9]*):', english.get(prefix + suffix, '')):
                refs['se' if kind == 'se_dmg' else kind].append(int(key))
    results = {}
    for kind, (base, growth, group, growth_group, level, id_field) in SPECS.items():
        records = audit(refs[kind], unique(tables[base], 'ID'),
                        growth_index(tables[growth], growth_group, level, id_field), group)
        results[kind] = {'records': records, 'counts': {
            status: sum(row['status'] == status for row in records)
            for status in ('linked', 'no-explicit-group', 'missing-group')}}
    return {'source': index['source'], 'inputSha256': hashes,
            'tableRows': {name: len(rows) for name, rows in tables.items()},
            'scope': 'Explicit direct se/se_dmg/abe links only; excludes nested references. '
                     'Group and level identity only, not override semantics, formulas, or in-game validation.',
            'effects': results}


if __name__ == '__main__':
    if len(sys.argv) != 6:
        raise SystemExit(__doc__)
    result = build(*sys.argv[1:5])
    Path(sys.argv[5]).write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({kind: value['counts'] for kind, value in result['effects'].items()}))
    raise SystemExit(1 if any(value['counts']['missing-group'] for value in result['effects'].values()) else 0)
