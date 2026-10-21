"""Global timer/pins regressions; controlled reads only, no account/public writes."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5184/lab/shadowcraft/')
OUT=Path('/mnt/d/CodexData/Projects/ASBC/evidence/timer-pins-20261021');OUT.mkdir(parents=True,exist_ok=True)
MESSAGES=json.loads((Path(__file__).resolve().parents[2]/'frontend/shadowcraft/lib/data/ui-translations.json').read_text())
legacy={'version':1,'region':'eu','server':'1301','profiles':{'eu:1301':{'offset':0,'dimension':'invasion','hidden':['tartan'],'times':{'gartua':'09:00'}}}}
with sync_playwright() as p:
 b=p.chromium.launch();ctx=b.new_context(viewport={'width':1366,'height':900});page=ctx.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('**/api/public/shadowcraft/boss-timers?*',lambda r:r.fulfill(status=503,json={}))
 page.goto(URL);page.evaluate('(x)=>localStorage.setItem("a2bc-event-timers-v1",JSON.stringify(x))',legacy);page.reload()
 header=page.locator('.event-timer-header');expect(header.locator('.event-timer-card')).to_have_count(5)
 expect(page.locator('.home-heading button')).to_have_count(0)
 page.locator('.sidebar').get_by_role('tab',name='빌드',exact=True).click();expect(page).to_have_url(URL+'#/build')
 for route in ['build','rankers','public-builds','map','builds','database','updates','account','']:
  page.goto(URL+'#/'+route);expect(header).to_be_visible();page.evaluate('window.scrollTo(0,1000)');assert abs(header.bounding_box()['y'])<=1,route
 page.goto(URL+'#privacy');expect(header).to_be_visible()
 page.goto(URL+'#/build/skills');expect(page.locator('.skill-editor')).to_be_visible()
 page.wait_for_timeout(500)
 assert page.locator('.build-pills').bounding_box()['y']>=header.bounding_box()['height']-1
 page.get_by_role('button',name='고정할 콘텐츠',exact=False).click()
 panel=page.locator('#event-timer-pins')
 for checkbox in panel.get_by_role('checkbox').all():checkbox.uncheck()
 expect(header.locator('.event-timer-card')).to_have_count(0)
 expect(header).to_contain_text('고정한 콘텐츠가 없습니다.')
 panel.get_by_label('영원의 가르투아 · 천족',exact=True).check();panel.get_by_label('슈고',exact=True).check()
 expect(header.locator('.event-timer-card')).to_have_count(2)
 page.keyboard.press('Escape');expect(panel).to_have_count(0)
 expect(page.get_by_role('button',name='고정할 콘텐츠',exact=False)).to_be_focused()
 saved=json.loads(page.evaluate('localStorage.getItem("a2bc-event-timers-v1")'))
 assert saved['profiles']==legacy['profiles'] and saved['pinned']==['shugo'] and saved['pinnedBosses']==['101021']
 page.reload();expect(header.locator('.event-timer-card')).to_have_count(2)
 page.get_by_role('button',name='고정할 콘텐츠',exact=False).click()
 panel.get_by_role('button',name='완료',exact=True).focus();page.keyboard.press('Tab')
 expect(panel).to_have_count(0)
 page.get_by_role('button',name='서버·타이머 설정',exact=True).click();page.get_by_label('타이머 서버',exact=True).select_option('1302');page.get_by_role('button',name='시간표 저장',exact=True).click()
 expect(header.locator('.event-timer-card')).to_have_count(2)
 assert json.loads(page.evaluate('localStorage.getItem("a2bc-event-timers-v1")'))['profiles']['eu:1301']==legacy['profiles']['eu:1301']
 for width in [320,390,1366]:
  page.set_viewport_size({'width':width,'height':900})
  for locale in ['ko','en','ja','fi']:
   page.locator('.asbc-language').select_option(locale)
   label='고정할 콘텐츠' if locale=='ko' else MESSAGES['고정할 콘텐츠'][locale]
   button=page.get_by_role('button',name=label,exact=False);expect(button).to_be_visible();button.click()
   expect(panel).to_be_visible();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,locale)
   box=panel.bounding_box();assert box['x']>=0 and box['x']+box['width']<=width,(width,locale)
   page.screenshot(path=str(OUT/f'pins-{width}-{locale}.png'));page.keyboard.press('Escape')
 page.locator('.asbc-language').select_option('ko');page.set_viewport_size({'width':390,'height':844})
 page.get_by_role('button',name='메뉴',exact=True).click();assert header.evaluate('(e)=>e.inert');page.keyboard.press('Escape');assert not header.evaluate('(e)=>e.inert')
 # Cross-tab updates must update visible cards without reload.
 other=ctx.new_page();other.goto(URL);other.evaluate('''()=>{const x=JSON.parse(localStorage.getItem('a2bc-event-timers-v1'));x.pinned=['tartan'];x.pinnedBosses=[];localStorage.setItem('a2bc-event-timers-v1',JSON.stringify(x))}''')
 expect(header.locator('.event-timer-card')).to_have_count(1);expect(header.locator('.event-timer-card')).to_contain_text('타르탄');other.close()
 page.get_by_role('button',name='고정할 콘텐츠',exact=False).click()
 before=page.evaluate('localStorage.getItem("a2bc-event-timers-v1")')
 page.evaluate("() => {Storage.prototype.setItem=()=>{throw Error('저장 공간 부족')}}")
 panel.get_by_label('슈고',exact=True).click();expect(header.get_by_role('alert')).to_contain_text('저장 공간 부족')
 expect(panel.get_by_label('슈고',exact=True)).not_to_be_checked()
 assert page.evaluate('localStorage.getItem("a2bc-event-timers-v1")')==before
 assert not errors,errors
 b.close()
print('PASS global routes/sticky/anchors, home/sidebar navigation, legacy/common/empty pins, persistence, server isolation, 4 locales/3 widths, menu inert, cross-tab and storage failure')
