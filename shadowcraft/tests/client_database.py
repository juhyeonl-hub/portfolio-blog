"""Browser acceptance against the bundled Global client index."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

url = os.environ.get('SHADOWCRAFT_TEST_URL', 'http://127.0.0.1:5173/lab/shadowcraft/')
data = json.loads((Path(__file__).parents[2]/'frontend/public/shadowcraft/data/client-index.json').read_text())
recipe = next(r for r in data['recipes'] if r['ingredients'])
items = {i['id']: i for i in data['items']}
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width':1440, 'height':1000})
    errors, posts = [], []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('request', lambda r: posts.append(r.url) if r.method == 'POST' else None)
    page.route('**/api/public/shadowcraft/catalog?*', lambda r: r.fulfill(status=503,json={}))
    page.goto(url)
    page.get_by_role('tab',name='글로벌 데이터',exact=True).click()
    panel = page.get_by_role('region',name='글로벌 클라이언트 데이터베이스',exact=True)
    expect(panel.get_by_role('button',name='아이템 (9308)',exact=True)).to_be_visible()
    before = page.evaluate("Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.startsWith('shadowcraft-plan-')))")
    panel.get_by_role('button',name='플레이어 스킬 (280)',exact=True).click()
    panel.get_by_label('데이터 검색',exact=True).fill('Quick Slice')
    expect(panel.locator('.database-list button')).to_have_count(1)
    panel.locator('.database-list button').click()
    expect(panel.locator('.skill-learning-list li')).to_have_count(10)
    expect(panel.locator('.skill-learning-list li').nth(4)).to_contain_text('캐릭터 Lv.10')
    expect(panel.locator('.skill-learning-list li').nth(4)).to_contain_text('SP 2')
    gated = next(s for s in data['skills'] if any(r['ascensionRequirement'] != 'None' for r in s['learning']))
    panel.get_by_label('데이터 검색',exact=True).fill(gated['id'])
    panel.locator('.database-list button').click()
    expect(panel.locator('.skill-learning-list')).to_contain_text('AscensionGrade_3')
    panel.get_by_role('button',name='제작법 (1098)',exact=True).click()
    panel.get_by_label('데이터 검색',exact=True).fill(recipe['id'])
    expect(panel.locator('.database-list button')).to_have_count(1)
    panel.locator('.database-list button').click()
    panel.get_by_label('제작 시도 횟수',exact=True).fill('3')
    ingredient = recipe['ingredients'][0]
    expect(panel.locator('.database-detail')).to_contain_text(items[ingredient['itemId']]['name']+' × '+format(ingredient['quantity']*3,','))
    panel.get_by_label('제작 시도 횟수',exact=True).fill('-1')
    expect(panel.get_by_role('alert')).to_be_visible()
    expect(panel.locator('.database-detail li')).to_have_count(0)
    panel.get_by_label('제작 시도 횟수',exact=True).fill('3')
    page.get_by_role('tab',name='스킬 & 특화',exact=True).click()
    page.get_by_role('tab',name='글로벌 데이터',exact=True).click()
    expect(panel.get_by_label('제작 시도 횟수',exact=True)).to_have_value('3')
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.screenshot(path='/tmp/a2bc-client-database-mobile.png',full_page=True)
    assert before == page.evaluate("Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.startsWith('shadowcraft-plan-')))")
    assert not errors, errors
    assert not posts, posts
    # Malformed server response must show retry rather than crash the application.
    page.route('**/shadowcraft/data/client-index.json',lambda r:r.fulfill(json={'schema':'broken'}))
    page.reload()
    page.get_by_role('tab',name='글로벌 데이터',exact=True).click()
    expect(panel.get_by_role('alert')).to_be_visible()
    page.unroute('**/shadowcraft/data/client-index.json')
    panel.get_by_role('button',name='다시 불러오기',exact=True).click()
    expect(panel.get_by_role('button',name='아이템 (9308)',exact=True)).to_be_visible()
    assert not errors, errors
    browser.close()
print('Client database: official references, search, material attempts, invalid input, tab retention, storage, mobile and retry PASS')
