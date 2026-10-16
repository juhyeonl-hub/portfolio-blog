"""Acceptance for official direct-material attempt planning, using bundled records."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

root = Path(__file__).parents[2]
data = json.loads((root/'frontend/public/shadowcraft/data/client-index.json').read_text())
recipe = next(r for r in data['recipes'] if r['ingredients'])
items = {i['id']: i['name'] for i in data['items']}
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width':1440, 'height':1000})
    errors, posts, requests = [], [], []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('request', lambda r: (posts.append(r.url) if r.method == 'POST' else None, requests.append(r.url)))
    page.route('**/api/public/shadowcraft/catalog?*', lambda r:r.fulfill(status=503,json={}))
    page.goto(os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5175/lab/shadowcraft/'))
    page.get_by_role('tab',name='제작 계산기',exact=True).click()
    panel = page.get_by_role('region',name='공식 제작 시도 계산',exact=True)
    before = page.evaluate('JSON.stringify(localStorage)')
    assert not any('/shadowcraft/data/client-index.json' in r for r in requests)
    page.route('**/shadowcraft/data/client-index.json', lambda r:r.fulfill(json={'schema':'broken'}))
    panel.get_by_role('button',name='공식 제작법 열기',exact=True).click()
    expect(panel.get_by_role('alert')).to_be_visible()
    page.unroute('**/shadowcraft/data/client-index.json')
    panel.get_by_role('button',name='공식 제작법 다시 불러오기',exact=True).click()
    expect(panel.get_by_label('공식 제작법 검색')).to_be_visible()
    panel.get_by_label('공식 제작법 검색').fill(recipe['id'])
    panel.get_by_role('button',name=f"#{recipe['id']}",exact=False).click()
    probability = panel.get_by_role('region',name='제작 기본 예상 확률',exact=True)
    expect(probability.get_by_role('status')).to_contain_text('약 67.51%')
    probability.get_by_label('숙련도 레벨 차이',exact=True).fill('10')
    expect(probability.get_by_role('status')).to_contain_text('약 79.03%')
    panel.get_by_label('제작 시도 횟수',exact=True).fill('3')
    result = panel.get_by_label('공식 제작 계산 결과',exact=True)
    expect(result).to_contain_text('수수료 포함 총비용: 미확정 · 성공 결과 수량: 미확정')
    required = {}
    for i in recipe['ingredients']:
        key = (i['itemId'],i['enchant'])
        required[key] = required.get(key,0)+i['quantity']*3
    cost = 0
    for (item_id,enchant), quantity in required.items():
        label = f'{items[item_id]} (+{enchant})'
        panel.get_by_label(label+' 공식 재료 보유량',exact=True).fill('1')
        panel.get_by_label(label+' 공식 재료 단가',exact=True).fill('7')
        cost += (quantity-1)*7
        expect(result).to_contain_text(f'{label} · 필요 {quantity:,} · 보유 사용 1 · 구매 {quantity-1:,}')
    expect(result).to_contain_text(f'구매 재료비: {cost:,}')
    expect(probability.get_by_role('status')).to_contain_text('약 79.03%')
    panel.get_by_label('제작 시도 횟수',exact=True).fill('10001')
    expect(panel.get_by_role('alert')).to_be_visible()
    expect(result).to_have_count(0)
    panel.get_by_label('제작 시도 횟수',exact=True).fill('3')
    page.get_by_role('tab',name='스킬 & 특화',exact=True).click()
    page.get_by_role('tab',name='제작 계산기',exact=True).click()
    expect(result).to_contain_text(f'구매 재료비: {cost:,}')
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.screenshot(path='/tmp/a2bc-official-crafting-mobile.png',full_page=True)
    assert before == page.evaluate('JSON.stringify(localStorage)')
    assert not errors, errors
    assert not posts, posts
    browser.close()
print('Official crafting: lazy loading, malformed response/retry, real materials, stock/prices, unknown totals, invalid input, tabs, mobile and storage PASS')
