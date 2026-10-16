"""Compare observed package property indexes with an unchanged mapping dump.

Passing coverage does NOT prove field semantics or complete package decoding.
"""
import collections
import hashlib
import json
from pathlib import Path
import re
import sys

TARGETS = {'AionWorldSettings', 'MaterialInstanceDynamic', 'StaticMeshComponent'}
PATTERN = re.compile(r'A2BC_PROPERTY (\w+) index=(\d+) nonzero=(True|False) name=(\S+) type=(\S+)$')


def audit(schemas, trace):
    lookup = {}
    for schema in schemas:
        name = schema['name']
        if name in lookup: raise ValueError('Duplicate schema')
        total = schema['totalCount']
        if type(total) is not int or total < 0: raise ValueError('Invalid property count')
        offset = 0
        names = set()
        for link in schema['chain']:
            if link['name'] in names or type(link['ownCount']) is not int or link['ownCount'] < 0 or link['offset'] != offset:
                raise ValueError('Invalid inheritance chain')
            names.add(link['name'])
            offset += link['ownCount']
        if not schema['chain'] or schema['chain'][0]['name'] != name or offset != total:
            raise ValueError('Inconsistent total count')
        properties = {}
        for prop in schema['properties']:
            index = prop['index']
            if type(index) is not int or not 0 <= index < total or index in properties or not isinstance(prop['name'], str) or not isinstance(prop['type'], str):
                raise ValueError('Invalid mapped property')
            properties[index] = prop
        lookup[name] = (schema, properties)
    if set(lookup) != TARGETS: raise ValueError('Expected three reviewed schemas')
    events = collections.Counter()
    for line in trace.splitlines():
        if not line.startswith('A2BC_PROPERTY '): continue
        match = PATTERN.fullmatch(line.strip())
        if not match: raise ValueError('Malformed property trace')
        name, index, nonzero, observed_name, observed_type = match.groups()
        if name not in TARGETS: continue
        index = int(index)
        mapped = lookup[name][1].get(index)
        expected = (mapped['name'], mapped['type']) if mapped else ('MISSING', 'MISSING')
        if (observed_name, observed_type) != expected:
            raise ValueError('Trace and mapping disagree; do not mix snapshots')
        events[(name, index, nonzero == 'True')] += 1
    if {name for name, _, _ in events} != TARGETS: raise ValueError('Missing target trace coverage')
    rows = []
    for name in sorted(TARGETS):
        schema, properties = lookup[name]
        issues = []
        for (observed, index, nonzero), count in sorted(events.items()):
            if observed != name: continue
            prop = properties.get(index)
            reason = 'missing-index' if prop is None else 'unknown-type' if prop['type'] in ('Unknown', 'UnknownProperty', 'MISSING') else None
            if reason: issues.append({'index': index, 'nonzero': nonzero, 'events': count, 'reason': reason})
        rows.append({'name': name, 'totalCount': schema['totalCount'], 'chain': schema['chain'],
                     'observedEvents': sum(count for (observed, _, _), count in events.items() if observed == name), 'issues': issues})
    return {'researchOnly': True, 'indexCoveragePassed': not any(row['issues'] for row in rows),
            'fieldSemanticsVerified': False, 'wholePackageVerified': False, 'worldProjectionVerified': False,
            'classes': rows}


if __name__ == '__main__':
    if len(sys.argv) != 3: raise SystemExit('Expected mapping dump JSON and property trace log')
    mapping, trace = map(Path, sys.argv[1:])
    result = audit(json.loads(mapping.read_text()), trace.read_text())
    result['evidenceSha256'] = {name: hashlib.sha256(path.read_bytes()).hexdigest() for name, path in [('mappingDump', mapping), ('propertyTrace', trace)]}
    print(json.dumps(result, indent=2))
    # Intentional failing gate: even a successful run cannot certify semantics.
    raise SystemExit(0 if result['indexCoveragePassed'] else 1)
