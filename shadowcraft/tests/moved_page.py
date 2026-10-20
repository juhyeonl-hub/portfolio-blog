"""Old address after the move: the blog build's light page. Serves https://juhyeonl.dev from frontend/dist (build with
VITE_ASBC_NEW_ORIGIN=https://asbc.app) and checks forwarding, the empty case and a real hand-over to asbc.app."""
import mimetypes, os, re
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

DIST = Path(__file__).parents[2] / 'frontend' / 'dist'
OLD = 'https://juhyeonl.dev/lab/shadowcraft/'
NEW = os.environ.get('ASBC_NEW', 'https://asbc.app/')

def serve(route):
    path = route.request.url.split('juhyeonl.dev', 1)[1].split('#')[0].split('?')[0]
    if path.startswith('/api/'): return route.fulfill(json={})
    file = DIST / (path.lstrip('/') + ('index.html' if path.endswith('/') else ''))
    if not file.is_file(): file = DIST / 'index.html'
    route.fulfill(body=file.read_bytes(), content_type=mimetypes.guess_type(file.name)[0] or 'application/octet-stream')

with sync_playwright() as p:
    browser = p.chromium.launch(); ctx = browser.new_context(viewport={'width': 1280, 'height': 900}); errors = []
    ctx.route('https://juhyeonl.dev/**', serve)
    ctx.on('page', lambda pg: pg.on('pageerror', lambda e: errors.append(str(e))))
    page = ctx.new_page()
    # No planner data: plain notice and a link to the new address (the language setting alone does not count).
    page.goto(OLD)
    expect(page.get_by_role('heading', name='ASBC가 새 주소로 이사했습니다.')).to_be_visible()
    expect(page.get_by_role('link', name='새 주소로 이동')).to_have_attribute('href', NEW)
    assert page.locator('.asbc-move-banner').count() == 0
    # Shared and published links are forwarded with their hash.
    for hash_ in ('#build=abc123', '#published=0f0e'):
        forwarded = ctx.new_page(); forwarded.route(re.compile(r'^https://asbc\.app/.*'), lambda r: r.fulfill(body='<p>new</p>', content_type='text/html'))
        forwarded.goto(OLD + hash_); forwarded.wait_for_url(NEW + hash_); forwarded.close()
    # Saved planner data: the move banner hands it to the real asbc.app.
    page.evaluate("localStorage.setItem('shadowcraft-plan-v1', JSON.stringify({classKey:'assassin',level:45}))")
    page.reload()
    banner = page.get_by_role('region', name='새 주소 안내')
    expect(banner).to_be_visible()
    with ctx.expect_page() as popup:
        banner.get_by_role('button', name='내 데이터와 함께 새 주소로 이동').click()
    new = popup.value
    dialog = new.get_by_role('dialog', name='옛 주소 데이터 가져오기')
    expect(dialog).to_contain_text('직업별 계획 1개')
    dialog.get_by_role('button', name='가져오기', exact=True).click()
    expect(dialog.get_by_role('status')).to_contain_text('가져왔습니다.')
    assert new.evaluate("localStorage.getItem('shadowcraft-plan-v1')") == '{"classKey":"assassin","level":45}'
    assert not errors, errors
    browser.close()
print('PASS moved page: empty notice, #build/#published forwarding, banner with data, real hand-over to asbc.app')
