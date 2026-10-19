"""Ascension UI acceptance, including preservation of pre-existing builds."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
root = Path(__file__).parents[2]
catalog = json.loads((root/'frontend/shadowcraft/lib/data/catalogs/assassin.json').read_text())
skill = next(s for s in catalog['skills'] if s['id'] == '13080000')
plan = dict(classKey='assassin',level=45,extraSP=0,extraStigma=0,extraCrystal=0,extraBattle=0,mode='safe',
            base={s['id']:0 if s['stigma'] else 1 for s in catalog['skills']},bonus={},specs={},nodes=[],checked=[],character=None,
            pointBudget=dict(sp=9999,stigma=9999,crystal=0,battle=0))
plan['base'][skill['id']] = 10
def show_budget(page):
    page.get_by_role('tab',name='스킬 & 특화',exact=True).first.click()
    box=page.get_by_role('checkbox',name='승급 조건 충족을 게임에서 확인했습니다 (AscensionGrade_3)',exact=True)
    if not box.is_visible():
        page.get_by_role('button',name='포인트 설정',exact=True).click()
    expect(box).to_be_visible()
url = os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.route('**/api/public/shadowcraft/catalog?*',lambda r:r.fulfill(status=503,json={}))
    page.goto(url)
    page.evaluate('(p)=>localStorage.setItem("shadowcraft-plan-v1",JSON.stringify(p))',plan)
    page.reload()
    show_budget(page)
    box=page.get_by_role('checkbox',name='승급 조건 충족을 게임에서 확인했습니다 (AscensionGrade_3)',exact=True)
    expect(box).not_to_be_checked()
    expect(page.get_by_text('승급 확인이 필요한 기존 투자',exact=False)).to_be_visible()
    page.get_by_role('tab',name='스킬 & 특화',exact=True).first.click()
    page.locator('.toolbar .segmented button').filter(has_text='스티그마').click()
    plus=page.get_by_role('button',name=skill['name']+' 레벨 증가',exact=True)
    minus=page.get_by_role('button',name=skill['name']+' 레벨 감소',exact=True)
    expect(plus).to_be_disabled()
    minus.click()
    assert page.evaluate('JSON.parse(localStorage.getItem("shadowcraft-plan-v1")).base["13080000"]')==9
    box.check()
    expect(plus).to_be_enabled()
    plus.click()
    assert page.evaluate('JSON.parse(localStorage.getItem("shadowcraft-plan-v1")).base["13080000"]')==10
    page.reload()
    show_budget(page)
    expect(box).to_be_checked()
    box.uncheck()
    assert page.evaluate('JSON.parse(localStorage.getItem("shadowcraft-plan-v1")).base["13080000"]')==10
    page.get_by_role('button',name='내 포인트로 추천 미리보기',exact=True).click()
    page.locator('.recommend-preview .button.primary').click()
    assert page.evaluate('JSON.parse(localStorage.getItem("shadowcraft-plan-v1")).base["13080000"]')==0
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    assert not errors, errors
    browser.close()
print('Ascension UI: legacy preservation, single-step decrease, confirmation/reload, upgrade gate, recommendation and mobile PASS')
