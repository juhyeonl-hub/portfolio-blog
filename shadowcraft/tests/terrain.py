"""Official terrain browser acceptance; no game-coordinate assertions."""
import os
from playwright.sync_api import sync_playwright,expect
url=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5175/lab/shadowcraft/')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors,tiles,posts=[],[],[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('request',lambda r:posts.append(r.url) if r.method=='POST' else None)
    page.on('response',lambda r:tiles.append((r.url,r.status)) if '/maps/steam-25926599/' in r.url and r.url.endswith('.webp') else None)
    page.route('**/api/public/shadowcraft/catalog?*',lambda r:r.fulfill(status=503,json={}))
    page.goto(url)
    page.get_by_role('tab',name='지도 & 수집',exact=True).click()
    panel=page.get_by_role('region',name='공식 글로벌 지형 지도',exact=True)
    before=page.evaluate('JSON.stringify({...localStorage})')
    assert not tiles,'terrain must not download before the user opens it'
    page.route('**/maps/steam-25926599/verteron/4_4.webp',lambda r:r.fulfill(status=404,body='missing'))
    panel.get_by_role('button',name='공식 Verteron 지형 열기',exact=True).click()
    canvas=panel.get_by_role('group',name='Verteron 지형 이미지',exact=True)
    expect(canvas.locator('image')).to_have_count(64)
    expect(panel.get_by_role('alert')).to_be_visible()
    page.unroute('**/maps/steam-25926599/verteron/4_4.webp')
    panel.get_by_role('button',name='지형 다시 불러오기',exact=True).click()
    expect(panel.get_by_role('alert')).to_have_count(0)
    # Retry can cancel unfinished first-pass requests; count unique successful assets.
    for _ in range(200):
        if len({u for u,status in tiles if status==200})==64: break
        page.wait_for_timeout(100)
    assert len({u for u,status in tiles if status==200})==64
    panel.get_by_role('button',name='지형 지도 확대',exact=True).click()
    expect(canvas).to_have_attribute('viewBox','250 250 500 500')
    expect(canvas.locator('image')).to_have_count(16)
    canvas.focus();page.keyboard.press('ArrowRight')
    expect(canvas).to_have_attribute('viewBox','300 250 500 500')
    box=canvas.bounding_box();page.mouse.move(box['x']+box['width']*.5,box['y']+box['height']*.5);page.mouse.down();page.mouse.move(box['x']+box['width']*.6,box['y']+box['height']*.5);page.mouse.up()
    assert float(canvas.get_attribute('viewBox').split()[0])<300
    panel.get_by_role('button',name='지형 전체 보기',exact=True).click()
    expect(canvas).to_have_attribute('viewBox','0 0 1000 1000')
    assert page.evaluate('JSON.stringify({...localStorage})')==before
    panel.get_by_label('공식 지형 지역',exact=True).select_option('altgard')
    expect(panel.get_by_role('group')).to_have_count(0)
    panel.get_by_role('button',name='공식 Altgard 지형 열기',exact=True).click()
    canvas=panel.get_by_role('group',name='Altgard 지형 이미지',exact=True)
    expect(canvas.locator('image')).to_have_count(64)
    for _ in range(200):
        if len({u for u,status in tiles if status==200 and '/altgard/' in u})==64: break
        page.wait_for_timeout(100)
    assert len({u for u,status in tiles if status==200 and '/altgard/' in u})==64
    expect(panel.get_by_role('alert')).to_have_count(0)
    canvas.screenshot(path='/tmp/a2bc-altgard-browser.png')
    expect(canvas).to_have_attribute('viewBox','0 0 1000 1000')
    assert all('/altgard/' in x for x in canvas.locator('image').evaluate_all('(els)=>els.map(e=>e.getAttribute("href"))'))
    panel.get_by_role('button',name='지형 지도 확대',exact=True).click()
    expect(canvas).to_have_attribute('viewBox','250 250 500 500')
    panel.get_by_label('공식 지형 지역',exact=True).select_option('verteron')
    panel.get_by_role('button',name='공식 Verteron 지형 열기',exact=True).click()
    canvas=panel.get_by_role('group',name='Verteron 지형 이미지',exact=True)
    expect(canvas).to_have_attribute('viewBox','0 0 1000 1000')
    assert page.evaluate('JSON.stringify({...localStorage})')==before
    for slug,name,count in [('poeta','Poeta',16),('ishalgen','Ishalgen',25),('reshanta-lower','Chaotic Lower Reshanta',16),('reshanta-middle','Chaotic Middle Reshanta',4)]:
        panel.get_by_label('공식 지형 지역',exact=True).select_option(slug)
        expect(panel.get_by_role('group')).to_have_count(0)
        panel.get_by_role('button',name=f'공식 {name} 지형 열기',exact=True).click()
        canvas=panel.get_by_role('group',name=f'{name} 지형 이미지',exact=True)
        expect(canvas.locator('image')).to_have_count(count)
        expect(canvas).to_have_attribute('viewBox','0 0 1000 1000')
        for _ in range(200):
            if len({u for u,status in tiles if status==200 and '/'+slug+'/' in u})==count:break
            page.wait_for_timeout(100)
        assert len({u for u,status in tiles if status==200 and '/'+slug+'/' in u})==count
        expect(panel.get_by_role('alert')).to_have_count(0)
        panel.get_by_role('button',name='지형 지도 확대',exact=True).click()
        expect(canvas).to_have_attribute('viewBox','250 250 500 500')
        canvas.focus();page.keyboard.press('ArrowRight')
        expect(canvas).to_have_attribute('viewBox','300 250 500 500')
        assert page.evaluate('JSON.stringify({...localStorage})')==before
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    canvas.screenshot(path='/tmp/a2bc-official-terrain.png')
    assert not errors,errors
    assert not posts,posts
    browser.close()
print('Terrain: lazy assets, 64 images, failed tile/retry, viewport/drag/keyboard, mobile and untouched storage PASS')
