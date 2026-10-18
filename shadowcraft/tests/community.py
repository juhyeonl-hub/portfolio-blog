"""Member flow against an isolated running test backend (never production writes).
Run test-profile backend on 18082 and Vite on 5173; see PROJECT_BRIEF.
"""
import os,uuid
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright,expect
url=os.environ.get('SHADOWCRAFT_TEST_URL','http://localhost:5173/lab/shadowcraft/')
api=os.environ.get('SHADOWCRAFT_TEST_API','http://127.0.0.1:18082')
assert urlsplit(api).hostname in ('localhost','127.0.0.1'), 'Only isolated localhost backends allowed'
username='browser_'+uuid.uuid4().hex[:10]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True);context=b.new_context(viewport={'width':1440,'height':1000});page=context.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 def proxy(route):
  req=route.request;path=urlsplit(req.url)
  if path.path.startswith('/api/community/') or path.path.startswith('/api/public/shadowcraft/builds'):
   result=route.fetch(url=api+path.path+('?' + path.query if path.query else ''))
   route.fulfill(response=result)
  else:route.fulfill(json={})
 context.route('**/api/**',proxy)
 page.goto(url);page.get_by_role('tab',name='공개 빌드',exact=True).click()
 before=page.evaluate('JSON.stringify(localStorage)')
 page.get_by_role('button',name='회원가입',exact=True).click()
 page.get_by_label('회원 아이디',exact=True).fill(username);page.get_by_label('회원 비밀번호',exact=True).fill('browserPassword123!')
 page.get_by_role('button',name='회원가입 후 로그인',exact=True).click()
 expect(page.get_by_role('region',name='커뮤니티 로그인')).to_contain_text(username+'님')
 page.get_by_role('button',name='회원 로그아웃').click();expect(page.get_by_role('button',name='회원 로그인',exact=True)).to_be_visible()
 page.get_by_label('회원 비밀번호',exact=True).fill('browserPassword123!');page.get_by_role('button',name='회원 로그인',exact=True).click()
 expect(page.get_by_role('region',name='커뮤니티 로그인')).to_contain_text(username+'님')
 page.get_by_text('현재 플래너 배분 게시하기',exact=True).click()
 page.get_by_label('게시 제목',exact=True).fill('Browser member allocation')
 page.get_by_label('빌드 설명',exact=True).fill('Plain <b>description</b>')
 page.get_by_role('button',name='현재 배분 공개 게시',exact=True).click()
 page.get_by_label('내 게시물만',exact=True).check()
 page.get_by_label('빌드 정렬',exact=True).select_option('votes')
 expect(page.get_by_role('region',name='공개 빌드 목록')).to_contain_text('Browser member allocation')
 page.get_by_role('link',name='게시한 빌드 보기',exact=True).click()
 expect(page.get_by_role('region',name='공개 빌드 정보')).to_contain_text('Browser member allocation')
 discuss=page.get_by_role('region',name='빌드 추천과 댓글')
 discuss.get_by_role('button',name='추천 · 0',exact=True).click()
 expect(discuss.get_by_role('button',name='추천 취소 · 1',exact=True)).to_be_visible()
 discuss.get_by_label('댓글 내용').fill('Helpful <script>window.BAD=true</script>')
 discuss.get_by_role('button',name='댓글 등록',exact=True).click()
 expect(discuss.get_by_role('heading',name='댓글 1개')).to_be_visible()
 assert page.evaluate('window.BAD') is None
 page.reload();expect(discuss.get_by_role('button',name='추천 취소 · 1')).to_be_visible()
 discuss.get_by_role('button',name='내 게시물 수정',exact=True).click()
 discuss.get_by_role('button',name='저장된 내 배분 불러오기').click()
 expect(discuss.get_by_role('alert')).to_contain_text('저장된 배분이 없습니다')
 page.evaluate("""async()=>{const id=location.hash.slice(11);const build=await fetch('/api/public/shadowcraft/builds/'+id).then(r=>r.json());const p={...build.shared.plan,level:44,character:{profile:{characterName:'PRIVATE'}},searchPrefs:{region:'eu',server:'1301',name:'PRIVATE'}};localStorage.setItem('shadowcraft-plan-v1',JSON.stringify(p));}""")
 before=page.evaluate('JSON.stringify(localStorage)')
 discuss.get_by_role('button',name='저장된 내 배분 불러오기').click()
 expect(discuss.get_by_role('status')).to_contain_text('교체할 배분: Lv.44')
 discuss.get_by_label('수정 제목').fill('Updated member allocation')
 discuss.get_by_role('button',name='게시물 수정 저장').click()
 expect(page.get_by_role('region',name='공개 빌드 정보')).to_contain_text('Updated member allocation')
 expect(page.get_by_role('region',name='공유 빌드 읽기 전용')).to_contain_text('살성 · Lv.44')
 saved=page.evaluate("async()=>await fetch('/api/public/shadowcraft/builds/'+location.hash.slice(11)).then(r=>r.json())")
 assert saved['shared']['plan']['character'] is None and 'searchPrefs' not in saved['shared']['plan']
 expect(discuss.get_by_role('heading',name='댓글 1개')).to_be_visible()
 discuss.get_by_role('button',name='내 댓글 삭제').click();expect(discuss.get_by_role('heading',name='댓글 0개')).to_be_visible()
 discuss.get_by_role('button',name='추천 취소 · 1').click();expect(discuss.get_by_role('button',name='추천 · 0',exact=True)).to_be_visible()
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
 page.screenshot(path='/tmp/a2bc-community-mobile.png')
 page.get_by_role('button',name='회원 로그아웃').click();expect(discuss.get_by_role('button',name='추천 · 0',exact=True)).to_be_disabled()
 page.get_by_label('회원 아이디',exact=True).fill(username);page.get_by_label('회원 비밀번호',exact=True).fill('browserPassword123!');page.get_by_role('button',name='회원 로그인',exact=True).click()
 discuss.get_by_role('button',name='내 게시물 삭제').click();discuss.get_by_role('button',name='삭제 확인').click()
 expect(page.get_by_role('tab',name='공개 빌드',exact=True)).to_be_visible()
 assert page.evaluate('JSON.stringify(localStorage)')==before
 assert not errors,errors
 b.close();print('PASS member signup/login/restore, publish/edit/delete, vote/unvote, comment/delete, plain text, mobile and planner preservation')
