"""Synthetic transport acceptance; does NOT establish live game measurement accuracy."""
import os
from playwright.sync_api import sync_playwright, expect
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width':390,'height':844})
    requests = []; errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.route('**/api/public/shadowcraft/catalog?*', lambda r:r.fulfill(status=503,json={}))
    state = {'fail':False}
    def serve(route):
        requests.append(route.request.method)
        if route.request.method == 'OPTIONS':
            route.fulfill(status=204,headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'X-A2BC-Token','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Private-Network':'true'});return
        route.fulfill(status=200,headers={'Access-Control-Allow-Origin':'*'},json={'v':2} if state['fail'] else {'v':1,'target':'Synthetic test','mode':'bossTargets','timeMs':10000,'rows':[{'name':'<img src=x>','dps':123,'dmg':1234,'you':True}]})
    page.route('http://127.0.0.1:18732/**', serve)
    page.goto(os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5174/lab/shadowcraft/'))
    before = page.evaluate('JSON.stringify(localStorage)')
    page.get_by_role('tab',name='실측 DPS',exact=True).click()
    panel=page.get_by_role('region',name='실측 실시간 DPS',exact=True)
    expect(panel.get_by_role('status')).to_have_text('연결 대기')
    assert not requests
    panel.get_by_label('a2bc 로컬 연결키',exact=True).fill('synthetic-test-key')
    panel.get_by_role('button',name='연결',exact=True).click()
    expect(panel.get_by_role('status')).to_contain_text('수집기 연결됨')
    expect(panel.locator('tbody')).to_contain_text('123')
    expect(panel.locator('tbody img')).to_have_count(0)
    state['fail']=True
    expect(panel.get_by_role('status')).to_contain_text('갱신 중단',timeout=10000)
    expect(panel.locator('tbody')).to_contain_text('1,234')
    panel.get_by_role('button',name='연결 해제',exact=True).click()
    expect(panel.get_by_role('status')).to_contain_text('연결 해제')
    count=len(requests); page.wait_for_timeout(1500); assert len(requests)==count
    assert before==page.evaluate('JSON.stringify(localStorage)')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    assert not errors,errors
    browser.close()
print('DPS transport: opt-in, source values, stale/invalid, disconnect, escaping, mobile, storage PASS (synthetic only)')
