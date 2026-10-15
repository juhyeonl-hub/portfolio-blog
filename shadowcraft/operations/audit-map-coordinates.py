"""Compare official label coordinates with subzone polygons; never certify terrain projection.

Usage: python3 audit-map-coordinates.py DECODED_DATA_DIRECTORY
Outputs an audit to stdout only. Does not modify game files or application data.
"""
import hashlib
import json
import math
from pathlib import Path
import statistics
import sys


def point(value):
    result = tuple(value[k] for k in ('X', 'Y'))
    if any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) for v in result):
        raise ValueError('Non-finite or invalid coordinate')
    return result


def polygon_distance(p, vertices):
    """Euclidean distance to a filled polygon; boundary counts as inside."""
    area = sum(a[0]*b[1] - b[0]*a[1] for a, b in zip(vertices, vertices[1:] + vertices[:1]))
    if len(set(vertices)) < 3 or not math.isfinite(area) or area == 0:
        raise ValueError('Degenerate subzone polygon')
    inside = False
    nearest = math.inf
    x, y = p
    for a, b in zip(vertices, vertices[1:] + vertices[:1]):
        dx, dy = b[0] - a[0], b[1] - a[1]
        length = dx * dx + dy * dy
        t = max(0, min(1, ((x-a[0])*dx + (y-a[1])*dy)/length)) if length else 0
        nearest = min(nearest, math.hypot(x-a[0]-t*dx, y-a[1]-t*dy))
        if (a[1] > y) != (b[1] > y) and x < (b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:
            inside = not inside
    return 0.0 if inside or nearest < 1e-7 else nearest


def audit(settings, regions, map_data):
    if settings['WorldMapDataTableKey'] != 'World_L_A' or map_data['MapId'] != 1010:
        raise ValueError('Expected reviewed Verteron map identity')
    world_size, plane_size = settings['SectorWorldSize'], settings['SectorPlaneSize']
    for value in (world_size, plane_size):
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value <= 0:
            raise ValueError('Invalid sector size')
    labels = {}
    for row in settings['LabelMap']:
        key = row['Key'].casefold()
        if key in labels:
            raise ValueError('Duplicate label: ' + key)
        labels[key] = point(row['Value']['Location'])
    zones = {}
    for row in map_data['SubzoneVolumeInfoMap']:
        value = row['Value']
        # Multiple volumes can belong to one subzone: retain their union.
        vertices = [point(p) for p in value['Points']]
        polygon_distance((0, 0), vertices)
        zones.setdefault(value['SubzoneTableId'], []).append(vertices)
    anchors, unresolved, seen = [], [], set()
    for row in regions:
        if row['MapId']['Value'] != 1010 or not row['bEnableWorldMap']:
            continue
        name, zone = row['WorldMapNameActor'], row['SubzoneId']['Value']
        key = name.casefold()
        if key in seen:
            raise ValueError('Duplicate region label: ' + name)
        seen.add(key)
        missing = [reason for absent, reason in [(key not in labels, 'label'), (zone not in zones, 'subzone')] if absent]
        if missing:
            unresolved.append({'label': name, 'subzoneId': zone, 'missing': missing})
        else:
            anchors.append((name, zone, labels[key]))
    if not anchors:
        raise ValueError('No joined anchors')
    candidates = []
    # 100 is an explicitly tested hypothesis, not an established conversion.
    # The other hypothesis comes directly from the two sector-size fields.
    for scale in sorted({100.0, world_size / plane_size}):
        for swap in (False, True):
            for sx, sy in ((1, 1), (-1, 1), (1, -1), (-1, -1)):
                rows = []
                for name, zone, location in anchors:
                    x, y = location[::-1] if swap else location
                    p = (x * sx * scale, y * sy * scale)
                    distance = min(polygon_distance(p, vertices) for vertices in zones[zone])
                    rows.append({'label': name, 'subzoneId': zone, 'distanceToRegion': round(distance, 6)})
                distances = [r['distanceToRegion'] for r in rows]
                candidate = {'scale': scale, 'swapXY': swap, 'signX': sx, 'signY': sy,
                             'insideCount': distances.count(0), 'medianDistance': statistics.median(distances),
                             'maxDistance': max(distances)}
                if not swap and sx == sy == 1:
                    candidate['anchors'] = rows
                candidates.append(candidate)
    return {'format': 'a2bc-map-coordinate-audit-v1', 'mapKey': 'World_L_A', 'mapId': 1010,
            'scope': 'Label-to-subzone consistency only; polygons are not texture control points.',
            'worldProjectionVerified': False, 'markerSupport': False,
            'joinedCount': len(anchors), 'unresolved': unresolved,
            'candidates': candidates,
            'remainingEvidence': 'Independently verified world-to-texture control points or correctly decoded tile transforms.'}


def from_directory(root):
    root = Path(root)
    paths = ['WorldMap/World_L_A.json', 'Table/WorldMapUIRegion.json',
             'Map/World/World_L/World_L_A/MapData.json']
    raw = [(p, (root / p).read_bytes()) for p in paths]
    result = audit(*(json.loads(data)['Properties']['Data'] for _, data in raw))
    result['inputSha256'] = {p: hashlib.sha256(data).hexdigest() for p, data in raw}
    return result


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Expected decoded Data directory')
    print(json.dumps(from_directory(sys.argv[1]), indent=2, allow_nan=False))
