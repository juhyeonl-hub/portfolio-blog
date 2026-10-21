"""Browser acceptance against the bundled Global client index."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from _ui import open_section, pick_class, open_build

url = os.environ.get('SHADOWCRAFT_TEST_URL', 'http://127.0.0.1:5173/lab/shadowcraft/')
data = json.loads((Path(__file__).parents[2]/'frontend/public/shadowcraft/data/client-index.json').read_text())
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width':1440, 'height':1000})
    errors, posts = [], []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('request', lambda r: posts.append(r.url) if r.method == 'POST' else None)
    page.route('**/api/public/shadowcraft/catalog?*', lambda r: r.fulfill(status=503,json={}))
    page.goto(url)
    open_section(page,'스킬 & 특화')
    official=page.get_by_role('button',name='공식 글로벌 설명 보기',exact=True)
    if not official.is_visible():
        page.locator('.skill-name').first.click()
    official.click()
    panel = page.get_by_role('region',name='글로벌 클라이언트 데이터베이스',exact=True)
    expect(panel.get_by_role('button',name='아이템 (9308)',exact=True)).to_be_visible()
    expect(panel.locator('.database-detail')).to_contain_text('공식 글로벌 스킬 설명')
    before = page.evaluate("Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.startsWith('shadowcraft-plan-')))")
    panel.get_by_role('button',name='플레이어 스킬 (280)',exact=True).click()
    panel.get_by_label('데이터 검색',exact=True).fill('Quick Slice')
    expect(panel.locator('.database-list button')).to_have_count(1)
    panel.locator('.database-list button').click()
    expect(panel.locator('.skill-learning-list li')).to_have_count(10)
    description = panel.get_by_label('공식 글로벌 스킬 설명', exact=True)
    expect(description).to_contain_text('restores 100 MP')
    expect(description).to_contain_text('[unresolved value]')
    assert '{se_' not in description.inner_text()
    expect(panel.locator('.skill-learning-list li').nth(4)).to_contain_text('캐릭터 Lv.10')
    expect(panel.locator('.skill-learning-list li').nth(4)).to_contain_text('SP 2')
    panel.get_by_label('데이터 검색',exact=True).fill('13020000')
    panel.locator('.database-list button').click()
    expect(description).to_contain_text('reduces Move Speed by 40% for 5s')
    expect(description).to_contain_text('클라이언트 기본값 기준')
    gated = next(s for s in data['skills'] if any(r['ascensionRequirement'] != 'None' for r in s['learning']))
    panel.get_by_label('데이터 검색',exact=True).fill(gated['id'])
    panel.locator('.database-list button').click()
    expect(panel.locator('.skill-learning-list')).to_contain_text('AscensionGrade_3')
    expect(page.get_by_role('tab',name='제작 계산기',exact=True)).to_have_count(0)
    expect(panel.get_by_role('button',name='제작법 (1098)',exact=True)).to_have_count(0)
    expect(page.get_by_role('region',name='공식 제작 시도 계산',exact=True)).to_have_count(0)
    panel.get_by_role('button',name='아이템 (9308)',exact=True).click()
    item = data['items'][0]
    panel.get_by_label('데이터 검색',exact=True).fill(item['id'])
    panel.locator('.database-list button').first.click()
    expect(panel.locator('.database-detail')).to_contain_text(item['name'])
    expect(panel.get_by_text('생산 제작법',exact=False)).to_have_count(0)
    open_section(page,'스킬 & 특화')
    page.get_by_role('tab',name='글로벌 데이터',exact=True).click()
    expect(panel.get_by_label('데이터 검색',exact=True)).to_have_value(item['id'])
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
print('Client database: official references, search, crafting exclusion, tab retention, storage, mobile and retry PASS')
