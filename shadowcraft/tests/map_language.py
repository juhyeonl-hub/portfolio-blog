import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from _ui import click_tab
root=Path(__file__).resolve().parents[2];out=Path('/mnt/d/CodexData/Projects/ASBC/artifacts/map-usability-20261022')
url=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5184/lab/shadowcraft/')
names=json.loads((root/'frontend/shadowcraft/lib/data/map-names.json').read_text())['names']
with sync_playwright() as p:
 browser=p.chromium.launch();page=browser.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('**/api/public/shadowcraft/catalog?*',lambda route:route.fulfill(status=503,json={}))
 page.goto(url);page.get_by_text('내 서버에는 어떤 직업이 많을까요?',exact=True).wait_for(state='attached');click_tab(page,'지도 & 수집')
 panel=page.locator('.terrain-panel');canvas=panel.locator('.terrain-canvas');expect(canvas.locator('[data-preview-marker=teleport]')).to_have_count(61)
 panel.get_by_role('checkbox',name='채집물',exact=True).check();panel.get_by_label('찾을 채집물 · 후보 구역 색칠',exact=True).select_option('Orichalcum')
 panel.locator('.map-advanced > summary').click()
 first=panel.get_by_label('실험 위치 선택',exact=True).locator('option').nth(1).get_attribute('value');panel.get_by_label('실험 위치 선택',exact=True).select_option(first)
 panel.get_by_label('이 위치 확인 완료',exact=True).check()
 saved=page.evaluate('JSON.stringify(Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.startsWith("a2bc-map-progress-v1:"))))')
 panel.get_by_role('button',name='마커 정보 닫기',exact=True).click()
 for lang in ['en','ja','fi','ko']:
  page.locator('.asbc-language').select_option(lang)
  region=panel.locator(':scope > label select');expect(region.locator('option').first).to_have_text(names['Verteron'].get(lang,'Verteron'))
  # Both original and translated place names remain searchable.
  search=panel.locator('.terrain-search input');search.fill(names['Dawn Legion Base'].get(lang,'Dawn Legion Base'))
  expect(panel.locator('.terrain-search select').get_by_role('option',name=names['Dawn Legion Base'].get(lang,'Dawn Legion Base'),exact=True)).to_have_count(1)
  search.fill('Dawn Legion Base');expect(panel.locator('.terrain-search select').get_by_role('option',name=names['Dawn Legion Base'].get(lang,'Dawn Legion Base'),exact=True)).to_have_count(1);search.fill('')
  assert page.evaluate('JSON.stringify(Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.startsWith("a2bc-map-progress-v1:"))))')==saved
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  expect(canvas.locator('g[aria-label="'+names['Dawn Legion Base'].get(lang,'Dawn Legion Base')+'"]').first).to_be_attached()
 panel.get_by_role('button',name='확대·이동 초기화',exact=True).click()
 panel.locator('.map-advanced > summary').click()
 panel.screenshot(path=str(out/'map-controls-and-canvas-1440.png'))
 assert not errors,errors
 browser.close()
print('PASS Korean/English/Japanese/Finnish map names, localized and original search, unchanged completion keys and no overflow')
