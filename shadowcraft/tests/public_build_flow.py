"""Read-only public previews, quickslot usability and nonofficial navigation audit."""
import base64,json,os
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright,expect
from _ui import open_section,pick_class,click_tab
root=Path(__file__).resolve().parents[2]
out=Path('/mnt/d/CodexData/Projects/ASBC/artifacts/public-build-flow-20261022')
url=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5184/lab/shadowcraft/')
id='11111111-1111-1111-1111-111111111111'
catalog=json.loads((root/'frontend/shadowcraft/lib/data/catalogs/assassin.json').read_text())
plan={'classKey':'assassin','level':45,'mode':'safe','extraSP':0,'extraStigma':0,'extraCrystal':0,'extraBattle':0,'character':None,'checked':[],'base':{},'bonus':{},'specs':{},'nodes':[n['id'] for n in catalog['boards'][0]['nodes'][:4]]}
shared={'schema':'a2bc-share-v1','catalogVersion':catalog['version'],'plan':plan}
row={'id':id,'author':'Test author','title':'초보자 빌드 테스트','description':'<b>꾸미지 않은 본문</b>','classKey':'assassin','catalogVersion':catalog['version'],'published':True,'revision':0,'updatedAt':'2026-10-22T00:00:00Z'}
def audit(page):
 for href in page.locator('a[href]').evaluate_all('(els)=>els.map(e=>e.href)'):
  u=urlsplit(href)
  if u.scheme in ['mailto','blob'] or u.hostname in ['127.0.0.1','localhost','asbc.app']:continue
  assert u.scheme=='https' and any(u.hostname==h or u.hostname.endswith('.'+h) for h in ['plaync.com','ncsoft.com','steampowered.com','steamcommunity.com']),href
