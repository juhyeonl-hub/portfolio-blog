"""Build page (clean UI): the five sections render in pill order under their anchors for assassin and another
class, pills scroll to the section and mark it active, the sidebar/menu reach 빌드 and 랭커, and the sidebar collapses
to an icon rail that is remembered."""
import os, re
from playwright.sync_api import sync_playwright, expect
from _ui import open_build, pick_class, click_tab

URL = os.environ.get('SHADOWCRAFT_TEST_URL', 'http://127.0.0.1:5173/lab/shadowcraft/')
ORDER = ['skills', 'daevanion', 'gear', 'macro', 'rotation']
PILLS = ['스킬 & 특화', '데바니온', '내 장비 & 성장', '매크로 & 키 배치', '보스전 운영']

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1366, 'height': 900}); errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.route('**/api/public/shadowcraft/armory', lambda r: r.fulfill(status=503, json={'error': 'x'}))
    page.goto(URL)
    open_build(page)
    for cls in ['검성', '살성']:
        pick_class(page, cls)
        expect(page.locator('#build-section-rotation')).to_have_count(1)
        ids = page.evaluate("[...document.querySelectorAll('[id^=\"build-\"]')].map(e => e.id)")
        expected = [x for s in ORDER for x in ('build-' + s, 'build-section-' + s)]
        assert [i for i in ids if i in expected] == expected, (cls, ids)
        expect(page.locator('.build-pills button')).to_have_text(PILLS)
    for pill, section in zip(PILLS, ORDER):
        page.locator('.build-pills button', has_text=pill).click()
        expect(page.locator('.build-pills button', has_text=pill)).to_have_class('active')
        page.wait_for_function("id => document.getElementById(id).getBoundingClientRect().top < 220", arg='build-' + section)
    # Menus: only the main screens; 랭커 is its own page.
    sidebar = page.locator('.sidebar')
    expect(sidebar.get_by_role('tab')).to_have_text(['메인', '빌드', '랭커', '공개 빌드', '지도 & 수집', '글로벌 데이터', '업데이트'])
    click_tab(sidebar,'랭커')
    expect(page.get_by_role('region', name='랭커 빌드 분석', exact=True)).to_be_visible()
    assert page.locator('#build-section-skills').count() == 0
    # Collapsible sidebar, remembered across reloads.
    page.get_by_role('button', name='사이드바 접기', exact=True).click()
    expect(sidebar).to_have_class(re.compile(r'\bcollapsed\b'))
    assert page.evaluate("localStorage.getItem('asbc-nav-collapsed')") == '1'
    assert page.locator('.sidebar').evaluate('el => el.getBoundingClientRect().width') < 100
    page.reload()
    open_build(page)
    expect(page.locator('.sidebar')).to_have_class(re.compile(r'\bcollapsed\b'))
    page.get_by_role('button', name='사이드바 펼치기', exact=True).click()
    assert page.locator('.sidebar').evaluate('el => el.getBoundingClientRect().width') > 150
    assert not errors, errors
    browser.close()
print('PASS build sections: pill order for 검성/살성, pills scroll + active, main-screen menus, 랭커 page, collapsible sidebar remembered')
