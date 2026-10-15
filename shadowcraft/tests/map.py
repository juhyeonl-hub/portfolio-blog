"""Synthetic map acceptance. Requires local Vite and Python Playwright/Chromium."""
import json
import os
from playwright.sync_api import sync_playwright, expect

fixture = {'schema': 'a2bc-map-v1', 'region': 'global', 'coordinates': 'normalized-top-left',
           'id': 'synthetic-map', 'name': 'Test map', 'version': 'Synthetic test',
           'categories': [{'id': 'ore', 'name': 'Test resources'}, {'id': 'boss', 'name': 'Test bosses'}],
           'markers': [{'id': 'ore-a', 'name': 'Test ore', 'categoryId': 'ore', 'x': 0.2, 'y': 0.3},
                       {'id': 'boss-a', 'name': 'Test boss', 'categoryId': 'boss', 'x': 0.8, 'y': 0.6}]}
url = os.environ.get('SHADOWCRAFT_TEST_URL', 'http://127.0.0.1:5173/lab/shadowcraft/')

def upload(panel, data):
    panel.get_by_label('지도 파일 가져오기', exact=True).set_input_files(
        {'name': 'synthetic-map.json', 'mimeType': 'application/json', 'buffer': json.dumps(data).encode()})

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    errors, posts = [], []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('request', lambda request: posts.append(request.url) if request.method == 'POST' else None)
    page.route('**/api/public/shadowcraft/catalog?*', lambda route: route.fulfill(status=503, json={}))
    page.goto(url)
    page.get_by_role('tab', name='지도 & 수집', exact=True).click()
    panel = page.get_by_role('region', name='지도 탐색', exact=True)
    expect(panel.get_by_text('표시할 지도가 없습니다', exact=True)).to_be_visible()
    before = page.evaluate("Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.startsWith('shadowcraft-plan-')))")
    upload(panel, fixture)
    expect(panel.get_by_text('전체 완료 0 / 2 · 현재 표시 2개', exact=True)).to_be_visible()
    canvas = panel.get_by_role('group', name='지도 좌표 영역', exact=True)
    panel.get_by_role('button', name='지도 확대', exact=True).click()
    expect(canvas).to_have_attribute('viewBox', '250 250 500 500')
    canvas.focus()
    page.keyboard.press('ArrowRight')
    expect(canvas).to_have_attribute('viewBox', '300 250 500 500')
    box = canvas.bounding_box()
    page.mouse.move(box['x'] + box['width'] * 0.5, box['y'] + box['height'] * 0.5)
    page.mouse.down()
    page.mouse.move(box['x'] + box['width'] * 0.6, box['y'] + box['height'] * 0.5)
    page.mouse.up()
    assert float(canvas.get_attribute('viewBox').split()[0]) < 300
    panel.get_by_role('button', name='전체 보기', exact=True).click()
    panel.get_by_label('Test bosses', exact=True).uncheck()
    expect(canvas.locator('circle')).to_have_count(1)
    panel.get_by_label('위치 검색', exact=True).fill('missing')
    expect(canvas.locator('circle')).to_have_count(0)
    panel.get_by_label('위치 검색', exact=True).fill('ORE')
    canvas.get_by_role('button', name='Test ore', exact=True).focus()
    page.keyboard.press('Enter')
    panel.get_by_label('이 위치 완료', exact=True).check()
    expect(panel.get_by_text('전체 완료 1 / 2 · 현재 표시 1개', exact=True)).to_be_visible()
    panel.get_by_label('완료한 위치 숨기기', exact=True).check()
    expect(canvas.locator('circle')).to_have_count(0)
    panel.get_by_label('완료한 위치 숨기기', exact=True).uncheck()
    key = page.evaluate("Object.keys(localStorage).find(k => k.startsWith('a2bc-map-progress-v1:'))")
    saved = page.evaluate('(key) => localStorage.getItem(key)', key)
    upload(panel, {**fixture, 'region': 'kr'})
    expect(panel.get_by_role('alert')).to_be_visible()
    assert page.evaluate('(key) => localStorage.getItem(key)', key) == saved
    page.reload()
    page.get_by_role('tab', name='지도 & 수집', exact=True).click()
    upload(panel, fixture)
    expect(panel.get_by_text('전체 완료 1 / 2 · 현재 표시 2개', exact=True)).to_be_visible()
    upload(panel, {**fixture, 'version': 'Other version'})
    expect(panel.get_by_text('전체 완료 0 / 2 · 현재 표시 2개', exact=True)).to_be_visible()
    upload(panel, fixture)
    expect(panel.get_by_text('전체 완료 1 / 2 · 현재 표시 2개', exact=True)).to_be_visible()
    page.evaluate('(key) => localStorage.setItem(key, "{broken")', key)
    upload(panel, fixture)
    expect(panel.get_by_text('저장된 진행도를 읽지 못했습니다.', exact=False)).to_be_visible()
    panel.get_by_label('위치 검색 결과', exact=True).get_by_role('button', name='Test ore', exact=True).click()
    panel.get_by_label('이 위치 완료', exact=True).check()
    assert page.evaluate('(key) => localStorage.getItem(key)', key) == '{broken'
    page.set_viewport_size({'width': 390, 'height': 844})
    panel.scroll_into_view_if_needed()
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    panel.screenshot(path='/tmp/a2bc-map-mobile.png')
    after = page.evaluate("Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.startsWith('shadowcraft-plan-')))")
    assert before == after
    assert not errors, errors
    assert not posts, posts
    # A storage-write failure must retain the in-memory checkbox and report it.
    upload(panel, {**fixture, 'version': 'Blocked storage test'})
    expect(panel.get_by_text('전체 완료 0 / 2 · 현재 표시 2개', exact=True)).to_be_visible()
    page.evaluate("""() => {const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k,v) {if(k.startsWith('a2bc-map-progress-v1:')) throw Error('blocked');
      return original.call(this,k,v);};} """)
    panel.get_by_label('위치 검색 결과', exact=True).get_by_role('button', name='Test ore', exact=True).click()
    panel.get_by_label('이 위치 완료', exact=True).check()
    expect(panel.get_by_text('진행도를 저장하지 못했습니다.', exact=False)).to_be_visible()
    expect(panel.get_by_label('이 위치 완료', exact=True)).to_be_checked()
    browser.close()
print('PASS: empty state, import, zoom/keyboard/drag, layers, search, completion, restore/version isolation, corrupt/blocked storage, mobile and build preservation')
