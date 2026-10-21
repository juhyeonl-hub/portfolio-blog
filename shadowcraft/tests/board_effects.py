"""Verify official compound-effect supplementation in each class's node inspector."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from _ui import open_section, pick_class, open_build
root = Path(__file__).parents[2]
names = [('assassin','살성'),('gladiator','검성'),('templar','수호성'),('ranger','궁성'),('elementalist','정령성'),('sorcerer','마도성'),('cleric','치유성'),('chanter','호법성')]
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width':1440,'height':1000})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.route('**/api/public/shadowcraft/catalog?*',lambda r:r.fulfill(status=503,json={}))
    page.goto(os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/'))
    open_section(page,'데바니온')
    rules=json.loads((root/'frontend/shadowcraft/lib/data/board-effects.json').read_text())['rules']
    for key,name in names:
        pick_class(page,name)
        open_section(page,'데바니온')
        catalog=json.loads((root/f'frontend/shadowcraft/lib/data/catalogs/{key}.json').read_text())
        board=next(b for b in catalog['boards'] if any(n['id'] in rules for n in b['nodes']))
        page.locator('.board-tabs button').filter(has_text=board['name']).click()
        storage='shadowcraft-plan-v1'+('' if key=='assassin' else ':'+key)
        before=page.evaluate('k=>JSON.parse(localStorage.getItem(k))?.nodes ?? null',storage)
        checked=set()
        for node in board['nodes']:
            rule=rules.get(node['id'])
            if not rule or rule['additional']['key'] in checked:continue
            checked.add(rule['additional']['key'])
            page.get_by_title(f"{node['name']} · {node['pointCost']}P · {node['row']}행 {node['column']}열",exact=True).click()
            expect(page.locator('.node-inspector')).to_contain_text(f"{node['stat']['name']} +{node['stat']['value']} · {rule['additional']['name']} +{rule['additional']['value']}")
        assert len(checked)==3
        assert before==page.evaluate('k=>JSON.parse(localStorage.getItem(k))?.nodes ?? null',storage)
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.locator('.node-inspector').screenshot(path='/tmp/a2bc-board-effects-mobile.png')
    assert not errors,errors
    browser.close()
print('Board effects: 8 classes, 3 compound-effect groups each, unchanged node selections and mobile PASS')
