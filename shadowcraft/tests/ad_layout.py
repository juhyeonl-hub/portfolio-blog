"""Reserved ad inventory and native compact layout; no ad provider requests."""
import os,json
from pathlib import Path
from datetime import datetime,timezone
from playwright.sync_api import sync_playwright,expect
fixture=json.loads((Path(__file__).resolve().parent/'fixtures/maintenance-notice.json').read_text())
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5184/lab/shadowcraft/')
OUT=Path('/mnt/d/CodexData/Projects/ASBC/evidence/ad-layout-20261021');OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch();page=b.new_page(viewport={'width':1920,'height':1080});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('**/api-global-community.plaync.com/**',lambda route:route.fulfill(json={'contentList':[fixture['article']['contentMeta']]} if 'search/' in route.request.url else fixture))
 page.clock.install(time=datetime(2026,10,21,9,tzinfo=timezone.utc))
 page.goto(URL)
 expect(page.locator('.maintenance-banner')).to_be_visible()
 # Keep header populated with all six timers; verify rails below the measured bar.
 settings={'version':1,'region':'eu','server':'1301','profiles':{}}
 page.evaluate('(x)=>localStorage.setItem("a2bc-event-timers-v1",JSON.stringify(x))',settings);page.reload();expect(page.locator('.maintenance-banner')).to_be_visible()
 for width in [1920,1760,1600,1550,1440,1366,1359,1280,1024,760,390,320]:
  page.set_viewport_size({'width':width,'height':900})
  for route in ['','build/skills','map','public-builds','database']:
   page.goto(URL+'#/'+route);page.wait_for_timeout(250)
   assert page.evaluate('document.documentElement.scrollWidth<=document.body.clientWidth+1'),(width,route,'page overflow')
   page.wait_for_function("Math.abs(document.querySelector('.event-timer-header').getBoundingClientRect().height-parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--a2bc-timer-height')))<1")
   rails=page.locator('.ad-rail');expect(rails).to_have_count(2)
   if width>=1360:
    expect(rails.first).to_be_visible();expect(rails.last).to_be_visible()
    root=page.locator('#root').bounding_box();left=rails.first.bounding_box();right=rails.last.bounding_box();header=page.locator('.event-timer-header').bounding_box()
    assert root['width']<=1180 and left['x']>=0 and left['x']+left['width']<=root['x']-15 and right['x']>=root['x']+root['width']+15 and right['x']+right['width']<=width,(width,root,left,right)
    assert left['y']>=header['height']+15,(width,left,header)
    sidebar=page.locator('.sidebar').bounding_box();assert abs(sidebar['x']-root['x'])<=1
   else:expect(rails.first).not_to_be_visible()
   if route=='':
    banner=page.locator('.home-footer-ad');expect(banner).to_be_visible()
    ad=banner.bounding_box();links=page.locator('.home-utility-links').bounding_box();footer=page.locator('.asbc-footer').bounding_box()
    assert abs(ad['height']-(100 if width<=760 else 90))<=1,(width,ad)
    assert ad['y']>=links['y']+links['height']+7 and ad['y']+ad['height']<=footer['y'],(width,ad,links,footer)
    assert ad['x']>=0 and ad['x']+ad['width']<=width,(width,ad)
   else:expect(page.locator('.home-footer-ad')).to_have_count(0)
   if route=='build/skills':
    expect(page.locator('.skill-editor')).to_be_visible();page.wait_for_timeout(200)
    table=page.locator('.skill-table');assert table.evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'),(width,'table overflow')
   if route=='' and width in [1920,1366,390]:page.screenshot(path=str(OUT/f'after-home-{width}.png'))
  if width>=761:
   page.goto(URL+'#/build');page.get_by_role('button',name='사이드바 접기',exact=True).click();expect(page.locator('.sidebar')).to_have_class('sidebar collapsed')
   sidebar=page.locator('.sidebar').bounding_box();main=page.locator('#asbc-main').bounding_box();assert main['x']>=sidebar['x']+sidebar['width']-1
   page.get_by_role('button',name='사이드바 펼치기',exact=True).click()
 # Locale growth and restored mobile menu focus.
 for width in [1366,1920,390]:
  page.set_viewport_size({'width':width,'height':900});page.goto(URL+'#/build')
  for locale in ['ko','en','ja','fi']:
   page.locator('.asbc-language').select_option(locale);page.wait_for_timeout(200)
   assert page.evaluate('document.documentElement.scrollWidth<=document.body.clientWidth+1'),(width,locale)
   page.screenshot(path=str(OUT/f'after-build-{width}-{locale}.png'))
 page.locator('.asbc-language').select_option('ko');page.get_by_role('button',name='메뉴',exact=True).click();expect(page.locator('.sidebar')).to_have_attribute('aria-modal','true');assert page.locator('.event-timer-header').evaluate('(e)=>e.inert');page.keyboard.press('Escape');expect(page.get_by_role('button',name='메뉴',exact=True)).to_be_focused()
 page.set_viewport_size({'width':1920,'height':1080});page.goto(URL+'#privacy');expect(page.locator('.ad-rail').first).to_be_visible();assert page.evaluate('document.documentElement.scrollWidth<=document.body.clientWidth+1')
 # Reserve a real scrollbar gutter, unlike headless Chromium's default overlays.
 page.goto(URL+'#/build');gutter=page.add_style_tag(content='html{scrollbar-gutter:stable}')
 for width in [820,1024,1180,1366,1920]:
  page.set_viewport_size({'width':width,'height':768});page.wait_for_timeout(100)
  bounds=page.evaluate("""()=>({body:document.body.clientWidth,scroll:document.documentElement.scrollWidth,root:document.querySelector('#root').getBoundingClientRect().toJSON(),side:document.querySelector('.sidebar').getBoundingClientRect().toJSON()})""")
  assert bounds['scroll']<=bounds['body']+1 and bounds['root']['right']<=bounds['body']+1,bounds
  assert abs(bounds['root']['x']-bounds['side']['x'])<=1,bounds
  if width>=1360:assert page.locator('.ad-rail-right').bounding_box()['x']+page.locator('.ad-rail-right').bounding_box()['width']<=bounds['body']+1
 gutter.evaluate('(e)=>e.remove()')
 assert not errors,errors;b.close()
print('PASS ad rails/center bounds at 12 widths, five screens, editor table, sidebar collapse, 4 locales, mobile inert/focus, standalone privacy')
