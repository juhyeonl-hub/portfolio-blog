"""Official candidate map interactions; does not validate real-world placement."""
import os
from playwright.sync_api import sync_playwright, expect
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    page=browser.new_page(viewport={'width':390,'height':844})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.route('**/api/public/shadowcraft/catalog?*',lambda r:r.fulfill(status=503,json={}))
    def open_map(name='altgard'):
        page.goto(URL)
        page.get_by_role('tab',name='지도 & 수집',exact=True).click()
        panel=page.get_by_role('region',name='공식 글로벌 지형 지도',exact=True)
        panel.get_by_label('공식 지형 지역',exact=True).select_option(name)
        panel.get_by_role('button',name='실험 위치 보기',exact=True).click()
        expect(panel.get_by_role('button',name='실험 위치 숨기기',exact=True)).to_be_visible()
        return panel
    panel=open_map()
    panel.get_by_role('button',name='항목 전체 끄기',exact=True).click()
    panel.get_by_role('checkbox',name='NPC',exact=True).check()
    choices=panel.get_by_label('실험 위치 선택',exact=True)
    first=choices.locator('option').nth(1).get_attribute('value')
    panel.get_by_role('button',name='위치 다음 페이지',exact=True).click()
    assert choices.locator('option').nth(1).get_attribute('value')!=first
    choices.select_option(choices.locator('option').nth(1).get_attribute('value'))
    expect(panel.get_by_label('이 위치 확인 완료',exact=True)).not_to_be_checked()
    panel.get_by_label('이 위치 확인 완료',exact=True).check()
    expect(panel.get_by_label('이 위치 확인 완료',exact=True)).to_be_checked()
    keys=page.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('a2bc-map-progress-v1:'))")
    assert len(keys)==1
    key=keys[0];saved=page.evaluate('(k)=>localStorage.getItem(k)',key)
    assert len(__import__('json').loads(saved)['completed'])==1
    panel.get_by_label('확인한 위치 숨기기',exact=True).check()
    expect(panel.get_by_label('이 위치 확인 완료',exact=True)).to_have_count(0)
    panel.get_by_label('확인한 위치 숨기기',exact=True).uncheck()
    expect(panel.get_by_label('이 위치 확인 완료',exact=True)).to_be_checked()
    panel.get_by_role('button',name='항목 전체 끄기',exact=True).click()
    panel.get_by_role('checkbox',name='네임드 몬스터',exact=True).check()
    panel.get_by_role('button',name='지형 전체 보기',exact=True).click()
    marker=panel.locator('[data-preview-marker="named"]').first
    marker.focus();page.keyboard.press('Enter')
    expect(panel.get_by_label('이 위치 확인 완료',exact=True)).to_be_visible()
    expect(marker).to_have_attribute('aria-pressed','true')
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    panel=open_map('verteron')
    expect(panel.get_by_text('확인 기록 0개',exact=False)).to_be_visible()
    panel=open_map()
    expect(panel.get_by_text('확인 기록 1개',exact=False)).to_be_visible()
    assert page.evaluate('(k)=>localStorage.getItem(k)',key)==saved
    for slug,count in [('poeta',55),('ishalgen',70),('reshanta-lower',548),('reshanta-middle',196)]:
        panel=open_map(slug)
        panel.get_by_role('button',name='항목 전체 켜기',exact=True).click()
        expect(panel.locator('[data-preview-marker]')).to_have_count(min(400,count))
        choices=panel.get_by_label('실험 위치 선택',exact=True)
        choices.select_option(choices.locator('option').nth(1).get_attribute('value'))
        expect(panel.get_by_label('이 위치 확인 완료',exact=True)).to_be_visible()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    panel=open_map()
    # Corrupt records are preserved, not silently overwritten by a checkbox.
    page.evaluate('(k)=>localStorage.setItem(k,"broken")',key)
    panel=open_map()
    expect(panel.get_by_role('alert').filter(has_text='기록을 읽지 못했습니다')).to_be_visible()
    choices=panel.get_by_label('실험 위치 선택',exact=True)
    choices.select_option(choices.locator('option').nth(1).get_attribute('value'))
    panel.get_by_label('이 위치 확인 완료',exact=True).check()
    assert page.evaluate('(k)=>localStorage.getItem(k)',key)=='broken'
    page.evaluate('({key,saved})=>localStorage.setItem(key,saved)',{'key':key,'saved':saved})
    panel=open_map()
    page.evaluate("""()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('a2bc-map-progress-v1:'))throw new DOMException('Quota','QuotaExceededError');return original.call(this,k,v)}}""")
    choices=panel.get_by_label('실험 위치 선택',exact=True)
    choices.select_option(choices.locator('option').nth(1).get_attribute('value'))
    panel.get_by_label('이 위치 확인 완료',exact=True).check()
    expect(panel.get_by_role('alert').filter(has_text='기록을 저장하지 못했습니다')).to_be_visible()
    assert page.evaluate('(k)=>localStorage.getItem(k)',key)==saved
    assert not errors,errors
    browser.close()
print('Official map: pagination, keyboard marker selection, mobile, persistence, isolation, corrupt/quota preservation PASS')
