#!/usr/bin/env python3
"""Build the equipment detail index shown in the in-game style equipment grid.

Usage: python3 build-item-index.py ITEM_TABLE_JSON ENGLISH_L10N_JSON STEAM_BUILD_ID ICON_DIR OUTPUT_JSON

ITEM_TABLE_JSON   strictly decoded Aion2/Content/Data/Table/Item.json (uex export)
ENGLISH_L10N_JSON Aion2/Content/L10N/Text/en-US/L10NString.json (uex export), used for the English stat names
STEAM_BUILD_ID    Global Steam build the tables came from (recorded, not verified here)
ICON_DIR          folder holding <IconRes>.webp files (see INTEGRATION.md "Equipment icons"); an item gets its
                  icon name only when that file exists, so the planner never requests a missing image
OUTPUT_JSON       frontend/public/shadowcraft/data/item-index.json

Only equipment rows (those with EquipCategory) are kept. Identical substat candidate lists are shared through
`pools` so the file stays small. Values are the raw client integers; the planner shows them as stored.
"""
import hashlib, json, os, re, sys
from collections import OrderedDict

# Korean stat names. The Global client ships only the English table, so these follow the Korean service's
# naming rules (inferred, corrected on report); English comes from the client strings.
STAT_KO = {
    'STR': '힘', 'AGI': '정밀', 'CON': '체력', 'DEX': '민첩', 'INT': '지능', 'WIS': '의지',
    'WeaponFixingDamage': '공격력', 'WeaponMinDamage': '최소 공격력', 'WeaponDamage': '최대 공격력',
    'WeaponAccuracy': '명중', 'Critical': '치명타', 'Block': '막기', 'ArmorDefense': '방어력', 'ArmorEvasion': '회피',
    'HPMax': '생명력', 'MPMax': '정신력', 'FPMax': '비행력', 'HPRegen': '자연 생명력 회복', 'MPRegen': '자연 정신력 회복',
    'MoveSpeed': '이동 속도', 'CombatSpeed': '전투 속도',
    'AmplifyAllDamage': '피해 증폭', 'AmplifyWeaponDamage': '무기 피해 증폭', 'AmplifyCriticalDamage': '치명타 피해 증폭',
    'AmplifyHpHealGet': '받는 치유량 증가', 'DecreaseDamage': '피해 내성', 'DecreaseWeaponDamage': '무기 피해 내성',
    'DecreaseCriticalDamage': '치명타 피해 내성', 'CriticalResist': '치명타 저항', 'CriticalDamageDefense': '치명타 피해 방어',
    'CriticalAddDamage': '치명타 공격력', 'Perfect': '완벽 확률', 'PerfectResist': '완벽 저항', 'HardHit': '강타 확률',
    'HardHitResist': '강타 저항', 'AdditionalHitRate': '추가타 확률', 'AdditionalHitResistRate': '추가타 저항',
    'AbnormalAccuracy': '상태 이상 적중', 'AbnormalResistance': '상태 이상 저항',
    'BackAttackDamage': '후방 공격', 'BackAttackDefense': '후방 방어', 'FrontAttackDamage': '전방 공격', 'FrontAttackDefense': '전방 방어',
    'DefensePierce': '관통', 'DefenseRatio': '방어력 증가', 'DamageRatio': '공격력 증가', 'IronWall': '인내', 'IgnoreIronWall': '인내 관통',
    'Restoration': '재생', 'MaxShieldBlock': '방패 막기 피해 감소량', 'DecreaseShieldBlock': '방패 막기 피해 감소율',
    'MaxWeaponBlock': '무기 막기 피해 감소량', 'DecreaseWeaponBlock': '무기 막기 피해 감소율', 'HpPotionRate': '생명력 물약 회복량 증가',
    'PvEAmplifyDamage': 'PvE 피해 증폭', 'PvEDecreaseDamage': 'PvE 피해 내성', 'PvPAmplifyDamage': 'PvP 피해 증폭',
    'SealStoneAddDamage': '신석 피해 증가',
    'Death': '죽음 [트리니엘]', 'Destiny': '운명 [마르쿠탄]', 'Destruction': '파괴 [지켈]', 'Freedom': '자유 [바이젤]',
    'Illusion': '환영 [카이시넬]', 'Justice': '정의 [네자칸]', 'Life': '생명 [유스티엘]', 'Space': '공간 [이스라펠]',
    'Time': '시간 [시엘]', 'Wisdom': '지혜 [루미엘]',
}
ENUM = re.compile(r'^E[A-Za-z]+::(\w+)$')


def enum_name(value):
    match = ENUM.match(value or '')
    if not match:
        raise ValueError('unexpected enum value ' + repr(value))
    return match.group(1)


def stat_key(value):
    key = enum_name(value)
    if key not in STAT_KO:
        raise ValueError('unknown stat ' + key + ' (add its Korean name)')
    return key


