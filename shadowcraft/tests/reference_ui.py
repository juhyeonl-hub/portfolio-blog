"""Responsive home shortcuts and map disclosure preserve the active workspace."""
import os
from playwright.sync_api import sync_playwright,expect
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
with sync_playwright() as p:
    browser=p.chromium.launch()
    for width in [1440,390]:
        page=browser.new_page(viewport={'width':width,'height':1000})
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.route('**/api/public/shadowcraft/catalog?*',lambda r:r.fulfill(status=503,json={}))
        page.goto(URL)
        expect(page.get_by_role('region',name='a2bc 메인',exact=True)).to_be_visible()
        expect(page.get_by_role('tab')).to_have_count(13)
        shortcuts=page.get_by_role('region',name='직업별 빌드 바로가기')
        expect(shortcuts.get_by_role('button')).to_have_count(8)
        for name in ['검성','수호성','궁성','살성','정령성','마도성','치유성','호법성']:
            shortcuts.get_by_role('button',name=name+' 빌드 시작',exact=True).click()
            expect(page.get_by_role('region',name='간편 빌드 선택')).to_be_visible()
            expect(page.locator('.class-picker button').filter(has_text=name)).to_have_attribute('aria-pressed','true')
            page.get_by_role('tab',name='메인',exact=True).click()
        page.screenshot(path=f'/tmp/a2bc-reference-ui-home-{width}.png')
        page.get_by_role('button',name='지도 열기',exact=True).click()
        panel=page.get_by_role('region',name='공식 글로벌 지형 지도',exact=True)
        panel.get_by_role('button',name='공식 Verteron 지형 열기',exact=True).click()
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
print('PASS desktop/mobile eight class shortcuts, all navigation, keyboard filter disclosure, zoom and stored-state preservation')
