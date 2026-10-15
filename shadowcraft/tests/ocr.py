import os
from urllib.parse import urlsplit
import json,base64
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
fixture=Path(__file__).resolve().parents[1]/'fixtures/gear-tooltip-preprocessed.png'
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 context=browser.new_context(permissions=['clipboard-read','clipboard-write'])
 page=context.new_page();errors=[];posts=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:posts.append((r.method,r.url,len(r.post_data_buffer or b''))) if r.method in ['POST','PUT'] else None)
 page.route('**/api/**',lambda r:r.fulfill(status=503,json={'error':'offline'}))
 page.goto(URL,wait_until='domcontentloaded');page.wait_for_selector('.class-picker button')
 page.locator('.sidebar .nav').filter(has_text='내 장비 & 성장').click()

 page.locator('input[type=file][accept*="image"]').set_input_files(str(fixture))
 page.get_by_role('button',name='인식 중지',exact=True).wait_for(timeout=15000);page.get_by_role('button',name='인식 중지',exact=True).click()
 expect(page.get_by_role('status')).to_contain_text('인식을 중지했습니다')
 # Prepared fixture already has a white background; disable negative correction.
 page.get_by_label('어두운 게임 화면 보정').uncheck()
 page.get_by_role('button',name='선택 영역 다시 읽기',exact=True).click()
 page.get_by_text('인식 완료 · 원본과 비교해서 수정해 주세요.',exact=True).wait_for(timeout=110000)

 assert page.get_by_role('button',name='확인한 장비 등록',exact=True).is_disabled()
 # Correct uncertain OCR candidates explicitly, as the UI requires.
 page.locator('.ocr-review input[maxlength="100"]').fill('브라우저 OCR 검증 장비')
 if not page.locator('.ocr-bonus').count():page.get_by_role('button',name='보너스 추가',exact=True).click()
 while page.locator('.ocr-bonus').count()>1:page.get_by_role('button',name='인식한 보너스 삭제',exact=True).last.click()
 page.get_by_label('인식한 스킬 1',exact=True).select_option('13130000')
 page.get_by_label('인식한 추가 레벨 1',exact=True).fill('1')
 page.get_by_label('이름·장착 위치·스킬 보너스를 원본과 확인했습니다.',exact=True).check()
 page.get_by_role('button',name='확인한 장비 등록',exact=True).click()
 expect(page.locator('.gear-item')).to_have_count(1)
 gear=json.loads(page.evaluate("localStorage.getItem('shadowcraft-plan-v1')"))['gear']['items'][0]
 assert gear['bonuses']=={'13130000':1} and not gear['current'] and not gear['target'],gear
 page.reload(wait_until='domcontentloaded');page.locator('.sidebar .nav').filter(has_text='내 장비 & 성장').click()
 expect(page.locator('.gear-item input[maxlength="100"]')).to_have_value('브라우저 OCR 검증 장비')
 assert not posts,posts
 print(json.dumps({'passed':['real browser OCR worker and Korean/English model','file input','cancel','OCR rerun','manual correction and required review','non-equipped item registration and reload','no POST/PUT image uploads'],'errors':errors,'postRequests':posts},ensure_ascii=False,indent=2),flush=True)
 assert not errors,errors
 browser.close()
