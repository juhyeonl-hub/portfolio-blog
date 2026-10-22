"""Requested official layers and migration from the previously deployed storage keys."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from _ui import click_tab

# The map opens with markers the first time its tab is shown; press "open"/"show markers" only when they are offered.
def ensure_open(panel, label):
    # Wait for the automatic opening first; click only if the map stays closed (e.g. after the user closed it).
    try: expect(panel.get_by_role('button', name='공식 지형 닫기', exact=True)).to_be_visible(timeout=4000)
    except AssertionError: panel.get_by_role('button', name=label, exact=True).click()
def ensure_markers(panel):
    controls=panel.locator('.terrain-controls')
    if controls.get_attribute('open') is None: controls.locator(':scope > summary').click()
    try: expect(panel.get_by_role('button', name='마커 숨기기', exact=True)).to_be_visible(timeout=4000)
    except AssertionError: panel.get_by_role('button', name='마커 보기', exact=True).click()

URL = os.environ.get('SHADOWCRAFT_TEST_URL', 'http://127.0.0.1:5173/lab/shadowcraft/')
ROOT = Path(__file__).resolve().parents[2]
DATA = json.loads((ROOT / 'frontend/shadowcraft/lib/data/spawn-preview.json').read_text())
LEGACY = json.loads((ROOT / 'frontend/shadowcraft/lib/data/map-progress-legacy.json').read_text())

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.route('**/api/public/shadowcraft/catalog?*', lambda r: r.fulfill(status=503, json={}))
    page.goto(URL)
    old_id = next(r['id'] for r in DATA['maps'][0]['markers'] if r['kind'] == 'sealed')
    prior = json.dumps({'schema': 'a2bc-map-progress-v1', 'completed': [old_id]})
    page.evaluate('({key,value})=>localStorage.setItem(key,value)', {'key': LEGACY['Verteron'], 'value': prior})

    def open_map(slug):
        page.goto(URL)
        page.get_by_text('내 서버에는 어떤 직업이 많을까요?',exact=True).wait_for(state='attached')
        click_tab(page,'지도 & 수집')
        panel = page.get_by_role('region', name='공식 글로벌 지형 지도', exact=True)
        panel.get_by_label('공식 지형 지역', exact=True).select_option(slug)
        ensure_markers(panel)
        expect(panel.get_by_role('button', name='마커 숨기기', exact=True)).to_be_visible()
        panel.get_by_role('button', name='항목 전체 끄기', exact=True).click()
        panel.locator('.map-advanced > summary').click()
        return panel

    panel = open_map('verteron')
    expect(panel.get_by_text('확인 기록 1개', exact=False)).to_be_visible()
    panel.get_by_role('checkbox', name='봉인던전', exact=True).check()
    expect(panel.locator('[data-preview-marker="sealed"]')).to_have_count(61)
    panel.get_by_label('실험 위치 선택', exact=True).select_option(old_id)
    expect(panel.get_by_label('이 위치 확인 완료', exact=True)).to_be_checked()
    panel.get_by_label('이 위치 확인 완료', exact=True).uncheck()
    panel = open_map('verteron')
    expect(panel.get_by_text('확인 기록 0개', exact=False)).to_be_visible()  # Empty new revision wins.
    assert page.evaluate('(key)=>localStorage.getItem(key)', LEGACY['Verteron']) == prior

    for slug in ['verteron', 'altgard']:
        panel = open_map(slug)
        panel.get_by_role('checkbox', name='주둔지', exact=True).check()
        expect(panel.locator('[data-preview-marker="stronghold"]')).to_have_count(15)
        panel.get_by_role('checkbox', name='봉인던전', exact=True).check()
        expect(panel.locator('[data-preview-marker="sealed"]')).to_have_count(61)
        expect(panel.locator('[data-preview-marker]')).to_have_count(76)
        marker = panel.locator('[data-preview-marker="stronghold"]').first
        marker.focus()
        page.keyboard.press('Enter')
        expect(panel.get_by_text('주둔지 구역 중심입니다.', exact=False)).to_be_visible()
        panel.get_by_label('이 위치 확인 완료', exact=True).check()
        panel = open_map(slug)
        expect(panel.get_by_text('확인 기록 1개', exact=False)).to_be_visible()
        panel.get_by_role('checkbox', name='깃털 (Empyrean Trace)', exact=True).check()
        assert panel.locator('[data-preview-marker="trace"]').evaluate_all('(els)=>els.reduce((n,e)=>n+Number(e.dataset.count),0)')==559
        expect(panel.get_by_text('검색 결과 559개', exact=False)).to_be_visible()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')

    panel = open_map('poeta')
    expect(panel.get_by_role('checkbox', name='주둔지', exact=True)).to_be_disabled()
    expect(panel.get_by_role('checkbox', name='봉인던전', exact=True)).to_be_disabled()
    expect(panel.get_by_role('checkbox', name='깃털 (Empyrean Trace)', exact=True)).to_be_disabled()
    assert not errors, errors
    browser.close()
print('Official requested layers: sealed/feather/stronghold, joint filters, area detail, legacy migration and mobile PASS')
