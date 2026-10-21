"""Shared link → "내 플래너에 적용": replaces that class's plan with the shared one (another class too), offers undo, and leaves no pending data."""
import base64, json, os
from playwright.sync_api import sync_playwright, expect
from _ui import open_section, pick_class, open_build, open_library

URL = os.environ.get('SHADOWCRAFT_TEST_URL', 'http://127.0.0.1:5173/lab/shadowcraft/')

def decode(link):
    encoded = link.split('#build=')[1]
    return json.loads(base64.urlsafe_b64decode(encoded + '=' * ((-len(encoded)) % 4)))

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={'width': 1440, 'height': 1000})
    page = ctx.new_page(); errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.route('**/api/public/shadowcraft/catalog?*', lambda r: r.fulfill(status=503, json={}))
    page.goto(URL)
    # A cleric link, made from the recommended cleric plan.
    open_library(page)
    pick_class(page, '치유성')
    panel = page.get_by_role('region', name='빌드 링크 공유', exact=True)
    panel.get_by_role('button', name='현재 배분 공유 링크 만들기').click()
    link = panel.get_by_label('공유 링크', exact=True).input_value()
    shared = decode(link)['plan']
    assert shared['classKey'] == 'cleric'
    # Change the local cleric plan, then go back to assassin so the planner opens on another class.
    open_section(page,'스킬 & 특화')
    page.locator('.stepper button').first.click()
    edited = json.loads(page.evaluate("localStorage.getItem('shadowcraft-plan-v1:cleric')"))
    assert edited['base'] != shared['base'], 'edit did not change the plan'
    pick_class(page, '살성')
    # Open the link and apply.
    page.goto(link)
    view = page.get_by_role('region', name='공유 빌드 읽기 전용', exact=True)
    view.get_by_role('button', name='내 플래너에 적용').click()
    expect(page.locator('.class-select')).to_have_value('cleric')
    expect(page.get_by_role('button', name='빌드 적용 전으로 되돌리기')).to_be_visible()
    # Right after applying, nothing has been edited yet: the notice must not claim later edits.
    expect(page.locator('.notice').filter(has_text='되돌리기')).to_contain_text('빌드를 적용했습니다.')
    applied = json.loads(page.evaluate("localStorage.getItem('shadowcraft-plan-v1:cleric')"))
    assert applied['base'] == shared['base'] and applied['specs'] == shared['specs'], 'shared plan not applied'
    assert page.evaluate("sessionStorage.getItem('asbc-pending-shared-plan')") is None
    assert page.evaluate('location.hash') in ('', '#')
    # Undo restores the edited plan; a reload does not apply anything again.
    page.get_by_role('button', name='빌드 적용 전으로 되돌리기').click()
    restored = json.loads(page.evaluate("localStorage.getItem('shadowcraft-plan-v1:cleric')"))
    assert restored['base'] == edited['base'], 'undo did not restore the plan'
    page.reload()
    assert json.loads(page.evaluate("localStorage.getItem('shadowcraft-plan-v1:cleric')"))['base'] == edited['base']
    # A tampered pending value is refused without touching the plan.
    page.evaluate("sessionStorage.setItem('asbc-pending-shared-plan', JSON.stringify({schema:'shadowcraft-v1',plan:{classKey:'cleric',level:'x'}}))")
    page.reload()
    expect(page.locator('.toast')).to_contain_text('공유 빌드를 적용하지 못했습니다.')
    assert json.loads(page.evaluate("localStorage.getItem('shadowcraft-plan-v1:cleric')"))['base'] == edited['base']
    assert not errors, errors
    browser.close()
print('PASS shared apply: other class selected, plan replaced, undo restores, no re-apply on reload, invalid pending refused')
