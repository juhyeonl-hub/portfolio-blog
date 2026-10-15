"""Read-only audit of uex JSON exports against the bundled a2bc catalogs.

Usage: python3 audit-client-export.py /path/to/Aion2/Content/Data/Table
Exit 0: required tables decoded and rosters match; 2: incomplete; 1: invalid.
This checks structure/IDs, not mapping correctness or live content availability.
"""
import json
import sys
from pathlib import Path

CLASSES = ('assassin', 'gladiator', 'templar', 'ranger', 'elementalist',
           'sorcerer', 'cleric', 'chanter')
REQUIRED = ('SkillList', 'Skill', 'SkillLv', 'SkillAcquireData',
            'SpecializedSkill', 'SpecializedSkillSlot', 'CraftRecipe',
            'CraftRecipeRate', 'CraftMastery', 'Map', 'MapEntrance',
            'WorldMapMapList', 'WorldMapUIRegion', 'WorldMapFieldNamed')
CATALOGS = Path(__file__).resolve().parents[2] / 'backend/src/main/resources/shadowcraft'


def read_json(path):
    if path.stat().st_size > 128 * 1024 * 1024:
        raise ValueError(f'{path.name}: file exceeds 128 MiB audit limit')
    return json.loads(path.read_text(encoding='utf-8-sig'))


def audit(directory, catalogs=CATALOGS):
    directory = Path(directory)
    if not directory.is_dir():
        raise ValueError('export directory does not exist')
    tables, missing = {}, []
    for name in REQUIRED:
        path = directory / f'{name}.json'
        if not path.is_file():
            missing.append(name)
            continue
        payload = read_json(path)
        rows = payload.get('Properties', {}).get('Data') if isinstance(payload, dict) else None
        if not isinstance(rows, list) or not rows or not all(isinstance(row, dict) for row in rows):
            raise ValueError(f'{name}: nonempty object rows required')
        tables[name] = rows
    comparisons = {}
    if 'SkillList' in tables:
        for class_key in CLASSES:
            rows = [row for row in tables['SkillList']
                    if row.get('ClassType') == f'ECharacterClass::{class_key.capitalize()}']
            if not rows:
                raise ValueError(f'{class_key}: no official skill roster')
            ids = []
            for row in rows:
                skills = row.get('SkillIdList')
                if not isinstance(skills, list) or not all(type(s) is int and s > 0 for s in skills):
                    raise ValueError(f'{class_key}: invalid skill IDs')
                ids.extend(skills)
            if not ids:
                raise ValueError(f'{class_key}: empty skill roster')
            if len(ids) != len(set(ids)):
                raise ValueError(f'{class_key}: duplicate skill IDs')
            official = {str(s) for s in ids}
            catalog = read_json(Path(catalogs) / f'{class_key}.json')
            catalog = catalog.get('catalog', catalog)
            current = {str(skill['id']) for skill in catalog['skills']}
            if len(current) != len(catalog['skills']):
                raise ValueError(f'{class_key}: duplicate catalog skill IDs')
            comparisons[class_key] = {
                'officialCount': len(official), 'catalogCount': len(current),
                'matches': len(official & current),
                'missingFromOfficial': sorted(current - official),
                'missingFromCatalog': sorted(official - current),
            }
    matches = len(comparisons) == len(CLASSES) and all(
        not row['missingFromOfficial'] and not row['missingFromCatalog']
        for row in comparisons.values())
    return {
        'status': 'structurally-complete' if not missing and matches else 'incomplete',
        'mappingSemanticsVerified': False,
        'productionImportApproved': False,
        'decodedRows': {name: len(rows) for name, rows in tables.items()},
        'missingTables': missing, 'skillRosters': comparisons,
    }


if __name__ == '__main__':
    try:
        if len(sys.argv) != 2:
            raise ValueError('provide one uex table-export directory')
        result = audit(sys.argv[1])
        print(json.dumps(result, ensure_ascii=False, indent=2))
        sys.exit(0 if result['status'] == 'structurally-complete' else 2)
    except (ValueError, OSError, KeyError, TypeError, AttributeError) as error:
        print(json.dumps({'status': 'invalid', 'error': str(error)}, ensure_ascii=False))
        sys.exit(1)
