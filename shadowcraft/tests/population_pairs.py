import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
root=Path(__file__).resolve().parents[2]
pairs=json.loads((root/'frontend/shadowcraft/lib/data/server-pairs.json').read_text())['pairs']
servers=json.loads((root/'frontend/shadowcraft/lib/data/population.json').read_text())['servers']
assert len({s for pair in pairs for s in pair})==len(servers)==106
for a,b in pairs:
    left=next(s for s in servers if s['id']==a);right=next(s for s in servers if s['id']==b)
    assert left['race']==1 and right['race']==2 and left['region']==right['region']
assert ['eu/nania','eu/hadala'] in pairs and ['as/nania','as/hadala'] in pairs
with sync_playwright() as p:
    browser=p.chromium.launch()
    for width in [1440,390]:
        page=browser.new_page(viewport={'width':width,'height':1000})
        page.goto(os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/'))
        panel=page.get_by_role('region',name='서버별 직업 분포',exact=True)
        select=panel.get_by_label('서버',exact=True)
        for a,b in pairs:
            panel.get_by_label('지역',exact=True).select_option(a.split('/')[0])
            panel.get_by_role('button',name='천족',exact=True).click()
            select.select_option(a)
            panel.get_by_role('button',name='천족',exact=True).click()
            expect(select).to_have_value(a)
            panel.get_by_role('button',name='마족',exact=True).click()
            expect(select).to_have_value(b)
            panel.get_by_role('button',name='천족',exact=True).click()
            expect(select).to_have_value(a)
        select.select_option('')
        panel.get_by_role('button',name='마족',exact=True).click()
        expect(select).to_have_value('')
        select.select_option('as/hadala')
        panel.get_by_label('지역',exact=True).select_option('eu')
        expect(select).to_have_value('')
        page.close()
    browser.close()
print('PASS 53 region-scoped pairs both directions desktop/mobile, same-race no-op, all-server and region reset')
