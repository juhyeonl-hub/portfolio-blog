"""Official Abyss/Arena ranker import — ready for the day NCSOFT publishes the Global rankings.

Usage:
  python3 shadowcraft/operations/import_official_rankers.py abyss|arenaOfSolitude|arenaOfCooperation [--dry-run]
  python3 shadowcraft/operations/import_official_rankers.py --self-test

Reads https://aion2.plaync.com/api/ranking/list for every Global region's servers (lib/data/servers.json), keeps the
first ten characters per class, verifies each one through the public character profile exactly like
import_rankers.py and writes lib/data/rankers-<kind>.json in the same shape as rankers.json (metric = the kind).
As of 2026-10-20 every server answers an empty list; the script then exits 3 without writing anything.

Ranking entry fields come from the official ranking page script (zod schema): rank, characterId, characterName,
classId, className, raceId, guildName, point, prevRank, rankChange, gradeId, gradeName, extraDataMap.
"""
import json, sys, time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, str(Path(__file__).resolve().parent))
import import_rankers  # fetch, verify, validate_entries, ROOT

KINDS = {'abyss': 1, 'arenaOfSolitude': 5, 'arenaOfCooperation': 6}
# Official pcId → planner class key (class-profiles.json pcIds: four per class, in class order).
CLASS_KEYS = ['gladiator', 'templar', 'ranger', 'assassin', 'elementalist', 'sorcerer', 'cleric', 'chanter']
PER_CLASS = 10
NOT_PUBLISHED = 3


def class_key(class_id, profiles):
    for profile in profiles:
        if class_id in profile['pcIds']:
            return profile['key']
    raise ValueError('Unknown official classId %r' % class_id)


def parse_rows(payload, region, server, profiles):
    """Validate one server's ranking response and return planner rows (unverified)."""
    if not isinstance(payload, dict) or not isinstance(payload.get('rankingList'), list):
        raise ValueError('Ranking response shape changed')
    rows = []
    for entry in payload['rankingList']:
        if not isinstance(entry, dict):
            raise ValueError('Ranking entry is not an object')
        rank, name, cid, cls, point = entry.get('rank'), entry.get('characterName'), entry.get('characterId'), entry.get('classId'), entry.get('point')
        if type(rank) is not int or rank < 1 or type(point) is not int or point < 0 or not isinstance(name, str) or not 1 <= len(name) <= 60 \
                or not isinstance(cid, str) or not cid or type(cls) is not int:
            raise ValueError('Invalid ranking entry')
        rows.append({'classKey': class_key(cls, profiles), 'sampleRank': rank, 'name': name, 'region': region, 'serverId': server['serverId'],
                     'serverName': server['serverName'], 'race': server.get('raceId', 0), 'rankingPoint': point, 'officialCharacterId': cid,
                     'gradeName': entry.get('gradeName') if isinstance(entry.get('gradeName'), str) else None})
    return rows


def select(rows):
    """First ten per class by ranking point across all regions; sampleRank keeps the official per-server rank."""
    found = {key: [] for key in CLASS_KEYS}
    for row in sorted(rows, key=lambda r: (-r['rankingPoint'], r['sampleRank'], r['region'], r['serverId'])):
        bucket = found[row['classKey']]
        if len(bucket) < PER_CLASS:
            bucket.append({**row, 'rank': len(bucket) + 1, 'combatPower': row['rankingPoint']})
    return [row for bucket in found.values() for row in bucket]


def verify(row):
    verified = import_rankers.verify(dict(row))
    if verified['characterId'] != row['officialCharacterId']:
        raise ValueError('Ranking characterId does not match the public profile: ' + row['name'])
    return verified


def collect(kind, servers, profiles, fetch=import_rankers.fetch):
    contents_type = KINDS[kind]
    rows = []
    for region, region_servers in servers.items():
        for server in region_servers:
            q = urlencode({'region': region, 'lang': 'en-US', 'rankingContentsType': contents_type, 'rankingType': 0, 'serverId': server['serverId']})
            rows += parse_rows(json.loads(fetch('https://aion2.plaync.com/api/ranking/list?' + q)), region, server, profiles)
            time.sleep(.2)
    return rows


