"""Mobile task selection, reachable navigation, focus restoration, map filters and input sizing."""
import os,re
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5184/lab/shadowcraft/')
OUT=Path('/mnt/d/CodexData/Projects/ASBC/artifacts/mobile-usability-20261022');OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch()
 for width in [390,320]:
  page=browser.new_page(viewport={'width':width,'height':844},is_mobile=True,has_touch=True);errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(URL);expect(page.locator('.home-start-grid')).to_be_visible()
  page.locator('.home-start-grid>button').first.tap()
  chooser=page.get_by_label('빌드에서 할 일',exact=True)
  expect(chooser).to_be_visible();expect(chooser.locator('option')).to_have_count(6)
  for section in ['skills','daevanion','gear','macro','rotation']:
   chooser.select_option(section)
   expect(page.locator('#build-section-'+section)).to_be_visible()
   page.get_by_role('button',name='전체 메뉴',exact=True).scroll_into_view_if_needed()
   position=page.evaluate('scrollY')
   page.get_by_role('button',name='전체 메뉴',exact=True).tap()
   expect(page.get_by_role('dialog',name='주 메뉴')).to_be_visible()
   page.get_by_role('button',name='메뉴 닫기',exact=True).tap()
   expect(page.get_by_role('button',name='전체 메뉴',exact=True)).to_be_focused()
   assert abs(page.evaluate('scrollY')-position)<3,'closing menu must not jump to page top'
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  chooser.select_option('gear')
  expect(page.locator('#build-section-gear')).to_contain_text('이미지 선택을 눌러')
  with page.expect_file_chooser():page.get_by_role('button',name='이미지 선택',exact=True).tap()
  page.screenshot(path=str(OUT/f'after-gear-{width}.png'))
  chooser.select_option('quick')
  page.get_by_role('button',name='내 캐릭터 연결',exact=True).tap()
  expect(page.get_by_role('dialog')).to_be_visible()
  for field in page.get_by_role('dialog').locator('input:not([type=checkbox]),select').all():
   assert field.evaluate('el=>parseFloat(getComputedStyle(el).fontSize)')>=16
  page.set_viewport_size({'width':width,'height':500})
  page.get_by_role('button',name='닫기',exact=True).tap()
  page.set_viewport_size({'width':width,'height':844})
  page.get_by_role('button',name='전체 메뉴',exact=True).tap()
  page.get_by_role('tab',name='지도 & 수집',exact=True).tap()
  controls=page.locator('.terrain-controls')
  expect(controls).to_be_visible();expect(controls).not_to_have_attribute('open','')
  controls.locator('summary').tap();expect(controls).to_have_attribute('open','')
  controls.locator('summary').tap();expect(controls).not_to_have_attribute('open','')
  canvas=page.locator('.terrain-canvas')
  if not canvas.is_visible():page.get_by_role('button',name=re.compile('공식 .* 지형 열기')).tap()
  expect(canvas).to_be_visible()
  page.get_by_role('button',name='지형 지도 확대',exact=True).tap()
  expect(page.locator('.terrain-stage > .map-toolbar')).to_contain_text('2배')
  expect(page.locator('.map-help').filter(has_text='손가락')).to_be_visible()
  page.screenshot(path=str(OUT/f'after-map-{width}.png'))
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  assert not errors,errors
  page.goto(URL+'#/rankers')
  panel=page.get_by_role('region',name='랭커 빌드 분석',exact=True)
  panel.locator('.ranker-list button').first.tap()
  page.get_by_role('button',name='내 캐릭터 연결하고 비교',exact=True).tap()
  expect(page.get_by_role('dialog')).to_be_visible()
  page.get_by_role('button',name='닫기',exact=True).tap()
  expect(panel).to_be_visible()
  page.close()
 browser.close()
print('PASS mobile 390/320: all editors reachable, menu close restores focus without scroll jump, file chooser, 16px modal fields, short viewport close, collapsed map filters and zoom')
