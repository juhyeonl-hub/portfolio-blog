"""Four-locale desktop/mobile checks for the screens connected in batch 2.
Run against the existing Vite dev server. This file does not start a server,
install packages or create real accounts, posts, characters or DPS connections.
Includes an isolated React mount for components absent from the current menu.
"""
import json
import os
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[2]
URL = os.environ.get('SHADOWCRAFT_TEST_URL', 'http://127.0.0.1:5173/lab/shadowcraft/')
MESSAGES = json.loads((ROOT / 'frontend/shadowcraft/lib/data/ui-translations.json').read_text())

def label(source, locale):
    return source if locale == 'ko' else MESSAGES[source][locale]

# Reuse Vite's actual optimized React URLs, including their version query, so
# this isolated mount uses the same React instance as the production components.
MOUNT = r'''async () => {
 const localeSource=await (await fetch('/shadowcraft/app/locale.tsx')).text();
 const mainSource=await (await fetch('/shadowcraft/main.tsx')).text();
 const dependency=(source,name)=>{
   const urls=[...source.matchAll(/(?:from\s*|import\s*)["']([^"']+)["']/g)].map(m=>m[1]);
   const url=urls.find(u=>u.includes('/'+name+'.js'));
   if(!url)throw Error('Vite dependency URL unavailable: '+name);
   return url;
 };
 const React=await import(dependency(localeSource,'react'));
 const dom=await import(dependency(mainSource,'react-dom_client'));
 const consumerSource=await (await fetch('/shadowcraft/app/craft-probability.tsx')).text();
 const localeUrl=[...consumerSource.matchAll(/from\s*["']([^"']+)["']/g)].map(m=>m[1]).find(u=>u.includes('/app/locale.tsx'));
 if(!localeUrl)throw Error('Shared locale module URL unavailable');
 const {LocaleProvider,LanguageSelect}=await import(localeUrl);
 const component=async name=>(await import('/shadowcraft/app/'+name+'.tsx')).default;
 const [Steam,Faction,Probability,Equipment,Comparison,RankerEquipment,Live,Official,Npc,Journal,Database]=await Promise.all(
  ['steam-activity','faction-picker','craft-probability','character-equipment','character-comparison','ranker-equipment','live-dps','official-crafting','npc-database','journal-database','client-database'].map(component));
 const item={id:1,name:'취소',slotPos:1,slotPosName:'Main hand',enchantLevel:3,exceedLevel:2};
 const character={equipment:[item],skills:[{id:1,name:'추천',skillLevel:2,equip:1}],nodes:['node'],failedBoards:[]};
 const rankers=[{region:'eu',serverId:1,characterId:'left',rank:1,name:'취소',serverName:'Server',equipment:[item],verifiedAt:'2026-10-19T10:00:00Z'},
 {region:'eu',serverId:1,characterId:'right',rank:2,name:'추천',serverName:'Server',equipment:[{...item,enchantLevel:4}],verifiedAt:'2026-10-19T10:00:00Z'}];
 const recipe={masteryLevel:1,baseRateCurve:{rawRates:[100,500],percentDivisor:100}};
 const host=document.createElement('main');host.id='screen-localization-test';document.body.append(host);
 // Remove the app visually after its normal bootstrap. No production source changes.
 document.getElementById('root').style.display='none';
 const h=(React.default||React).createElement;
 (dom.default||dom).createRoot(host).render(h(LocaleProvider,null,h(LanguageSelect),
 h(Faction,{value:1,onChange:()=>{}}),h(Steam,{active:true}),
 h(Probability,{recipe,grades:[{key:'Beginner',name:'Beginner',min:1,max:20}]}),
 h(Equipment,{equipment:[item]}),h(Comparison,{current:character,saved:{...character,equipment:[{...item,enchantLevel:4}]}}),
 h(RankerEquipment,{rows:rankers}),h(Live),h(Official),h(Database,{active:true}),
 // Standalone IDs let the test locate nested database components unambiguously.
 h('div',{id:'isolated-npc'},h(Npc,{active:true})),h('div',{id:'isolated-journal'},h(Journal,{active:true}))));
}'''

