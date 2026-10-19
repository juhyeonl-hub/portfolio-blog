"""Build official en/ja skill names and specialization text for ASBC localization.

Source: metabot.gg skill pages (en, ja_JP), which mirror the official AION2 Global
client text. Pages are fetched politely (1 request/second) into CACHE_DIR and reused.
Acceptance rules:
  * skill English names always come from client-index.json (installed Global client);
  * a specialization's en/ja text is used only when its numbers (thousands separators
    removed) equal the Korean catalog description's numbers;
  * skills whose metabot page disagrees with the client-index name are excluded.
Usage: python3 build-official-specializations.py CACHE_DIR
Writes frontend/shadowcraft/lib/data/{skill-names,official-specializations}.json.
"""
import glob, html, json, os, re, subprocess, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'frontend/shadowcraft/lib/data'
UA = 'Mozilla/5.0 (ASBC localization reference check)'
CLASSES = ['gladiator', 'templar', 'assassin', 'ranger', 'sorcerer', 'spiritmaster', 'cleric', 'chanter']


def fetch(url, path):
    if path.exists() and path.stat().st_size > 10000:
        return path.read_text(encoding='utf-8')
    code = subprocess.run(['curl', '-s', '-L', '-A', UA, '--max-time', '30', '-o', str(path), '-w', '%{http_code}', url],
                          capture_output=True, text=True).stdout
    time.sleep(1.0)
    if code != '200':
        raise SystemExit(f'HTTP {code} {url}')
    return path.read_text(encoding='utf-8')


def clean(value):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<!--.*?-->|<[^>]+>', '', value))).strip()


def page(text):
    skill_id = re.search(r'aion2%2Fskills%2F(\d+)\.webp', text).group(1)
    name = clean(re.search(r'<h1[^>]*>(.*?)<span', text, re.S).group(1))
    specs = {m.group(1): clean(m.group(2)) for m in re.finditer(r'stigma%2F(\d+)\.webp.{0,800}?specText">(.*?)</p>', text, re.S)}
    return skill_id, name, specs


def numbers(text):
    return sorted(re.findall(r'\d+(?:\.\d+)?', re.sub(r'(?<=\d),(?=\d{3})', '', text)))


def main(cache):
    cache = Path(cache); cache.mkdir(parents=True, exist_ok=True)
    official = {}
    for cls in CLASSES:
        listing = fetch(f'https://metabot.gg/en/aion-2/classes/{cls}', cache / f'class-{cls}.html')
        for slug in sorted(set(re.findall(r'/en/aion-2/skills/([a-z0-9-]+)', listing))):
            en = page(fetch(f'https://metabot.gg/en/aion-2/skills/{slug}', cache / f'en-{slug}.html'))
            ja = page(fetch(f'https://metabot.gg/ja_JP/aion-2/skills/{slug}', cache / f'ja-{slug}.html'))
            if en[0] != ja[0] or set(en[2]) != set(ja[2]):
                raise SystemExit(f'en/ja page mismatch: {slug}')
            official[en[0]] = {'en': en[1], 'ja': ja[1], 'specs': {k: {'en': en[2][k], 'ja': ja[2][k]} for k in en[2]}}
    client = {s['id']: s['name'] for s in json.loads((ROOT / 'frontend/public/shadowcraft/data/client-index.json').read_text())['skills']}
    excluded = {i for i, v in official.items() if client.get(i) != v['en']}
    names, specs = {}, {}
    for path in sorted(glob.glob(str(DATA / 'catalogs/*.json'))):
        catalog = json.loads(Path(path).read_text())
        for skill in catalog['skills']:
            o = None if skill['id'] in excluded else official.get(skill['id'])
            names[skill['name']] = {'en': client[skill['id']], **({'ja': o['ja']} if o else {})}
            for spec in skill['specializations']:
                if not o or spec['id'] not in o['specs']:
                    continue
                row = {l: o['specs'][spec['id']][l] for l in ('en', 'ja') if numbers(o['specs'][spec['id']][l]) == numbers(spec['description'])}
                if row:
                    specs[spec['id']] = row
        for board in catalog['boards']:
            for node in board['nodes']:
                m = re.match(r'^스킬 레벨 상승 - (.+)$', node['name'])
                if m and m.group(1) not in names:
                    i = node['skill']['id']; o = None if i in excluded else official.get(i)
                    names[m.group(1)] = {'en': client[i], **({'ja': o['ja']} if o else {})}
    for name, value in (('skill-names.json', dict(sorted(names.items()))), ('official-specializations.json', dict(sorted(specs.items())))):
        (DATA / name).write_text(json.dumps(value, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(json.dumps({'skills': len(names), 'withJapanese': sum('ja' in v for v in names.values()), 'excluded': sorted(excluded),
                      'specsEn': sum('en' in v for v in specs.values()), 'specsJa': sum('ja' in v for v in specs.values())}))


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: build-official-specializations.py CACHE_DIR')
    main(sys.argv[1])
