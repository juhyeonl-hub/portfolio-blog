"""Nine map UX requests; verifies local data representation, not in-game spawn accuracy."""
import json,os,re
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from _ui import click_tab
root=Path(__file__).resolve().parents[2]
out=Path('/mnt/d/CodexData/Projects/ASBC/artifacts/map-usability-20261022')
url=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5184/lab/shadowcraft/')
data=json.loads((root/'frontend/shadowcraft/lib/data/spawn-preview.json').read_text())
with sync_playwright() as p:
 browser=p.chromium.launch()
 for width in [1920,390,320]:
  page=browser.new_page(viewport={'width':width,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('**/api/public/shadowcraft/catalog?*',lambda route:route.fulfill(status=503,json={}))
  page.goto(url);page.get_by_text('내 서버에는 어떤 직업이 많을까요?',exact=True).wait_for(state='attached');click_tab(page,'지도 & 수집')
  panel=page.locator('.terrain-panel')
  for slug,mapname in [('verteron','Verteron'),('altgard','Altgard')]:
   panel.get_by_label('공식 지형 지역',exact=True).select_option(slug)
   controls=panel.locator('.terrain-controls')
   if controls.get_attribute('open') is None:controls.locator(':scope > summary').click()
   expect(panel.get_by_role('button',name='마커 숨기기',exact=True)).to_be_visible()
   panel.locator('.map-advanced > summary').click()
   canvas=panel.locator('.terrain-canvas')
   panel.get_by_role('checkbox',name='봉인던전',exact=True).check();panel.get_by_role('checkbox',name='주둔지',exact=True).check()
   expect(canvas.locator('[data-preview-marker=sealed]')).to_have_count(61);expect(canvas.locator('[data-preview-marker=stronghold]')).to_have_count(15)
   panel.get_by_role('checkbox',name='채집물',exact=True).check()
   expect(canvas.locator('[data-preview-marker=sealed]')).to_have_count(61);expect(canvas.locator('[data-preview-marker=stronghold]')).to_have_count(15)
   expected=sum(r['kind'] in ['sealed','stronghold','gather','teleport'] for m in data['maps'] if m['name']==mapname for r in m['markers'])
   assert canvas.locator('[data-preview-marker]').evaluate_all('(els)=>els.reduce((n,e)=>n+Number(e.dataset.count),0)')==expected
   marker=canvas.locator('[data-preview-marker=sealed]').first;marker_id=marker.get_attribute('data-marker-id')
   before=canvas.get_attribute('viewBox');marker.focus();marker.press('Enter')
   assert canvas.get_attribute('viewBox')==before,'selection must not auto-zoom or remove other markers'
   expect(canvas.locator('[data-preview-marker=sealed]')).to_have_count(61)
   card=panel.get_by_role('region',name='선택한 마커 정보',exact=True);expect(card.get_by_label('이 위치 확인 완료',exact=True)).not_to_be_checked()
   assert marker.evaluate('(e)=>getComputedStyle(e).outlineStyle')=='none'
   card.get_by_label('이 위치 확인 완료',exact=True).check()
   expect(panel.locator('.map-legend-row').filter(has=page.get_by_role('checkbox',name='봉인던전',exact=True))).to_contain_text('1/61 · 1.64%')
   expect(canvas.locator('[data-marker-id="'+marker_id+'"]')).to_have_count(1)
   card.get_by_role('button',name='마커 정보 닫기',exact=True).click()
   resource=panel.get_by_label('찾을 채집물 · 후보 구역 색칠',exact=True)
   resource.select_option('Orichalcum');expect(canvas.locator('.gather-area rect').first).to_be_attached()
   expect(canvas.locator('[data-preview-marker=sealed]')).to_have_count(61);expect(canvas.locator('[data-preview-marker=stronghold]')).to_have_count(15)
   gather=next(r for m in data['maps'] if m['name']==mapname for r in m['markers'] if r['kind']=='gather' and r['name']=='Orichalcum')
   panel.get_by_label('실험 위치 선택',exact=True).select_option(gather['id'])
   card=panel.get_by_role('region',name='선택한 마커 정보',exact=True);expect(card.get_by_role('heading',name='오리하르콘',exact=True)).to_be_visible()
   card.get_by_label('이 위치 확인 완료',exact=True).check()
   gatherrow=panel.locator('.map-legend-row').filter(has=page.get_by_role('checkbox',name='채집물',exact=True));expect(gatherrow).to_contain_text('0.04%')
   card.get_by_role('button',name='마커 정보 닫기',exact=True).click()
   reset=panel.get_by_role('button',name='확대·이동 초기화',exact=True);reset.click();expect(canvas).to_have_attribute('viewBox','0 0 1000 1000');expect(reset).to_be_disabled()
   controls_box=controls.bounding_box();stage_box=panel.locator('.terrain-stage').bounding_box();assert stage_box['y']>=controls_box['y']+controls_box['height']-1
   box=canvas.bounding_box();assert abs(box['width']-box['height'])<2;assert abs(box['width']-stage_box['width'])<2
   assert controls.evaluate('(e)=>getComputedStyle(e).overflowY')=='visible'
   panel.get_by_role('button',name='지형 지도 확대',exact=True).click();canvas.scroll_into_view_if_needed();box=canvas.bounding_box()
   page.mouse.move(box['x']+box['width']*.8,box['y']+box['height']*.7);page.mouse.down();page.mouse.move(box['x']+box['width']*.9,box['y']+box['height']*.72,steps=8);page.mouse.up()
   assert page.evaluate('getSelection().toString()')==''
   reset.click();canvas.screenshot(path=str(out/f'{slug}-{width}.png'))
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   assert all(not re.search('[A-Za-z]',x) for x in canvas.locator(':scope > g[pointer-events=none] text').all_text_contents())
  assert not errors,errors
  page.close()
 browser.close()
print('PASS both factions × 1920/390/320: all layers represented, selection unchanged, completion counts and fractions, localized resource, shading, full-width square, upper controls, reset and no text selection')
