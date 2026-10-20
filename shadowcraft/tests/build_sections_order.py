"""Build page bars: each section's content sits directly under its own bar (assassin and other classes), sections
fold/unfold independently, and navigating to a folded section opens it."""
import os
from playwright.sync_api import sync_playwright, expect

URL = os.environ.get('SHADOWCRAFT_TEST_URL', 'http://127.0.0.1:5173/lab/shadowcraft/')
ORDER = ['skills', 'daevanion', 'gear', 'macro', 'rotation']

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1366, 'height': 900}); errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.route('**/api/public/shadowcraft/armory', lambda r: r.fulfill(status=503, json={'error': 'x'}))
    page.goto(URL)
    page.get_by_role('tab', name='빌드 선택', exact=True).click()
    for cls in ['검성', '살성']:
        page.locator('.class-picker button').filter(has_text=cls).click()
        for section in ORDER:
            expect(page.locator('#build-' + section)).to_have_count(1)
            assert page.locator('#build-section-' + section).count() == 0, section + ' must start folded'
        for section in ORDER:
            page.locator('#build-' + section + ' button').click()
            expect(page.locator('#build-section-' + section)).to_have_count(1)
        ids = page.evaluate("[...document.querySelectorAll('[id^=\"build-\"]')].map(e => e.id)")
        expected = [x for s in ORDER for x in ('build-' + s, 'build-section-' + s)]
        assert [i for i in ids if i in expected] == expected, (cls, ids)
        for section in ORDER:
            page.locator('#build-' + section + ' button').click()
            expect(page.locator('#build-section-' + section)).to_have_count(0)
    # Navigating through the sidebar opens the folded section.
    page.get_by_role('tab', name='매크로 & 키 배치', exact=True).click()
    expect(page.locator('#build-section-macro')).to_have_count(1)
    assert page.locator('#build-section-rotation').count() == 0
    assert not errors, errors
    browser.close()
print('PASS build section order: content under its own bar for 검성/살성, independent fold/unfold, sidebar opens the section')
