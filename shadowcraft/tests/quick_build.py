"""Build-first flow: nonmutating previews, all classes, undo and mobile."""
import json, os
from playwright.sync_api import sync_playwright, expect
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
with sync_playwright() as p:
 browser=p.chromium.launch()
 page=browser.new_page()
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('**/api/public/shadowcraft/catalog?*',lambda r:r.fulfill(status=503,json={}))
 page.goto(URL)
 page.get_by_role('tab',name='빌드 선택',exact=True).click()
 for key,name in zip(['assassin','gladiator','templar','ranger','elementalist','sorcerer','cleric','chanter'],['살성','검성','수호성','궁성','정령성','마도성','치유성','호법성']):
  page.locator('.class-picker button').filter(has_text=name).click()
  expect(page.get_by_role('region',name='간편 빌드 선택')).to_be_visible()
  # The skill editor shares the build page now; it is present but the quick picker stays on top.
  expect(page.locator('.skill-table')).to_have_count(1)
  storage='shadowcraft-plan-v1'+('' if key=='assassin' else ':'+key)
  before=page.evaluate('(key)=>localStorage.getItem(key)',storage)
  page.get_by_role('button',name='공격형',exact=False).filter(has_text='공격 관련').click()
  page.get_by_role('button',name='이 빌드 미리보기',exact=True).click()
  expect(page.locator('.quick-preview')).to_be_visible()
  assert page.evaluate('(key)=>localStorage.getItem(key)',storage)==before
  page.get_by_role('button',name='미리보기 취소',exact=True).click()
  assert page.evaluate('(key)=>localStorage.getItem(key)',storage)==before
  page.locator('.quick-build .point-extras summary').click()
  for field in ['sp','stigma','crystal','battle']:page.get_by_label('간편 '+field,exact=True).fill('0')
  page.get_by_role('button',name='이 빌드 미리보기',exact=True).click()
  page.get_by_role('button',name='이 빌드 적용',exact=True).click()
  saved=json.loads(page.evaluate('(key)=>localStorage.getItem(key)',storage))
  assert all(v==0 for v in saved['pointBudget'].values())
  page.locator('.quick-edit summary').click()
  page.get_by_role('button',name='데바니온 보드 편집',exact=True).click()
  expect(page.get_by_role('button',name='빌드 적용 전으로 되돌리기',exact=True)).to_be_visible()
  page.get_by_role('button',name='빌드 적용 전으로 되돌리기',exact=True).click()
  restored=json.loads(page.evaluate('(key)=>localStorage.getItem(key)',storage))
  if before:assert restored==json.loads(before)
  else:assert restored.get('pointBudget')!=saved['pointBudget']
  page.reload()
  page.get_by_role('tab',name='빌드 선택',exact=True).click()
  expect(page.get_by_role('region',name='간편 빌드 선택')).to_be_visible()
  assert json.loads(page.evaluate('(key)=>localStorage.getItem(key)',storage))==restored
 page.set_viewport_size({'width':390,'height':844})
 page.get_by_role('button',name='이 빌드 미리보기',exact=True).click()
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 page.screenshot(path='/tmp/a2bc-quick-build-mobile.png',full_page=True)
 assert not errors,errors
 print('PASS: 8 classes, preview/cancel preservation, zero budgets, cross-tab undo, reload, mobile; no page errors')
 browser.close()
