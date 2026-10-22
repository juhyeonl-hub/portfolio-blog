"""Synthetic goal comparison and character-modal checks; no real accounts or game writes."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from _ui import click_tab,open_build
root=Path(__file__).resolve().parents[2]
out=Path('/mnt/d/CodexData/Projects/ASBC/artifacts/comparison-workflow-20261022');out.mkdir(parents=True,exist_ok=True)
url=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5184/lab/shadowcraft/')
c=json.loads((root/'frontend/shadowcraft/lib/data/catalogs/gladiator.json').read_text());b=c['boards'][0]
auto=next(n for n in b['nodes'] if n['autoLearn'])
paths={auto['id']:[auto['id']]};queue=[auto]
while queue:
 n=queue.pop(0)
 for other in b['nodes']:
  if other['id'] not in paths and abs(n['row']-other['row'])+abs(n['column']-other['column'])==1:
   paths[other['id']]=paths[n['id']]+[other['id']];queue.append(other)
branches=[v for v in paths.values() if len(v)>3]
pa,pb=next((a,z) for a in branches for z in branches if set(a)-set(z) and set(z)-set(a) and len(set(a)&set(z))>1)
owned=pa;goal=pb
kept=len((set(owned)&set(goal))-{auto['id']});removed=len(set(owned)-set(goal));added=len(set(goal)-set(owned))
cls=next(x for x in json.loads((root/'frontend/shadowcraft/lib/data/class-profiles.json').read_text()) if x['key']=='gladiator')
with sync_playwright() as p:
 browser=p.chromium.launch()
 for width in [1440,390,320]:
  page=browser.new_page(viewport={'width':width,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  character={'classKey':'gladiator','region':'eu','profile':{'characterId':'own','serverId':1304,'characterName':'Own character','characterLevel':45},'nodes':owned,'equipment':[],'skills':[],'failedBoards':[],'importedAt':'2026-10-22T00:00:00Z'}
  plan={'classKey':'gladiator','level':45,'mode':'damage','extraSP':0,'extraStigma':0,'extraCrystal':0,'extraBattle':0,'base':{},'bonus':{},'specs':{},'nodes':owned,'checked':[],'character':character,'pointBudget':{'sp':0,'stigma':0,'crystal':0,'battle':0}}
  page.add_init_script('localStorage.setItem("shadowcraft-selected-class","gladiator");localStorage.setItem("shadowcraft-plan-v1:gladiator",'+json.dumps(json.dumps(plan))+');')
  page.route('**/api/public/shadowcraft/catalog?*',lambda route:route.fulfill(status=503,json={}))
  def armory(route):
   q=route.request.post_data_json
   route.fulfill(json={'classKey':q['class'],'region':q['region'],'profile':{'characterId':q['id'],'serverId':int(q['server']),'pcId':cls['pcIds'][0]},'nodes':goal,'failedBoards':[],'boards':[{'id':b['id'],'open':1}],'importedAt':'2026-10-22T00:00:00Z','skills':[],'equipment':[]})
  page.route('**/api/public/shadowcraft/armory',armory)
  page.goto(url);page.get_by_text('내 서버에는 어떤 직업이 많을까요?',exact=True).wait_for(state='attached');click_tab(page,'랭커');page.locator('.ranker-list button').first.click()
  before=page.evaluate('localStorage.getItem("shadowcraft-plan-v1:gladiator")')
  page.get_by_role('button',name='데바니온 따라하기 미리보기',exact=True).click()
  panel=page.get_by_role('region',name='데바니온 목표 비교',exact=True)
  expect(panel).to_be_visible();expect(panel.locator('.goal-node.keep')).to_have_count(kept);expect(panel.locator('.goal-node.remove')).to_have_count(removed);expect(panel.locator('.goal-node.add')).to_have_count(added)
  expect(page.get_by_role('button',name='이 데바니온 배치 적용',exact=True)).to_be_disabled()
  expect(panel).to_contain_text('내 캐릭터 실제 배치 기준')
  panel.locator('.goal-node.add').first.click();expect(panel.get_by_role('status')).to_contain_text('추가로 찍을 목표 노드')
  for i,board in enumerate(c['boards']):
   rendered=panel.locator('.goal-board').nth(i)
   expect(rendered.locator('.goal-node')).to_have_count(len(board['nodes']))
   assert rendered.locator('img').first.evaluate('(e)=>e.complete&&e.naturalWidth>0')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  panel.screenshot(path=str(out/f'goals-{width}.png'))
  assert page.evaluate('localStorage.getItem("shadowcraft-plan-v1:gladiator")')==before
  page.get_by_role('button',name='취소',exact=True).click();expect(panel).to_have_count(0)
  assert page.evaluate('localStorage.getItem("shadowcraft-plan-v1:gladiator")')==before
  assert not errors,errors
  page.close()
 # Short displays: no visible scrollbar, but all content remains scrollable and closing unlocks the page.
 for width,height in [(1440,900),(390,600),(320,480)]:
  page=browser.new_page(viewport={'width':width,'height':height})
  page.route('**/api/public/shadowcraft/catalog?*',lambda route:route.fulfill(status=503,json={}))
  page.goto(url);page.get_by_text('내 서버에는 어떤 직업이 많을까요?',exact=True).wait_for(state='attached');open_build(page)
  page.get_by_role('button',name='내 캐릭터 연결',exact=True).click()
  modal=page.locator('.character-import-backdrop .modal')
  expect(modal).to_be_visible();expect(modal).to_contain_text('Steam 로그인은 사이트 계정 확인용입니다.')
  assert page.evaluate('document.body.style.overflow')=='hidden'
  assert modal.evaluate('(e)=>getComputedStyle(e).scrollbarWidth')=='none'
  modal.locator('.quiet-note').scroll_into_view_if_needed();expect(modal.locator('.quiet-note')).to_be_in_viewport()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  modal.screenshot(path=str(out/f'character-modal-{width}.png'))
  modal.get_by_role('button',name='닫기',exact=True).click()
  assert page.evaluate('document.body.style.overflow')!='hidden'
  page.close()
 browser.close()
print('PASS zero-budget goal preview, green/red/orange nodes, all board images, click details, disabled over-budget application, nonmutation, 1440/390/320, scroll-hidden usable character modal')
