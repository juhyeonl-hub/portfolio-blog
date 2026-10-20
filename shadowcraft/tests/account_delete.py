"""Account deletion UI with a mocked API: the username must be typed again; success signs out, errors are shown."""
import json
import os
from playwright.sync_api import sync_playwright, expect

URL = os.environ.get('SHADOWCRAFT_TEST_URL', 'http://127.0.0.1:5173/lab/shadowcraft/')
MEMBER = {'id': 'm1', 'username': 'leaving_member', 'steamLinked': False}

def open_account(p, calls, delete_status=204):
    ctx = p.browser.new_context(viewport={'width': 1366, 'height': 900})
    ctx.add_init_script("sessionStorage.setItem('a2bc-member-session-v1', JSON.stringify({token:'a2bc_%s',member:%s}))" % ('d' * 43, json.dumps(MEMBER)))
    page = ctx.new_page()
    def api(route):
        req = route.request
        path = req.url.split('/api/', 1)[1].split('?')[0]
        calls.append((req.method, path, req.post_data, req.headers.get('authorization')))
        if path == 'community/me' and req.method == 'DELETE':
            if delete_status == 204: return route.fulfill(status=204, body='')
            return route.fulfill(status=delete_status, json={'error': '확인을 위해 아이디를 정확히 입력하세요.'})
        if path == 'community/me': return route.fulfill(json=MEMBER)
        return route.fulfill(json={})
    page.route('**/api/**', api)
    page.goto(URL)
    page.get_by_role('button', name='내 계정').first.click()
    account = page.get_by_role('region', name='커뮤니티 로그인')
    expect(account).to_contain_text('로그인 계정: leaving_member')
    return ctx, page, account

with sync_playwright() as p:
    p.browser = p.chromium.launch()
    calls = []
    ctx, page, account = open_account(p, calls)
    account.get_by_text('회원 탈퇴', exact=True).click()
    button = account.get_by_role('button', name='계정 영구 삭제')
    field = account.get_by_role('textbox', name='탈퇴 확인용 아이디')
    expect(button).to_be_disabled()
    field.fill('leaving_membe'); expect(button).to_be_disabled()
    field.fill(' Leaving_Member '); expect(button).to_be_enabled()
    button.click()
    expect(account.get_by_role('button', name='계정 영구 삭제')).to_have_count(0)
    expect(account).to_contain_text('누구나 빌드를 볼 수 있습니다.')
    deletes = [c for c in calls if c[0] == 'DELETE']
    assert len(deletes) == 1 and deletes[0][1] == 'community/me', deletes
    assert json.loads(deletes[0][2]) == {'username': 'Leaving_Member'} and deletes[0][3] == 'Bearer a2bc_' + 'd' * 43, deletes
    assert page.evaluate("sessionStorage.getItem('a2bc-member-session-v1')") in (None, 'null'), 'session kept after deletion'
    ctx.close()
    # A refusal keeps the user signed in and shows the (translated) server message.
    calls = []
    ctx, page, account = open_account(p, calls, delete_status=400)
    page.locator('select.asbc-language').select_option('en')
    account = page.get_by_role('region', name='Community sign-in')
    account.get_by_text('Delete account', exact=True).click()
    account.get_by_role('textbox', name='Username to confirm deletion').fill('leaving_member')
    account.get_by_role('button', name='Delete account permanently').click()
    expect(account.get_by_role('alert')).to_have_text('Type your username exactly to confirm.')
    expect(account).to_contain_text('leaving_member')
    ctx.close()
    p.browser.close()
print('PASS account deletion UI: confirm by username (case/space tolerant), DELETE with token, signed out after success, refusal shown translated and session kept')
