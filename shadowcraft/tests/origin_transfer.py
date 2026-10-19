"""Moving saved planner data from the old origin to the new one with postMessage.
Run a dev server with VITE_ASBC_OLD_ORIGIN=http://127.0.0.1:5174 VITE_ASBC_NEW_ORIGIN=http://localhost:5174
VITE_ASBC_NEW_PATH=/lab/shadowcraft/ on port 5174 (two hostnames = two origins). No backend is used."""
import os
from playwright.sync_api import sync_playwright, expect
OLD = os.environ.get('ASBC_TRANSFER_OLD', 'http://127.0.0.1:5174') + '/lab/shadowcraft/'
NEW = os.environ.get('ASBC_TRANSFER_NEW', 'http://localhost:5174') + '/lab/shadowcraft/'
PLAN = '{"classKey":"assassin","level":45}'
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1366, 'height': 900}); errors = []
    ctx.on('page', lambda pg: pg.on('pageerror', lambda e: errors.append(str(e))))
    ctx.route('**/api/**', lambda r: r.fulfill(json={}))
    # Data on the new origin before the move: one conflicting plan, which must survive "keep".
    new0 = ctx.new_page(); new0.goto(NEW); new0.evaluate("localStorage.setItem('shadowcraft-plan-v1:templar','{\"mine\":true}')"); new0.close()
    old = ctx.new_page(); old.goto(OLD)
    old.evaluate("""p=>{localStorage.setItem('shadowcraft-plan-v1',p);localStorage.setItem('shadowcraft-plan-v1:templar','{"old":true}');
        localStorage.setItem('a2bc-build-library-v1:assassin','[]');localStorage.setItem('a2bc-map-progress-v1:x','{"done":1}');localStorage.setItem('token','blog-admin-secret');}""", PLAN)
    old.reload()
    banner = old.get_by_role('region', name='새 주소 안내')
    expect(banner).to_contain_text('ASBC가 새 주소로 이사했습니다.')
    expect(banner.get_by_role('link', name='데이터 없이 이동')).to_have_attribute('href', NEW)
    with ctx.expect_page() as popup:
        banner.get_by_role('button', name='내 데이터와 함께 새 주소로 이동').click()
    new = popup.value
    dialog = new.get_by_role('dialog', name='옛 주소 데이터 가져오기')
    # The app also stores its own settings (e.g. language) on load, so the total is at least the four seeded keys.
    expect(dialog).to_contain_text(__import__('re').compile(r'직업별 계획 2개, 빌드 보관함 1개, 지도 기록 1개 등 총 [4-9]개 항목을 가져옵니다.'))
    expect(dialog).to_contain_text('이 주소에도 이미 다른 데이터가 1개 있습니다.')
    dialog.get_by_role('button', name='이 주소 데이터는 유지하고 나머지만 가져오기').click()
    expect(dialog.get_by_role('status')).to_contain_text('가져왔습니다. 이 주소에 있던 다른 데이터 1개는 그대로 두었습니다.')
    store = new.evaluate("Object.fromEntries(Object.entries(localStorage))")
    assert store['shadowcraft-plan-v1'] == PLAN and store['shadowcraft-plan-v1:templar'] == '{"mine":true}', store
    assert store['a2bc-map-progress-v1:x'] == '{"done":1}' and 'token' not in store, store
    assert new.evaluate('location.hash') == ''
    expect(old.get_by_role('region', name='새 주소 안내').get_by_role('status')).to_contain_text('새 주소로 데이터를 보냈습니다.')
    # Old data is never deleted.
    assert old.evaluate("localStorage.getItem('shadowcraft-plan-v1')") == PLAN
    # The banner is only on the old origin; /#transfer opened directly (no opener) explains what to do.
    lone = ctx.new_page(); lone.goto(NEW + '#transfer')
    expect(lone.get_by_role('dialog', name='옛 주소 데이터 가져오기').get_by_role('alert')).to_contain_text('옛 주소에서 "내 데이터와 함께 새 주소로 이동"을 눌러')
    expect(lone.get_by_role('region', name='새 주소 안내')).to_have_count(0)
    assert not errors, errors
    b.close()
print('PASS origin transfer: banner on old origin only, popup request/response, summary, conflict kept, token not moved, old data intact, no-opener guidance')
