"""Research-only consistency check of a quarantined package-mapping hypothesis.

This cannot certify the mapping or the world-to-image projection.
"""
import hashlib
import json
import math
from pathlib import Path
import sys


def audit(exports):
    rows = []
    seen = set()
    # Four float32 ULPs at the largest reviewed center (3584), rounded up.
    tolerance = 0.001
    for actor in exports:
        if actor['Type'] != 'BP_WorldMapPlane_C':
            continue
        props = actor['Properties']
        sector = props.get('SectorIndex', {'X': 0, 'Y': 0})
        x, y = sector['X'], sector['Y']
        if any(type(v) is not int or not 0 <= v < 8 for v in (x, y)) or (x, y) in seen:
            raise ValueError('Invalid or duplicate sector')
        seen.add((x, y))
        if props['SectorTexture']['ObjectName'] != f"Texture2D'World_L_A_{x:02}_{y:02}'":
            raise ValueError('Texture/sector mismatch')
        path = props['RootComponent']['ObjectPath']
        prefix, number = path.rsplit('.', 1)
        if prefix != '/Game/UI/Map/WorldMap/World_L_A/WorldMap_World_L_A' or not number.isdecimal():
            raise ValueError('Unexpected component reference')
        index = int(number)
        if index >= len(exports):
            raise ValueError('Missing component')
        component = exports[index]
        if component['Type'] != 'StaticMeshComponent' or not component['Outer']['ObjectName'].endswith('.' + actor['Name'] + "'"):
            raise ValueError('Wrong component owner or type')
        data = component['Properties']
        location = data['RelativeLocation']
        scale = data['RelativeScale3D']
        expected = {'X': -3584 + 1024*x, 'Y': -3584 + 1024*y, 'Z': 0}
        errors = []
        for actual, target in ((location, expected), (scale, {'X': 10.24, 'Y': 10.24, 'Z': 1})):
            for axis in ('X', 'Y', 'Z'):
                value = actual[axis]
                if type(value) not in (int, float) or not math.isfinite(value):
                    raise ValueError('Invalid transform')
                error = abs(value - target[axis])
                if error > tolerance:
                    raise ValueError('Transform outside reviewed grid')
                errors.append(error)
        rows.append({'x': x, 'y': y, 'location': location, 'scale': scale, 'maxError': max(errors)})
    if len(seen) != 64:
        raise ValueError('Expected all 64 sectors')
    return {'researchOnly': True, 'wholePackageVerified': False, 'worldProjectionVerified': False,
            'hypothesis': 'StaticMeshComponent property count 33 -> 34; missing field identity/position unknown',
            'grid': {'size': 8, 'pitch': 1024, 'firstCenter': -3584, 'lastCenter': 3584},
            'tolerance': tolerance, 'maxError': max(row['maxError'] for row in rows),
            'tiles': sorted(rows, key=lambda row: (row['y'], row['x']))}


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Expected quarantined Verteron package JSON')
    raw = Path(sys.argv[1]).read_bytes()
    result = audit(json.loads(raw))
    result['inputSha256'] = hashlib.sha256(raw).hexdigest()
    print(json.dumps(result, indent=2, allow_nan=False))
