"""Country/city clock selection preserves old numeric-offset profiles."""
import json,os
from playwright.sync_api import sync_playwright,expect
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
legacy={'version':1,'region':'eu','server':'1301','profiles':{'eu:1301':{'offset':120,'dimension':'invasion','hidden':[],'times':{'gartua':'09:00'}}}}
with sync_playwright() as p:
 browser=p.chromium.launch();page=browser.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('**/api/public/shadowcraft/catalog?*',lambda r:r.fulfill(status=503,json={}))
 page.goto(URL)
 page.evaluate('(x)=>localStorage.setItem("a2bc-event-timers-v1",JSON.stringify(x))',legacy)
 page.reload()
 page.get_by_role('button',name='서버·타이머 설정',exact=True).click()
 clock=page.get_by_label('시간 기준 국가·지역',exact=True)
 expect(clock).to_have_value('legacy')
 expect(clock.locator('option:checked')).to_contain_text('기존 설정 유지')
 assert json.loads(page.evaluate('localStorage.getItem("a2bc-event-timers-v1")'))==legacy
 clock.select_option('Europe/Helsinki')
 page.get_by_role('button',name='시간표 저장',exact=True).click()
 profile=json.loads(page.evaluate('localStorage.getItem("a2bc-event-timers-v1")'))['profiles']['eu:1301']
 assert profile['timeZone']=='Europe/Helsinki' and profile['times']==legacy['profiles']['eu:1301']['times']
 page.reload()
 expect(page.locator('.event-timer-toolbar')).to_contain_text('핀란드 · 헬싱키')
 page.get_by_role('button',name='서버·타이머 설정',exact=True).click()
 expect(clock).to_have_value('Europe/Helsinki')
 clock.select_option('legacy')
 page.get_by_role('button',name='시간표 저장',exact=True).click()
 assert json.loads(page.evaluate('localStorage.getItem("a2bc-event-timers-v1")'))==legacy
 page.get_by_role('button',name='서버·타이머 설정',exact=True).click()
 clock.select_option('Asia/Seoul')
 page.get_by_role('button',name='시간표 저장',exact=True).click()
 expect(page.locator('.event-timer-toolbar')).to_contain_text('대한민국 · 서울')
 page.set_viewport_size({'width':390,'height':844})
 page.get_by_role('button',name='서버·타이머 설정',exact=True).click()
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 page.screenshot(path='/tmp/a2bc-timezone-mobile.png')
 assert not errors,errors
 print('PASS: legacy unchanged, country choice, reload, legacy restoration, schedule preservation, mobile')
 browser.close()
