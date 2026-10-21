"""Build page (clean UI): class dropdown, style switch, 추천 배분 적용 with undo, persistence, all eight classes, phone."""
import json, os
from playwright.sync_api import sync_playwright, expect
from _ui import pick_class, open_build
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
with sync_playwright() as p:
 browser=p.chromium.launch()
 page=browser.new_page()
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('**/api/public/shadowcraft/catalog?*',lambda r:r.fulfill(status=503,json={}))
 page.goto(URL)
 open_build(page)
 for key,name in zip(['assassin','gladiator','templar','ranger','elementalist','sorcerer','cleric','chanter'],['살성','검성','수호성','궁성','정령성','마도성','치유성','호법성']):
  pick_class(page,name)
  expect(page.locator('#build-section-rotation')).to_have_count(1)
  settings=page.get_by_role('region',name='빌드 설정',exact=True)
  expect(settings).to_be_visible()
  expect(page.locator('.class-select option:checked')).to_have_text(name)
  # All five sections render on the one page, in pill order, with the summary column.
  for section in ['skills','daevanion','gear','macro','rotation']:expect(page.locator('#build-section-'+section)).to_have_count(1)
  expect(page.locator('.build-pills button')).to_have_count(5)
  expect(page.locator('.build-summary')).to_be_visible()
  expect(page.locator('.skill-table')).to_have_count(1)
  storage='shadowcraft-plan-v1'+('' if key=='assassin' else ':'+key)
  # Style switch writes the mode at once (no preview step); 추천 배분 적용 replaces the plan with an undo.
  settings.get_by_role('button',name='공격형',exact=True).click()
  assert json.loads(page.evaluate('(key)=>localStorage.getItem(key)',storage))['mode']=='damage'
  before=page.evaluate('(key)=>localStorage.getItem(key)',storage)
  settings.get_by_role('button',name='추천 배분 적용',exact=True).click()
  expect(page.get_by_role('button',name='빌드 적용 전으로 되돌리기',exact=True)).to_be_visible()
  applied=page.evaluate('(key)=>localStorage.getItem(key)',storage)
  page.get_by_role('button',name='빌드 적용 전으로 되돌리기',exact=True).click()
  restored=page.evaluate('(key)=>localStorage.getItem(key)',storage)
  assert json.loads(restored)['base']==json.loads(before)['base'],'undo must restore the base investment'
  if applied!=before:assert json.loads(applied)['base']!=json.loads(restored)['base'] or json.loads(applied)['nodes']!=json.loads(restored)['nodes']
  # Level field and reload persistence.
  page.get_by_label('캐릭터 레벨',exact=True).fill('30')
  assert json.loads(page.evaluate('(key)=>localStorage.getItem(key)',storage))['level']==30
  page.reload()
  open_build(page)
  expect(page.locator('.class-select option:checked')).to_have_text(name)
  assert json.loads(page.evaluate('(key)=>localStorage.getItem(key)',storage))['level']==30
  page.get_by_label('캐릭터 레벨',exact=True).fill('45')
 # Section pills scroll to their anchor on the same page.
 page.locator('.build-pills button',has_text='데바니온').click()
 expect(page.locator('.build-pills button',has_text='데바니온')).to_have_class('active')
 page.wait_for_function("document.getElementById('build-daevanion').getBoundingClientRect().top < 200")
 page.set_viewport_size({'width':390,'height':844})
 expect(page.get_by_role('region',name='빌드 설정',exact=True)).to_be_visible()
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 page.screenshot(path='/tmp/a2bc-quick-build-mobile.png',full_page=True)
 assert not errors,errors
 print('PASS: 8 classes via dropdown, five sections + summary, style switch, apply/undo, level persistence, pills, mobile; no page errors')
 browser.close()
