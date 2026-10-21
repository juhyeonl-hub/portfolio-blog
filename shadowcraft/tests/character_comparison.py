"""Read-only saved character comparison; controlled observations, not ranker claims."""
import json,os
from playwright.sync_api import sync_playwright,expect
from _ui import open_section, pick_class, open_build, open_library
url=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
with sync_playwright() as p:
 browser=p.chromium.launch();page=browser.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('**/api/public/shadowcraft/catalog?*',lambda r:r.fulfill(status=503,json={}))
 character={'profile':{'characterName':'Comparison','characterLevel':45,'serverName':'Test'},'equipment':[{'id':1,'slotPos':1,'slotPosName':'MainHand','name':'Sword','enchantLevel':10,'exceedLevel':0}],'skills':[{'id':1,'name':'Strike','skillLevel':10,'equip':1},{'id':2,'name':'Guard','skillLevel':5,'equip':1}],'nodes':['1','2'],'failedBoards':[]}
 current={'classKey':'assassin','level':45,'mode':'safe','extraSP':0,'extraStigma':0,'extraCrystal':0,'extraBattle':0,'base':{},'bonus':{},'specs':{},'nodes':[],'checked':[],'character':character}
 saved=json.loads(json.dumps(current));saved['character']['equipment'][0]['enchantLevel']=12;saved['character']['skills'][0]['skillLevel']=11;saved['character']['nodes']=['2','3']
 library={'schema':'a2bc-build-library-v1','classKey':'assassin','entries':[{'id':'comparison','name':'Compare sample','catalogVersion':'2.0.7.0','savedAt':'2026-10-18T00:00:00Z','plan':saved}],'recovery':None}
 values={'shadowcraft-plan-v1':json.dumps(current),'a2bc-build-library-v1:assassin':json.dumps(library)}
 page.add_init_script('for(const [key,value] of Object.entries('+json.dumps(values)+'))localStorage.setItem(key,value);')
 page.goto(url,wait_until='domcontentloaded');open_library(page);page.locator('.database-list button').filter(has_text='Compare sample').click()
 comparison=page.get_by_role('region',name='캐릭터 조회 결과 비교',exact=True)
 expect(comparison).to_contain_text('강화 +10');expect(comparison).to_contain_text('강화 +12');expect(comparison).to_contain_text('공통 1개 · 현재 조회에만 1개 · 보관 조회에만 1개')
 expect(comparison.locator('tbody tr')).to_have_count(2)
 comparison.get_by_label('차이 있는 항목만 보기').uncheck();expect(comparison.locator('tbody tr')).to_have_count(3)
 for key,value in values.items():assert page.evaluate('(key)=>localStorage.getItem(key)',key)==value
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 page.get_by_role('button',name='복원 취소',exact=True).click()
 for key,value in values.items():assert page.evaluate('(key)=>localStorage.getItem(key)',key)==value
 assert not errors,errors
 print('PASS comparison rows, filter, node counts, preview/cancel nonmutation and mobile')
 browser.close()
