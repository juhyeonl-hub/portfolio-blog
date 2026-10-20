"""Localized member UI using controlled API responses; never creates real posts."""
import json, os
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[2]
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
MESSAGES=json.loads((ROOT/'frontend/shadowcraft/lib/data/ui-translations.json').read_text())
CATALOG=json.loads((ROOT/'frontend/shadowcraft/lib/data/catalogs/assassin.json').read_text())
ID='11111111-1111-4111-8111-111111111111'
PLAN={'classKey':'assassin','level':45,'mode':'safe','base':{},'bonus':{},'specs':{},'nodes':[], 'checked':[], 'character':None, 'extraSP':0,'extraStigma':0,'extraCrystal':0,'extraBattle':0}
SHARED={'schema':'a2bc-share-v1','catalogVersion':CATALOG['version'],'plan':PLAN}
def label(key,locale):return key if locale=='ko' else MESSAGES[key][locale]
with sync_playwright() as p:
 browser=p.chromium.launch()
 for width in [1366,390]:
  for initial in ['ko','en','ja','fi']:
   page=browser.new_page(viewport={'width':width,'height':900})
   page.add_init_script('localStorage.setItem("asbc-locale",'+json.dumps(initial)+');sessionStorage.setItem("a2bc-member-session-v1",JSON.stringify({token:"test",member:{id:"member",username:"취소"}}));')
   build={'id':ID,'title':'취소','description':'내 게시물 삭제','authorId':'member','author':'추천','classKey':'assassin','catalogVersion':CATALOG['version'],'published':True,'revision':1,'updatedAt':'2026-10-19T10:00:00Z','shared':SHARED}
   social={'votes':0,'voted':False}
   mutations=[];errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   def route(r):
    path=urlsplit(r.request.url).path;method=r.request.method
    if method!='GET':mutations.append((path,method,r.request.post_data_json if r.request.post_data else None))
    if path=='/api/community/me':r.fulfill(json={'id':'member','username':'취소'})
    elif path.endswith('/community'):r.fulfill(json=social)
    elif path=='/api/public/shadowcraft/builds':r.fulfill(json={'items':[build],'page':0,'totalElements':1,'totalPages':1})
    elif path=='/api/public/shadowcraft/builds/'+ID:r.fulfill(json=build)
    elif path.endswith('/vote'):
     social['voted']=method=='PUT';social['votes']=int(social['voted']);r.fulfill(json={})
    elif path=='/api/community/builds':r.fulfill(json={'id':ID})
    elif path=='/api/community/builds/'+ID and method=='PUT':
     body=r.request.post_data_json;build.update(title=body['title'],description=body['description'],shared=body['shared'],revision=build['revision']+1);r.fulfill(json=build)
    else:r.fulfill(status=503,json={'error':'요청을 처리하지 못했습니다.'})
   page.route('**/api/**',route)
   page.goto(URL)
   page.get_by_role('tab',name=label('공개 빌드',initial),exact=True).click()
   listing=page.get_by_role('region',name=label('공개 빌드 목록',initial),exact=True)
   expect(listing.get_by_role('heading',name='취소',exact=True)).to_be_visible()
   expect(listing).to_contain_text('내 게시물 삭제')
   page.get_by_text(label('현재 플래너 배분 게시하기',initial),exact=True).click()
   page.get_by_label(label('게시 제목',initial),exact=True).fill('취소')
   page.get_by_label(label('빌드 설명',initial),exact=True).fill('내 게시물 삭제')
   page.get_by_role('button',name=label('현재 배분 공개 게시',initial),exact=True).click()
   expect(page.get_by_role('link',name=label('게시한 빌드 보기',initial),exact=True)).to_be_visible()
   assert mutations[-1][2]['title']=='취소' and mutations[-1][2]['description']=='내 게시물 삭제'
   page.get_by_role('link',name=label('게시한 빌드 보기',initial),exact=True).click()
   info=page.get_by_role('region',name=label('공개 빌드 정보',initial),exact=True)
   expect(info.get_by_role('heading',name='취소',exact=True)).to_be_visible()
   discuss=page.locator('.community-discussion')
   expect(discuss.get_by_role('button',name=label('좋아요',initial),exact=True)).to_contain_text('0')
   before=page.evaluate('JSON.stringify(Object.fromEntries(Object.entries(localStorage).filter(([k])=>k!=="asbc-locale")))')
   # Editing drafts must survive changing language without a write request.
   discuss.get_by_role('button',name=label('내 게시물 수정',initial),exact=True).click()
   discuss.get_by_label(label('수정 제목',initial),exact=True).fill('추천')
   discuss.get_by_label(label('수정 설명',initial),exact=True).fill('취소')
   count=len(mutations);locale={'ko':'en','en':'ja','ja':'fi','fi':'ko'}[initial]
   page.locator('.asbc-language').select_option(locale)
   expect(discuss.get_by_label(label('수정 제목',locale),exact=True)).to_have_value('추천')
   expect(discuss.get_by_label(label('수정 설명',locale),exact=True)).to_have_value('취소')
   assert len(mutations)==count
   discuss.get_by_role('button',name=label('좋아요',locale),exact=True).click()
   expect(discuss.get_by_role('button',name=label('좋아요 취소',locale),exact=True)).to_contain_text('1')
   discuss.get_by_role('button',name=label('게시물 수정 저장',locale),exact=True).click()
   expect(page.get_by_role('region',name=label('공개 빌드 정보',locale),exact=True).get_by_role('heading',name='추천',exact=True)).to_be_visible()
   assert mutations[-1][2]['title']=='추천' and mutations[-1][2]['description']=='취소'
   assert page.evaluate('JSON.stringify(Object.fromEntries(Object.entries(localStorage).filter(([k])=>k!=="asbc-locale")))')==before
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),(width,locale)
   assert not errors,errors
   page.screenshot(path=f'/tmp/asbc-community-{width}-{locale}.png')
   page.close()
 browser.close()
print('PASS four-language community: desktop/mobile publish, public detail, like, edit, shared language selector, literal user content, drafts and request/storage preservation')
