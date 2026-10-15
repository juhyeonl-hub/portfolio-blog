"""Build a narrow display overlay for reviewed integer-valued compound board nodes."""
import hashlib
import json
from pathlib import Path
import sys


EXPECTED_COVERAGE = (8, 192, 4296, 704)

def build(nodes_path, catalog_dir):
    raw = Path(nodes_path).read_bytes()
    nodes = {}
    for row in json.loads(raw)['Properties']['Data']:
        key = str(row['ID']['Value'])
        if key in nodes:
            raise ValueError('Duplicate official node ID')
        nodes[key] = row
    rules, checked, skills_checked = {}, 0, 0
    hashes = {}
    for path in sorted(Path(catalog_dir).glob('*.json')):
        catalog = json.loads(path.read_text())
        hashes[path.stem] = hashlib.sha256(path.read_bytes()).hexdigest()
        labels = {}
        for board in catalog['boards']:
            for node in board['nodes']:
                stat = node.get('stat')
                if stat and stat['format'] == '{v:0}':
                    previous = labels.setdefault(stat['key'], stat['name'])
                    if previous != stat['name']:
                        raise ValueError('Ambiguous display label')
        for board in catalog['boards']:
            for node in board['nodes']:
                row = nodes[node['id']]
                checked += 1
                for field, source in [('row','Row'),('column','Col'),('autoLearn','bAutoLearn'),('requiredLevel','NeedLevel'),('pointCost','CostDaevanionPoint'),('resetGold','ResetGold')]:
                    if type(node[field]) is not type(row[source]) or node[field] != row[source]:
                        raise ValueError('Board field mismatch: '+node['id']+'/'+field)
                if str(row['Board']['Value']) != board['id'] or row['NeedConditionType'] != 'EDaevanionNodeConditionType::None' or row['NeedConditionValue']:
                    raise ValueError('Unexpected board reference or condition')
                if row['Type'] == 'EDaevanionNodeType::SkillLevel':
                    if node['skill']['id'] != row['Value01'] or str(node['skillLevels']) != row['Value02']:
                        raise ValueError('Skill level effect mismatch')
                    skills_checked += 1
                if row['Type'] != 'EDaevanionNodeType::Stat' or not row['Value03']:
                    continue
                if any(row[f'Value{i:02}'] for i in range(5,11)):
                    raise ValueError('Additional effect slots require review')
                primary = node['stat']
                if primary['key'] != row['Value01'] or primary['format'] != '{v:0}' or str(primary['value']) != row['Value02']:
                    raise ValueError('Primary integer effect mismatch')
                key, value = row['Value03'], row['Value04']
                if key not in ('PvPCriticalResist','PvPEvasion','PvPDamageDefense') or not value.isdecimal() or not 0 < int(value) <= 1000000:
                    raise ValueError('Unreviewed secondary effect')
                if node['id'] in rules:
                    raise ValueError('Duplicate planner node ID')
                rules[node['id']] = {'catalogVersion':catalog['version'],'row':node['row'],'column':node['column'],
                    'primary':{'key':primary['key'],'value':primary['value'],'format':primary['format']},
                    'additional':{'key':key,'name':labels[key],'value':int(value),'format':'{v:0}'}}
    if (len(hashes), len(rules), checked, skills_checked) != EXPECTED_COVERAGE:
        raise ValueError('Unexpected reviewed catalog coverage')
    return {'source':{'kind':'installed-steam-client','region':'global','appId':3393110,'buildId':'25926599',
                      'nodeSha256':hashlib.sha256(raw).hexdigest(),'catalogSha256':hashes},
            'scope':'Additional integer effects only; labels retained from existing catalogs',
            'nodesChecked':checked,'skillEffectsChecked':skills_checked,'wholeCatalogVerified':False,'rules':rules}


if __name__ == '__main__':
    if len(sys.argv) != 4:
        raise SystemExit('Expected official DaevanionNode JSON, planner catalog directory, output JSON')
    output = build(sys.argv[1],sys.argv[2])
    path=Path(sys.argv[3]); temporary=path.with_suffix('.tmp')
    temporary.write_text(json.dumps(output,ensure_ascii=False,separators=(',',':'))+'\n')
    temporary.replace(path)
    print('Verified nodes:',output['nodesChecked'],'additional effects:',len(output['rules']))
