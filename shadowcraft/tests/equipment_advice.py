"""Synthetic public equipment responses; no game mutations or economic claims."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from _ui import click_tab
root=Path(__file__).resolve().parents[2]
out=Path('/mnt/d/CodexData/Projects/ASBC/artifacts/character-advice-20261022');out.mkdir(parents=True,exist_ok=True)
url=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5184/lab/shadowcraft/')
ranker=next(r for r in json.loads((root/'frontend/shadowcraft/lib/data/rankers.json').read_text())['entries'] if r['classKey']=='gladiator')
items=ranker['equipment'][:2]
index=json.loads((root/'frontend/public/shadowcraft/data/item-index.json').read_text())
with sync_playwright() as p:
 browser=p.chromium.launch()
 for width,level in [(1440,20),(390,102),(320,102)]:
  page=browser.new_page(viewport={'width':width,'height':1000});errors=[];requests=[];state={'bad':False}
  page.on('pageerror',lambda e:errors.append(str(e)))
  character={'classKey':'gladiator','region':'eu','profile':{'characterId':'my-character','serverId':1304,'characterName':'My test character','characterLevel':45},'equipment':items,'importedAt':'2026-10-22T00:00:00Z','skills':[],'nodes':[],'failedBoards':[]}
  plan={'classKey':'gladiator','level':45,'mode':'damage','extraSP':0,'extraStigma':0,'extraCrystal':0,'extraBattle':0,'base':{},'bonus':{},'specs':{},'nodes':[],'checked':[],'character':character}
  page.add_init_script('localStorage.setItem("shadowcraft-selected-class","gladiator");localStorage.setItem("shadowcraft-plan-v1:gladiator",'+json.dumps(json.dumps(plan))+');')
  page.route('**/api/public/shadowcraft/catalog?*',lambda route:route.fulfill(status=503,json={}))
  def armory(route):
   q=route.request.post_data_json;requests.append(q)
   if q['action']=='profile':
    route.fulfill(json={**character,'profile':{**character['profile'],'characterId':q['id'],'characterName':ranker['name']},'equipment':items});return
   mine=q['id']=='my-character'
   route.fulfill(json={'characterId':'wrong-character' if mine and state['bad'] else q['id'],'serverId':q['server'],'region':q['region'],'slotPos':int(q['slot']),'item':{'id':int(q['itemId']),'name':'Actual MY rolls' if mine else 'Actual RANKER rolls','level':level if mine else 102,'enchantLevel':int(q['enchant']),'subStatRandom':True,'subStats':[{'id':'PvPAmplifyDamage' if int(q['slot'])==items[0]['slotPos'] else 'AmplifyAllDamage','name':'Actual damage option','value':'7%'}]}})
  page.route('**/api/public/shadowcraft/armory',armory)
  page.goto(url);page.get_by_text('내 서버에는 어떤 직업이 많을까요?',exact=True).wait_for();click_tab(page,'랭커');page.locator('.ranker-list button').first.click()
  pair=page.get_by_role('region',name='내 캐릭터와 랭커 비교',exact=True)
  expect(pair).to_contain_text('My test character')
  before=page.evaluate('localStorage.getItem("shadowcraft-plan-v1:gladiator")')
  expect(pair.locator('.aligned-slot')).to_have_count(2)
  assert not any(q['action']=='item' for q in requests),'no unsolicited per-item request fanout'
  pair.locator('.slot-selector').first.click()
  mine=pair.locator('.actual-options').first
  expect(mine).to_contain_text('Actual MY rolls');expect(pair.locator('.actual-options').nth(1)).to_contain_text('Actual RANKER rolls')
  expect(mine).to_contain_text('현재 빌드에서 낮은 우선순위')
  mine.locator('select').select_option('keep');mine.get_by_label('교체·필수 성장 비용을 제외해도 자원이 남아요').check();mine.get_by_label('모든 옵션이 내 운용에 필요한지 확인했어요').check()
  expect(mine.locator('.advice-result')).to_have_class('advice-result advice-low' if level==20 else 'advice-result advice-tune')
  mine.locator('select').select_option('replace');expect(mine.locator('.advice-result')).to_have_class('advice-result advice-replace')
  boxes=pair.locator('.option-pair > div').evaluate_all('(els)=>els.map(e=>({x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,w:e.getBoundingClientRect().width}))')
  assert abs(boxes[0]['y']-boxes[1]['y'])<1 and boxes[0]['x']+boxes[0]['w']<=boxes[1]['x'],boxes
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  pair.screenshot(path=str(out/f'comparison-{width}.png'))
  state['bad']=True;pair.locator('.slot-selector').nth(1).click();expect(pair.locator('.actual-options').first.get_by_role('alert')).to_contain_text('실제 장비 옵션을 확인하지 못했습니다.')
  state['bad']=False;pair.locator('.actual-options').first.get_by_role('button',name='다시 조회',exact=True).click()
  mine=pair.locator('.actual-options').first;expect(mine).to_contain_text('Actual MY rolls')
  mine.locator('select').select_option('keep');mine.get_by_label('교체·필수 성장 비용을 제외해도 자원이 남아요').check();mine.get_by_label('모든 옵션이 내 운용에 필요한지 확인했어요').check()
  expect(mine.locator('.advice-result')).to_have_class('advice-result advice-low' if level==20 else 'advice-result advice-engrave')
  assert page.evaluate('localStorage.getItem("shadowcraft-plan-v1:gladiator")')==before
  assert not errors,errors
  page.close()
 browser.close()
print('PASS aligned desktop/390/320, actual rolls, low-tier block, tuning/conditional engraving, identity rejection/retry, no request fanout, plan nonmutation')
