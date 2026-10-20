"""Home navigation and same-map nearest teleport inspection without changing filters."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

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
DATA=json.loads((Path(__file__).resolve().parents[2]/'frontend/shadowcraft/lib/data/spawn-preview.json').read_text())
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for width in [1280,390]:
        page=browser.new_page(viewport={'width':width,'height':900})
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.route('**/api/public/shadowcraft/catalog?*',lambda r:r.fulfill(status=503,json={}))
        page.goto(URL)
        expect(page.get_by_role('region',name='ASBC',exact=True)).to_be_visible()
        expect(page.get_by_role('tablist')).to_have_count(1)
        expect(page.locator('.class-picker')).to_have_count(0)
        page.screenshot(path=f'/tmp/a2bc-clean-home-{width}.png')
        page.get_by_role('button',name='내 빌드 시작하기',exact=True).click()
        expect(page.get_by_role('region',name='간편 빌드 선택')).to_be_visible()
        open_menu(page);page.get_by_role('tab',name='메인',exact=True).click()
        page.get_by_role('button',name='지도 열기',exact=True).click()
        expect(page.locator('.class-picker')).to_have_count(0)
        expect(page.locator('.planner-context')).to_have_count(0)
        optional=page.locator('details.optional-panel')
        expect(optional).not_to_have_attribute('open','')
        optional.locator('summary').click()
        expect(page.get_by_label('지도 파일 가져오기',exact=True)).to_be_visible()
        optional.locator('summary').click()
        panel=page.get_by_role('region',name='공식 글로벌 지형 지도',exact=True)
        ensure_open(panel,'공식 Verteron 지형 열기')
        expect(panel.locator('[data-preview-marker="teleport"]')).to_have_count(61)
        if width>=1200:
            controls=panel.locator('.terrain-controls').bounding_box()
            stage=panel.locator('.terrain-stage').bounding_box()
            assert stage['x']>=controls['x']+controls['width']
        page.screenshot(path=f'/tmp/a2bc-clean-map-{width}.png')
        panel.get_by_role('button',name='항목 전체 끄기',exact=True).click()
        panel.get_by_role('checkbox',name='채집물',exact=True).check()
        marker=panel.locator('[data-preview-marker="gather"]').first
        label=marker.get_attribute('aria-label').removesuffix(' 후보 위치')
        marker.focus()
        marker.press('Enter')
        card=panel.get_by_role('region',name='선택한 마커 정보',exact=True)
        expect(card.get_by_role('heading',name=label,exact=True)).to_be_visible()
        chosen_id=panel.get_by_label('실험 위치 선택',exact=True).input_value()
        rows=DATA['maps'][0]['markers']
        target=next(r for r in rows if r['id']==chosen_id)
        nearest=sorted([r for r in rows if r['kind']=='teleport'],key=lambda r:((r['x']-target['x'])**2+(r['y']-target['y'])**2,r['id']))[:3]
        for index,row in enumerate(nearest):
            expect(card.get_by_role('button',name=f'{index+1}. {row["name"]}',exact=True)).to_be_visible()
        card.get_by_role('button',name=f'1. {nearest[0]["name"]}',exact=True).click()
        expect(panel.locator('[aria-label="가까운 이동 지점: '+nearest[0]['name']+'"]')).to_have_count(1)
        assert panel.get_by_label('실험 위치 선택',exact=True).input_value()==chosen_id
        expect(panel.get_by_role('checkbox',name='이동 지점',exact=True)).not_to_be_checked()
        card.get_by_role('button',name='후보 위치로 돌아가기',exact=True).click()
        expect(panel.locator('[aria-label^="가까운 이동 지점:"]')).to_have_count(0)
        card.get_by_role('button',name='마커 정보 닫기',exact=True).click()
        expect(card).to_have_count(0)
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        assert not errors,errors
        page.close()
    browser.close()
print('Home navigation, marker details, nearest teleport focus/return and mobile passed')
