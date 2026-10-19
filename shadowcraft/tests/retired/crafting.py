"""Run against local Vite with Python Playwright installed; synthetic data only.
Usage: SHADOWCRAFT_TEST_URL=http://127.0.0.1:5173/lab/shadowcraft/ python3 shadowcraft/tests/crafting.py
"""
import json
import os
from playwright.sync_api import sync_playwright, expect

fixture = {
    'schema': 'a2bc-crafting-v1', 'region': 'global', 'version': 'Synthetic test',
    'items': [{'id': 'tool', 'name': 'Test tool'}, {'id': 'bar', 'name': 'Test bar'},
              {'id': 'ore', 'name': 'Test ore'}],
    'recipes': [
        {'id': 'tool-recipe', 'itemId': 'tool', 'outputQuantity': 1,
         'ingredients': [{'itemId': 'bar', 'quantity': 2}], 'feePerCraft': 5},
        {'id': 'bar-recipe', 'itemId': 'bar', 'outputQuantity': 3,
         'ingredients': [{'itemId': 'ore', 'quantity': 2}], 'feePerCraft': 2},
    ],
}
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    errors, posts = [], []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('request', lambda request: posts.append(request.url) if request.method == 'POST' else None)
    page.route('**/api/public/shadowcraft/catalog?*', lambda route: route.fulfill(status=503, json={}))
    page.goto(os.environ.get('SHADOWCRAFT_TEST_URL', 'http://127.0.0.1:5173/lab/shadowcraft/'))
    page.get_by_role('tab', name='제작 계산기', exact=True).click()
    panel = page.get_by_role('region', name='제작 계산기', exact=True)
    expect(panel.get_by_text('계산할 제작법이 없습니다', exact=True)).to_be_visible()
    before = page.evaluate("Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.startsWith('shadowcraft-plan-')))")
    upload = panel.get_by_label('레시피 파일 가져오기', exact=True)
    upload.set_input_files({'name': 'synthetic.json', 'mimeType': 'application/json',
                           'buffer': json.dumps(fixture).encode()})
    expect(panel.get_by_text('사용자 파일 · 공식 검증 안 됨', exact=False)).to_be_visible()
    panel.get_by_label('레시피 검색', exact=True).fill('Test tool')
    panel.get_by_role('button', name='Test tool · 1회 1개', exact=True).click()
    panel.get_by_label('목표 수량', exact=True).fill('2')
    panel.get_by_label('Test bar 보유 수량', exact=True).fill('1')
    panel.get_by_label('Test ore 보유 수량', exact=True).fill('1')
    expect(panel.locator('.crafting-total')).to_have_text('총비용: 미확정')
    panel.get_by_label('Test ore 구매 단가', exact=True).fill('7')
    expect(panel.locator('.crafting-total')).to_have_text('총비용: 19')
    expect(panel.get_by_text('Test ore × 1 · 7', exact=True)).to_be_visible()
    panel.get_by_label('목표 수량', exact=True).fill('0')
    expect(panel.get_by_role('alert')).to_be_visible()
    expect(panel.locator('.crafting-result')).to_have_count(0)
    panel.get_by_label('목표 수량', exact=True).fill('2')
    upload.set_input_files({'name': 'broken.json', 'mimeType': 'application/json', 'buffer': b'{broken'})
    expect(panel.get_by_role('alert')).to_be_visible()
    expect(panel.locator('.crafting-total')).to_have_text('총비용: 19')
    upload.set_input_files({'name': 'wrong-region.json', 'mimeType': 'application/json',
                           'buffer': json.dumps({**fixture, 'region': 'kr'}).encode()})
    expect(panel.get_by_role('alert')).to_have_text('글로벌용 a2bc 제작 레시피 파일이 아닙니다.')
    expect(panel.locator('.crafting-total')).to_have_text('총비용: 19')
    page.get_by_role('tab', name='스킬 & 특화', exact=True).click()
    page.get_by_role('tab', name='제작 계산기', exact=True).click()
    expect(panel.get_by_label('목표 수량', exact=True)).to_have_value('2')
    expect(panel.locator('.crafting-total')).to_have_text('총비용: 19')
    panel.get_by_label('중간 재료도 직접 제작', exact=True).uncheck()
    panel.get_by_label('Test bar 구매 단가', exact=True).fill('4')
    expect(panel.locator('.crafting-total')).to_have_text('총비용: 22')
    panel.get_by_label('레시피 검색', exact=True).fill('no-such-recipe')
    expect(panel.get_by_text('검색 결과가 없습니다.', exact=True)).to_be_visible()
    page.set_viewport_size({'width': 390, 'height': 844})
    panel.scroll_into_view_if_needed()
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'mobile page overflows'
    page.screenshot(path='/tmp/a2bc-crafting-mobile.png', full_page=True)
    after = page.evaluate("Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.startsWith('shadowcraft-plan-')))")
    assert before == after, 'crafting must not modify saved builds'
    assert not errors, errors
    assert not posts, posts
    browser.close()
print('PASS: empty state, search, calculation, invalid inputs/files, region rejection, tab retention, purchase mode, mobile width, saved builds and no uploads')
