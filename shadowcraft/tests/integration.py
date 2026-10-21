import os
from urllib.parse import urlsplit
import json,re
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from _ui import open_section, pick_class, open_build, open_library, click_tab
ROOT=Path(__file__).resolve().parents[2]
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
keys=['assassin','gladiator','templar','ranger','elementalist','sorcerer','cleric','chanter']
names=['살성','검성','수호성','궁성','정령성','마도성','치유성','호법성']
passed=[]
def open_settings(page):
 open_section(page,'스킬 & 특화')
 page.locator('.planner-context').evaluate('(el)=>el.open=true')
 if page.locator('.point-entry input').count()==0:
  page.get_by_role('button',name='내 포인트 입력',exact=False).click()

with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 context=browser.new_context(accept_downloads=True)
 page=context.new_page(); errors=[]; requests=[]
 page.on('pageerror',lambda e: errors.append(str(e)))
 page.on('request',lambda r: requests.append((r.method,r.url,r.post_data)))
 # Test degraded upstream separately from deterministic successful profile fixtures.
 page.route('**/api/public/shadowcraft/catalog?*',lambda r:r.fulfill(status=503,json={'error':'offline'}))
 page.goto(URL,wait_until='domcontentloaded');click_tab(page,'빌드');page.wait_for_selector('.class-select')
 for key,name in zip(keys,names):
  pick_class(page,name)
  expect(page.locator('.breadcrumb span')).to_have_text(name)
  open_settings(page)
  field=page.locator('.point-entry input').nth(0);field.fill(str(100+keys.index(key)))
  page.wait_for_function("key => !!localStorage.getItem(key)",arg='shadowcraft-plan-v1' if key=='assassin' else 'shadowcraft-plan-v1:'+key)
  page.reload(wait_until='domcontentloaded');open_settings(page);expect(page.locator('.point-entry input').nth(0)).to_have_value(str(100+keys.index(key)))
 passed.append('8 classes: isolated edits, selected class and reload persistence during catalog failure')
 pick_class(page,'살성')
 open_settings(page)
 page.locator('.point-entry input').nth(0).fill('80');page.locator('.point-entry input').nth(1).fill('5');page.locator('.point-entry input').nth(2).fill('10')
 page.get_by_role('button',name='내 포인트로 추천 미리보기',exact=True).click()
 page.wait_for_selector('.recommend-preview')

 page.locator('.recommend-preview .button.primary').click()
 data=json.loads(page.evaluate("localStorage.getItem('shadowcraft-plan-v1')"));assert data['pointBudget']['sp']==80
 passed.append('budget preview and apply writes local plan')
 # Character successful selection, recent shortcut, and visible failure with plan preservation.
 def armory(route):
  body=json.loads(route.request.post_data); action=body['action']
  if action=='servers':route.fulfill(json={'servers':[{'serverId':1316,'serverName':'Test','raceId':1}]})
  elif action=='search':route.fulfill(json={'characters':[{'characterId':'abcde123','serverId':1316,'name':'검증캐릭터','level':45,'serverName':'Test','race':1}]})
  else:route.fulfill(json={'profile':{'characterName':'검증캐릭터','characterLevel':45,'serverName':'Test'},'nodes':[],'skills':[],'failedBoards':[],'region':'eu','equipment':[{'id':11001,'name':'검증용 단검','slotPos':1,'slotPosName':'MainHand','enchantLevel':12,'exceedLevel':2}]})
 page.route('**/api/public/shadowcraft/armory',armory)
 gear_before=json.loads(page.evaluate("localStorage.getItem('shadowcraft-plan-v1')")).get('gear')
 page.get_by_role('button',name='캐릭터 불러오기',exact=True).click()
 page.locator('.modal input[placeholder="정확한 이름을 입력하세요"]').fill('검증캐릭터')
 page.get_by_role('button',name='검색',exact=True).click();page.locator('.search-results button').first.click()
 expect(page.locator('.character-main h3')).to_contain_text('검증캐릭터')
 # The equipment panel opens by default; the grid is shown with a list fallback.
 expect(page.locator('.character-equipment > summary')).to_be_visible()
 expect(page.locator('.character-equipment')).to_contain_text('검증용 단검')
 expect(page.locator('.character-equipment')).to_contain_text('강화 +12 · 초월 +2')
 assert json.loads(page.evaluate("localStorage.getItem('shadowcraft-plan-v1')")).get('gear')==gear_before
 page.get_by_role('button',name=re.compile('캐릭터.*불러오기|다시 불러오기|캐릭터 변경')).first.click()

 page.locator('.recent-characters button').first.click()
 page.reload(wait_until='domcontentloaded');open_settings(page);expect(page.locator('.character-main h3')).to_contain_text('검증캐릭터')
 passed.append('fixture region/server lookup, search/profile, recent selection and character reload')
 # Add equipment through the UI before exporting the combined plan.
 open_section(page,'내 장비 & 성장')
 page.get_by_role('button',name='장비 등록',exact=True).click()
 page.locator('.gear-add input[maxlength="100"]').fill('이전 검증 장비')
 page.locator('.gear-add').get_by_role('button',name='등록',exact=True).click()
 expect(page.locator('.gear-item')).to_have_count(1)
 # Export/import preserves full plan, including character/search/budget/gear.
 open_build(page)  # 빌드 내보내기 lives in the build summary column
 with page.expect_download() as download:
  page.get_by_role('button',name='빌드 내보내기',exact=True).click()
 path=download.value.path(); exported=json.loads(Path(path).read_text());assert exported['schema']=='shadowcraft-v1';assert exported['plan']['gear']['items'][0]['name']=='이전 검증 장비'
 click_tab(page,'업데이트')
 page.locator('.sources-panel input[type=file]').set_input_files(str(path))
 expect(page.locator('.toast')).to_contain_text('불러왔습니다')
 assert json.loads(page.evaluate("localStorage.getItem('shadowcraft-plan-v1')"))==exported['plan']
 passed.append('JSON export/import roundtrip preserves character, search and budget')
 # Asset paths and compression are served under the planner namespace.
 for path,mime in [('ocr/worker.min.js','javascript'),('ocr/core/tesseract-core-lstm.wasm.js','javascript'),('ocr/lang/kor.traineddata.gz','')]:
  r=context.request.get(urlsplit(URL).scheme+'://'+urlsplit(URL).netloc+'/shadowcraft/'+path);assert r.ok,(path,r.status)
  if mime:assert mime in r.headers.get('content-type',''),r.headers
 passed.append('namespaced OCR worker, embedded WASM JS and gzip paths/MIME')
 page.set_viewport_size({'width':390,'height':844});page.reload(wait_until='domcontentloaded')
 click_tab(page,'빌드');page.wait_for_selector('.class-select');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 passed.append('390px mobile viewport has no document overflow')
 assert not errors,errors
 print(json.dumps({'passed':passed,'pageErrors':errors,'planNetworkCalls':[u for m,u,b in requests if '/api/plan' in u]},ensure_ascii=False,indent=2))
 browser.close()
