import os
from urllib.parse import urlsplit
import json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from _ui import open_section, pick_class, open_build
ROOT=Path(__file__).resolve().parents[2]
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
def open_settings(page):
 open_section(page,'스킬 & 특화')
 page.locator('.planner-context summary').click()
 if page.locator('.point-entry input').count()==0:
  page.get_by_role('button',name='내 포인트 입력',exact=False).click()

with sync_playwright() as p:
 browser=p.chromium.launch(headless=True);ctx=browser.new_context();page=ctx.new_page();held=[];errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('**/api/public/shadowcraft/catalog?*',lambda r:held.append(r))
 page.goto(URL,wait_until='domcontentloaded');open_settings(page);page.wait_for_selector('.point-entry input');page.locator('.point-entry input').first.fill('77')
 assert held
 held[0].fulfill(json=json.loads((ROOT/'backend/src/main/resources/shadowcraft/assassin.json').read_text()))
 expect(page.locator('.point-entry input').first).to_have_value('77')
 page.close();page=ctx.new_page();page.route('**/api/**',lambda r:r.fulfill(status=503,json={'error':'offline'}));page.goto(URL,wait_until='domcontentloaded');open_settings(page)
 expect(page.locator('.point-entry input').first).to_have_value('77')
 page.get_by_role('tab',name='업데이트',exact=True).first.click()
 before=page.evaluate("localStorage.getItem('shadowcraft-plan-v1')")
 page.locator('.sources-panel input[type=file]').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':b'{"schema":"shadowcraft-v1","plan":{"level":45}}'})
 expect(page.locator('.toast')).to_contain_text('올바른 ASBC 빌드 파일이 아닙니다')
 assert page.evaluate("localStorage.getItem('shadowcraft-plan-v1')")==before
 # A failed profile/search cannot alter the user's previous plan.
 open_section(page,'스킬 & 특화')
 if not page.locator('.planner-context').evaluate('e=>e.open'):page.locator('.planner-context > summary').click()
 page.get_by_role('button',name='캐릭터 불러오기',exact=True).click();page.locator('.modal input[placeholder="정확한 이름을 입력하세요"]').fill('unavailable')
 current=json.loads(page.evaluate("localStorage.getItem('shadowcraft-plan-v1')"))
 page.get_by_role('button',name='검색',exact=True).click();expect(page.locator('.modal .notice')).to_contain_text('offline')
 assert json.loads(page.evaluate("localStorage.getItem('shadowcraft-plan-v1')"))==current
 ctx.close()
 blocked=browser.new_context();blocked.add_init_script("Storage.prototype.getItem=function(){throw new Error('blocked')};Storage.prototype.setItem=function(){throw new Error('blocked')}")
 b=blocked.new_page();b.route('**/api/**',lambda r:r.fulfill(status=503,json={'error':'offline'}));b.on('pageerror',lambda e:errors.append(str(e)))
 b.goto(URL,wait_until='domcontentloaded');open_settings(b);b.locator('.point-entry input').first.fill('55')
 expect(b.locator('.save-status')).to_contain_text('기기 저장 실패')
 expect(b.locator('.point-entry input').first).to_have_value('55')
 assert not errors,errors
 print(json.dumps({'passed':['late catalog does not overwrite edited budget','tab close and new tab restore','invalid import preserves stored bytes','failed character search preserves current plan','blocked browser storage shows failure and remains editable'],'errors':errors},ensure_ascii=False,indent=2))
 browser.close()
