"""Read-only comparison of known fields; never grants whole-catalog provenance."""
import json
import sys
from pathlib import Path


def compare(tables, catalogs):
    def rows(name):
        return json.loads((Path(tables)/(name+'.json')).read_text())['Properties']['Data']
    def unique(records, key):
        result = {}
        for row in records:
            k = key(row)
            if k in result:
                raise ValueError('Duplicate client reference: '+str(k))
            result[k] = row
        return result
    acquire = unique(rows('SkillAcquireData'), lambda r: (str(r['SkillId']['Value']), r['SkillLevel']))
    parts = unique(rows('SpecializedSkillParts'), lambda r: str(r['ID']['Value']))
    result = {'scope': 'learning fields and specialization parent/level only', 'wholeCatalogVerified': False,
              'learningChecked': 0, 'specializationsChecked': 0, 'ascensionConditionRows': 0, 'differences': []}
    for file in sorted(Path(catalogs).glob('*.json')):
        data = json.loads(file.read_text())
        for skill in data['skills']:
            for value in skill['learning']:
                row = acquire.get((skill['id'], value['level']))
                result['learningChecked'] += 1
                if row and row.get('NeedAscensionGrade') not in (None, 'EAscensionGrade::None'):
                    result['ascensionConditionRows'] += 1
                for a, b in [('autoLearn','bAutoLearn'),('requiredCharacterLevel','NeedCharacterLevel'),('skillPoints','CostSkillPoint'),('stigmaPoints','CostStigmaPoint')]:
                    if row is None or value[a] != row[b]:
                        result['differences'].append({'class':file.stem,'skill':skill['id'],'level':value['level'],'field':a,'catalog':value[a],'client':row.get(b) if row else None})
            for value in skill['specializations']:
                row = parts.get(value['id'])
                result['specializationsChecked'] += 1
                if not row or str(row['ParentSkillId']['Value']) != skill['id'] or row['ParentSkillLv'] != value['requiredParentLevel']:
                    result['differences'].append({'class':file.stem,'skill':skill['id'],'specialization':value['id']})
    if not result['learningChecked'] or not result['specializationsChecked']:
        raise ValueError('No planner records checked')
    return result

if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('Expected decoded Table directory and planner catalog directory')
    result = compare(*sys.argv[1:])
    print(json.dumps(result, indent=2))
    raise SystemExit(2 if result['differences'] else 0)
