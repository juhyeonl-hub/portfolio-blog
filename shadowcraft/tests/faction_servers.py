"""Faction-first server filtering for timers and planner character lookup."""
import json,os
from playwright.sync_api import sync_playwright,expect
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
with sync_playwright() as p:
 browser=p.chromium.launch()
 page=browser.new_page(); errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('**/api/public/shadowcraft/catalog?*',lambda r:r.fulfill(status=503,json={}))
 def armory(route):
  action=json.loads(route.request.post_data)['action']
  if action=='servers':route.fulfill(json={'servers':[{'serverId':1301,'serverName':'ElyosServer','raceId':1},{'serverId':2301,'serverName':'AsmodianServer','raceId':2}]})
  elif action=='search':route.fulfill(json={'characters':[{'characterId':'one','serverId':1301,'name':'천족결과','level':45,'serverName':'ElyosServer','race':1},{'characterId':'two','serverId':2301,'name':'마족결과','level':45,'serverName':'AsmodianServer','race':2}]})
  else:route.fulfill(status=503,json={})
 page.route('**/api/public/shadowcraft/armory',armory)
 page.goto(URL)
 page.get_by_role('button',name='서버·타이머 설정',exact=True).click()
 form=page.locator('#event-timer-settings')
 select=page.get_by_label('타이머 서버',exact=True)
 assert select.locator('option[value="1301"]').count()==1
 assert select.locator('option[value="2301"]').count()==0
 select.select_option('1301')
 form.get_by_role('button',name='마족',exact=True).click()
 expect(select).to_have_value('')
 assert select.locator('option[value="1301"]').count()==0
 select.select_option('2301')
 page.get_by_label('서버 시계',exact=True).select_option('0')
 page.get_by_role('button',name='시간표 저장',exact=True).click()
 page.reload()
 page.get_by_role('button',name='서버·타이머 설정',exact=True).click()
 expect(form.get_by_role('button',name='마족',exact=True)).to_have_attribute('aria-pressed','true')
 expect(select).to_have_value('2301')
 select.select_option('')
 expect(form.get_by_role('button',name='마족',exact=True)).to_have_attribute('aria-pressed','true')
 select.select_option('2301')
 form.get_by_label('글로벌 지역',exact=True).select_option('nae')
 expect(select).to_have_value('')
 assert select.locator('option[value="2101"]').count()==1
 assert select.locator('option[value="1101"]').count()==0
 form.get_by_role('button',name='취소',exact=True).click()
 page.locator('.sidebar .nav').filter(has_text='스킬 & 특화').click()
 page.locator('.planner-context summary').click()
 page.get_by_role('button',name='캐릭터 불러오기',exact=True).click()
 modal=page.get_by_role('dialog')
 expect(modal.locator('.server-status')).to_contain_text('선택 가능')
 character_server=page.get_by_label('캐릭터 서버',exact=True)
 character_server.select_option('1301')
 modal.get_by_role('button',name='마족',exact=True).click()
 expect(character_server).to_have_value('')
 assert character_server.locator('option[value="1301"]').count()==0
 expect(character_server.locator('option').first).to_have_text('마족 모든 서버')
 character_server.select_option('2301')
 character_server.select_option('')
 expect(modal.get_by_role('button',name='마족',exact=True)).to_have_attribute('aria-pressed','true')
 modal.get_by_placeholder('정확한 이름을 입력하세요').fill('결과')
 modal.get_by_role('button',name='검색',exact=True).click()
 expect(modal.locator('.search-results button')).to_have_count(1)
 expect(modal.locator('.search-results')).to_contain_text('마족결과')
 modal.get_by_role('button',name='천족',exact=True).click()
 expect(modal.locator('.search-results button')).to_have_count(0)
 modal.get_by_role('button',name='검색',exact=True).click()
 expect(modal.locator('.search-results')).to_contain_text('천족결과')
 expect(modal.locator('.search-results button')).to_have_count(1)
 page.set_viewport_size({'width':390,'height':844})
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 assert not errors,errors
 print('PASS: factions filter both server selectors; change clears server/results; saved faction restored; region switch; search result isolation; mobile')
 browser.close()
