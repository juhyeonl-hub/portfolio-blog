"""Report flow with controlled API responses: member reports in the planner, administrator queue in the blog admin.
Never creates real posts or reports."""
import json, os
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect
ROOT = Path(__file__).resolve().parents[2]
URL = os.environ.get('SHADOWCRAFT_TEST_URL', 'http://127.0.0.1:5173/lab/shadowcraft/')
ORIGIN = '{0.scheme}://{0.netloc}'.format(urlsplit(URL))
CATALOG = json.loads((ROOT / 'frontend/shadowcraft/lib/data/catalogs/assassin.json').read_text())
ID = '22222222-2222-4222-8222-222222222222'
PLAN = {'classKey': 'assassin', 'level': 45, 'mode': 'safe', 'base': {}, 'bonus': {}, 'specs': {}, 'nodes': [], 'checked': [], 'character': None, 'extraSP': 0, 'extraStigma': 0, 'extraCrystal': 0, 'extraBattle': 0}
BUILD = {'id': ID, 'title': 'Reported build', 'description': 'desc', 'authorId': 'author', 'author': 'someone', 'classKey': 'assassin',
         'catalogVersion': CATALOG['version'], 'published': True, 'revision': 1, 'updatedAt': '2026-10-19T10:00:00Z',
         'shared': {'schema': 'a2bc-share-v1', 'catalogVersion': CATALOG['version'], 'plan': PLAN}}
SOCIAL = {'votes': 0, 'voted': False, 'page': 0, 'totalComments': 2, 'comments': [
    {'id': 'c-other', 'author_id': 'author', 'author': 'someone', 'body': 'other comment', 'created_at': '2026-10-19T10:00:00Z'},
    {'id': 'c-mine', 'author_id': 'me', 'author': 'reporter', 'body': 'my comment', 'created_at': '2026-10-19T10:01:00Z'}]}

