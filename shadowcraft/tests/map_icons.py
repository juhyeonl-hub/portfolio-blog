"""Official local icon assets, faction variants and failed-image interaction fallback."""
import os
from playwright.sync_api import sync_playwright,expect

# The map opens with markers the first time its tab is shown; press "open"/"show markers" only when they are offered.
def ensure_open(panel, label):
    opener = panel.get_by_role('button', name=label, exact=True)
    expect(opener.or_(panel.get_by_role('button', name='공식 지형 닫기', exact=True))).to_be_visible()
    if opener.is_visible(): opener.click()
def ensure_markers(panel):
    show = panel.get_by_role('button', name='마커 보기', exact=True)
    expect(show.or_(panel.get_by_role('button', name='마커 숨기기', exact=True))).to_be_visible()
    if show.is_visible(): show.click()
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for width in [1280,390]:
        page=browser.new_page(viewport={'width':width,'height':900})
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.route('**/api/public/shadowcraft/catalog?*',lambda r:r.fulfill(status=503,json={}))
        page.goto(URL)
        page.get_by_role('tab',name='지도 & 수집',exact=True).click()
        panel=page.get_by_role('region',name='공식 글로벌 지형 지도',exact=True)
        for region,faction in [('verteron','Light'),('altgard','Dark')]:
            panel.get_by_label('공식 지형 지역',exact=True).select_option(region)
            ensure_markers(panel)
            marker=panel.locator('[data-preview-marker="teleport"]').first
            expect(marker.locator('image')).to_have_attribute('href',f'/shadowcraft/maps/steam-25926599/icons/TeleportArtifact_{faction}_Engraved.png')
            href=marker.locator('image').get_attribute('href')
            assert page.evaluate('''async path=>{const img=new Image();img.src=path;await img.decode();return img.naturalWidth>0}''',href)
            marker.focus();marker.press('Enter')
            expect(panel.get_by_role('region',name='선택한 마커 정보',exact=True)).to_be_visible()
        page.screenshot(path=f'/tmp/a2bc-icons-{width}.png',full_page=True)
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        assert not errors,errors
        page.close()
    page=browser.new_page()
    page.route('**/icons/*.png',lambda r:r.abort())
    page.goto(URL)
    page.get_by_role('tab',name='지도 & 수집',exact=True).click()
    panel=page.get_by_role('region',name='공식 글로벌 지형 지도',exact=True)
    ensure_markers(panel)
    marker=panel.locator('[data-preview-marker="teleport"]').first
    expect(marker.locator('[data-icon-fallback]')).to_have_count(1)
    marker.focus();marker.press('Enter')
    expect(panel.get_by_role('region',name='선택한 마커 정보',exact=True)).to_be_visible()
    browser.close()
print('Official icons: decoded assets, faction variants, desktop/mobile, keyboard and failed-image fallback PASS')
