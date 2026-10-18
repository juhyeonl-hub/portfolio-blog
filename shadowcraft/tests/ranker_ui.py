import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
root=Path(__file__).resolve().parents[2]
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
with sync_playwright() as p:
 browser=p.chromium.launch()
 for width in [1440,390]:
  page=browser.new_page(viewport={'width':width,'height':1000});errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  def armory(route):
   q=route.request.post_data_json
   c=json.loads((root/f'frontend/shadowcraft/lib/data/catalogs/{q["class"]}.json').read_text())
   board=c['boards'][0];auto=[n for n in board['nodes'] if n['autoLearn']][0]
   node=next(n for n in board['nodes'] if not n['autoLearn'] and abs(n['row']-auto['row'])+abs(n['column']-auto['column'])==1)
   cls=next(c for c in json.loads((root/'frontend/shadowcraft/lib/data/class-profiles.json').read_text()) if c['key']==q['class'])
   route.fulfill(json={'classKey':q['class'],'region':q['region'],'profile':{'characterId':q['id'],'serverId':int(q['server']),'pcId':cls['pcIds'][0]},'nodes':[auto['id'],node['id']],'failedBoards':[],'boards':[{'id':board['id'],'open':1}],'skills':[],'equipment':[]})
  page.route('**/api/public/shadowcraft/armory',armory)
  page.goto(URL);page.get_by_role('tab',name='빌드 선택',exact=True).click()
  panel=page.get_by_role('region',name='랭커 빌드 분석',exact=True)
  expect(panel.locator('.ranker-list button')).to_have_count(10)
  key='shadowcraft-plan-v1'
  page.get_by_role('button',name='이 빌드 미리보기',exact=True).click()
  page.get_by_role('button',name='이 빌드 적용',exact=True).click()
  page.get_by_role('button',name='빌드 적용 전으로 되돌리기',exact=True).click()
  before=page.evaluate('(key)=>localStorage.getItem(key)',key)
  panel.locator('.ranker-list button').first.click()
  panel.get_by_role('button',name='데바니온 따라하기 미리보기',exact=True).click()
  expect(panel.get_by_role('button',name='이 데바니온 배치 적용')).to_be_visible()
  assert page.evaluate('(key)=>localStorage.getItem(key)',key)==before
  panel.get_by_role('button',name='취소',exact=True).click()
  assert page.evaluate('(key)=>localStorage.getItem(key)',key)==before
  panel.get_by_role('button',name='데바니온 따라하기 미리보기',exact=True).click()
  panel.get_by_role('button',name='이 데바니온 배치 적용').click()
  after=json.loads(page.evaluate('(key)=>localStorage.getItem(key)',key));old=json.loads(before)
  for field in ['base','gear','character','bonus']:assert after.get(field)==old.get(field),field
  page.get_by_role('button',name='적용 전으로 되돌리기').click()
  assert json.loads(page.evaluate('(key)=>localStorage.getItem(key)',key))==old
  for name in ['검성','수호성','궁성','살성','정령성','마도성','치유성','호법성']:
   page.locator('.class-picker button').filter(has_text=name).click()
   expect(panel.locator('.ranker-list button')).to_have_count(10)
   expect(panel.locator('.ranker-detail')).to_have_count(0)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  page.screenshot(path=f'/tmp/a2bc-rankers-{width}.png',full_page=True)
  assert not errors,errors
  page.close()
 browser.close()
print('PASS eight classes/top10, preview/cancel/apply/undo preservation, class switch isolation and mobile')
