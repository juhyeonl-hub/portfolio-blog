"""Verified world-map assignments, per-NPC overrides and unchanged storage."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright,expect

# The map opens with markers the first time its tab is shown; press "open"/"show markers" only when they are offered.
def ensure_open(panel, label):
    # Wait for the automatic opening first; click only if the map stays closed (e.g. after the user closed it).
    try: expect(panel.get_by_role('button', name='공식 지형 닫기', exact=True)).to_be_visible(timeout=4000)
    except AssertionError: panel.get_by_role('button', name=label, exact=True).click()
def ensure_markers(panel):
    try: expect(panel.get_by_role('button', name='마커 숨기기', exact=True)).to_be_visible(timeout=4000)
    except AssertionError: panel.get_by_role('button', name='마커 보기', exact=True).click()
root=Path(__file__).resolve().parents[2]
data=json.loads((root/'frontend/shadowcraft/lib/data/spawn-preview.json').read_text())
icons=json.loads((root/'frontend/shadowcraft/lib/data/map-icons.json').read_text())
npcs=json.loads((root/'frontend/shadowcraft/lib/data/map-npc-icons.json').read_text())
url=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    page=browser.new_page(viewport={'width':390,'height':900})
    page.route('**/api/public/shadowcraft/catalog?*',lambda r:r.fulfill(status=503,json={}))
    page.goto(url)
    page.get_by_role('tab',name='지도 & 수집',exact=True).click()
    panel=page.get_by_role('region',name='공식 글로벌 지형 지도',exact=True)
    ensure_markers(panel)
    expect(panel.locator('[data-preview-marker="teleport"]')).to_have_count(61)
    before=page.evaluate('JSON.stringify({...localStorage})')
    rows=data['maps'][0]['markers']
    for key,kind,label in [('gather','gather','채집물'),('shop','npc','NPC'),('storage','npc','NPC'),('named','named','네임드 몬스터'),('cube','cube','히든큐브'),('trace','trace','깃털 (Empyrean Trace)')]:
        target=next(r for r in rows if r['kind']==kind and (kind in ['gather','cube','trace'] or npcs.get(str(r['objectId']))==key))
        panel.get_by_role('button',name='항목 전체 끄기',exact=True).click()
        panel.get_by_role('checkbox',name=label,exact=True).check()
        panel.get_by_label('실험 위치 검색',exact=True).fill(target['name'])
        panel.get_by_label('실험 위치 선택',exact=True).select_option(target['id'])
        marker=panel.locator('[data-preview-marker][aria-pressed="true"]')
        expect(marker.locator('image')).to_have_attribute('href',icons[key]['src'])
        expect(marker.locator('svg')).to_have_attribute('viewBox',' '.join(map(str,icons[key]['viewBox'])))
        card=panel.get_by_role('region',name='선택한 마커 정보',exact=True)
        expect(card.locator('h3 image')).to_have_attribute('href',icons[key]['src'])
    panel.get_by_label('공식 지형 지역',exact=True).select_option('reshanta-lower')
    ensure_markers(panel)
    expect(panel.locator('[data-preview-marker="teleport"]')).to_have_count(2)
    for marker in panel.locator('[data-preview-marker="teleport"]').all():
        expect(marker.locator('image')).to_have_attribute('href',icons['teleportAbyss']['src'])
    assert page.evaluate('JSON.stringify({...localStorage})')==before
    panel.get_by_label('공식 지형 지역',exact=True).select_option('verteron')
    ensure_markers(panel)
    panel.get_by_role('button',name='항목 전체 끄기',exact=True).click()
    panel.get_by_role('checkbox',name='깃털 (Empyrean Trace)',exact=True).check()
    target=next(r for r in rows if r['kind']=='trace')
    panel.get_by_label('실험 위치 검색',exact=True).fill(target['name'])
    panel.get_by_label('실험 위치 선택',exact=True).select_option(target['id'])
    card=panel.get_by_role('region',name='선택한 마커 정보',exact=True)
    toggle=card.get_by_role('checkbox',name='이 위치 확인 완료',exact=True)
    toggle.check()
    expect(card.locator('h3 image')).to_have_attribute('href',icons['traceComplete']['src'])
    expect(panel.locator('[data-preview-marker][aria-pressed="true"] image')).to_have_attribute('href',icons['traceComplete']['src'])
    page.reload()
    page.get_by_role('tab',name='지도 & 수집',exact=True).click()
    ensure_markers(panel)
    panel.get_by_role('checkbox',name='깃털 (Empyrean Trace)',exact=True).check()
    panel.get_by_label('실험 위치 검색',exact=True).fill(target['name'])
    panel.get_by_label('실험 위치 선택',exact=True).select_option(target['id'])
    expect(toggle).to_be_checked()
    expect(card.locator('h3 image')).to_have_attribute('href',icons['traceComplete']['src'])
    toggle.uncheck()
    expect(card.locator('h3 image')).to_have_attribute('href',icons['trace']['src'])
    browser.close()
print('World-map gather atlas, shop/storage/hero NPC binding, Abyss teleport, collectible icons, feather completion/reload/undo and storage preservation PASS')
