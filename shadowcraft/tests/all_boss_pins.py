"""All boss picker integration: controlled public reads and local browser settings only."""
import os,json,time
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5184/lab/shadowcraft/')
OUT=Path('/mnt/d/CodexData/Projects/ASBC/evidence/all-bosses-20261021');OUT.mkdir(parents=True,exist_ok=True)
CAT=json.loads((Path(__file__).resolve().parents[2]/'frontend/shadowcraft/lib/data/boss-catalog.json').read_text())
with sync_playwright() as p:
 b=p.chromium.launch();ctx=b.new_context(viewport={'width':1366,'height':900});page=ctx.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 def feed(r):
  now=int(time.time()*1000)
  records={x['id']:{'id':int(x['id']),'state':'dead','reportedAt':now,'nextSpawn':now+3600000,'upSince':0,'confirmed':True} for x in CAT}
  records['99999']={**records['2001'],'id':99999};del records['111001']
  r.fulfill(json={'region':'eu','server':1301,'serverNow':now,'fetchedAt':now,'refreshFailed':False,'enabled':True,'bosses':{},'allBosses':records})
 page.route('**/api/public/shadowcraft/boss-timers?*',feed)
 page.goto(URL);page.evaluate("()=>localStorage.setItem('a2bc-event-timers-v1',JSON.stringify({version:1,region:'eu',server:'1301',pinned:[],profiles:{}}))");page.reload()
 header=page.locator('.event-timer-header');page.get_by_role('button',name='고정할 콘텐츠',exact=False).click();panel=page.locator('#event-timer-pins')
 expect(panel.locator('.event-boss-options input')).to_have_count(50)
 panel.get_by_label('보스 검색',exact=True).fill('네이켈');expect(panel.locator('.event-boss-options input')).to_have_count(1)
 panel.get_by_label('동쪽의 네이켈 · 천족',exact=True).check();expect(header.locator('[data-boss-id="101001"] strong')).to_have_text(__import__('re').compile(r'\d+:\d+:\d+'))
 panel.get_by_label('보스 검색',exact=True).fill('');panel.get_by_label('진영 필터',exact=True).select_option('asmodian');expect(panel.locator('.event-boss-options input')).to_have_count(24)
 panel.get_by_label('녹아내린 다나르 · 마족',exact=True).check();expect(header.locator('[data-boss-id="111001"]')).to_contain_text('관측 기록 없음')
 panel.get_by_label('진영 필터',exact=True).select_option('shared');panel.get_by_label('정령왕 아그로 · 공통',exact=True).check();panel.get_by_label('진영 필터',exact=True).select_option('unknown');panel.get_by_label('보스 #99999 · 이름 미확인 · 진영 미확인',exact=True).check()
 page.keyboard.press('Escape');page.reload();expect(header.locator('.event-timer-card')).to_have_count(4)
 page.goto(URL+'#/build');expect(header.locator('[data-boss-id="101001"]')).to_be_visible()
 page.get_by_role('button',name='고정할 콘텐츠',exact=False).click()
 for checkbox in panel.locator('.event-boss-options input').all():checkbox.check()
 expect(header.locator('.event-timer-card')).to_have_count(50)
 page.keyboard.press('Escape');page.reload();expect(header.locator('.event-timer-card')).to_have_count(50)
 for width in [320,390,1366]:
  page.set_viewport_size({'width':width,'height':900});page.get_by_role('button',name='고정할 콘텐츠',exact=False).click()
  expect(panel).to_be_visible();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  assert header.bounding_box()['height']<250
  page.screenshot(path=str(OUT/f'all-bosses-{width}.png'));page.keyboard.press('Escape')
 assert not errors,errors
 b.close()
print('PASS full catalog/search/factions/unknown IDs/countdown/missing records/50 pins/reload/navigation/mobile bounds')
