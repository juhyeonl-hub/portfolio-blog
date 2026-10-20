"""Full-width home, planner class entry and map disclosure preserve the active workspace."""
import os
from playwright.sync_api import sync_playwright,expect

# The map opens with markers the first time its tab is shown; press "open"/"show markers" only when they are offered.
def ensure_open(panel, label):
    # Wait for the automatic opening first; click only if the map stays closed (e.g. after the user closed it).
    try: expect(panel.get_by_role('button', name='공식 지형 닫기', exact=True)).to_be_visible(timeout=4000)
    except AssertionError: panel.get_by_role('button', name=label, exact=True).click()
def ensure_markers(panel):
    try: expect(panel.get_by_role('button', name='마커 숨기기', exact=True)).to_be_visible(timeout=4000)
    except AssertionError: panel.get_by_role('button', name='마커 보기', exact=True).click()

def open_menu(page):
    # On phones the tab strip is shown only on Home; other screens use the 메뉴 drawer.
    if page.locator('.mobile-menu').is_visible(): page.locator('.mobile-menu').click()
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
with sync_playwright() as p:
    browser=p.chromium.launch()
    for width in [1440,390]:
        page=browser.new_page(viewport={'width':width,'height':1000})
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.route('**/api/public/shadowcraft/catalog?*',lambda r:r.fulfill(status=503,json={}))
        page.goto(URL)
        expect(page.get_by_role('region',name='ASBC',exact=True)).to_be_visible()
        expect(page.get_by_role('tab')).to_have_count(13)
        expect(page.locator('.sidebar')).to_have_count(0)
        expect(page.get_by_role('heading',name='어떤 직업으로 시작할까요?')).to_have_count(0)
        assert page.locator('.shell > main').evaluate("el=>getComputedStyle(el).marginLeft")=='0px'
        stats=page.get_by_role('region',name='서버별 직업 분포')
        expect(stats.get_by_role('link',name='외부 통계 보기')).to_have_attribute('href','https://aion2tierlist.com/population')
        page.get_by_role('button',name='내 빌드 시작하기').click()
        expect(page.get_by_role('heading',name='어떤 직업으로 시작할까요?')).to_be_visible()
        expect(page.locator('.class-picker button')).to_have_count(8)
        for name in ['검성','수호성','궁성','살성','정령성','마도성','치유성','호법성']:
            page.locator('.class-picker button').filter(has_text=name).click()
            expect(page.get_by_role('region',name='간편 빌드 선택')).to_be_visible()
            expect(page.locator('.class-picker button').filter(has_text=name)).to_have_attribute('aria-pressed','true')
        open_menu(page);page.get_by_role('tab',name='메인',exact=True).click()
        expect(page.locator('.sidebar')).to_have_count(0)
        page.screenshot(path=f'/tmp/a2bc-reference-ui-home-{width}.png')
        page.get_by_role('button',name='지도 열기',exact=True).click()
        panel=page.get_by_role('region',name='공식 글로벌 지형 지도',exact=True)
        ensure_open(panel,'공식 Verteron 지형 열기')
        expect(panel.locator('[data-preview-marker="teleport"]')).to_have_count(61)
        before=page.evaluate('JSON.stringify({...localStorage})')
        filters=panel.locator('details.terrain-controls')
        filters.locator(':scope > summary').click()
        expect(panel.get_by_role('checkbox',name='이동 지점',exact=True)).not_to_be_visible()
        panel.get_by_role('button',name='지형 지도 확대',exact=True).click()
        expect(filters).not_to_have_attribute('open','')
        expect(panel.get_by_role('group',name='Verteron 지형 이미지',exact=True)).to_be_visible()
        filters.locator(':scope > summary').press('Enter')
        expect(panel.get_by_role('checkbox',name='이동 지점',exact=True)).to_be_checked()
        assert page.evaluate('JSON.stringify({...localStorage})')==before
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        assert not errors,errors
        page.screenshot(path=f'/tmp/a2bc-reference-ui-map-{width}.png')
        page.close()
    browser.close()
print('PASS desktop/mobile full-width home, eight planner classes, external statistics entry, navigation, map filters and storage preservation')
