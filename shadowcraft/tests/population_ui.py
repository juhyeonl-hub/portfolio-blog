import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
data=json.loads((Path(__file__).resolve().parents[2]/'frontend/shadowcraft/lib/data/population.json').read_text())
with sync_playwright() as p:
    browser=p.chromium.launch()
    for width in [1440,390]:
        page=browser.new_page(viewport={'width':width,'height':1100})
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(URL)
        panel=page.get_by_role('region',name='서버별 직업 분포',exact=True)
        expect(panel.get_by_role('listitem')).to_have_count(8)
        before=page.evaluate('JSON.stringify({...localStorage})')
        for region in ['eu','nae','naw','la','as']:
            panel.get_by_label('지역',exact=True).select_option(region)
            for race,name in [(1,'천족'),(2,'마족')]:
                panel.get_by_role('button',name=name,exact=True).click()
                servers=[s for s in data['servers'] if s['region']==region and s['race']==race]
                select=panel.get_by_label('서버',exact=True)
                expect(select.locator('option')).to_have_count(len(servers)+1)
                select.select_option('')
                server=servers[0];select.select_option(server['id'])
                total=sum(server['counts'].values())
                expect(panel.locator('.population-summary')).to_contain_text(f'{total:,}명')
                for key,count in server['counts'].items():
                    row=panel.locator(f'[data-class="{key}"]')
                    expect(row).to_contain_text(f'{count:,}명')
                    expect(row).to_contain_text(f'{100*count/total:.1f}%')
        assert page.evaluate('JSON.stringify({...localStorage})')==before
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        expect(panel).to_contain_text('수동 갱신')
        page.screenshot(path=f'/tmp/a2bc-population-{width}.png',full_page=True)
        assert not errors,errors
        page.close()
    browser.close()
print('PASS desktop/mobile five regions, both factions, server reset, eight exact counts/shares and preserved storage')
