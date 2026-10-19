"""ASBC compact home, locale persistence and existing member entry regression.
Auth requests use controlled responses: no real accounts or posts are created.
This checks the translated home/account only, not full application translation.
"""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

URL = os.environ.get('SHADOWCRAFT_TEST_URL', 'http://127.0.0.1:5173/lab/shadowcraft/')
MESSAGES = json.loads((Path(__file__).resolve().parents[2] / 'frontend/shadowcraft/lib/data/ui-translations.json').read_text())

with sync_playwright() as p:
    browser = p.chromium.launch()
    for width, height in [(1366, 768), (1440, 900), (390, 844), (683, 768)]:
        page = browser.new_page(viewport={'width': width, 'height': height})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(URL)
        for locale in ['ko', 'en', 'ja', 'fi']:
            page.locator('.asbc-language').select_option(locale)
            expect(page.locator('html')).to_have_attribute('lang', locale)
            page.reload()
            expect(page.locator('.asbc-language')).to_have_value(locale)
            expect(page.get_by_role('region', name='ASBC', exact=True)).to_be_visible()
            expect(page.locator('.asbc-footer')).to_contain_text('추억 게임즈')
            expect(page.locator('.population-bars li')).to_have_count(8)
            for selected in [False, True]:
                select = page.locator('.population-filters select').last
                select.select_option(index=1 if selected else 0)
                page.evaluate('document.fonts.ready')
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (width, locale, 'horizontal')
                if width >= 901:
                    assert page.evaluate('document.documentElement.scrollHeight <= innerHeight'), (width, locale, selected, page.evaluate('document.documentElement.scrollHeight'))
            page.screenshot(path=f'/tmp/asbc-home-{width}-{locale}.png')
        assert not errors, errors
        page.close()

    page = browser.new_page(viewport={'width': 1366, 'height': 768})
    requests = []
    def auth(route):
        requests.append((route.request.url.rsplit('/', 1)[-1], route.request.post_data_json))
        route.fulfill(json={'token': 'controlled-test-session', 'member': {'id': 'test-member', 'username': 'asbc_test'}})
    page.route('**/api/community/auth/*', auth)
    page.route('**/api/community/me', lambda r: r.fulfill(json={'id': 'test-member', 'username': 'asbc_test'}))
    page.route('**/api/community/logout', lambda r: r.fulfill(json={'ok': True}))
    page.goto(URL)
    # Browsing never redirects to an account gate.
    expect(page.locator('.population-panel')).to_be_visible()
    saved = page.evaluate('JSON.stringify({...localStorage})')
    page.locator('.asbc-account-actions button').click()
    account = page.locator('.asbc-account-page .community-account')
    account.get_by_role('button', name='회원가입', exact=True).click()
    account.get_by_label('회원 아이디', exact=True).fill('asbc_test')
    account.get_by_label('회원 비밀번호', exact=True).fill('test-password-123')
    account.get_by_role('button', name='회원가입 후 로그인', exact=True).click()
    expect(account).to_contain_text('asbc_test')
    assert requests[-1][0] == 'register'
    account.get_by_role('button', name='회원 로그아웃', exact=True).click()
    account.get_by_label('회원 아이디', exact=True).fill('asbc_test')
    account.get_by_label('회원 비밀번호', exact=True).fill('test-password-123')
    account.get_by_role('button', name='회원 로그인', exact=True).click()
    expect(account).to_contain_text('asbc_test')
    assert requests[-1][0] == 'login'
    for locale in ['en', 'ja', 'fi', 'ko']:
        page.locator('.asbc-language').select_option(locale)
        expect(account).to_contain_text('asbc_test')
        logout = '회원 로그아웃' if locale == 'ko' else MESSAGES['회원 로그아웃'][locale]
        expect(account.get_by_role('button', name=logout, exact=True)).to_be_visible()
    assert page.evaluate('JSON.stringify({...localStorage})') == saved
    account.get_by_role('button', name='회원 로그아웃', exact=True).click()
    expect(account.get_by_role('button', name='회원 로그인', exact=True)).to_be_visible()
    assert page.evaluate("sessionStorage.getItem('a2bc-member-session-v1')") is None
    page.close()
    browser.close()
print('PASS ASBC home/account: four locales, desktop fit, mobile/zoom width, persistence, public read, signup/login/logout and preserved local data')
