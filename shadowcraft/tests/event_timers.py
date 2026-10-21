"""Server-scoped pinned timers: clock rollover, storage, fixed layout and errors."""
import os, json
from datetime import datetime, timezone
from playwright.sync_api import sync_playwright, expect
from _ui import open_section, pick_class, open_build, click_tab
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
with sync_playwright() as p:
 browser=p.chromium.launch()
 page=browser.new_page()
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('**/api/public/shadowcraft/catalog?*',lambda r:r.fulfill(status=503,json={}))
 page.route('**/api/public/shadowcraft/boss-timers?*',lambda r:r.fulfill(status=503,json={}))
 page.clock.install(time=datetime(2026,10,17,8,50,0,tzinfo=timezone.utc))
 page.goto(URL)
 header=page.get_by_role('region',name='고정 콘텐츠 타이머')
 # Before a server is chosen the bar is one line, not six 'not configured' cards.
 expect(header.locator('.event-timer-card')).to_have_count(0)
 expect(header).to_contain_text('서버를 고르면 보스·콘텐츠 출현 시간이 여기에 표시됩니다.')
 page.get_by_role('button',name='서버·타이머 설정',exact=True).click()
 page.get_by_label('타이머 서버',exact=True).select_option('1301')
 page.get_by_label('시간 기준 국가·지역',exact=True).select_option('Atlantic/Reykjavik')
 page.get_by_label('가르투아 시간표',exact=True).fill('25:00')
 page.get_by_role('button',name='시간표 저장',exact=True).click()
 expect(header.get_by_role('alert')).to_contain_text('HH:mm')
 assert page.evaluate("localStorage.getItem('a2bc-event-timers-v1')") is None
 page.get_by_label('가르투아 시간표',exact=True).fill('09:00,22:00')
 page.get_by_role('button',name='시간표 저장',exact=True).click()
 card=header.locator('.event-timer-card').filter(has_text='가르투아')
 expect(card).to_contain_text('등록 시간표')
 expect(header.locator('.event-timer-card').filter(has_text='라그타')).to_contain_text('조회 실패')
 page.clock.pause_at(datetime(2026,10,17,9,0,1,tzinfo=timezone.utc))
 page.clock.run_for(1000)
 expect(card.locator('strong')).to_have_text('12:59:58')
 page.get_by_role('tab',name='빌드',exact=True).click();page.get_by_role('tab',name='메인',exact=True).first.click()  # the timer bar shows on 메인 only
 expect(header).to_contain_text('Siel')
 before=page.evaluate("localStorage.getItem('a2bc-event-timers-v1')")
 page.reload()
 expect(card).to_contain_text('등록 시간표')
 assert page.evaluate("localStorage.getItem('a2bc-event-timers-v1')")==before
 page.get_by_role('button',name='서버·타이머 설정',exact=True).click()
 page.get_by_label('타이머 서버',exact=True).select_option('1302')
 expect(page.get_by_label('가르투아 시간표',exact=True)).to_have_value('')
 page.get_by_label('시간 기준 국가·지역',exact=True).select_option('Europe/Helsinki')
 page.get_by_label('가르투아 시간표',exact=True).fill('12:00')
 page.get_by_label('차원 콘텐츠',exact=True).select_option('rift')
 page.get_by_label('타르탄 고정',exact=True).uncheck()
 page.get_by_role('button',name='시간표 저장',exact=True).click()
 expect(header.locator('.event-timer-card')).to_have_count(5)
 expect(header.locator('.event-timer-card').filter(has_text='시공의 균열')).to_contain_text('서버 기준 · 참고 일정')
 stored=json.loads(page.evaluate("localStorage.getItem('a2bc-event-timers-v1')"))
 assert stored['profiles']['eu:1301']['times']['gartua']=='09:00,22:00'
 assert stored['profiles']['eu:1302']['times']['gartua']=='12:00'
 page.set_viewport_size({'width':390,'height':844})
 click_tab(page,'빌드');click_tab(page,'메인')  # the timer bar shows on 메인 only
 page.evaluate('window.scrollTo(0,document.body.scrollHeight)')
 assert abs(header.bounding_box()['y'])<=1
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 page.screenshot(path='/tmp/a2bc-event-timers-mobile.png',full_page=False)
 page.get_by_role('button',name='서버·타이머 설정',exact=True).click()
 page.evaluate("() => {Storage.prototype.setItem=()=>{throw new Error('저장 공간 부족')}}")
 page.get_by_role('button',name='시간표 저장',exact=True).click()
 expect(header.get_by_role('alert')).to_contain_text('저장 공간 부족')
 assert page.evaluate("localStorage.getItem('a2bc-event-timers-v1')")==json.dumps(stored,ensure_ascii=False,separators=(',',':'))
 assert not errors,errors
 print('PASS: 6 defaults, invalid input, rollover, class/reload persistence, server isolation, pin selection, missing schedules, sticky/mobile, storage failure')
 browser.close()
