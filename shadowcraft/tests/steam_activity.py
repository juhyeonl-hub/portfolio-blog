"""Steam activity is opt-in, validates responses and preserves last-known data."""
import json, os
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
    page.goto(os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5175/lab/shadowcraft/'))
    page.get_by_role('tab',name='Steam 접속 현황',exact=True).wait_for()
    assert not requests
    before=page.evaluate('JSON.stringify(localStorage)')
    page.get_by_role('tab',name='Steam 접속 현황',exact=True).click()
    panel=page.get_by_role('region',name='Steam 글로벌 접속 현황',exact=True)
    expect(panel.get_by_text('42명',exact=True)).to_be_visible()
    assert panel.bounding_box()['y'] > page.get_by_role('tablist').bounding_box()['y']
    timestamp=panel.get_by_text('마지막 확인:',exact=False).inner_text()
    status[0]=502
    panel.get_by_role('button',name='접속 현황 다시 확인').click()
    expect(panel.get_by_role('alert')).to_be_visible()
    expect(panel.get_by_text('42명',exact=True)).to_be_visible()
    assert panel.get_by_text('마지막 확인:',exact=False).inner_text()==timestamp
    status[0]=200; response['appId']='invalid';response['players']=999
    panel.get_by_role('button',name='접속 현황 다시 확인').click()
    expect(panel.get_by_role('alert')).to_be_visible()
    expect(panel.get_by_text('42명',exact=True)).to_be_visible()
    response.update(appId='3393110',players=0,stale=True)
    panel.get_by_role('button',name='접속 현황 다시 확인').click()
    expect(panel.get_by_text('0명',exact=True)).to_be_visible()
    expect(panel.get_by_text('최신 갱신을 확인하지 못한 이전 값입니다.',exact=True)).to_be_visible()
    response.update(players=100,stale=False)
    panel.get_by_role('button',name='접속 현황 다시 확인').click()
    expect(panel.get_by_text('100명',exact=True)).to_be_visible()
    expect(panel.get_by_role('alert')).to_have_count(0)
    expect(panel.get_by_text('최신 갱신을 확인하지 못한 이전 값입니다.',exact=True)).to_have_count(0)
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    assert page.evaluate('JSON.stringify(localStorage)')==before
    assert not errors,errors
    browser.close()
print('Steam activity: opt-in fetch, success, failure/invalid response preservation, stale/zero, recovery, mobile and storage PASS')
