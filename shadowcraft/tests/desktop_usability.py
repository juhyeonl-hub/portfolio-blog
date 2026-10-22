"""PC recommendation result visibility, focus, cancellation, undo and direct library navigation."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5184/lab/shadowcraft/')
OUT=Path('/mnt/d/CodexData/Projects/ASBC/artifacts/desktop-usability-20261022')
with sync_playwright() as p:
 b=p.chromium.launch()
 for width,height in [(1440,900),(1280,720),(390,844)]:
  page=b.new_page(viewport={'width':width,'height':height});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(URL);expect(page.locator('.home-start-grid')).to_be_visible()
  # Let live startup data settle before comparing preview geometry; a catalog refresh invalidates stale previews.
  page.wait_for_load_state('networkidle',timeout=45000)
  page.locator('.home-start-grid>button').first.click()
  expect(page.locator('.quick-basis')).to_contain_text('45')
  button=page.get_by_role('button',name='이 빌드 미리보기',exact=True)
  before=page.evaluate("localStorage.getItem('shadowcraft-plan-v1')")
  button.focus();page.keyboard.press('Enter')
  preview=page.locator('.quick-preview');expect(preview).to_be_focused()
  assert preview.bounding_box()['y']>=page.locator('.event-timer-header').bounding_box()['height']
  assert preview.bounding_box()['y']<height-100
  assert page.evaluate("localStorage.getItem('shadowcraft-plan-v1')")==before
  page.get_by_role('button',name='미리보기 취소',exact=True).click();expect(button).to_be_focused()
  button.click();page.get_by_role('button',name='이 빌드 적용',exact=True).click()
  result=page.locator('.quick-result');expect(result).to_be_focused()
  expect(result).to_contain_text('게임 안에서는')
  assert result.bounding_box()['y']<height-100
  page.screenshot(path=str(OUT/f'after-applied-{width}.png'))
  button.click();page.get_by_role('button',name='미리보기 취소',exact=True).click();expect(button).to_be_focused()
  page.get_by_role('button',name='빌드 적용 전으로 되돌리기',exact=True).click()
  expect(result).to_have_count(0);expect(button).to_be_focused()
  if before is not None:
   old=json.loads(before);restored=json.loads(page.evaluate("localStorage.getItem('shadowcraft-plan-v1')"))
   for key in ['base','nodes','level','gear']:assert old.get(key)==restored.get(key)
  button.click();page.get_by_role('button',name='이 빌드 적용',exact=True).click()
  page.get_by_role('button',name='적용한 스킬 확인',exact=True).click()
  expect(page.locator('#build-section-skills')).to_be_visible()
  if width<761:page.get_by_role('button',name='전체 메뉴',exact=True).click()
  page.get_by_role('tab',name='빌드 보관함',exact=True).click()
  expect(page.get_by_label('빌드 이름',exact=True)).to_be_visible()
  assert not errors,errors
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  page.close()
 b.close()
print('PASS PC1440/1280 and mobile390: keyboard preview focus/visibility, cancellation, applied result/undo, skill action, direct library access, no page errors')
