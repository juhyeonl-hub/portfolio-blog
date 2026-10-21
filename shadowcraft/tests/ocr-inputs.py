import os
from urllib.parse import urlsplit
import json,base64
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from _ui import open_section, pick_class, open_build, click_tab
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
fixture=Path(__file__).resolve().parents[1]/'fixtures/gear-tooltip-preprocessed.png'
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 context=browser.new_context(viewport={'width':1440,'height':1400},permissions=['clipboard-read','clipboard-write']); page=context.new_page(); errors=[]; writes=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:writes.append(r.url) if r.method in ['POST','PUT'] else None)
 page.route('**/api/**',lambda r:r.fulfill(status=503,json={'error':'offline'}))
 page.goto(URL,wait_until='domcontentloaded');click_tab(page,'빌드');page.wait_for_selector('.class-select')
 open_section(page,'내 장비 & 성장')
 # Real clipboard shortcut with a local PNG, rather than a synthetic paste event.
 encoded=base64.b64encode(fixture.read_bytes()).decode()
 page.evaluate("async b64=>{const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));await navigator.clipboard.write([new ClipboardItem({'image/png':new Blob([bytes],{type:'image/png'})})]);}",encoded)
 page.keyboard.press('Control+V');page.get_by_role('button',name='인식 중지',exact=True).wait_for(timeout=15000);page.get_by_role('button',name='인식 중지',exact=True).click()
 expect(page.get_by_role('status')).to_contain_text('인식을 중지했습니다')
 box=page.locator('.ocr-image');box.scroll_into_view_if_needed();r=box.bounding_box()
 # Keep the tall fixture's drag endpoints in the visible viewport below the pinned header.
 assert page.evaluate('(p)=>document.elementFromPoint(p.x,p.y)?.closest(".ocr-image")!==null',{'x':r['x']+r['width']*.1,'y':r['y']+r['height']*.1})
 page.mouse.move(r['x']+r['width']*.1,r['y']+r['height']*.1);page.mouse.down();page.mouse.move(r['x']+r['width']*.8,r['y']+r['height']*.8,steps=8);page.mouse.up()
 assert '70%' in page.locator('.ocr-selection').get_attribute('style'),page.locator('.ocr-selection').get_attribute('style')
 page.get_by_role('button',name='선택 영역 다시 읽기',exact=True).click();page.get_by_role('button',name='인식 중지',exact=True).click()
 data=page.evaluate_handle("b64=>{const dt=new DataTransfer();dt.items.add(new File([Uint8Array.from(atob(b64),c=>c.charCodeAt(0))],'gear.png',{type:'image/png'}));return dt}",encoded)
 page.locator('.ocr-panel').dispatch_event('drop',{'dataTransfer':data})
 page.get_by_role('button',name='인식 중지',exact=True).wait_for(timeout=15000);page.get_by_role('button',name='인식 중지',exact=True).click()
 page.get_by_role('button',name='클립보드 붙여넣기',exact=True).click();page.get_by_role('button',name='인식 중지',exact=True).wait_for(timeout=15000);page.get_by_role('button',name='인식 중지',exact=True).click()
 assert not writes,writes
 assert not errors,errors
 print(json.dumps({'passed':['real Ctrl+V image paste','clipboard button','pointer crop and rerun','file drop','cancel for each input','no image POST/PUT'],'errors':errors},ensure_ascii=False,indent=2))
 browser.close()
