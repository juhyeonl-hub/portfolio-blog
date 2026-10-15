"""Derive compact planner gates from the reviewed official client index."""
import hashlib
import json
import sys
from pathlib import Path


def build(path):
    raw = Path(path).read_bytes()
    data = json.loads(raw)
    source = data['source']
    if data['schema'] != 'a2bc-client-index-v1' or source['region'] != 'global' or source['appId'] != 3393110:
        raise ValueError('Expected reviewed Global client index')
    gates = {}
    for skill in data['skills']:
        for row in skill['learning']:
            condition = row['ascensionRequirement']
            if condition == 'None':
                continue
            if condition != 'AscensionGrade_3':
                raise ValueError('New ascension condition needs explicit planner support')
            # First acquisition remains a prerequisite for every later level.
            gates[skill['id']] = min(gates.get(skill['id'], row['level']), row['level'])
    if not gates:
        raise ValueError('Missing expected ascension gates')
    return {'source': source, 'indexSha256': hashlib.sha256(raw).hexdigest(), 'condition': 'AscensionGrade_3', 'requiredFromLevel': gates}

if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('Expected reviewed client index JSON and output JSON')
    result = build(sys.argv[1])
    Path(sys.argv[2]).write_text(json.dumps(result, indent=2)+'\n')
    print('Ascension gates:', len(result['requiredFromLevel']))
