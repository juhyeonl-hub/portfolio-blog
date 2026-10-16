"""Official recipe/material references are navigable without storage writes."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
root=Path(__file__).parents[2]
data=json.loads((root/'frontend/public/shadowcraft/data/client-index.json').read_text())
recipe=data['recipes'][0]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000});errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5175/lab/shadowcraft/'))
    page.get_by_role('tab',name='글로벌 데이터',exact=True).click()
    panel=page.get_by_role('region',name='글로벌 클라이언트 데이터베이스',exact=True)
    before=page.evaluate('JSON.stringify(localStorage)')
    panel.get_by_label('데이터 검색',exact=True).fill(recipe['itemId'])
    panel.locator('.database-list button').filter(has_text=recipe['itemId']).first.click()
    detail=panel.get_by_label('데이터 상세',exact=True)
    detail.locator('summary').filter(has_text='생산 제작법').click()
    detail.get_by_role('button').filter(has_text=recipe['id']).click()
    expect(detail).to_contain_text('레시피 '+recipe['id'])
    ingredient=recipe['ingredients'][0]
    item=next(i for i in data['items'] if i['id']==ingredient['itemId'])
    detail.get_by_role('button',name=item['name'],exact=True).click()
    expect(detail).to_contain_text('ID '+ingredient['itemId'])
    detail.locator('summary').filter(has_text='재료로 쓰는 제작법').click()
    detail.get_by_role('button').filter(has_text=recipe['id']).click()
    expect(detail).to_contain_text('레시피 '+recipe['id'])
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    assert page.evaluate('JSON.stringify(localStorage)')==before
    assert not errors,errors
    browser.close()
print('Recipe links: output → recipe → material → consuming recipe, mobile and unchanged storage PASS')
