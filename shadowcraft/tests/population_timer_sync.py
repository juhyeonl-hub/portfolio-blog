"""Home server distribution starts from (and follows) the server saved in the content timer; picking on Home leaves the timer alone."""
import os
from playwright.sync_api import sync_playwright, expect

URL = os.environ.get('SHADOWCRAFT_TEST_URL', 'http://127.0.0.1:5173/lab/shadowcraft/')
with sync_playwright() as p:
    browser = p.chromium.launch(); ctx = browser.new_context(viewport={'width': 1366, 'height': 900})
    page = ctx.new_page(); errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.route('**/api/public/shadowcraft/boss-timers?*', lambda r: r.fulfill(status=503, json={}))
    page.goto(URL)
    population = page.get_by_role('region', name='서버별 직업 분포')
    server = population.get_by_label('서버', exact=True)
    expect(server).to_have_value('')
    # Save Siel (EU, Elyos, 1301) in the timer: Home follows without a reload.
    page.get_by_role('button', name='서버·타이머 설정', exact=True).click()
    page.get_by_label('타이머 서버', exact=True).select_option('1301')
    page.get_by_role('button', name='시간표 저장', exact=True).click()
    expect(server).to_have_value('eu/siel')
    expect(population.get_by_label('지역', exact=True)).to_have_value('eu')
    # After a reload Home starts from the timer server.
    page.reload()
    expect(server).to_have_value('eu/siel')
    timer_before = page.evaluate("localStorage.getItem('a2bc-event-timers-v1')")
    # Choosing another server on Home does not change the timer.
    other = server.locator('option').nth(2).get_attribute('value')
    server.select_option(other)
    assert page.evaluate("localStorage.getItem('a2bc-event-timers-v1')") == timer_before
    expect(page.get_by_role('region', name='고정 콘텐츠 타이머')).to_contain_text('Siel')
    assert not errors, errors
    browser.close()
print('PASS population follows the timer server (save, reload) and Home choices leave the timer unchanged')
