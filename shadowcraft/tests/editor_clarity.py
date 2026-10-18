"""Detailed editor controls, persistence and responsive information hierarchy."""
import os,re
from playwright.sync_api import sync_playwright,expect
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
with sync_playwright() as p:
    browser=p.chromium.launch()
    for width in [1440,390]:
        page=browser.new_page(viewport={'width':width,'height':1000})
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.route('**/api/public/shadowcraft/catalog?*',lambda r:r.fulfill(status=503,json={}))
        page.goto(URL)
        page.get_by_role('tab',name='스킬 & 특화',exact=True).click()
        editor=page.get_by_role('region',name='스킬 상세 편집',exact=True)
        expect(editor.locator('.skill-details')).to_have_count(0)
        expect(page.get_by_role('region',name='편집 포인트 현황')).to_contain_text('스킬 포인트')
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
        page.get_by_role('tab',name='스킬 & 특화',exact=True).click()
        expect(row.locator('.stepper b')).to_have_text(str(value-1))
        page.get_by_role('button',name='포인트 설정',exact=True).click()
        expect(page.locator('#point-budget')).to_be_visible()
        page.locator('.planner-context>summary').click()
        editor.locator('.editor-guide>summary').click()
        expect(editor.locator('.editor-guide .priority').first).to_be_visible()
        editor.locator('.editor-guide>summary').click()
        page.evaluate('scrollTo(0,0)')
        page.screenshot(path=f'/tmp/a2bc-editor-skills-{width}.png')
        page.get_by_role('tab',name='데바니온',exact=True).click()
        expect(page.get_by_role('region',name='편집 포인트 현황')).to_contain_text('데바니온 결정')
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
