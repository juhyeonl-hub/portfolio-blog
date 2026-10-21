"""Detailed editor controls, persistence and responsive information hierarchy."""
import os,re
from playwright.sync_api import sync_playwright,expect
from _ui import open_section, pick_class, open_build

def open_menu(page):
    # On phones the tab strip is shown only on Home; other screens use the 메뉴 drawer.
    if page.locator('.mobile-menu').is_visible(): page.locator('.mobile-menu').click()
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
with sync_playwright() as p:
    browser=p.chromium.launch()
    for width in [1440,390]:
        page=browser.new_page(viewport={'width':width,'height':1000})
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.route('**/api/public/shadowcraft/catalog?*',lambda r:r.fulfill(status=503,json={}))
        page.goto(URL)
        open_menu(page);open_section(page,'스킬 & 특화')
        editor=page.get_by_role('region',name='스킬 상세 편집',exact=True)
        expect(editor.locator('.skill-details')).to_have_count(0)
        expect(page.locator('.build-summary')).to_contain_text('스킬 포인트')
        row=editor.locator('.skill-row').first
        value=int(row.locator('.stepper b').inner_text())
        row.get_by_role('button',name=re.compile('레벨 감소$')).click()
        expect(row.locator('.stepper b')).to_have_text(str(value-1))
        row.locator('.skill-name').click()
        expect(row.locator('.skill-details')).to_be_visible()
        choices=row.locator('.spec[aria-pressed=true]:enabled')
        if choices.count():
            choice=choices.first
            choice.click()
            expect(row.locator('.spec[aria-pressed=true]:enabled')).to_have_count(0)
        page.reload()
        open_menu(page);open_section(page,'스킬 & 특화')
        expect(row.locator('.stepper b')).to_have_text(str(value-1))
        page.get_by_role('button',name='포인트 설정',exact=True).click()
        expect(page.locator('#point-budget')).to_be_visible()
        page.locator('.planner-context>summary').click()
        editor.locator('.editor-guide>summary').click()
        expect(editor.locator('.editor-guide .priority').first).to_be_visible()
        editor.locator('.editor-guide>summary').click()
        page.evaluate('scrollTo(0,0)')
        page.screenshot(path=f'/tmp/a2bc-editor-skills-{width}.png')
        open_menu(page);open_section(page,'데바니온')
        expect(page.locator('.build-summary')).to_contain_text('데바니온 결정')
        page.locator('.board-node:not(.on):not(.start)').first.click()
        add=page.get_by_role('button',name=re.compile('^경로 추가 ·'))
        expect(add).to_be_enabled()
        before=page.locator('.board-node.on').count()
        add.click()
        added=page.locator('.board-node.on').count()
        assert added>before
        expect(page.get_by_role('button',name='이 노드와 연결 경로 해제',exact=True)).to_be_visible()
        page.get_by_role('button',name='이 노드와 연결 경로 해제',exact=True).click()
        assert page.locator('.board-node.on').count()<added
        expect(add).to_be_enabled()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        page.evaluate('scrollTo(0,0)')
        page.screenshot(path=f'/tmp/a2bc-editor-board-{width}.png')
        assert not errors,errors
        page.close()
    browser.close()
print('PASS desktop/mobile skill edit/reload, specialization, budget access, guide disclosure and board path add/remove')
