"""Official schedule display only. No game health inference, account or public writes."""
import json,os
from pathlib import Path
from datetime import datetime,timezone
from playwright.sync_api import sync_playwright,expect
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5184/lab/shadowcraft/')
OUT=Path('/mnt/d/CodexData/Projects/ASBC/evidence/maintenance-20261021');OUT.mkdir(parents=True,exist_ok=True)
fixture=json.loads((Path(__file__).resolve().parent/'fixtures/maintenance-notice.json').read_text());messages=json.loads((Path(__file__).resolve().parents[2]/'frontend/shadowcraft/lib/data/ui-translations.json').read_text())
def translated(key,locale):return key if locale=='ko' else messages[key][locale]
with sync_playwright() as p:
 b=p.chromium.launch();ctx=b.new_context(timezone_id='Europe/Helsinki',viewport={'width':1366,'height':900});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 state={'failed':False,'completed':False,'extended':False,'unknown':False}
 def official(route):
  assert route.request.headers.get('cookie') is None
  if state['failed']:route.fulfill(status=503,json={});return
  detail=json.loads(json.dumps(fixture));meta=detail['article']['contentMeta']
  if state['completed']:meta['title']+=' (Completed)'
  if state['extended']:meta['title']+=' (Extended)'
  if state['unknown']:detail['article']['content']['content']='<p>Schedule to follow</p>';meta['timestamps']['postedAt']='2026-10-21T07:00:00Z'
  route.fulfill(json={'contentList':[meta]} if 'search/' in route.request.url else detail)
 page.route('**/api-global-community.plaync.com/**',official)
 page.clock.install(time=datetime(2026,10,21,9,tzinfo=timezone.utc));page.goto(URL)
 banner=page.locator('.maintenance-banner');expect(banner).to_contain_text('서버 점검 시간 (공식 일정 기준)');expect(banner).to_contain_text('오후 03:00 GMT+3');expect(banner).to_contain_text('약 180분 남음')
 assert banner.locator('a').get_attribute('href').startswith('https://aion2.plaync.com/en-us/board/notice/view?articleId=')
 for width in [320,390,1366]:
  page.set_viewport_size({'width':width,'height':900})
  for locale in ['ko','en','ja','fi']:
   page.locator('.asbc-language').select_option(locale);expect(banner).to_contain_text(translated('서버 점검 시간 (공식 일정 기준)',locale));assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,locale)
   page.screenshot(path=str(OUT/f'maintenance-{width}-{locale}.png'))
 page.locator('.asbc-language').select_option('ko');page.goto(URL+'#/build/skills');expect(page.locator('.skill-editor')).to_be_visible();page.wait_for_timeout(500)
 assert page.locator('.build-pills').bounding_box()['y']>=page.locator('.event-timer-header').bounding_box()['height']-1
 # Refresh failure preserves uncertainty, never claims an actual outage.
 state['failed']=True;page.clock.fast_forward(5*60*1000+1000);expect(banner).to_contain_text('공지 갱신 실패 · 마지막으로 확인한 일정입니다.');expect(banner).to_contain_text('종료 예정:')
 page.clock.fast_forward(11*60*1000);expect(banner).to_contain_text('점검 공지 확인 필요');expect(banner).to_contain_text('조회 실패가 서버 점검을 뜻하지는 않습니다.')
 state['failed']=False;state['extended']=True;page.reload();expect(banner).to_contain_text('종료 예정 시각 미정');expect(banner).not_to_contain_text('종료 예정:')
 state['extended']=False;page.clock.set_system_time(datetime(2026,10,21,12,1,tzinfo=timezone.utc));page.reload();expect(banner).to_contain_text('점검 종료 확인 필요')
 state['completed']=True;page.reload();page.wait_for_timeout(400);expect(banner).to_have_count(0)
 state['completed']=False;state['unknown']=True;page.reload();expect(banner).to_contain_text('공식 점검 공지');expect(banner).not_to_contain_text('서버 점검 시간')
 state['unknown']=False;page.clock.set_system_time(datetime(2026,10,22,12,tzinfo=timezone.utc));page.reload();page.wait_for_timeout(400);expect(banner).to_have_count(0)
 state['failed']=True;page.reload();page.wait_for_timeout(400);expect(banner).to_have_count(0)
 assert not errors,errors;b.close()
print('PASS official maintenance local ETA, 4 locales/3 widths, sticky anchors, refresh failure, extension unknown ETA, overdue, completion, unknown and expiry; no credentials')
