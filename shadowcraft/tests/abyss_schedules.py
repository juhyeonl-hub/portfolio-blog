"""Scheduled Abyss pins stay usable without the sightings API and preserve old settings."""
import os,json,re
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5184/lab/shadowcraft/')
OUT=Path('/mnt/d/CodexData/Projects/ASBC/evidence/abyss-schedules-20261022');OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch();ctx=b.new_context(viewport={'width':1366,'height':900});page=ctx.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('**/api/public/shadowcraft/boss-timers?*',lambda r:r.fulfill(status=503,json={}))
 initial={'version':1,'region':'eu','server':'1301','pinned':['shugo'],'pinnedBosses':['2001'],'profiles':{'eu:1301':{'offset':0,'dimension':'invasion','hidden':[],'times':{'gartua':'09:00'}}}}
 page.goto(URL);page.evaluate('(x)=>localStorage.setItem("a2bc-event-timers-v1",JSON.stringify(x))',initial);page.reload()
 page.get_by_role('button',name='고정할 콘텐츠',exact=False).click();panel=page.locator('#event-timer-pins');panel.get_by_role('group',name='진영 필터').get_by_role('button',name='어비스',exact=True).click();expect(panel.locator('.event-boss-options input')).to_have_count(6)
 names=['감시자 카이라','수호신장 나흐마','집행자 타마사','집행자 아그로','집행자 카이라']
 for name in names:panel.get_by_label(name+' · 어비스',exact=True).check()
 saved=page.evaluate('JSON.parse(localStorage.getItem("a2bc-event-timers-v1"))')
 assert len(saved['pinnedSchedules'])==5 and saved['pinnedBosses']==initial['pinnedBosses'] and saved['pinned']==initial['pinned'] and saved['profiles']==initial['profiles']
 page.keyboard.press('Escape');page.reload();cards=page.locator('.event-timer-card');expect(cards).to_have_count(7)
 for name in names:
  card=cards.filter(has_text=name);expect(card.locator('strong')).to_have_text(re.compile(r'\d+:\d+:\d+'));expect(card).to_contain_text('서버 기준 · 참고 일정');expect(card).not_to_contain_text('조회 실패')
 expect(page.locator('[data-boss-id="2001"]')).to_contain_text('조회 실패')
 page.goto(URL+'#/build');expect(cards).to_have_count(7)
 other=ctx.new_page();other.goto(URL);other.evaluate("()=>{const x=JSON.parse(localStorage.getItem('a2bc-event-timers-v1'));x.pinnedSchedules=x.pinnedSchedules.slice(0,4);localStorage.setItem('a2bc-event-timers-v1',JSON.stringify(x))}");expect(cards).to_have_count(6);other.close()
 for width in [320,390,1366]:
  page.set_viewport_size({'width':width,'height':900});page.get_by_role('button',name='고정할 콘텐츠',exact=False).click();panel.get_by_role('group',name='진영 필터').get_by_role('button',name='어비스',exact=True).click();expect(panel.locator('.event-boss-options input')).to_have_count(6);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path=str(OUT/f'abyss-{width}.png'));page.keyboard.press('Escape')
 page.get_by_role('button',name='고정할 콘텐츠',exact=False).click();before=page.evaluate('localStorage.getItem("a2bc-event-timers-v1")');page.evaluate("()=>{Storage.prototype.setItem=()=>{throw Error('저장 공간 부족')}}");panel.get_by_label('집행자 카이라 · 어비스',exact=True).click();expect(panel.get_by_label('집행자 카이라 · 어비스',exact=True)).not_to_be_checked();expect(page.locator('.event-timer-header').get_by_role('alert')).to_contain_text('저장 공간 부족');assert page.evaluate('localStorage.getItem("a2bc-event-timers-v1")')==before
 assert not errors,errors;b.close()
print('PASS six Abyss bosses, separate pins, five schedules without feed, reload/navigation/cross-tab, mobile and storage failure')