with sync_playwright() as p:
    browser = p.chromium.launch()
    for width in [1366, 390]:
        for initial in ['ko', 'en', 'ja', 'fi']:
            page = browser.new_page(viewport={'width': width, 'height': 900})
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.add_init_script('localStorage.setItem("asbc-locale",' + json.dumps(initial) + ')')
            activity = {'appId': '3393110', 'scope': 'steam-global-total', 'players': 1234,
                        'checkedAt': '2026-10-19T10:00:00Z', 'stale': False}
            requests = []
            def api(route):
                requests.append((route.request.method, urlsplit(route.request.url).path))
                if urlsplit(route.request.url).path.endswith('/activity'):
                    route.fulfill(json=activity)
                else:
                    route.fulfill(status=503, json={})
            page.route('**/api/**', api)
            page.route('http://127.0.0.1:18732/**', lambda r: r.abort())
            page.goto(URL)
            page.evaluate(MOUNT)
            host = page.locator('#screen-localization-test')
            expect(host.locator('.asbc-language')).to_have_value(initial)
            for source in ['Steam 글로벌 접속 현황', '실측 실시간 DPS', '기본 예상 성공 확률', '공식 글로벌 제작 재료 계산']:
                expect(host.get_by_role('heading', name=label(source, initial), exact=True)).to_be_visible()
            expect(host.get_by_role('group', name=label('종족 선택', initial))).to_be_visible()
            probability = host.get_by_role('region', name=label('제작 기본 예상 확률', initial))
            probability.get_by_label(label('숙련도 레벨 차이', initial), exact=True).fill('999')
            expect(probability.get_by_role('alert')).to_have_text(label('숙련도 차이는 0~{0}의 정수로 입력하세요.', initial).replace('{0}', '1'))
            probability.get_by_label(label('숙련도 레벨 차이', initial), exact=True).fill('1')
            expect(probability.get_by_role('status')).to_contain_text('5.00%')
            host.locator('.character-equipment summary').click()
            expect(host.locator('.character-equipment strong')).to_have_text('취소')
            expect(host.locator('.character-comparison')).to_contain_text('취소')
            host.locator('.ranker-equipment-compare summary').click()
            expect(host.locator('.ranker-equipment-compare')).to_contain_text('추천')
            live = host.get_by_role('region', name=label('실측 실시간 DPS', initial))
            live.locator('summary').click()
            expect(live).to_contain_text('A2Tools')
            expect(live).not_to_contain_text('{t(')
            live.get_by_label(label('a2bc 로컬 연결키', initial), exact=True).fill('취소')
            # Open local data screens and check translated loading/data paths.
            npc = host.locator('#isolated-npc')
            npc.get_by_role('button', name=label('NPC 목록 열기', initial), exact=True).click()
            expect(npc.get_by_label(label('NPC 검색', initial), exact=True)).to_be_visible(timeout=20000)
            npc.get_by_label(label('NPC 검색', initial), exact=True).fill('no-such-npc-translation-test')
            expect(npc.get_by_role('status')).to_have_text(label('NPC 검색 결과가 없습니다.', initial))
            journal = host.locator('#isolated-journal')
            journal.get_by_role('button', name=label('퀘스트·던전·펫 열기', initial), exact=True).click()
            expect(journal.get_by_label(label('퀘스트·던전·펫 검색', initial), exact=True)).to_be_visible(timeout=20000)
            journal.get_by_label(label('퀘스트·던전·펫 검색', initial), exact=True).fill('no-such-quest-translation-test')
            expect(journal.get_by_role('status')).to_have_text(label('퀘스트·던전·펫 검색 결과가 없습니다.', initial))
            official = host.get_by_role('region', name=label('공식 제작 시도 계산', initial))
            official.get_by_role('button', name=label('공식 제작법 열기', initial), exact=True).click()
            expect(official.get_by_label(label('공식 제작법 검색', initial), exact=True)).to_be_visible(timeout=20000)
            # Switch live: drafts, source names, equipment names and numeric inputs survive.
            target = {'ko': 'en', 'en': 'ja', 'ja': 'fi', 'fi': 'ko'}[initial]
            before = page.evaluate('JSON.stringify(Object.fromEntries(Object.entries(localStorage).filter(([k])=>k!=="asbc-locale")))')
            host.locator('.asbc-language').select_option(target)
            expect(host.get_by_label(label('숙련도 레벨 차이', target), exact=True)).to_have_value('1')
            expect(host.get_by_label(label('a2bc 로컬 연결키', target), exact=True)).to_have_value('취소')
            expect(host.locator('.character-equipment strong')).to_have_text('취소')
            expect(host.locator('#isolated-npc').get_by_label(label('NPC 검색', target), exact=True)).to_have_value('no-such-npc-translation-test')
            assert page.evaluate('JSON.stringify(Object.fromEntries(Object.entries(localStorage).filter(([k])=>k!=="asbc-locale")))') == before
            # Force a refresh failure and ensure the observed player count remains visible.
            page.unroute('**/api/**', api)
            page.route('**/api/**', lambda r: r.fulfill(status=503, json={}))
            steam = host.get_by_role('region', name=label('Steam 글로벌 접속 현황', target))
            steam.get_by_role('button', name=label('접속 현황 다시 확인', target), exact=True).click()
            expect(steam.get_by_role('alert')).to_have_text(label('Steam 접속자 수 갱신 실패 · 마지막 확인값이 있으면 유지합니다.', target))
            expect(steam.locator('strong')).to_have_text(label('{0}명', target).replace('{0}', page.evaluate('(1234).toLocaleString('+json.dumps(target)+')')))
            assert not [request for request in requests if request[0] != 'GET'], requests
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (width, initial, "horizontal overflow")
            assert not errors, errors
            page.screenshot(path=f'/tmp/asbc-screens-{width}-{initial}.png', full_page=True)
            page.close()
    browser.close()
print('PASS screen localization: four locales, desktop/mobile, live switching, probabilities, source/user names, read-only data, activity refresh failure')
