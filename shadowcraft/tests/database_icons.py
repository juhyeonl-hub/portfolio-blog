"""Global data: equipment rows and the detail show the client icon and main stats from the item index; skills and
non-equipment rows have no icon; a missing index leaves the list intact."""
import os, re
from playwright.sync_api import sync_playwright, expect

URL = os.environ.get('SHADOWCRAFT_TEST_URL', 'http://127.0.0.1:5173/lab/shadowcraft/')

with sync_playwright() as p:
    browser = p.chromium.launch()
    for mode in ['normal', 'missing']:
        page = browser.new_page(viewport={'width': 1366, 'height': 900}); errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        if mode == 'missing':
            page.route('**/shadowcraft/data/item-index.json', lambda r: r.fulfill(status=404, body='nope'))
        page.goto(URL)
        page.get_by_role('tab', name='글로벌 데이터', exact=True).click()
        panel = page.get_by_role('region', name='글로벌 클라이언트 데이터베이스', exact=True)
        panel.get_by_placeholder('영문 이름 또는 ID').fill('110130002')  # Wisdom Greatsword, a unique weapon
        row = panel.locator('.database-list button').first
        expect(row).to_contain_text('Wisdom Greatsword')
        row.click()
        detail = panel.get_by_role('region', name='데이터 상세', exact=True) if panel.get_by_role('region', name='데이터 상세').count() else panel.locator('.database-detail')
        if mode == 'normal':
            expect(row.locator('img.db-icon')).to_have_count(1)
            # Lazy images may still be in flight on a cold CDN; wait for them rather than sampling once.
            page.wait_for_function("[...document.querySelectorAll('img.db-icon')].length > 0 && [...document.querySelectorAll('img.db-icon')].every(i => i.complete && i.naturalWidth > 0)", timeout=20000)
            expect(detail.locator('img.db-icon-large')).to_have_count(1)
            expect(detail.locator('.db-stats li').first).to_be_visible()
            expect(detail.locator('.db-stats')).to_contain_text(re.compile('최대 공격력|공격력'))
            # Skills never get an icon from the item index.
            panel.get_by_role('button', name=re.compile('^플레이어 스킬')).click()
            panel.get_by_placeholder('영문 이름 또는 ID').fill('13010000')
            assert panel.locator('.database-list img.db-icon').count() == 0
        else:
            assert panel.locator('img.db-icon').count() == 0
            expect(detail).to_contain_text('Wisdom Greatsword')
        assert not errors, errors
        page.close()
    browser.close()
print('PASS database icons: equipment row/detail icon + main stats from the item index, no icon for skills, graceful without index')
