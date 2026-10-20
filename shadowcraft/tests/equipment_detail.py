"""Equipment grid details: ranker gear shows client icons, grade, level and option candidates from the item index;
a missing index keeps the glyph layout; English shows the client stat names."""
import os, re
from playwright.sync_api import sync_playwright, expect

URL = os.environ.get('SHADOWCRAFT_TEST_URL', 'http://127.0.0.1:5173/lab/shadowcraft/')

with sync_playwright() as p:
    browser = p.chromium.launch()
    for index_mode in ['normal', 'missing']:
        page = browser.new_page(viewport={'width': 1440, 'height': 1000}); errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.route('**/api/public/shadowcraft/armory', lambda r: r.fulfill(status=503, json={'error': 'test official unavailable'}))
        if index_mode == 'missing':
            page.route('**/shadowcraft/data/item-index.json', lambda r: r.fulfill(status=404, body='not found'))
        page.goto(URL)
        page.get_by_role('tab', name='빌드 선택', exact=True).click()
        panel = page.get_by_role('region', name='랭커 빌드 분석', exact=True)
        panel.locator('.ranker-list button').first.click()
        grid = page.get_by_role('group', name='장비 배치')
        expect(grid).to_be_visible()
        filled = grid.locator('.eq-slot.filled')
        assert filled.count() >= 10, filled.count()
        slot = filled.first
        slot.focus()
        tip = slot.locator('.eq-tip')
        expect(tip).to_be_visible()
        if index_mode == 'normal':
            expect(grid.locator('img.eq-icon').first).to_be_visible()
            assert grid.locator('img.eq-icon').count() >= 10, grid.locator('img.eq-icon').count()
            # Every icon the grid asked for exists.
            for src in grid.locator('img.eq-icon').evaluate_all('nodes => nodes.map(n => n.currentSrc || n.src)'):
                assert page.request.get(src).ok, src
            assert page.evaluate("[...document.querySelectorAll('img.eq-icon')].every(i => i.complete && i.naturalWidth > 0)"), 'icons must load'
            expect(tip).to_contain_text(re.compile('아이템 레벨 \\d+'))
            expect(tip).to_contain_text('클라이언트 표 원값 기준')
            expect(tip.locator('.eq-stats li').first).to_be_visible()
            assert slot.evaluate("n => [...n.classList].some(c => c.startsWith('grade-'))"), 'grade class'
            expect(tip).not_to_contain_text('클라이언트 표에 없습니다')
            # English stat names come straight from the client strings.
            page.locator('select.asbc-language').select_option('en')
            expect(page.get_by_role('tab').first).to_have_text('Home')
            # The group's accessible name is translated too, so locate the grid by class now.
            slot_en = page.locator('.equipment-grid .eq-slot.filled').first
            slot_en.focus(); tip_en = slot_en.locator('.eq-tip')
            expect(tip_en).to_contain_text(re.compile('Item level \\d+'))
            expect(tip_en.locator('.eq-stats li span').first).to_contain_text(re.compile('^[A-Za-z]'))
            expect(tip_en).to_contain_text('raw client table values')
        else:
            assert grid.locator('img.eq-icon').count() == 0
            expect(grid.locator('.eq-glyph').first).to_be_visible()
            expect(tip).to_contain_text(re.compile('강화 \\+\\d+ · 초월 \\+\\d+'))
            expect(tip).not_to_contain_text('클라이언트 표 원값 기준')
            assert tip.locator('.eq-stats').count() == 0
        assert not errors, errors
        page.close()
    browser.close()
print('PASS equipment detail: icons + grade + level + stats from the item index, English names, graceful fallback without index')
