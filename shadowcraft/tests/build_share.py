"""Share links are anonymous snapshots; opening/downloading never writes a plan."""
import base64,json,os
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from _ui import open_section, pick_class, open_build, open_library
url=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 context=browser.new_context(viewport={'width':1440,'height':1000})
 page=context.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('**/api/public/shadowcraft/catalog?*',lambda r:r.fulfill(status=503,json={}))
 page.goto(url)
 open_library(page)
 panel=page.get_by_role('region',name='빌드 링크 공유',exact=True)
 before=page.evaluate('JSON.stringify(localStorage)')
 panel.get_by_role('button',name='현재 배분 공유 링크 만들기').click()
 link=panel.get_by_label('공유 링크',exact=True).input_value()
 assert '#build=' in link
 page.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('Denied')}}})")
 panel.get_by_role('button',name='공유 링크 복사',exact=True).click()
 expect(panel.get_by_role('alert')).to_contain_text('직접 복사')
 assert panel.get_by_label('공유 링크',exact=True).input_value()==link
 assert page.evaluate('JSON.stringify(localStorage)')==before
 encoded=link.split('#build=')[1]
 decoded=json.loads(base64.urlsafe_b64decode(encoded+'='*((-len(encoded))%4)))
 assert decoded['plan']['character'] is None
 assert 'gear' not in decoded['plan'] and 'searchPrefs' not in decoded['plan']
 receiver=context.new_page();api=[]
 receiver.on('pageerror',lambda e:errors.append(str(e)))
 receiver.on('request',lambda r:api.append(r.url) if '/api/' in r.url else None)
 receiver.goto(link)
 view=receiver.get_by_role('region',name='공유 빌드 읽기 전용',exact=True)
 expect(view.get_by_role('heading',name='살성 · Lv.45',exact=True)).to_be_visible()
 catalog=json.loads((Path(__file__).parents[2]/'frontend/shadowcraft/lib/data/catalogs/assassin.json').read_text())
 selected=next((s,x) for s in catalog['skills'] for x in s['specializations'] if x['id'] in decoded['plan']['specs'].get(s['id'],[]))
 expect(view).to_contain_text(selected[1]['description'])
 assert receiver.evaluate('JSON.stringify(localStorage)')==before
 with receiver.expect_download() as info:view.get_by_role('button',name='공유 빌드 JSON 받기').click()
 exported=json.loads(Path(info.value.path()).read_text())
 assert exported['schema']=='shadowcraft-v1' and exported['plan']==decoded['plan']
 assert receiver.evaluate('JSON.stringify(localStorage)')==before
 receiver.set_viewport_size({'width':390,'height':844})
 assert receiver.evaluate('document.documentElement.scrollWidth <= innerWidth')
 receiver.screenshot(path='/tmp/a2bc-shared-build-mobile.png')
 # Version changes are visible without changing or silently normalizing the snapshot.
 decoded['catalogVersion']='old-version'
 def encoded_link(data):return url+'#build='+base64.urlsafe_b64encode(json.dumps(data).encode()).decode().rstrip('=')
 receiver.goto(encoded_link(decoded))
 expect(view.get_by_role('status')).to_contain_text('데이터 버전이 다릅니다')
 decoded['plan']['nodes'].append('999999999999999999')
 receiver.goto(encoded_link(decoded))
 expect(view.get_by_role('alert')).to_contain_text('찾을 수 없는')
 expect(view.get_by_role('button',name='공유 빌드 JSON 받기')).to_have_count(0)
 receiver.goto(url+'#build=broken!')
 expect(view.get_by_role('alert')).to_be_visible()
 assert receiver.evaluate('JSON.stringify(localStorage)')==before
 assert not api,api
 # Another class loads its own data without changing the reader's selected class.
 pick_class(page,'검성')
 open_library(page)
 panel.get_by_role('button',name='현재 배분 공유 링크 만들기').click()
 before=page.evaluate('JSON.stringify(localStorage)')
 receiver.goto(panel.get_by_label('공유 링크',exact=True).input_value())
 expect(view.get_by_role('heading',name='검성 · Lv.45',exact=True)).to_be_visible()
 assert receiver.evaluate('JSON.stringify(localStorage)')==before
 assert not errors,errors
 browser.close()
print('Build share: anonymous URL/JSON, read-only storage, version/malformed/reference failures, cross-class, no API calls and mobile PASS')