def main(argv):
    if argv[:1] == ['--self-test']:
        return self_test()
    if not argv or argv[0] not in KINDS:
        print(__doc__, file=sys.stderr)
        return 2
    kind, dry = argv[0], '--dry-run' in argv
    servers = json.loads((import_rankers.ROOT / 'frontend/shadowcraft/lib/data/servers.json').read_text())
    profiles = json.loads((import_rankers.ROOT / 'frontend/shadowcraft/lib/data/class-profiles.json').read_text())
    fetched_at = datetime.now(timezone.utc).isoformat()
    rows = collect(kind, servers, profiles)
    if not rows:
        print('Official %s ranking is not published yet (every server answered an empty list); nothing written.' % kind)
        return NOT_PUBLISHED
    chosen = select(rows)
    print('Official %s ranking: %d rows, %d selected (%s)' % (kind, len(rows), len(chosen), ', '.join('%s %d' % (k, sum(1 for r in chosen if r['classKey'] == k)) for k in CLASS_KEYS)))
    if dry:
        return 0
    with ThreadPoolExecutor(max_workers=2) as pool:
        entries = list(pool.map(verify, chosen))
    if len(entries) != 8 * PER_CLASS:
        raise ValueError('Fewer than ten verified characters for some class; review before publishing')
    import_rankers.validate_entries(entries)
    result = {'source': 'https://aion2.plaync.com/api/ranking/list', 'scope': 'global-official-%s-class-top10' % kind, 'metric': kind,
              'fetchedAt': fetched_at, 'verifiedAt': datetime.now(timezone.utc).isoformat(), 'entries': entries}
    output = import_rankers.ROOT / ('frontend/shadowcraft/lib/data/rankers-%s.json' % kind)
    tmp = output.with_suffix('.tmp')
    tmp.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n')
    tmp.replace(output)
    print('Saved', output.name, '— review before deployment')
    return 0


def self_test():
    profiles = [{'key': key, 'pcIds': [5 + 4 * i, 6 + 4 * i, 7 + 4 * i, 8 + 4 * i]} for i, key in enumerate(CLASS_KEYS)]
    server = {'serverId': 1301, 'serverName': 'Siel', 'raceId': 1}
    entry = lambda rank, name, cls, point: {'rank': rank, 'characterId': 'id-' + name, 'characterName': name, 'classId': cls, 'point': point, 'gradeName': 'Gold'}
    empty = {'friendRankingList': None, 'myRanking': None, 'rankingList': [], 'season': None}
    assert parse_rows(empty, 'eu', server, profiles) == []
    rows = parse_rows({'rankingList': [entry(1, 'A', 17, 900), entry(2, 'B', 18, 800), entry(3, 'C', 29, 700)]}, 'eu', server, profiles)
    assert [r['classKey'] for r in rows] == ['assassin', 'assassin', 'cleric'] and rows[0]['officialCharacterId'] == 'id-A'
    for bad in [{'rankingList': 'no'}, {'rankingList': [{'rank': 0, 'characterId': 'x', 'characterName': 'N', 'classId': 17, 'point': 1}]},
                {'rankingList': [{'rank': 1, 'characterId': '', 'characterName': 'N', 'classId': 17, 'point': 1}]},
                {'rankingList': [{'rank': 1, 'characterId': 'x', 'characterName': 'N', 'classId': 99, 'point': 1}]},
                {'rankingList': [{'rank': 1, 'characterId': 'x', 'characterName': 'N', 'classId': 17, 'point': -1}]}]:
        try:
            parse_rows(bad, 'eu', server, profiles)
        except ValueError:
            continue
        raise AssertionError('accepted %r' % bad)
    many = parse_rows({'rankingList': [entry(i, 'P%d' % i, 17, 1000 - i) for i in range(1, 15)]}, 'eu', server, profiles)
    other = parse_rows({'rankingList': [entry(1, 'Q', 17, 2000)]}, 'nae', {'serverId': 1101, 'serverName': 'Siel', 'raceId': 1}, profiles)
    chosen = select(many + other)
    assassins = [r for r in chosen if r['classKey'] == 'assassin']
    assert len(assassins) == PER_CLASS and assassins[0]['name'] == 'Q' and assassins[0]['rank'] == 1 and assassins[1]['name'] == 'P1' and assassins[-1]['rank'] == PER_CLASS
    assert all(r['combatPower'] == r['rankingPoint'] for r in chosen)
    # collect() walks every server of every region and stops cleanly on empty answers.
    calls = []
    servers = {'eu': [server, {'serverId': 1302, 'serverName': 'Nezekan', 'raceId': 1}], 'nae': [{'serverId': 1101, 'serverName': 'Siel', 'raceId': 1}]}
    assert collect('abyss', servers, profiles, fetch=lambda url: (calls.append(url), json.dumps(empty))[1]) == []
    assert len(calls) == 3 and all('rankingContentsType=1' in url for url in calls) and 'serverId=1101' in calls[2]
    print('PASS import_official_rankers self-test: parse, rejection, selection, collection')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
