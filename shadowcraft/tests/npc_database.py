"""NPC browse/retry and unchanged user storage acceptance."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
root = Path(__file__).parents[2]
data = json.loads((root/'frontend/public/shadowcraft/data/npc-index.json').read_text())
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width':1440,'height':1000})
    errors, requests = [], []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('request', lambda r: requests.append(r.url) if '/npc-index.json' in r.url else None)
    page.goto(os.environ.get('SHADOWCRAFT_TEST_URL', 'http://127.0.0.1:5173/lab/shadowcraft/'))
    page.get_by_role('tab',name='글로벌 데이터',exact=True).click()
    panel = page.get_by_role('region',name='공식 NPC 목록',exact=True)
    assert not requests
    before = page.evaluate('JSON.stringify(localStorage)')
    page.route('**/npc-index.json', lambda r:r.fulfill(json={'invalid':True}))
    panel.get_by_role('button',name='NPC 목록 열기').click()
    expect(panel.get_by_role('alert')).to_be_visible()
    page.unroute('**/npc-index.json')
    panel.get_by_role('button',name='NPC 다시 불러오기').click()
    expect(panel).to_contain_text('13,495개')
    panel.get_by_role('button',name='NPC 다음',exact=True).click()
    expect(panel.locator('.database-pages')).to_contain_text('2 / 450')
    panel.get_by_label('NPC 분류',exact=True).select_option('Citizen')
    expect(panel).to_contain_text('NPC 검색 결과 3,755개')
    panel.get_by_label('NPC 분류',exact=True).select_option('')
    for row in [data['npcs'][0], next(n for n in data['npcs'] if n['name'] is None)]:
        panel.get_by_label('NPC 검색',exact=True).fill(row['id'])
        panel.locator('.database-list button').first.click()
        expect(panel.get_by_label('NPC 상세',exact=True)).to_contain_text(row['name'] or '이름 미확인')
        expect(panel.get_by_label('NPC 상세',exact=True)).to_contain_text(row['id'])
    panel.get_by_label('NPC 검색',exact=True).fill('no-such-npc-xyz')
    expect(panel.get_by_role('status')).to_contain_text('NPC 검색 결과가 없습니다.')
    panel.get_by_label('NPC 검색',exact=True).fill('')
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    assert page.evaluate('JSON.stringify(localStorage)') == before
    assert not errors,errors
    browser.close()
print('NPC database: lazy load, invalid/retry, pagination, type/search, missing name, mobile, storage PASS')
