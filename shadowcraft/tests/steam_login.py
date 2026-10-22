"""Steam sign-in UI with a mocked API: no Steam, backend or real account is contacted."""
import json
import os
from playwright.sync_api import sync_playwright, expect

URL = os.environ.get('SHADOWCRAFT_TEST_URL', 'http://127.0.0.1:5173/lab/shadowcraft/')
CODE = 'A' * 43
MEMBER = {'id': 'm1', 'username': 'steam_tester', 'steamLinked': True}

def page_with(p, calls, link_url='https://steamcommunity.com/openid/login?openid.mode=checkid_setup', member=MEMBER, token=None):
    ctx = p.browser.new_context(viewport={'width': 1366, 'height': 900})
    if token:
        ctx.add_init_script("sessionStorage.setItem('a2bc-member-session-v1', JSON.stringify({token:'%s',member:%s}))" % (token, json.dumps(member)))
    page = ctx.new_page()
    def api(route):
        req = route.request
        path = req.url.split('/api/', 1)[1].split('?')[0]
        calls.append((req.method, path, req.post_data))
        if path == 'community/auth/steam/register':
            body = json.loads(req.post_data)
            return route.fulfill(json={'token': 'a2bc_' + 'b' * 43, 'member': {**member, 'username': body['username']}})
        if path == 'community/auth/steam/exchange':
            return route.fulfill(json={'token': 'a2bc_' + 'c' * 43, 'member': member})
        if path == 'community/me':
            return route.fulfill(json=member)
        if path == 'community/auth/steam/link':
            return route.fulfill(json={'url': link_url})
        return route.fulfill(json={})
    page.route('**/api/**', api)
    page.route('https://steamcommunity.com/**', lambda r: (calls.append(('NAV', r.request.url, None)), r.fulfill(body='steam')))
    page.route('https://evil.example/**', lambda r: (calls.append(('NAV', r.request.url, None)), r.fulfill(body='evil')))
    return ctx, page

with sync_playwright() as pw:
    class P: pass
    p = P(); p.browser = pw.chromium.launch()
    # First Steam sign-in: choose a username; the one-time code leaves the address bar immediately.
    calls = []; ctx, page = page_with(p, calls)
    page.goto(URL + '#steam-new=' + CODE)
    account = page.get_by_role('region', name='커뮤니티 로그인')
    expect(account.get_by_label('표시할 아이디', exact=True)).to_be_visible()
    assert page.evaluate('location.hash') == ''
    account.get_by_label('표시할 아이디', exact=True).fill('steam_tester')
    account.get_by_role('button', name='아이디 정하고 가입', exact=True).click()
    expect(account).to_contain_text('로그인 계정: steam_tester')
    expect(account).to_contain_text('Steam 계정 연결됨')
    assert ('POST', 'community/auth/steam/register', json.dumps({'code': CODE, 'username': 'steam_tester'}, separators=(',', ':'))) in calls, calls
    ctx.close()

    # Returning Steam user: code exchanged once for a session.
    calls = []; ctx, page = page_with(p, calls)
    page.goto(URL + '#steam-code=' + CODE)
    account = page.get_by_role('region', name='커뮤니티 로그인')
    expect(account).to_contain_text('Steam으로 로그인했습니다.')
    expect(account).to_contain_text('로그인 계정: steam_tester')
    assert [c for c in calls if c[1] == 'community/auth/steam/exchange'] == [('POST', 'community/auth/steam/exchange', json.dumps({'code': CODE}, separators=(',', ':')))]
    assert page.evaluate('location.hash') == ''
    ctx.close()

    # Errors are shown; unknown error keys fall back to the generic message.
    for key, text in (('taken', '이미 다른 계정에 연결된 Steam 계정입니다.'), ('expired', 'Steam 로그인이 만료되었습니다. 다시 시도하세요.'), ('bogus', 'Steam 로그인을 확인하지 못했습니다. 다시 시도하세요.')):
        calls = []; ctx, page = page_with(p, calls)
        page.goto(URL + '#steam-error=' + key)
        expect(page.get_by_role('region', name='커뮤니티 로그인').get_by_role('alert')).to_contain_text(text)
        ctx.close()

    # Signed out: plain Steam start link.
    calls = []; ctx, page = page_with(p, calls)
    page.goto(URL); page.get_by_role('button', name='로그인', exact=True).first.click()
    expect(page.get_by_role('link', name='Steam으로 로그인', exact=True)).to_have_attribute('href', '/api/community/auth/steam/start')
    expect(page.get_by_role('region', name='커뮤니티 로그인').locator('input[type=password]')).to_have_count(0)
    expect(page.get_by_role('region', name='커뮤니티 로그인').get_by_role('button', name='회원가입', exact=True)).to_have_count(0)
    ctx.close()

    # Signed-in password member links Steam: navigates only to Steam's OpenID endpoint.
    unlinked = {'id': 'm2', 'username': 'pw_user', 'steamLinked': False}
    calls = []; ctx, page = page_with(p, calls, member=unlinked, token='a2bc_' + 'd' * 43)
    page.goto(URL); page.get_by_role('button', name='내 계정', exact=True).first.click()
    page.get_by_role('button', name='Steam 계정 연결', exact=True).click()
    page.wait_for_url('https://steamcommunity.com/**')
    assert any(c[0] == 'NAV' and c[1].startswith('https://steamcommunity.com/openid/login?') for c in calls)
    ctx.close()

    # A non-Steam link URL from the API is refused.
    calls = []; ctx, page = page_with(p, calls, link_url='https://evil.example/phish', member=unlinked, token='a2bc_' + 'e' * 43)
    page.goto(URL); page.get_by_role('button', name='내 계정', exact=True).first.click()
    page.get_by_role('button', name='Steam 계정 연결', exact=True).click()
    expect(page.get_by_role('region', name='커뮤니티 로그인').get_by_role('alert')).to_contain_text('요청을 처리하지 못했습니다.')
    assert not any(c[0] == 'NAV' and 'evil.example' in c[1] for c in calls)
    ctx.close()

    # English labels.
    calls = []; ctx, page = page_with(p, calls)
    page.goto(URL); page.evaluate("localStorage.setItem('asbc-locale','en')"); page.reload()
    page.get_by_role('button', name='Sign in', exact=True).first.click()
    expect(page.get_by_role('link', name='Sign in with Steam', exact=True)).to_be_visible()
    ctx.close()
print('PASS Steam sign-in UI: first sign-in, returning code exchange, errors, link flow, non-Steam redirect refused, hash cleared, English labels')
