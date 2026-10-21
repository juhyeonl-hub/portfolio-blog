"""Public directory and admin publishing UI with controlled API fixtures."""
import base64,json,os
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright,expect
from _ui import click_tab
url=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
origin=url.split('/lab/')[0]
id='11111111-1111-1111-1111-111111111111'
plan={'classKey':'assassin','level':45,'mode':'safe','extraSP':0,'extraStigma':0,'extraCrystal':0,'extraBattle':0,'character':None,'checked':[],'base':{},'bonus':{},'specs':{},'nodes':[]}
shared={'schema':'a2bc-share-v1','catalogVersion':'2.0.7.0','plan':plan}
row={'id':id,'title':'Reviewed build','description':'Plain <b>text</b>','classKey':'assassin','catalogVersion':'2.0.7.0','published':True,'revision':0,'updatedAt':'2026-10-16T00:00:00Z'}
with sync_playwright() as p:
 b=p.chromium.launch(headless=True);context=b.new_context(viewport={'width':1440,'height':1000});page=context.new_page();requests=[];errors=[];mode=['ok']
 page.on('pageerror',lambda e:errors.append(str(e)))
 def public(route):
  requests.append(route.request.url);parsed=urlparse(route.request.url)
  if parsed.path.endswith('/'+id):
   if mode[0]=='missing':route.fulfill(status=404,json={'error':'Not found'})
   else:route.fulfill(json={**row,'shared':shared})
  elif mode[0]=='invalid':route.fulfill(json={'items':[{}]})
  else:
   query=parse_qs(parsed.query);items=[] if query.get('class')==['gladiator'] or query.get('q')==['missing'] else [row]
   route.fulfill(json={'items':items,'page':int(query.get('page',['0'])[0]),'totalElements':len(items),'totalPages':len(items)})
 page.route('**/api/public/shadowcraft/builds**',public)
 page.goto(url);page.get_by_role('tab',name='공개 빌드',exact=True).wait_for();assert not requests
 before=page.evaluate('JSON.stringify(localStorage)')
 click_tab(page,'공개 빌드');panel=page.get_by_role('region',name='공개 빌드 목록',exact=True)
 expect(panel.get_by_role('heading',name='Reviewed build')).to_be_visible()
 expect(panel).to_contain_text('Plain <b>text</b>');assert panel.locator('article b').count()==0
 panel.get_by_label('빌드 직업').select_option('gladiator');expect(panel).to_contain_text('공개된 빌드가 없습니다')
 panel.get_by_label('빌드 직업').select_option('');panel.get_by_label('빌드 제목').fill('missing');panel.get_by_role('button',name='공개 빌드 검색').click();expect(panel).to_contain_text('공개된 빌드가 없습니다')
 mode[0]='invalid';panel.get_by_label('빌드 제목').fill('');panel.get_by_role('button',name='공개 빌드 검색').click();expect(panel.get_by_role('alert')).to_be_visible()
 mode[0]='ok';panel.get_by_role('button',name='공개 빌드 다시 불러오기').click();expect(panel.get_by_role('heading',name='Reviewed build')).to_be_visible()
 panel.get_by_role('link',name='빌드 상세 보기').click()
 expect(page.get_by_role('region',name='공개 빌드 정보')).to_contain_text('Reviewed build')
 expect(page.get_by_role('region',name='공유 빌드 읽기 전용')).to_contain_text('살성 · Lv.45')
 assert page.evaluate('JSON.stringify(localStorage)')==before
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
 page.screenshot(path='/tmp/a2bc-public-build-mobile.png')
 mode[0]='missing';page.reload();expect(page.get_by_role('alert')).to_contain_text('비공개 또는 삭제')
 assert page.evaluate('JSON.stringify(localStorage)')==before
 # Admin fixtures never contact or alter production data.
 admin=b.new_page(viewport={'width':1440,'height':1000});admin.on('pageerror',lambda e:errors.append(str(e)))
 admin.add_init_script("localStorage.setItem('token','test-only')")
 admin.route('**/api/auth/me',lambda r:r.fulfill(json={'authenticated':True,'username':'test'}))
 admin.route('**/api/public/analytics/**',lambda r:r.fulfill(json={}))
 saved=[];conflict=[False]
 def manage(route):
  req=route.request
  if req.method=='GET':
   if urlparse(req.url).path.endswith('/'+id):route.fulfill(json=saved[0])
   else:route.fulfill(json={'items':[{**row,**{k:saved[0][k] for k in ['title','published','revision']}}] if saved else [],'page':0,'totalElements':len(saved),'totalPages':len(saved)})
  elif req.method in ['POST','PUT']:
   if conflict[0]:route.fulfill(status=409,json={'error':'다른 창에서 수정됐습니다. 최신 내용을 다시 불러오세요.'});return
   data=req.post_data_json;assert data['shared']==shared
   revision=saved[0]['revision']+1 if saved else 0
   saved[:]=[{**data,'id':id,'revision':revision,'updatedAt':row['updatedAt']}];route.fulfill(status=201 if req.method=='POST' else 200,json=saved[0])
  elif req.method=='DELETE':saved.clear();route.fulfill(status=204)
  else:raise AssertionError(req.method)
 admin.route('**/api/admin/shadowcraft/builds**',manage)
 admin.goto(origin+'/admin/a2bc-builds')
 admin.get_by_label('빌드 제목',exact=True).fill('Draft build');admin.get_by_label('빌드 설명',exact=True).fill('Reviewed description')
 link=url+'#build='+base64.urlsafe_b64encode(json.dumps(shared).encode()).decode().rstrip('=')
 admin.get_by_label('플래너 공유 링크',exact=True).fill(link)
 admin.get_by_role('button',name='빌드 저장',exact=True).click();expect(admin.get_by_role('status').filter(has_text='비공개 빌드를 저장')).to_be_visible()
 assert len(saved)==1 and not saved[0]['published']
 admin.get_by_label('방문자에게 공개').check();admin.get_by_role('button',name='빌드 저장',exact=True).click();expect(admin.get_by_role('status').filter(has_text='공개 빌드를 저장')).to_be_visible()
 assert saved[0]['published'] and saved[0]['revision']==1
 conflict[0]=True;admin.get_by_label('빌드 제목',exact=True).fill('Unsaved edit');admin.get_by_role('button',name='빌드 저장',exact=True).click();expect(admin.get_by_role('alert')).to_contain_text('다른 창')
 expect(admin.get_by_label('빌드 제목',exact=True)).to_have_value('Unsaved edit');assert saved[0]['title']=='Draft build'
 conflict[0]=False;admin.on('dialog',lambda d:d.accept());admin.get_by_role('button',name='빌드 삭제',exact=True).click();expect(admin.get_by_role('status').filter(has_text='삭제했습니다')).to_be_visible();assert not saved
 admin.set_viewport_size({'width':390,'height':844});assert admin.evaluate('document.documentElement.scrollWidth <= innerWidth')
 assert not errors,errors
 b.close()
print('Public/admin builds: lazy search/filter/retry, safe text, read-only detail/404, draft/publish/conflict/delete, storage and mobile PASS')
