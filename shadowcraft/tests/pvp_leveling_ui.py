"""Build page: the PvP style is stored and survives a reload; 레벨링 shows level chips that set the plan level; the
랭커 tab states whether the official Abyss/Arena rankings are open (probe mocked both ways)."""
import json, os
from playwright.sync_api import sync_playwright, expect
from _ui import open_build, click_tab

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
            click_tab(page, '랭커')
            note = page.locator('.ranking-availability')
            expect(note).to_contain_text({'closed': '아직 공개 전입니다 (마지막 확인 2026-10-20)', 'open': '공식 어비스 랭킹이 공개되었습니다 (확인 2026-10-20)', 'down': '확인하지 못했습니다'}[probe])
            if probe != 'closed':
                page.close(); continue
            open_build(page)
            settings = page.get_by_role('region', name='빌드 설정', exact=True)
            # PvP style → stored mode pvp, kept after reload.
            settings.get_by_role('button', name='PvP형', exact=True).click()
            stored = json.loads(page.evaluate("localStorage.getItem('shadowcraft-plan-v1:assassin') || localStorage.getItem('shadowcraft-plan-v1')"))
            assert stored['mode'] == 'pvp', stored['mode']
            page.reload()
            open_build(page)
            settings = page.get_by_role('region', name='빌드 설정', exact=True)
            expect(settings.get_by_role('button', name='PvP형', exact=True)).to_have_attribute('aria-pressed', 'true')
            # 레벨링: chips appear, Lv.20 sets the plan level and the mode falls back to damage.
            settings.get_by_role('button', name='레벨링', exact=True).click()
            chips = page.locator('.leveling-levels')
            expect(chips.get_by_role('button', name='Lv.20', exact=True)).to_be_visible()
            chips.get_by_role('button', name='Lv.20', exact=True).click()
            expect(chips.get_by_role('button', name='Lv.20', exact=True)).to_have_attribute('aria-pressed', 'true')
            stored = json.loads(page.evaluate("localStorage.getItem('shadowcraft-plan-v1:assassin') || localStorage.getItem('shadowcraft-plan-v1')"))
            assert stored['level'] == 20 and stored['mode'] == 'damage', (stored['level'], stored['mode'])
            expect(page.get_by_label('캐릭터 레벨', exact=True)).to_have_value('20')
            # Back to a normal style hides the chips.
            settings.get_by_role('button', name='안정형', exact=True).click()
            expect(chips).to_have_count(0)
            page.get_by_label('캐릭터 레벨', exact=True).fill('45')
            assert not errors, errors
            page.close()
    browser.close()
print('PASS pvp + levelling UI: PvP style persists, levelling chips set the level, ranking availability note (closed/open/down) on desktop and phone')
