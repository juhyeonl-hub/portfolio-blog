"""Steam player count in the content timer bar: fetched on normal pages, validates responses, keeps the last value on failure."""
import json, os, re
from playwright.sync_api import sync_playwright, expect
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    requests=[]; errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    response={'appId':'3393110','scope':'steam-global-total','players':42,'checkedAt':'2026-10-16T10:00:00Z','stale':False}
    status=[200]
    def serve(route):
        requests.append(route.request.url)
        route.fulfill(status=status[0],content_type='application/json',body=json.dumps(response))
    page.route('**/api/public/shadowcraft/activity',serve)
    page.goto(os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/'))
    before=page.evaluate('JSON.stringify(localStorage)')
    panel=page.get_by_role('region',name='Steam 글로벌 접속 현황',exact=True)
    number=panel.locator('.steam-players')
    expect(number).to_have_text('42명'); expect(number).not_to_have_class(re.compile('steam-stale'))
    assert requests
    timestamp=panel.locator('.steam-time').inner_text()
    retry=panel.get_by_role('button',name='접속 현황 다시 확인')
    # Failure keeps the last value, tints it and explains in the tooltip; no sentence or live region appears in the bar.
    status[0]=502; retry.click()
    expect(number).to_have_class(re.compile('steam-stale')); expect(number).to_have_text('42명')
    assert panel.locator('.steam-time').inner_text()==timestamp
    assert panel.get_attribute('title'), 'tooltip explains the failure'
    assert panel.get_by_role('status').count()==0 and panel.get_by_role('alert').count()==0
    status[0]=200; response['appId']='invalid'; response['players']=999; retry.click()
    expect(number).to_have_class(re.compile('steam-stale')); expect(number).to_have_text('42명')
    response.update(appId='3393110',players=0,stale=True); retry.click()
    expect(number).to_have_text('0명'); expect(number).to_have_class(re.compile('steam-stale'))
    assert '최신 갱신을 확인하지 못한 이전 값입니다.' in (panel.get_attribute('title') or '')
    response.update(players=100,stale=False); retry.click()
    expect(number).to_have_text('100명'); expect(number).not_to_have_class(re.compile('steam-stale'))
    assert not panel.get_attribute('title')
    # Shared-build views do not fetch it.
    n=len(requests); page.goto(os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')+'#privacy'); page.wait_for_timeout(800)
    assert len(requests)==n, 'standalone views must not fetch the Steam count'
    page.goto(os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/'))
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    expect(panel.locator('.steam-label-short')).to_be_visible(); expect(panel.locator('.steam-time')).to_be_hidden()
    assert page.evaluate('JSON.stringify(localStorage)')==before
    assert not errors,errors
    browser.close()
print('Steam activity: timer-bar stat, success, failure/invalid response preservation, stale/zero, recovery, no fetch on standalone views, mobile and storage PASS')
