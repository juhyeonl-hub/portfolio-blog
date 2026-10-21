"""When the official detail lookup lags behind the search index (search Lv.19, detail Lv.11), a banner under the top bar
says so on every screen, the plan level follows the search level, and 다시 조회 re-queries; it disappears once the detail
catches up."""
import json, os
from playwright.sync_api import sync_playwright, expect
from _ui import open_build, click_tab

URL = os.environ.get('SHADOWCRAFT_TEST_URL', 'http://127.0.0.1:5173/lab/shadowcraft/')

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1366, 'height': 900}); errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.route('**/api/public/shadowcraft/catalog?*', lambda r: r.fulfill(status=503, json={'error': 'offline'}))
    detail = {'level': 11}
    def armory(route):
        body = json.loads(route.request.post_data); action = body['action']
        if action == 'servers': route.fulfill(json={'servers': [{'serverId': 2310, 'serverName': 'Hadala', 'raceId': 1}]})
        elif action == 'search': route.fulfill(json={'characters': [{'characterId': 'green1', 'serverId': 2310, 'name': 'GreenOrc', 'level': 19, 'serverName': 'Hadala', 'race': 1}]})
        else: route.fulfill(json={'profile': {'characterId': 'green1', 'characterName': 'GreenOrc', 'characterLevel': detail['level'], 'serverId': 2310, 'serverName': 'Hadala', 'combatPower': 5137}, 'nodes': [], 'skills': [], 'failedBoards': [], 'region': 'eu', 'equipment': []})
    page.route('**/api/public/shadowcraft/armory', armory)
    page.goto(URL)
    open_build(page)
    page.get_by_role('button', name='내 캐릭터 연결', exact=True).click()
    page.locator('.modal input[placeholder="정확한 이름을 입력하세요"]').fill('GreenOrc')
    page.get_by_role('button', name='검색', exact=True).click(); page.locator('.search-results button').first.click()
    banner = page.locator('.site-notice')
    expect(banner).to_contain_text('GreenOrc의 상세 정보(스킬·장비·전투력)가 아직 Lv.11 기준입니다. 공식 검색은 Lv.19입니다.')
    expect(page.get_by_label('캐릭터 레벨', exact=True)).to_have_value('19')
    assert json.loads(page.evaluate("localStorage.getItem('shadowcraft-plan-v1')"))['level'] == 19
    # The banner stays on other screens too.
    click_tab(page, '지도 & 수집'); expect(banner).to_be_visible()
    click_tab(page, '랭커'); expect(banner).to_be_visible()
    # Once the official detail catches up, 다시 조회 clears it.
    detail['level'] = 19
    banner.get_by_role('button', name='다시 조회', exact=True).click()
    expect(banner).to_have_count(0)
    assert json.loads(page.evaluate("localStorage.getItem('shadowcraft-plan-v1')"))['character']['profile']['characterLevel'] == 19
    page.reload(); open_build(page)
    expect(page.locator('.site-notice')).to_have_count(0)
    assert not errors, errors
    browser.close()
print('PASS stale character banner: shown on every screen while the detail lags, level follows search, 다시 조회 clears it')
