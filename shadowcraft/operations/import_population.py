"""Import public numerical aggregates; no character records or third-party UI code.
Run from repo root: python3 shadowcraft/operations/import_population.py
Review the resulting diff, test, then deploy. Not a scheduled/live feed.
"""
import json
import re
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from urllib.request import Request, urlopen

SOURCE = 'https://aion2tierlist.com/population'
OUTPUT = Path(__file__).resolve().parents[2] / 'frontend/shadowcraft/lib/data/population.json'
CLASSES = {'gladiator', 'templar', 'assassin', 'ranger', 'sorcerer', 'spiritmaster', 'cleric', 'chanter'}
REGIONS = {'eu', 'nae', 'naw', 'la', 'as'}


def normalize(html, fetched_at):
    match = re.search(r'<script\b(?=[^>]*\bid="pop-cls-data")(?=[^>]*\btype="application/json")[^>]*>(.*?)</script>', html, re.S)
    if not match:
        raise ValueError('Missing public aggregate data')
    raw = json.loads(match[1])
    table = re.search(r'<table\b[^>]*\bid="pop-servers"[^>]*>(.*?)</table>', html, re.S)
    if not table:
        raise ValueError('Missing faction table')
    factions = {}
    for row in re.findall(r'<tr\b[^>]*>(.*?)</tr>', table[1], re.S):
        cells = re.findall(r'<td\b[^>]*>(.*?)</td>', row, re.S)
        if not cells:
            continue
        path = re.search(r'href="([^"]+)"', cells[0])
        faction = unescape(re.sub('<[^>]*>', '', cells[2])).strip()
        if not path or faction not in {'Elyos', 'Asmodians'} or path[1] in factions:
            raise ValueError('Invalid faction row')
        factions[path[1]] = (1 if faction == 'Elyos' else 2, int(re.sub('<[^>]*>', '', cells[4]).replace(',', '')))
    servers, seen = [], set()
    totals = {key: 0 for key in CLASSES}
    for server in raw['servers']:
        region, slug, name, counts = server['r'], server['slug'], server['name'], server['n45']
        identity = region + '/' + slug
        if region not in REGIONS or not re.fullmatch('[a-z0-9-]{1,60}', slug) or identity in seen:
            raise ValueError('Invalid/duplicate server')
        if not isinstance(name, str) or not 1 <= len(name) <= 80 or set(counts) != CLASSES:
            raise ValueError('Invalid server name/classes')
        if any(type(n) is not int or not 0 <= n <= 100_000_000 for n in counts.values()):
            raise ValueError('Invalid count')
        race, table_total = factions[server['path']]
        if sum(counts.values()) != table_total:
            raise ValueError('Server total disagrees with public table')
        seen.add(identity)
        for key, count in counts.items():
            totals[key] += count
        servers.append({'id': identity, 'region': region, 'name': name, 'race': race,
                        'counts': {('elementalist' if k == 'spiritmaster' else k): v for k, v in counts.items()}})
    if not servers or len(servers) != len(factions) or totals != raw['global'] or {s['region'] for s in servers} != REGIONS:
        raise ValueError('Incomplete snapshot/global total disagreement')
    return {'source': SOURCE, 'methodology': 'https://aion2tierlist.com/methodology',
            'fetchedAt': fetched_at, 'level': 45, 'scope': 'indexed-characters',
            'servers': sorted(servers, key=lambda s: s['id'])}


if __name__ == '__main__':
    with urlopen(Request(SOURCE, headers={'User-Agent': 'a2bc-public-statistics/1.0'}), timeout=30) as response:
        payload = response.read(2_000_001)
    if len(payload) > 2_000_000:
        raise ValueError('Oversized source response')
    data = normalize(payload.decode('utf-8'), datetime.now(timezone.utc).isoformat())
    temporary = OUTPUT.with_suffix('.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(OUTPUT)
    print(f"Imported {len(data['servers'])} servers; review and deploy to publish")
