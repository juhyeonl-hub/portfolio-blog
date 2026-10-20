"""Quick build: PvP option previews a PvP plan, the levelling guide previews at a chosen level, and the ranker
section states whether the official Abyss/Arena rankings are open (probe mocked both ways)."""
import json, os
from playwright.sync_api import sync_playwright, expect

URL = os.environ.get('SHADOWCRAFT_TEST_URL', 'http://127.0.0.1:5173/lab/shadowcraft/')
CLOSED = {'checkedAt': '2026-10-20T03:00:00Z', 'published': {'abyss': False, 'arenaOfSolitude': False, 'arenaOfCooperation': False}, 'failed': False}
OPEN = {**CLOSED, 'published': {**CLOSED['published'], 'abyss': True}}

with sync_playwright() as p:
    browser = p.chromium.launch()
    for width in [1440, 390]:
        for probe in ['closed', 'open', 'down']:
            page = browser.new_page(viewport={'width': width, 'height': 1000}); errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.route('**/api/public/shadowcraft/armory', lambda r: r.fulfill(status=503, json={'error': 'x'}))
            page.route('**/api/public/shadowcraft/ranking-availability', lambda r: r.fulfill(status=503, body='down') if probe == 'down' else r.fulfill(json=OPEN if probe == 'open' else CLOSED))
            page.goto(URL)
            page.get_by_role('tab', name='빌드 선택', exact=True).click()
            quick = page.get_by_role('region', name='간편 빌드 선택', exact=True)
            note = page.locator('.ranking-availability')
            expect(note).to_contain_text({'closed': '아직 공개 전입니다 (마지막 확인 2026-10-20)', 'open': '공식 어비스 랭킹이 공개되었습니다 (확인 2026-10-20)', 'down': '확인하지 못했습니다'}[probe])
            if probe != 'closed':
                page.close(); continue
            # PvP option → preview labelled PvP형, applied plan stores mode pvp and keeps it after reload.
            quick.get_by_role('button', name='PvP형', exact=False).click()
            quick.get_by_role('button', name='이 빌드 미리보기', exact=True).click()
            preview = quick.locator('.quick-preview')
            expect(preview).to_contain_text('PvP형')
            quick.get_by_role('button', name='이 빌드 적용', exact=True).click()
            # The default class keeps the legacy key without a class suffix.
            stored = json.loads(page.evaluate("localStorage.getItem('shadowcraft-plan-v1:assassin') || localStorage.getItem('shadowcraft-plan-v1')"))
            assert stored['mode'] == 'pvp', stored['mode']
            page.reload()
            page.get_by_role('tab', name='빌드 선택', exact=True).click()
            quick = page.get_by_role('region', name='간편 빌드 선택', exact=True)
            expect(quick.get_by_role('button', name='PvP형', exact=False)).to_have_attribute('aria-pressed', 'true')
            # Levelling guide: choosing Lv.20 previews a Lv.20 offence plan with the tips visible.
            guide = quick.locator('.leveling-guide')
            guide.locator('summary').click()
            expect(guide.locator('.leveling-tips li')).to_have_count(5)
            expect(guide.get_by_role('link', name='game8 · 序盤の進め方')).to_have_attribute('href', 'https://game8.jp/aion2/822366')
            guide.get_by_role('button', name='Lv.20', exact=True).click()
            expect(guide.get_by_role('button', name='Lv.20', exact=True)).to_have_attribute('aria-pressed', 'true')
            quick.get_by_role('button', name='이 빌드 미리보기', exact=True).click()
            expect(quick.locator('.quick-preview')).to_contain_text('Lv.20 · 공격형')
            quick.get_by_role('button', name='미리보기 취소', exact=True).click()
            assert not errors, errors
            page.close()
    browser.close()
print('PASS pvp + levelling UI: PvP preview/apply/persist, levelling milestones preview, ranking availability note (closed/open/down) on desktop and phone')