with sync_playwright() as p:
    browser = p.chromium.launch()
    # Planner: a member reports someone else's build and comment; own comment has no report button.
    page = browser.new_page(viewport={'width': 1366, 'height': 900}); posts = []; errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.add_init_script('sessionStorage.setItem("a2bc-member-session-v1",JSON.stringify({token:"t",member:{id:"me",username:"reporter"}}));')
    def planner(r):
        path = urlsplit(r.request.url).path
        if r.request.method == 'POST': posts.append((path, r.request.post_data_json))
        if path == '/api/community/me': return r.fulfill(json={'id': 'me', 'username': 'reporter'})
        if path == '/api/public/shadowcraft/builds/' + ID: return r.fulfill(json=BUILD)
        if path.endswith('/community'): return r.fulfill(json=SOCIAL)
        if path.endswith('/report'):
            if path.endswith('c-other/report') and len([x for x in posts if x[0] == path]) > 1: return r.fulfill(status=409, json={'error': '이미 신고했습니다.'})
            return r.fulfill(status=201, body='')
        r.fulfill(json={})
    page.route('**/api/**', planner)
    page.goto(URL + '#published=' + ID)
    discussion = page.get_by_role('region', name='빌드 추천과 댓글')
    discussion.get_by_role('button', name='이 빌드 신고', exact=True).click()
    discussion.get_by_label('신고 사유', exact=True).select_option('hate')
    discussion.get_by_label('설명 (선택)', exact=True).fill('slur in title')
    discussion.get_by_role('button', name='신고 보내기', exact=True).click()
    expect(discussion.get_by_role('status').filter(has_text='신고했습니다. 관리자가 확인합니다.')).to_be_visible()
    assert ('/api/community/builds/' + ID + '/report', {'reason': 'hate', 'detail': 'slur in title'}) in posts, posts
    comments = discussion.get_by_role('button', name='댓글 신고', exact=True)
    expect(comments).to_have_count(1)  # only the other member's comment
    comments.click(); discussion.get_by_role('button', name='신고 보내기', exact=True).click()
    assert any(x[0] == '/api/community/builds/' + ID + '/comments/c-other/report' and x[1]['reason'] == 'spam' for x in posts), posts
    assert not errors, errors
    page.close()

    # Own build: no build report button.
    page = browser.new_page(); page.add_init_script('sessionStorage.setItem("a2bc-member-session-v1",JSON.stringify({token:"t",member:{id:"author",username:"someone"}}));')
    page.route('**/api/**', lambda r: r.fulfill(json={'id': 'author', 'username': 'someone'} if r.request.url.endswith('/me') else BUILD if r.request.url.endswith(ID) else SOCIAL if '/community' in r.request.url else {}))
    page.goto(URL + '#published=' + ID)
    expect(page.get_by_role('region', name='빌드 추천과 댓글').get_by_text('추천과 댓글', exact=True)).to_be_visible()
    expect(page.get_by_role('button', name='이 빌드 신고', exact=True)).to_have_count(0)
    page.close()

    # Admin queue: list, dismiss, hide a build, delete a comment.
    queue = [{'targetKey': 'build:' + ID, 'type': 'build', 'buildId': ID, 'buildTitle': 'Reported build', 'published': True, 'author': 'someone', 'text': 'Reported build', 'count': 2, 'reasons': ['hate', 'spam'], 'details': ['slur in title'], 'latest': '2026-10-19'},
             {'targetKey': 'comment:c-other', 'type': 'comment', 'buildId': ID, 'buildTitle': 'Reported build', 'published': True, 'author': 'someone', 'text': 'other comment', 'count': 1, 'reasons': ['abuse'], 'details': [], 'latest': '2026-10-19'}]
    page = browser.new_page(viewport={'width': 1366, 'height': 900}); resolves = []; errors = []
    page.on('pageerror', lambda e: errors.append(str(e))); page.on('dialog', lambda d: d.accept())
    page.add_init_script('localStorage.setItem("token","admin-test")')
    def admin(r):
        path = urlsplit(r.request.url).path
        if path == '/api/auth/me': return r.fulfill(json={'authenticated': True, 'username': 'admin'})
        if path == '/api/admin/shadowcraft/reports': return r.fulfill(json={'items': queue})
        if path == '/api/admin/shadowcraft/reports/resolve':
            body = r.request.post_data_json; resolves.append(body)
            queue[:] = [q for q in queue if q['targetKey'] != body['targetKey']]
            return r.fulfill(json=body)
        r.fulfill(json={})
    page.route('**/api/**', admin)
    page.goto(ORIGIN + '/admin/a2bc-reports')
    lst = page.get_by_role('list', name='신고 목록')
    items = lst.locator(':scope > li')
    expect(items).to_have_count(2)
    expect(lst).to_contain_text('신고 2건'); expect(lst).to_contain_text('혐오·차별, 스팸·광고'); expect(lst).to_contain_text('slur in title')
    first = items.nth(0)
    expect(first.get_by_role('link', name='공개 화면 열기')).to_have_attribute('href', '/lab/shadowcraft/#published=' + ID)
    first.get_by_role('button', name='빌드 비공개', exact=True).click()
    expect(page.get_by_role('status')).to_contain_text('빌드를 비공개로 전환했습니다.')
    comment = items.nth(0)
    expect(comment.get_by_role('button', name='빌드 비공개', exact=True)).to_have_count(0)
    comment.get_by_role('button', name='댓글 삭제', exact=True).click()
    expect(page.get_by_text('처리할 신고가 없습니다.', exact=True)).to_be_visible()
    assert resolves == [{'targetKey': 'build:' + ID, 'action': 'hide'}, {'targetKey': 'comment:c-other', 'action': 'delete'}], resolves
    assert not errors, errors
    browser.close()
print('PASS reports: member build/comment report payloads, own content without report button, admin queue hide/delete with confirmation')
