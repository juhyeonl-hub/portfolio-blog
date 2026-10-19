"""End-to-end Steam sign-in against the isolated backend and a local fake Steam OpenID provider.

Start the backend with: STEAM_OPENID=http://127.0.0.1:18090/openid/login shadowcraft/tests/e2e_backend.sh
and Vite on 5173. Nothing contacts the real Steam; the fake answers check_authentication only for
assertions it issued, so a forged callback is rejected by the real backend verification path.
"""
import json, os, threading, uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, parse_qs, urlencode
from playwright.sync_api import sync_playwright, expect

URL = os.environ.get('SHADOWCRAFT_TEST_URL', 'http://localhost:5173/lab/shadowcraft/')
API = os.environ.get('SHADOWCRAFT_TEST_API', 'http://127.0.0.1:18082')
ENDPOINT = 'http://127.0.0.1:18090/openid/login'
STEAM_ID = '7656119' + str(uuid.uuid4().int)[:10]
issued, checks = set(), []

class Fake(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        q = {k: v[0] for k, v in parse_qs(urlsplit(self.path).query).items()}
        nonce = uuid.uuid4().hex; issued.add(nonce)
        claimed = 'https://steamcommunity.com/openid/id/' + STEAM_ID
        params = {'openid.ns': 'http://specs.openid.net/auth/2.0', 'openid.mode': 'id_res', 'openid.op_endpoint': ENDPOINT,
                  'openid.claimed_id': claimed, 'openid.identity': claimed, 'openid.return_to': q['openid.return_to'],
                  'openid.response_nonce': nonce, 'openid.assoc_handle': '1234567890',
                  'openid.signed': 'signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle', 'openid.sig': 'fake'}
        sep = '&' if '?' in q['openid.return_to'] else '?'
        # Return through a client-side redirect: browser routing cannot intercept a server redirect, and the
        # callback must reach the site origin so the Steam binding cookie is sent, as in production.
        target = json.dumps(q['openid.return_to'] + sep + urlencode(params))
        body = ('<!doctype html><script>location.replace(%s)</script>' % target).encode()
        self.send_response(200); self.send_header('Content-Type', 'text/html'); self.end_headers(); self.wfile.write(body)
    def do_POST(self):
        body = {k: v[0] for k, v in parse_qs(self.rfile.read(int(self.headers['Content-Length'])).decode()).items()}
        ok = body.get('openid.mode') == 'check_authentication' and body.get('openid.response_nonce') in issued
        if ok: issued.discard(body['openid.response_nonce'])
        checks.append(ok)
        self.send_response(200); self.end_headers(); self.wfile.write(('ns:http://specs.openid.net/auth/2.0\nis_valid:%s\n' % ('true' if ok else 'false')).encode())

server = ThreadingHTTPServer(('127.0.0.1', 18090), Fake); threading.Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1366, 'height': 900}); page = ctx.new_page(); errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        def proxy(route):
            path = urlsplit(route.request.url)
            if path.path.startswith('/api/community/') or path.path.startswith('/api/public/shadowcraft/builds'):
                result = route.fetch(url=API + path.path + ('?' + path.query if path.query else ''), max_redirects=0)
                return route.fulfill(response=result)
            route.fulfill(json={})
        ctx.route('**/api/**', proxy)
        name = 'e2e_' + uuid.uuid4().hex[:8]
        # First sign-in: Steam → callback → choose username.
        page.goto(URL); page.get_by_role('button', name='로그인', exact=True).first.click()
        page.get_by_role('link', name='Steam으로 로그인', exact=True).click()
        account = page.get_by_role('region', name='커뮤니티 로그인')
        expect(account.get_by_label('표시할 아이디', exact=True)).to_be_visible(timeout=15000)
        assert page.evaluate('location.hash') == '', page.url
        account.get_by_label('표시할 아이디', exact=True).fill(name.upper())
        account.get_by_role('button', name='아이디 정하고 가입', exact=True).click()
        expect(account).to_contain_text('로그인 계정: ' + name)
        expect(account).to_contain_text('Steam 계정 연결됨')
        account.get_by_role('button', name='회원 로그아웃', exact=True).click()
        # Returning sign-in: same Steam account logs straight in.
        page.goto(URL); page.get_by_role('button', name='로그인', exact=True).first.click()
        page.get_by_role('link', name='Steam으로 로그인', exact=True).click()
        expect(page.get_by_role('region', name='커뮤니티 로그인')).to_contain_text('Steam으로 로그인했습니다.', timeout=15000)
        expect(page.get_by_role('region', name='커뮤니티 로그인')).to_contain_text('로그인 계정: ' + name)
        # A forged callback (unknown nonce) is rejected by the backend's verification call.
        start = ctx.request.get(API + '/api/community/auth/steam/start', max_redirects=0).headers['location']
        q = {k: v[0] for k, v in parse_qs(urlsplit(start).query).items()}
        forged = {'openid.ns': 'http://specs.openid.net/auth/2.0', 'openid.mode': 'id_res', 'openid.op_endpoint': ENDPOINT,
                  'openid.claimed_id': 'https://steamcommunity.com/openid/id/76561190000000001', 'openid.identity': 'https://steamcommunity.com/openid/id/76561190000000001',
                  'openid.return_to': q['openid.return_to'], 'openid.response_nonce': 'forged', 'openid.assoc_handle': '1',
                  'openid.signed': 'signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle', 'openid.sig': 'x'}
        r = ctx.request.get(q['openid.return_to'].replace('http://localhost:5173', API) + '&' + urlencode(forged), max_redirects=0)
        assert r.headers['location'].endswith('#steam-error=failed'), r.headers
        assert checks.count(True) == 2 and checks[-1] is False, checks
        assert not errors, errors
        b.close()
finally:
    server.shutdown()
print('PASS Steam end-to-end: real backend + fake OpenID provider, first sign-in with username (lowercased), returning sign-in, forged assertion rejected')
