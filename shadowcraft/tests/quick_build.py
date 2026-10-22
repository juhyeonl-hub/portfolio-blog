"""Beginner flow: preview is read-only, explicit apply and undo, class isolation, persistence and mobile."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from _ui import pick_class, open_build
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5184/lab/shadowcraft/')
OUT=Path(os.environ.get('ASBC_EVIDENCE','/mnt/d/CodexData/Projects/ASBC/artifacts/beginner-ux-20261022'));OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch()
 page=browser.new_page(viewport={'width':1366,'height':900});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(URL)
 expect(page.locator('.home-start-grid')).to_be_visible()
 expect(page.locator('.home-start-grid>button')).to_have_count(3)
 assert page.locator('.home-start').bounding_box()['y']+page.locator('.home-start').bounding_box()['height']<=page.locator('.home-favorites').bounding_box()['y'],'home sections must not overlap'
 page.screenshot(path=str(OUT/'home-desktop.png'),full_page=True)
 page.get_by_role('button',name='내 캐릭터 세팅하기',exact=False).click()
 for key,name in zip(['assassin','gladiator','templar','ranger','elementalist','sorcerer','cleric','chanter'],['살성','검성','수호성','궁성','정령성','마도성','치유성','호법성']):
  pick_class(page,name)
  expect(page.locator('.quick-build')).to_be_visible()
  expect(page.locator('.build-layout')).to_have_count(0)
  expect(page.locator('.build-pills > button')).to_have_count(6)
  page.locator('.build-pills > button').filter(has_text='스킬 & 특화').click()
  page.get_by_label('캐릭터 레벨',exact=True).fill('29')
  page.locator('.build-pills > button').filter(has_text='처음부터').click()
  storage='shadowcraft-plan-v1'+('' if key=='assassin' else ':'+key)
  page.locator('.point-extras summary').click()
  page.get_by_label('간편 캐릭터 레벨',exact=True).fill('30')
  before=page.evaluate('(key)=>localStorage.getItem(key)',storage)
  page.get_by_role('button',name='이 빌드 미리보기',exact=True).click()
  expect(page.locator('.quick-preview')).to_be_visible()
  assert page.evaluate('(key)=>localStorage.getItem(key)',storage)==before,'preview must not write the plan'
  page.get_by_role('button',name='이 빌드 적용',exact=True).click()
  assert json.loads(page.evaluate('(key)=>localStorage.getItem(key)',storage))['level']==30
  page.get_by_role('button',name='빌드 적용 전으로 되돌리기',exact=True).click()
  restored=json.loads(page.evaluate('(key)=>localStorage.getItem(key)',storage))
  original=json.loads(before)
  for field in ['base','nodes','level','gear','mode']:assert restored.get(field)==original.get(field),(key,field)
 # Explicit application persists across reload and starts from the saved level.
 page.get_by_role('button',name='이 빌드 미리보기',exact=True).click()
 page.get_by_role('button',name='이 빌드 적용',exact=True).click()
 page.reload();expect(page.locator('.quick-build')).to_be_visible()
 page.locator('.point-extras summary').click()
 expect(page.get_by_label('간편 캐릭터 레벨',exact=True)).to_have_value('30')
 page.get_by_role('button',name='내 캐릭터 연결',exact=True).click()
 expect(page.get_by_role('dialog')).to_be_visible()
 page.get_by_role('button',name='닫기',exact=True).click()
 page.evaluate('window.scrollTo(0,0)')
 page.screenshot(path=str(OUT/'build-desktop.png'),full_page=True)
 for width in [390,320]:
  page.set_viewport_size({'width':width,'height':844})
  expect(page.locator('.quick-build')).to_be_visible()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),width
  page.evaluate('window.scrollTo(0,0)')
  page.screenshot(path=str(OUT/f'build-{width}.png'),full_page=True)
  page.goto(URL);expect(page.locator('.home-start-grid')).to_be_visible()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),width
  page.locator('.page-help summary').focus();page.keyboard.press('Enter')
  expect(page.locator('.page-help')).to_have_attribute('open','')
  page.screenshot(path=str(OUT/f'home-{width}.png'),full_page=True)
  open_build(page)
 page.get_by_role('button',name='공유 링크 · 보관함',exact=True).click()
 expect(page.get_by_text('저장한 빌드 가져오기',exact=True)).to_be_visible()
 with page.expect_download() as download:page.get_by_role('button',name='빌드 내보내기',exact=True).click()
 assert download.value.suggested_filename.endswith('.json')
 assert not errors,errors
 browser.close()
print('PASS beginner flow: 8 classes; preview does not mutate; apply/undo; reload; character dialog; keyboard help; 1366/390/320px; no page errors')
