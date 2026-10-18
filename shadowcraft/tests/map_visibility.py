"""Normal map opening, async close/retry, and independent gathering resource filters."""
import os
from playwright.sync_api import sync_playwright, expect

URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    page=browser.new_page(viewport={'width':390,'height':844})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.route('**/api/public/shadowcraft/catalog?*',lambda r:r.fulfill(status=503,json={}))
    pending=[]
    patterns=['**/spawn-preview.json*','**/assets/spawn-preview-*.js']
    for pattern in patterns:page.route(pattern,lambda route:pending.append(route))
    page.goto(URL)
    page.get_by_role('tab',name='지도 & 수집',exact=True).click()
    panel=page.get_by_role('region',name='공식 글로벌 지형 지도',exact=True)
    original=page.evaluate('JSON.stringify({...localStorage})')
    panel.get_by_role('button',name='공식 Verteron 지형 열기',exact=True).click()
    canvas=panel.get_by_role('group',name='Verteron 지형 이미지',exact=True)
    expect(canvas).to_be_visible()
    expect(panel.get_by_role('button',name='위치 자료 불러오는 중',exact=True)).to_be_visible()
    panel.get_by_role('button',name='공식 지형 닫기',exact=True).click()
    for _ in range(100):
        if pending: break
        page.wait_for_timeout(50)
    assert pending
    for pattern in patterns:page.unroute(pattern)
    for route in pending:route.continue_()
    expect(panel.get_by_role('button',name='마커 숨기기',exact=True)).to_be_visible()
    expect(canvas).to_have_count(0)  # Data arrival must not reopen a closed map.
    panel.get_by_role('button',name='공식 Verteron 지형 열기',exact=True).click()
    expect(canvas.locator('[data-preview-marker="teleport"]')).to_have_count(61)
    bounds=canvas.locator('[data-preview-marker="teleport"]').first.bounding_box()
    assert bounds['width']>=5, bounds
    panel.get_by_role('checkbox',name='채집물',exact=True).check()
    panel.locator('summary').filter(has_text='채집물 종류 선택').click()
    expect(panel.get_by_role('group',name='채집 자원별 표시').get_by_role('checkbox')).to_have_count(13)
    panel.get_by_role('button',name='채집물 전체 끄기',exact=True).click()
    expect(canvas.locator('[data-preview-marker="gather"]')).to_have_count(0)
    expect(canvas.locator('[data-preview-marker="teleport"]')).to_have_count(61)
    panel.get_by_role('checkbox',name='채집물 Ruby',exact=True).check()
    expect(canvas.locator('[data-preview-marker="gather"]')).to_have_count(196)
    assert canvas.locator('[data-preview-marker="gather"]').evaluate_all('(rows)=>rows.every(r=>r.getAttribute("aria-label")==="Ruby 후보 위치")')
    panel.get_by_role('checkbox',name='채집물 Sapphire',exact=True).check()
    expect(panel.get_by_text('검색 결과 449개',exact=False)).to_be_visible()
    panel.get_by_role('checkbox',name='채집물 Ruby',exact=True).uncheck()
    expect(canvas.locator('[data-preview-marker="gather"]')).to_have_count(192)
    panel.get_by_role('button',name='항목 전체 켜기',exact=True).click()
    expect(panel.get_by_role('checkbox',name='채집물 Ruby',exact=True)).to_be_checked()
    panel.get_by_label('공식 지형 지역',exact=True).select_option('altgard')
    panel.get_by_role('button',name='공식 Altgard 지형 열기',exact=True).click()
    expect(panel.locator('[data-preview-marker="teleport"]')).to_have_count(61)
    panel.get_by_role('checkbox',name='채집물',exact=True).check()
    panel.locator('summary').filter(has_text='채집물 종류 선택').click()
    expect(panel.get_by_role('checkbox',name='채집물 Ruby',exact=True)).to_be_checked()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    assert page.evaluate('JSON.stringify({...localStorage})')==original
    panel.get_by_role('button',name='마커 숨기기',exact=True).click()
    expect(panel.locator('[data-preview-marker]')).to_have_count(0)
    assert not errors,errors
    browser.close()
print('Map open auto-load, close during load, visible mobile markers, gathering resource combinations and storage preservation PASS')