with sync_playwright() as p:
 b=p.chromium.launch();errors=[]
 for width in [1920,390,320]:
  context=b.new_context(viewport={'width':width,'height':1000});page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  def api(route):
   path=urlsplit(route.request.url).path
   if path.endswith('/community'):route.fulfill(json={'votes':3,'voted':False})
   elif path.endswith('/'+id):route.fulfill(json={**row,'shared':shared})
   elif path.endswith('/builds'):route.fulfill(json={'items':[row],'page':0,'totalElements':1,'totalPages':1})
   else:route.fulfill(status=503,json={})
  page.route('**/api/**',api)
  page.goto(url+'#/public-builds');page.get_by_role('link',name=row['title'],exact=True).wait_for()
  assert page.get_by_label('내 게시물만',exact=True).count()==0
  before=page.evaluate('JSON.stringify(localStorage)')
  page.get_by_role('link',name=row['title'],exact=True).click()
  expect(page.locator('.visual-build-preview')).to_be_visible();expect(page.locator('.reader-sidebar')).to_be_visible()
  if width<900:assert page.locator('.reader-sidebar').bounding_box()['height']<240
  assert page.locator('.community-account').count()==0
  assert page.locator('.preview-skill img').count()>10
  assert page.locator('.goal-node.keep').count()>=4
  assert page.get_by_role('button',name='내 게시물 수정',exact=True).count()==0
  page.locator('.preview-tabs').get_by_role('button',name='선택한 데바니온').click()
  page.locator('.goal-node').first.click();expect(page.locator('.visual-build-preview [role=status]')).to_be_visible()
  assert page.evaluate('JSON.stringify(localStorage)')==before
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  audit(page);page.evaluate('window.scrollTo(0,0)');page.screenshot(path=str(out/f'public-detail-{width}.png'),full_page=True)
  # Apply remains explicit and undoable; preview does not write session pending state.
  assert page.evaluate("sessionStorage.getItem('asbc-pending-shared-plan')") is None
  page.get_by_role('button',name='내 플래너에 적용',exact=True).click()
  expect(page.locator('#build-section-skills')).to_be_visible()
  expect(page.get_by_role('button',name='빌드 적용 전으로 되돌리기',exact=True)).to_be_visible()
  context.close()
 page=b.new_page(viewport={'width':1920,'height':1000});page.on('pageerror',lambda e:errors.append(str(e)));page.route('**/api/**',lambda r:r.fulfill(status=503,json={}))
 page.goto(url);open_section(page,'매크로 & 키 배치')
 for profile in json.loads((root/'frontend/shadowcraft/lib/data/class-profiles.json').read_text()):
  pick_class(page,profile['name']);macro=page.locator('#build-section-macro');expect(macro.locator('.visual-macro')).to_be_visible()
  assert macro.locator('.manual-key-grid article').count()>=len(set(profile['movement']+profile['manual']))
  assert '파티·회복·버프·충전 타이밍 직접 관리' not in macro.inner_text()
  assert 'A열' not in macro.inner_text() and '0행' not in macro.inner_text()
  for column in macro.locator('.quickslot-column').all():assert column.locator('.quickslot-cell').count()==4
  audit(page)
  if profile['key']=='ranger':
   macro.screenshot(path=str(out/'ranger-macro-pc.png'))
   for width in [390,320]:
    page.set_viewport_size({'width':width,'height':1000});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');macro.screenshot(path=str(out/f'ranger-macro-{width}.png'))
   page.set_viewport_size({'width':1920,'height':1000})
 for name in ['메인','랭커','업데이트','글로벌 데이터','지도 & 수집']:
  click_tab(page,name);page.wait_for_timeout(200);audit(page)
 # Signed-in owner and reader controls, using isolated API fixtures only.
 for member_id in ['owner','reader']:
  context=b.new_context();member_page=context.new_page();member_page.on('pageerror',lambda e:errors.append(str(e)))
  context.add_init_script("sessionStorage.setItem('a2bc-member-session-v1',JSON.stringify({token:'fixture-only'}))")
  voted=[False];post={**row,'authorId':'owner','shared':shared}
  def member_api(route):
   req=route.request;path=urlsplit(req.url).path
   if path.endswith('/me'):route.fulfill(json={'id':member_id,'username':'Fixture','steamLinked':True})
   elif path.endswith('/community'):route.fulfill(json={'votes':int(voted[0]),'voted':voted[0]})
   elif path.endswith('/vote'):
    assert req.method in ['PUT','DELETE'];voted[0]=req.method=='PUT';route.fulfill(json={})
   elif path.endswith('/'+id):
    if req.method=='PUT':post.update(req.post_data_json);post['revision']+=1
    route.fulfill(json=post)
   else:route.fulfill(status=503,json={})
  context.route('**/api/**',member_api);member_page.goto(url+'#published='+id)
  expect(member_page.get_by_role('button',name='좋아요',exact=True)).to_be_enabled()
  member_page.get_by_role('button',name='좋아요',exact=True).click()
  expect(member_page.get_by_role('button',name='좋아요 취소',exact=True)).to_contain_text('1')
  member_page.get_by_role('button',name='좋아요 취소',exact=True).click()
  expect(member_page.get_by_role('button',name='좋아요',exact=True)).to_contain_text('0')
  if member_id=='owner':
   member_page.get_by_role('button',name='내 게시물 수정',exact=True).click()
   member_page.get_by_label('수정 제목',exact=True).fill('수정된 게시글')
   member_page.get_by_role('button',name='게시물 수정 저장',exact=True).click()
   expect(member_page.get_by_role('heading',name='수정된 게시글',exact=True)).to_be_visible()
  else:assert member_page.get_by_role('button',name='내 게시물 수정',exact=True).count()==0
  assert member_page.locator('.community-account').count()==0
  context.close()
 assert not errors,errors
 b.close()
print('Public board/detail, visual read-only storage, explicit apply/undo, all 8 macro classes, official links, 1920/390/320 PASS')
