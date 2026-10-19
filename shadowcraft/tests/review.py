import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[2]
URL=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 data=json.loads((ROOT/'backend/src/main/resources/shadowcraft/assassin.json').read_text())
 data['catalog'].update(version='2.0.8.0',baselineVersion='2.0.7.0',reviewRequired=True)
 data['newsRefresh']={'enabled':True,'intervalMinutes':15}
 page.route('**/api/public/shadowcraft/catalog?*',lambda r:r.fulfill(json=data))
 page.goto(URL,wait_until='domcontentloaded')
 page.get_by_role('tab',name='업데이트',exact=True).first.click()
 expect(page.get_by_role('tab',name='업데이트',exact=True).locator('.dot.amber').first).to_be_visible()
 expect(page.locator('.update-cards')).to_contain_text('2.0.8.0')
 expect(page.locator('.update-cards')).to_contain_text('추천 재검토 필요')
 expect(page.locator('.notice.violet-notice').filter(has_text='공식 공지')).to_contain_text('15분 간격')
 expect(page.locator('.news-panel')).to_contain_text('마지막 성공 확인')
 assert not errors,errors
 print('Review version, pending-review flag, news refresh policy and last success timestamp: PASS')
 browser.close()
