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
  response_mode={"value":"normal"}
  def armory(route):
   if response_mode["value"]=="error":
    route.fulfill(status=503,json={"error":"test official unavailable"});return
   q=route.request.post_data_json
   c=json.loads((root/f'frontend/shadowcraft/lib/data/catalogs/{q["class"]}.json').read_text())
   board=c['boards'][0];auto=[n for n in board['nodes'] if n['autoLearn']][0]
   node=next(n for n in board['nodes'] if not n['autoLearn'] and abs(n['row']-auto['row'])+abs(n['column']-auto['column'])==1)
   cls=next(c for c in json.loads((root/'frontend/shadowcraft/lib/data/class-profiles.json').read_text()) if c['key']==q['class'])
   route.fulfill(json={'classKey':q['class'],'region':q['region'],'profile':{'characterId':q['id'],'serverId':int(q['server']),'pcId':cls['pcIds'][0]},'nodes':[auto['id'],node['id']],'failedBoards':[],'boards':[{'id':board['id'],'open':1}],'importedAt':'2026-10-19T00:00:00Z','skills':[] if response_mode['value']=='empty' else [{'id':int(c['skills'][0]['id']),'name':'Test public skill','category':'Active','skillLevel':40,'equip':1}],'equipment':[]})
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
  expect(panel.get_by_role('button',name='데바니온 따라하기 미리보기',exact=True)).to_be_visible()
  skills=panel.locator('.ranker-skills')
  skills.locator('summary').click()
  expect(skills.get_by_text('Lv.40',exact=False)).to_be_visible()
  expect(panel.locator('.ranker-observation')).to_contain_text('공식 상세 조회:')
  response_mode['value']='empty'
  panel.get_by_role('button',name='공식 세팅 다시 조회',exact=True).click()
  expect(skills.get_by_text('표시할 스킬 정보를 확인하지 못했습니다.',exact=False)).to_be_visible()
  expect(skills.locator('li')).to_have_count(0)
  response_mode['value']='error'
  panel.get_by_role('button',name='공식 세팅 다시 조회',exact=True).click()
  expect(panel.get_by_role('alert')).to_have_text('test official unavailable')
  expect(panel.locator('.ranker-observation')).to_contain_text('저장 자료 표시:')
  response_mode['value']='normal'
  panel.get_by_role('button',name='공식 세팅 다시 조회',exact=True).click()
  expect(skills.get_by_text('Lv.40',exact=False)).to_be_visible()
  skills.locator('summary').click()
  panel.locator('.ranker-preparation > summary').click()
  expect(panel.locator('.ranker-preparation li')).to_have_count(4)
  panel.locator('.ranker-preparation > summary').click()
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
   equipment=panel.locator('.ranker-equipment-compare')
   equipment.locator(':scope > summary').click()
   first=equipment.get_by_label('기준 캐릭터',exact=True)
   second=equipment.get_by_label('비교 캐릭터',exact=True)
   ids=first.locator('option').evaluate_all('(nodes)=>nodes.map(n=>n.value)')
   assert first.input_value()==ids[0] and second.input_value()==ids[1]
   old_plan=page.evaluate('(key)=>localStorage.getItem(key)',key)
   status=equipment.get_by_role('status').inner_text()
   first.select_option(ids[1]);second.select_option(ids[0])
   expect(equipment.get_by_role('status')).to_have_text(status)
   second.select_option(ids[1])
   expect(equipment.locator('.ranker-equipment-row')).to_have_count(0)
   expect(equipment.get_by_text('확인된 장비·강화·초월이 같습니다.',exact=True)).to_be_visible()
   equipment.get_by_role('checkbox').uncheck()
   assert equipment.locator('.ranker-equipment-row').count()>0
   assert page.evaluate('(key)=>localStorage.getItem(key)',key)==old_plan
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   equipment.locator(':scope > summary').click()
   panel.locator('.ranker-analysis > summary').click()
   compare=panel.get_by_role('region',name='빌드 구성 비교',exact=True)
   selectors=[compare.get_by_label('기준 구성',exact=True),compare.get_by_label('비교 구성',exact=True)]
   values=selectors[0].locator('option').evaluate_all('(nodes)=>nodes.map(n=>n.value)')
   assert selectors[0].input_value()==values[0]
   assert selectors[1].input_value()==values[min(1,len(values)-1)]
   unchanged=page.evaluate('(key)=>localStorage.getItem(key)',key)
   for a,b in [(0,len(values)-1),(len(values)-1,0),(0,0)]:
    selectors[0].select_option(values[a]);selectors[1].select_option(values[b])
    left,right=set(filter(None,values[a].split(','))),set(filter(None,values[b].split(',')))
    expect(compare.locator('.ranker-shared > summary')).to_have_text(f'공통 기술 {len(left&right)}개')
    expect(compare.locator('.ranker-difference > h4').nth(0)).to_have_text(f'기준 구성에만 있는 기술 · {len(left-right)}개')
    expect(compare.locator('.ranker-difference > h4').nth(1)).to_have_text(f'비교 구성에만 있는 기술 · {len(right-left)}개')
    if a==b:expect(compare.get_by_role('status')).to_have_text('두 구성의 공개 장착 기술이 같습니다.')
    assert page.evaluate('(key)=>localStorage.getItem(key)',key)==unchanged
   selectors[1].select_option(values[min(1,len(values)-1)])
   guidance=panel.locator('.ranker-guidance').filter(has=page.locator('h4')).first
   guidance.locator(':scope > summary').click()
   expect(guidance.locator('h4').first).to_be_visible()
   expect(guidance.get_by_text('활용 제안:',exact=True).first).to_be_visible()
   guidance.locator('details > summary').first.click()
   expect(guidance.get_by_text('글로벌 Steam 기본 설명',exact=False).first).to_be_visible()
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   guidance.locator(':scope > summary').click()
   panel.locator('.ranker-analysis > summary').click()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  page.screenshot(path=f'/tmp/a2bc-rankers-{width}.png',full_page=True)
  assert not errors,errors
  page.close()
 browser.close()
print('PASS eight classes/top10, guidance, group comparison/reset/nonmutation, preview/cancel/apply/undo preservation and mobile')