RACE_LETTER = {'ERace::Light': 'L', 'ERace::Dark': 'D'}


def icon_candidates(icon, race):
    """Pak texture names an IconRes may resolve to. 289 equipment rows name `Icon_GM_…`/`Icon_WP_…` textures the
    Global paks only ship as `Icon_Equip_AR_<L|D>_…`/`Icon_Equip_WP_<L|D>_…`; the item's race is tried first."""
    if icon == 'None':
        return []
    letters = [RACE_LETTER[race]] if race in RACE_LETTER else []
    letters += [letter for letter in ('L', 'D') if letter not in letters]
    candidates = [icon]
    for prefix, kind in (('Icon_GM_', 'AR'), ('Icon_WP_', 'WP')):
        if icon.startswith(prefix):
            candidates += ['Icon_Equip_%s_%s_%s' % (kind, letter, icon[len(prefix):]) for letter in letters]
    return candidates


def resolve_icon(icon, race, icon_dir):
    for candidate in icon_candidates(icon, race):
        if os.path.isfile(os.path.join(icon_dir, candidate + '.webp')):
            return candidate
    return None


def load_rows(path):
    table = json.load(open(path, encoding='utf-8'))
    properties = table['Properties']
    if len(properties) != 1:
        raise ValueError('Item table must hold exactly one property list')
    rows = next(iter(properties.values()))
    if not isinstance(rows, list) or not rows:
        raise ValueError('Item table rows missing')
    return rows


def build(item_path, l10n_path, build_id, icon_dir, output):
    rows = load_rows(item_path)
    english = json.load(open(l10n_path, encoding='utf-8'))['Entries']
    pools, pool_index, items, used = [], {}, OrderedDict(), set()
    for row in rows:
        if 'EquipCategory' not in row:
            continue
        item_id = row['ID']['Value']
        if type(item_id) is not int or item_id <= 0 or str(item_id) in items:
            raise ValueError('bad or duplicate item id ' + repr(item_id))
        main = [[stat_key(s['Key']), s['Value']] for s in row.get('MainStats', [])]
        subs = tuple((stat_key(s['Key']), s['Value']['MinValue'], s['Value']['MaxValue']) for s in row.get('SubStats', []))
        for key, value in main:
            if type(value) is not int:
                raise ValueError('main stat value must be an integer: %s %r' % (key, value))
        for key, low, high in subs:
            if type(low) is not int or type(high) is not int or low > high:
                raise ValueError('bad substat range: %s %r %r' % (key, low, high))
        if subs not in pool_index:
            pool_index[subs] = len(pools)
            pools.append([list(s) for s in subs])
        used.update(k for k, _ in main)
        used.update(s[0] for s in subs)
        entry = {'g': enum_name(row['ItemGrade']), 'lv': row['ItemLevel'], 'c': enum_name(row['EquipCategory'])}
        icon = resolve_icon(row.get('IconRes') or 'None', row.get('ItemRace') or '', icon_dir)
        if icon:
            entry['i'] = icon
        if main:
            entry['m'] = main
        if subs:
            entry['p'] = pool_index[subs]
            entry['sc'] = [row.get('SubStatCountMin', 0), row.get('SubStatCountMax', 0)]
        if row.get('SoulbindRandomStat') and row.get('SoulbindRandomStatCount', 0) > 0:
            entry['rs'] = row['SoulbindRandomStatCount']
        if row.get('MagicStoneSlotCount', 0) > 0:
            entry['ms'] = row['MagicStoneSlotCount']
        if row.get('GodStoneSlotCount', 0) > 0:
            entry['gs'] = row['GodStoneSlotCount']
        items[str(item_id)] = entry
    stats = {}
    for key in sorted(used):
        name = english.get('String_StatName_%s_body' % key)
        if not isinstance(name, str) or not name.strip():
            raise ValueError('English stat name missing for ' + key)
        stats[key] = {'ko': STAT_KO[key], 'en': name.strip()}
    with_icon = sum(1 for e in items.values() if 'i' in e)
    result = {
        'schema': 'asbc-item-index-v1', 'steamBuild': str(build_id),
        'source': {'itemTable': os.path.basename(item_path), 'sha256': sha256(item_path), 'rows': len(rows), 'equipment': len(items), 'withIcon': with_icon},
        'stats': stats, 'pools': pools, 'items': items,
    }
    with open(output, 'w', encoding='utf-8') as out:
        json.dump(result, out, ensure_ascii=False, separators=(',', ':'))
        out.write('\n')
    return result['source'], len(pools)


def sha256(path):
    digest = hashlib.sha256()
    with open(path, 'rb') as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()


if __name__ == '__main__':
    if len(sys.argv) != 6:
        print(__doc__, file=sys.stderr)
        sys.exit(2)
    source, pool_count = build(*sys.argv[1:])
    print(json.dumps({'source': source, 'pools': pool_count}, ensure_ascii=False))
