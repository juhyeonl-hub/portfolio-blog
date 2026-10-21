import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5184/lab/shadowcraft/')
OUT=Path('/mnt/d/CodexData/Projects/ASBC/evidence/favorites-20261021');OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch();page=b.new_page(viewport={'width':1366,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 member={'id':'favorite-a','username':'favorite_a'}
 page.route('**/api/community/me',lambda r:r.fulfill(json=member))
 page.route('**/api/community/auth/login',lambda r:r.fulfill(json={'token':'test-token','member':member}))
 page.route('**/api/community/logout',lambda r:r.fulfill(json={}))
 page.goto(URL);panel=page.locator('.home-favorites');expect(panel.get_by_role('button',name='로그인',exact=True)).to_be_visible();expect(page.get_by_text('자주 쓰는 도구',exact=True)).to_have_count(0)
 page.screenshot(path=str(OUT/'signed-out.png'))
 panel.get_by_role('button',name='로그인',exact=True).click();account=page.locator('.asbc-account-page .community-account')
 account.get_by_label('회원 아이디',exact=True).fill('favorite_a');account.get_by_label('회원 비밀번호',exact=True).fill('test-password-123');account.get_by_role('button',name='회원 로그인',exact=True).click();expect(account).to_contain_text('favorite_a');page.get_by_role('button',name='홈으로',exact=True).click()
 expect(panel).to_contain_text('즐겨찾기에 원하는 도구');assert page.evaluate("localStorage.getItem('a2bc-home-favorites-v1:favorite-a')") is None
 panel.get_by_text('즐겨찾기 편집',exact=True).click();panel.get_by_role('checkbox',name='지도 & 수집',exact=True).check();panel.get_by_role('checkbox',name='빌드 플래너',exact=True).check();page.keyboard.press('Escape');expect(panel.locator('summary')).to_be_focused();assert not panel.locator('details').evaluate('(e)=>e.open')
 page.reload();expect(panel.locator('.home-favorite-links button')).to_have_count(2);panel.get_by_role('button',name='지도 & 수집',exact=True).click();expect(page).to_have_url(URL+'#/map');page.goto(URL+'#/');expect(panel.locator('.home-favorite-links button')).to_have_count(2)
 panel.get_by_text('즐겨찾기 편집',exact=True).click()
 for checkbox in panel.get_by_role('checkbox').all():checkbox.check()
 for width in [1920,1366,390,320]:
  page.set_viewport_size({'width':width,'height':900})
  for locale in ['ko','en','ja','fi']:
   page.locator('.asbc-language').select_option(locale);page.wait_for_timeout(250);assert page.evaluate('document.documentElement.scrollWidth<=document.body.clientWidth+1'),(width,locale)
  page.screenshot(path=str(OUT/f'signed-in-{width}.png'))
 page.locator('.asbc-language').select_option('ko')
 for checkbox in panel.get_by_role('checkbox').all():checkbox.uncheck()
 page.reload();expect(panel.locator('.home-favorite-links button')).to_have_count(0)
 page.evaluate("(ids)=>localStorage.setItem('a2bc-home-favorites-v1:favorite-a',JSON.stringify(ids))",["map"]);page.reload();expect(panel.locator('.home-favorite-links button')).to_have_count(1)
 page.locator('.asbc-account-actions button').click();account.get_by_role('button',name='회원 로그아웃',exact=True).click();page.get_by_role('button',name='홈으로',exact=True).click();expect(panel.get_by_role('button',name='로그인',exact=True)).to_be_visible();expect(panel.locator('.home-favorite-links button')).to_have_count(0)
 member={'id':'favorite-b','username':'favorite_b'}
 page.evaluate('(m)=>sessionStorage.setItem("a2bc-member-session-v1",JSON.stringify({token:"test",member:m}))',member);page.reload();expect(panel).to_contain_text('즐겨찾기에 원하는 도구');assert page.evaluate("localStorage.getItem('a2bc-home-favorites-v1:favorite-b')") is None
 page.evaluate("localStorage.setItem('a2bc-home-favorites-v1:favorite-b','corrupt')");page.reload();expect(panel.get_by_role('alert')).to_contain_text('불러오지 못했습니다')
 panel.get_by_text('즐겨찾기 편집',exact=True).click();page.evaluate("()=>{Storage.prototype.setItem=function(){throw new Error('blocked')}}");panel.get_by_role('checkbox',name='지도 & 수집',exact=True).click();expect(panel.get_by_role('alert')).to_contain_text('저장하지 못했습니다');expect(panel.locator('.home-favorite-links button')).to_have_count(0)
 assert not errors,errors;b.close()
print('PASS favorites login/logout, empty initial state, selection/reload, navigation, account isolation, corrupt/blocked storage, four locales and four widths')
