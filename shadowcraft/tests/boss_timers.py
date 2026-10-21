"""Header live feed integration using controlled data; does not claim in-game accuracy."""
import os,time,json
from playwright.sync_api import sync_playwright,expect
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
with sync_playwright() as p:
 browser=p.chromium.launch()
 page=browser.new_page()
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 def feed(route):
  from urllib.parse import urlparse,parse_qs
  query=parse_qs(urlparse(route.request.url).query)
  sid=int(query['server'][0]);now=int(time.time()*1000)
  b={'id':101021,'state':'dead','reportedAt':now,'nextSpawn':now+3600000,'upSince':0,'confirmed':True}
  if sid==2301:b={**b,'id':111021,'state':'up','nextSpawn':0}
  route.fulfill(json={'server':sid,'region':'eu','serverNow':now,'fetchedAt':now,'refreshFailed':False,'enabled':True,'bosses':{'gartua':b,'lagta':{**b,'id':111022 if sid==2301 else 101024,'state':'dead','nextSpawn':now-1000}}})
 page.route('**/api/public/shadowcraft/boss-timers?*',feed)
 page.goto(URL)
 page.get_by_role('button',name='서버·타이머 설정',exact=True).click()
 page.get_by_label('타이머 서버',exact=True).select_option('1301')
 page.get_by_role('button',name='시간표 저장',exact=True).click()
 header=page.get_by_role('region',name='고정 콘텐츠 타이머')
 card=header.locator('.event-timer-card').filter(has_text='가르투아')
 expect(card).to_contain_text('A2Tools')
 expect(card.locator('strong')).to_have_text(__import__('re').compile(r'\d+:\d+:\d+'))
 expect(header.locator('.event-timer-card').filter(has_text='라그타')).to_contain_text('출현 예정 시각 경과')
 expect(header.locator('.event-timer-card').filter(has_text='타르탄')).to_contain_text('관측 기록 없음')
 page.get_by_role('button',name='서버·타이머 설정',exact=True).click()
 page.get_by_label('종족 선택').get_by_role('button',name='마족',exact=True).click()
 page.get_by_label('타이머 서버',exact=True).select_option('2301')
 page.get_by_role('button',name='시간표 저장',exact=True).click()
 expect(card).to_contain_text('생존 관측')
 before=page.evaluate("localStorage.getItem('a2bc-event-timers-v1')")
 page.reload();expect(card).to_contain_text('생존 관측')
 assert page.evaluate("localStorage.getItem('a2bc-event-timers-v1')")==before
 page.set_viewport_size({'width':390,'height':844})
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 page.unroute('**/api/public/shadowcraft/boss-timers?*')
 page.route('**/api/public/shadowcraft/boss-timers?*',lambda r:r.fulfill(status=503,json={}))
 page.reload();expect(card).to_contain_text('조회 실패')
 assert not errors,errors
 print('PASS live boss header: auto country, countdown, elapsed, absent, faction switch, reload, mobile, failure')
 browser.close()
