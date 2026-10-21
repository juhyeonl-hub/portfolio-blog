"""Each stable build URL displays one editor; switching sections preserves user changes."""
import os,re
from playwright.sync_api import sync_playwright,expect
from _ui import open_build,pick_class,click_tab
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5184/lab/shadowcraft/')
ORDER=['skills','daevanion','gear','macro','rotation']
PILLS=['스킬 & 특화','데바니온','내 장비 & 성장','매크로 & 키 배치','보스전 운영']
with sync_playwright() as p:
 browser=p.chromium.launch();page=browser.new_page(viewport={'width':1366,'height':900});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(URL);expect(page.locator('.home-start-grid')).to_be_visible();open_build(page)
 for cls in ['검성','살성']:
  pick_class(page,cls)
  expect(page.locator('.build-pills button')).to_have_text(['처음부터']+PILLS)
  for pill,section in zip(PILLS,ORDER):
   page.locator('.build-pills button').filter(has_text=re.compile('^'+re.escape(pill)+'$')).click()
   expect(page.locator('#build-section-'+section)).to_be_visible()
   for other in ORDER:
    if other!=section:expect(page.locator('#build-section-'+other)).to_be_hidden()
   expect(page.locator('.build-summary')).to_be_visible()
   assert page.url.endswith('/build/'+section),page.url
  page.get_by_label('캐릭터 레벨',exact=True).fill('30')
  page.locator('.build-pills button').filter(has_text=re.compile('^처음부터$')).click()
  expect(page.locator('.quick-build')).to_be_visible()
  page.locator('.point-extras summary').click()
  expect(page.get_by_label('간편 캐릭터 레벨',exact=True)).to_have_value('30')
 page.goto(URL+'#/build/gear');expect(page.locator('#build-section-gear')).to_be_visible()
 page.reload();expect(page.locator('#build-section-gear')).to_be_visible()
 expect(page.locator('#build-section-skills')).to_be_hidden()
 click_tab(page,'랭커');expect(page.get_by_role('region',name='랭커 빌드 분석',exact=True)).to_be_visible()
 expect(page.get_by_role('button',name='내 캐릭터 연결',exact=True)).to_be_visible()
 page.get_by_role('button',name='사이드바 접기',exact=True).click()
 page.reload();expect(page.locator('.sidebar')).to_have_class(re.compile(r'\bcollapsed\b'))
 assert not errors,errors
 browser.close()
print('PASS isolated editors: two classes, five sections, stable deep links, edit preservation, ranker connection and remembered sidebar')
