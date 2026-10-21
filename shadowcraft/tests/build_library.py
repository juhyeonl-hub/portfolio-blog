"""Preserve active builds while managing isolated named snapshots."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from _ui import open_section, pick_class, open_build, open_library
root=Path(__file__).parents[2]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    context=browser.new_context(viewport={'width':1440,'height':1000})
    page=context.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.route('**/api/public/shadowcraft/catalog?*',lambda r:r.fulfill(status=503,json={}))
    url=os.environ.get('SHADOWCRAFT_TEST_URL','http://127.0.0.1:5173/lab/shadowcraft/')
    page.goto(url)
    open_library(page)
    panel=page.get_by_role('region',name='빌드 보관함',exact=True)
    panel.get_by_label('빌드 이름',exact=True).fill('First build')
    panel.get_by_role('button',name='현재 계획 보관',exact=True).click()
    expect(panel).to_contain_text('1 / 20개')
    raw=page.evaluate("localStorage.getItem('a2bc-build-library-v1:assassin')")
    library=json.loads(raw);original=library['entries'][0]['plan']
    with page.expect_download() as download_info:
        panel.get_by_role('button',name='First build 보관본 내보내기',exact=True).click()
    exported=json.loads(Path(download_info.value.path()).read_text())
    assert exported['schema']=='shadowcraft-v1' and exported['plan']==original
    altered=dict(original,level=12,mode='damage')
    page.evaluate("p=>localStorage.setItem('shadowcraft-plan-v1',JSON.stringify(p))",altered)
    page.reload();open_library(page)
    panel.locator('.database-list button').filter(has_text='First build').click()
    expect(panel.get_by_label('빌드 복원 미리보기',exact=True)).to_be_visible()
    assert json.loads(page.evaluate("localStorage.getItem('shadowcraft-plan-v1')"))['level']==12
    panel.get_by_role('button',name='이 빌드 적용',exact=True).click()
    expect(panel.get_by_role('status')).to_contain_text('적용했습니다')
    assert json.loads(page.evaluate("localStorage.getItem('shadowcraft-plan-v1')"))==original
    assert json.loads(page.evaluate("localStorage.getItem('a2bc-build-library-v1:assassin')"))['recovery']['plan']==altered
    page.reload();open_library(page)
    panel.get_by_role('button',name='복원 직전 계획 보기',exact=True).click()
    panel.get_by_role('button',name='이 빌드 적용',exact=True).click()
    expect(panel.get_by_role('status')).to_contain_text('적용했습니다')
    assert json.loads(page.evaluate("localStorage.getItem('shadowcraft-plan-v1')"))==altered
    panel.get_by_role('button',name='First build 보관본 삭제',exact=True).click()
    panel.get_by_role('button',name='보관본 삭제 확인',exact=True).click()
    expect(panel).to_contain_text('0 / 20개')
    assert json.loads(page.evaluate("localStorage.getItem('shadowcraft-plan-v1')"))==altered
    pick_class(page,'검성')
    open_library(page)
    expect(panel).to_contain_text('0 / 20개')
    panel.get_by_label('빌드 이름',exact=True).fill('Gladiator build')
    panel.get_by_role('button',name='현재 계획 보관',exact=True).click()
    expect(panel).to_contain_text('1 / 20개')
    assert json.loads(page.evaluate("localStorage.getItem('a2bc-build-library-v1:assassin')"))['entries']==[]
    active_before=page.evaluate("localStorage.getItem('shadowcraft-plan-v1:gladiator')")
    library_before=page.evaluate("localStorage.getItem('a2bc-build-library-v1:gladiator')")
    page.evaluate("""() => {window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('a2bc-build-library'))throw new DOMException('Quota exceeded','QuotaExceededError');return window.originalSetItem.call(this,k,v)}}""")
    panel.locator('.database-list button').filter(has_text='Gladiator build').click()
    panel.get_by_role('button',name='이 빌드 적용',exact=True).click()
    expect(panel.get_by_role('alert')).to_be_visible()
    assert page.evaluate("localStorage.getItem('shadowcraft-plan-v1:gladiator')")==active_before
    assert page.evaluate("localStorage.getItem('a2bc-build-library-v1:gladiator')")==library_before
    page.evaluate('() => {Storage.prototype.setItem=window.originalSetItem;}')
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    # Corruption must not be replaced by an empty library.
    page.evaluate("localStorage.setItem('a2bc-build-library-v1:gladiator','broken')")
    panel.get_by_role('button',name='보관함 다시 불러오기',exact=True).click()
    expect(panel.get_by_role('alert')).to_contain_text('읽지 못했습니다')
    assert page.evaluate("localStorage.getItem('a2bc-build-library-v1:gladiator')")=='broken'
    assert not errors,errors
    # Force concurrent writes behind one browser-wide lock.
    other_context=browser.new_context()
    a=other_context.new_page();b=other_context.new_page()
    for page2 in [a,b]:
        page2.route('**/api/public/shadowcraft/catalog?*',lambda r:r.fulfill(status=503,json={}))
        page2.goto(url)
        open_library(page2)
    a.evaluate("() => {navigator.locks.request('a2bc-build-library-v1:assassin',()=>new Promise(resolve=>{window.releaseBuildLock=resolve}));}")
    a.wait_for_function('!!window.releaseBuildLock')
    a.get_by_label('빌드 이름',exact=True).fill('Concurrent A')
    b.get_by_label('빌드 이름',exact=True).fill('Concurrent B')
    a.get_by_role('button',name='현재 계획 보관',exact=True).click()
    b.get_by_role('button',name='현재 계획 보관',exact=True).click()
    a.evaluate('window.releaseBuildLock()')
    expect(b.get_by_role('region',name='빌드 보관함',exact=True).get_by_role('alert')).to_contain_text('다른 탭')
    saved=json.loads(a.evaluate("localStorage.getItem('a2bc-build-library-v1:assassin')"))
    assert len(saved['entries'])==1 and saved['entries'][0]['name']=='Concurrent A'
    browser.close()
print('Build library: save, preview, apply, persisted recovery, delete, class isolation, mobile and corruption preservation PASS')
