"""UI-only regressions. No live account or public-build writes."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5183/lab/shadowcraft/')
OUT=Path(os.environ.get('ASBC_UX_EVIDENCE','/mnt/d/CodexData/Projects/ASBC/evidence/ui-ux-20261021'))
OUT.mkdir(parents=True,exist_ok=True)
MESSAGES=json.loads((Path(__file__).resolve().parents[2]/'frontend/shadowcraft/lib/data/ui-translations.json').read_text())
def tr(key,locale):
 return key if locale=='ko' else MESSAGES[key][locale]
with sync_playwright() as p:
 b=p.chromium.launch()
 page=b.new_page(viewport={'width':1440,'height':1000})
 errors=[]
 page.on('pageerror',lambda error:errors.append(str(error)))
 page.goto(URL)
 page.locator('.sidebar').get_by_role('tab',name='빌드',exact=True).click()
 expect(page).to_have_url(URL+'#/build')
 page.locator('.build-pills').get_by_role('button',name='내 장비 & 성장',exact=True).click()
 expect(page).to_have_url(URL+'#/build/gear')
 page.reload()
 expect(page.locator('#build-section-gear')).to_be_visible()
 page.wait_for_timeout(500)
 assert page.locator('.build-pills').bounding_box()['y']>=-1
 page.locator('.sidebar').get_by_role('tab',name='랭킹',exact=True).click()
 expect(page).to_have_url(URL+'#/rankers')
 page.go_back()
 expect(page).to_have_url(URL+'#/build/gear')
 page.go_forward()
 expect(page).to_have_url(URL+'#/rankers')
 page.goto(URL+'#/build/skills')
 expect(page.locator('.class-select')).to_be_visible()
 # Native control and visual picker both survive; all icons load.
 page.locator('.class-grid-trigger').click()
 expect(page.locator('.class-options button')).to_have_count(8)
 page.wait_for_function("Array.from(document.querySelectorAll('.class-options img')).every(i=>i.complete&&i.naturalWidth>0)")
 keys=page.locator('.class-select option').evaluate_all('(els)=>els.map(e=>e.value)')
 for key in keys:
  page.locator('.class-select').select_option(key)
  expect(page.locator('.class-select')).to_have_value(key)
  expect(page.locator('.skill-row').first).to_be_visible()
 page.locator('.class-grid-trigger').click()
 page.locator('.class-options button').first.click()
 expect(page.locator('.class-options')).to_have_count(0)
 page.locator('.class-grid-trigger').click()
 page.locator('.class-options button').nth(1).click()
 expect(page.locator('.class-select')).to_be_focused()
 chosen=page.locator('.class-select').input_value()
 page.reload()
 expect(page.locator('.class-select')).to_have_value(chosen)
 for locale in ['ko','en','ja','fi']:
  page.locator('.asbc-language').select_option(locale)
  expect(page.locator('.class-grid-trigger')).to_have_text(tr('직업 둘러보기',locale))
  page.get_by_role('searchbox',name=tr('스킬 검색',locale)).fill('zz-no-skill-92837')
  expect(page.locator('.skill-search-empty')).to_contain_text(tr('검색한 스킬이 없습니다.',locale))
  page.locator('.skill-search-empty').get_by_role('button').click()
  expect(page.locator('.skill-row').first).to_be_visible()
  page.locator('.class-grid-trigger').click()
  expect(page.locator('.class-options button')).to_have_count(8)
  page.keyboard.press('Escape')
  expect(page.locator('.class-options')).to_have_count(0)
  expect(page.locator('.class-grid-trigger')).to_be_focused()
 assert not errors,errors
 page.locator('.asbc-language').select_option('ko')
 page.goto(URL+'#/build')
 page.screenshot(path=str(OUT/'after-build.png'))
 page.locator('.class-grid-trigger').click()
 page.screenshot(path=str(OUT/'after-class-picker.png'))
 page.keyboard.press('Escape')
 # A collapsed desktop rail must still be a full labelled phone drawer.
 page.get_by_role('button',name='사이드바 접기',exact=True).click()
 for width in [390,320,760]:
  page.set_viewport_size({'width':width,'height':844})
  trigger=page.get_by_role('button',name='메뉴',exact=True)
  trigger.click()
  dialog=page.get_by_role('dialog',name='주 메뉴')
  expect(dialog).to_be_visible()
  expect(trigger).to_have_attribute('aria-expanded','true')
  assert dialog.evaluate('(e)=>e.contains(document.activeElement)')
  assert dialog.bounding_box()['width']>200
  assert page.locator('#asbc-main').evaluate('(e)=>e.inert')
  assert page.evaluate('document.body.style.overflow')=='hidden'
  for _ in range(15):
   page.keyboard.press('Tab')
   assert dialog.evaluate('(e)=>e.contains(document.activeElement)')
  page.keyboard.press('Shift+Tab')
  assert dialog.evaluate('(e)=>e.contains(document.activeElement)')
  page.screenshot(path=str(OUT/f'after-mobile-menu-{width}.png'))
  page.keyboard.press('Escape')
  expect(trigger).to_be_focused()
  assert not page.locator('#asbc-main').evaluate('(e)=>e.inert')
  assert page.evaluate('document.body.style.overflow')!='hidden'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  trigger.click()
  page.set_viewport_size({'width':1000,'height':844})
  expect(page.locator('.sidebar')).not_to_have_attribute('role','dialog')
 # Public search reset changes only GET filters.
 page.goto(URL+'#/public-builds')
 requests=[]
 def listing(route):
  requests.append(route.request.url)
  route.fulfill(json={'items':[],'page':0,'totalElements':0,'totalPages':0})
 page.route('**/api/public/shadowcraft/builds?*',listing)
 page.reload()
 page.get_by_label('빌드 제목',exact=True).fill('missing')
 page.get_by_role('button',name='공개 빌드 검색',exact=True).click()
 expect(page.get_by_role('button',name='필터 초기화',exact=True)).to_be_visible()
 page.get_by_role('button',name='필터 초기화',exact=True).click()
 expect(page.get_by_label('빌드 제목',exact=True)).to_have_value('')
 expect(page.get_by_label('빌드 제목',exact=True)).to_be_focused()
 expect(page.get_by_role('button',name='필터 초기화',exact=True)).to_have_count(0)
 # Legacy reserved hashes are still handled by their original screens.
 page.goto(URL+'#privacy')
 expect(page.locator('.asbc-share-toolbar')).to_be_visible()
 page.locator('.asbc-share-toolbar a').click()
 expect(page.locator('.a2bc-home')).to_be_visible()
 page.goto(URL+'#steam-error=expired')
 page.reload() # Steam returns from an external document, so exercise a real mount.
 expect(page.locator('.asbc-account-page')).to_be_visible()
 page.goto(URL+'#transfer')
 page.reload()
 expect(page.locator('.a2bc-home')).to_be_visible()
 # Unknown screen route stays recoverable at home.
 page.goto(URL+'#/not-a-screen')
 page.reload()
 expect(page.locator('.a2bc-home')).to_be_visible()
 page.set_viewport_size({'width':1440,'height':1000})
 page.get_by_role('button',name='사이드바 펼치기',exact=True).click()
 page.screenshot(path=str(OUT/'after-home.png'))
 page.locator('.skip-link').focus()
 page.keyboard.press('Enter')
 expect(page.locator('#asbc-main')).to_be_focused()
 for width in [320,390,1366]:
  page.set_viewport_size({'width':width,'height':900})
  page.goto(URL+'#/build')
  for locale in ['ko','en','ja','fi']:
   page.locator('.asbc-language').select_option(locale)
   expect(page.locator('.class-grid-trigger')).to_have_text(tr('직업 둘러보기',locale))
   page.locator('.class-grid-trigger').click()
   expect(page.locator('.class-options button')).to_have_count(8)
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,locale)
   box=page.locator('.class-options').bounding_box()
   assert box['x']>=0 and box['x']+box['width']<=width,(width,locale,box)
   page.screenshot(path=str(OUT/f'after-picker-{width}-{locale}.png'))
   page.keyboard.press('Escape')
 # Last-row tooltip must escape the table on phones (previously clipped by overflow:auto).
 page.locator('.asbc-language').select_option('ko')
 page.set_viewport_size({'width':390,'height':900})
 page.locator('.skill-name').last.focus()
 tip=page.locator('.skill-row').last.locator('.skill-tip')
 expect(tip).to_be_visible()
 assert page.locator('.skill-table').evaluate("(e)=>getComputedStyle(e).overflowY")=='visible'
 page.screenshot(path=str(OUT/'mobile-last-skill-tip.png'))
 assert not errors,errors
 b.close()
print('PASS deep links/history/reload; eight classes/icons; four locales; search recovery; 320/390/760px drawer/focus/resize; reserved privacy/Steam/transfer; skip link')
