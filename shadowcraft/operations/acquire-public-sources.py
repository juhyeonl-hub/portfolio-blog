"""Acquire research snapshots, never publish them or modify application catalogs.

Run from any directory. Optional GRIMVANE_API_KEY is used only in an HTTP header.
No access-gate bypass, browser impersonation, personal timer access or game capture.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import time
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
REGIONS = ('eu', 'nae', 'naw', 'la', 'as')
LIMIT = 5_000_000
NEWS = ('https://api-global-community.plaync.com/aion2_global/board/'
        'update_en/article/search/moreArticle')


def decode_json(raw):
    if len(raw) > LIMIT:
        raise ValueError('response-too-large')
    value = json.loads(raw)
    if not isinstance(value, (dict, list)):
        raise ValueError('invalid-json-root')
    return value


def validate(value, kind):
    if kind == 'servers':
        rows = value.get('serverList')
        if not isinstance(rows, list) or not rows:
            raise ValueError('invalid-server-list')
        ids = set()
        for row in rows:
            if (not isinstance(row, dict) or row.get('raceId') not in (1, 2)
                    or not isinstance(row.get('serverId'), int)
                    or not isinstance(row.get('serverName'), str)
                    or row['serverId'] in ids):
                raise ValueError('invalid-server-record')
            ids.add(row['serverId'])
    elif kind == 'news':
        if (not isinstance(value.get('contentList'), list)
                or not isinstance(value.get('hasMore'), bool)
                or any(not isinstance(x, dict) or not x.get('id')
                       for x in value['contentList'])):
            raise ValueError('invalid-news-page')
    elif kind == 'ranking':
        if not isinstance(value.get('rankingList'), list):
            raise ValueError('invalid-ranking-list')
    return value


def next_cursor(page, seen):
    if not page['hasMore']:
        return None
    rows = page['contentList']
    cursor = str(rows[-1]['id']) if rows else ''
    if not cursor or cursor in seen:
        raise ValueError('non-progressing-news-pagination')
    return cursor


class Collector:
    def __init__(self, directory, transport=None):
        self.directory = Path(directory)
        self.directory.mkdir(parents=True, exist_ok=False)
        self.records = []
        self.transport = transport or self.download

    @staticmethod
    def download(url, headers):
        request = Request(url, headers={'User-Agent': 'a2bc-source-audit/1.0', **headers})
        with urlopen(request, timeout=25) as response:
            raw = response.read(LIMIT + 1)
            if len(raw) > LIMIT:
                raise ValueError('response-too-large')
            return raw

    def get(self, name, url, kind='json', headers=None):
        if not re.fullmatch(r'[a-zA-Z0-9_.-]+', name):
            raise ValueError('unsafe-file-name')
        record = {'file': name, 'url': url,
                  'checkedAt': datetime.now(timezone.utc).isoformat()}
        self.records.append(record)
        try:
            raw = self.transport(url, headers or {})
            if len(raw) > LIMIT:
                raise ValueError('response-too-large')
            if kind == 'text':
                value = raw.decode('utf-8')
                if 'AI gate' in value:
                    raise ValueError('automated-access-gate')
            else:
                value = validate(decode_json(raw), kind)
            (self.directory / name).write_bytes(raw)
            record.update(status='acquired', bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest())
            for key in ('serverList', 'contentList', 'rankingList'):
                if isinstance(value, dict) and key in value:
                    record['count'] = len(value[key])
            return value
        except (HTTPError, URLError, TimeoutError, ValueError, AttributeError) as error:
            # Never log request headers, secrets or arbitrary response/error bodies.
            record.update(status='unavailable', reason=(f'HTTP-{error.code}'
                          if isinstance(error, HTTPError) else type(error).__name__))
            return None

    def save_manifest(self, coverage):
        result = {'createdAt': datetime.now(timezone.utc).isoformat(),
                  'publication': 'local-research-only', 'coverage': coverage,
                  'requests': self.records}
        (self.directory / 'manifest.json').write_text(json.dumps(result, indent=2) + '\n')
        return result


def acquire(collector, key=None):
    coverage = {}
    for region in REGIONS:
        servers = collector.get(f'official-servers-{region}.json',
            f'https://aion2.plaync.com/en-us/api/gameinfo/servers?region={region}&lang=en-US', 'servers')
        if servers:
            # Availability sample: one server per faction, not an all-server census.
            for race in (1, 2):
                row = next((r for r in servers['serverList'] if r['raceId'] == race), None)
                if row:
                    server = row['serverId']
                    for content in (1, 3, 21):
                        collector.get(f'official-ranking-{region}-{server}-{content}.json',
                            'https://aion2.plaync.com/api/ranking/list'
                            f'?region={region}&lang=en-US&rankingContentsType={content}'
                            f'&rankingType=0&serverId={server}', 'ranking')
                        time.sleep(0.25)
    cursor, seen = '0', {'0'}
    coverage['officialUpdates'] = 'incomplete'
    # Bound requests and require cursor progress, even if an upstream API malfunctions.
    for page in range(100):
        data = collector.get(f'official-updates-{page:03}.json',
            f'{NEWS}?moreSize=50&moreDirection=BEFORE&previousArticleId={cursor}', 'news')
        if data is None:
            break
        try:
            cursor = next_cursor(data, seen)
        except ValueError:
            coverage['officialUpdates'] = 'pagination-error'
            break
        if cursor is None:
            coverage['officialUpdates'] = 'available-listing-exhausted'
            break
        seen.add(cursor)
        time.sleep(0.25)
    coverage['officialCharacters'] = 'existing-on-demand-app-lookup; no-bulk-character-census'
    coverage['officialRankings'] = 'availability-sample-only; two-servers-per-region; types-1-3-21'
    coverage['officialFullGameDatabase'] = 'no-confirmed-website-export'

    commit = collector.get('mythos-commit.json',
        'https://api.github.com/repos/MythosOfs/aion2-tracker/commits/main')
    if commit and re.fullmatch('[0-9a-f]{40}', str(commit.get('sha', ''))):
        sha = commit['sha']
        base = f'https://raw.githubusercontent.com/MythosOfs/aion2-tracker/{sha}/'
        license_text = collector.get('mythos-LICENSE.txt', base + 'LICENSE', 'text')
        if license_text and 'MIT License' in license_text and 'Copyright (c) 2026 MythosOfs' in license_text:
            for name in ('README.md', 'index.html'):
                collector.get('mythos-' + name, base + name, 'text')
            coverage['mythos'] = {'revision': sha, 'license': 'MIT',
                'scope': 'code-and-documentation; upstream-feed-rights-not-granted; do-not-execute-archived-html'}
        else:
            coverage['mythos'] = 'license-not-verified'
    else:
        coverage['mythos'] = 'revision-unavailable'

    if key:
        for route in ('timers', 'next', 'field-bosses'):
            collector.get(f'grimvane-{route}.json',
                'https://aion2.grimvane.app/api/v1/' + route,
                headers={'Authorization': 'Bearer ' + key})
        coverage['grimvane'] = 'attempted-public-routes; see-individual-results; personal-timers-excluded'
    else:
        coverage['grimvane'] = 'developer-key-required; not-acquired'
    coverage['gamingTools'] = 'original-bulk-content-permission-not-obtained; not-acquired'
    coverage['aion2Timers'] = 'previously-confirmed-automated-access-gate; not-retried-or-bypassed'
    return collector.save_manifest(coverage)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'source-snapshots' /
                        datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ'))
    args = parser.parse_args()
    result = acquire(Collector(args.output), os.environ.get('GRIMVANE_API_KEY'))
    print(json.dumps({'directory': str(args.output), 'acquired': sum(
        r['status'] == 'acquired' for r in result['requests']), 'unavailable': sum(
        r['status'] != 'acquired' for r in result['requests']), 'coverage': result['coverage']}, indent=2))
