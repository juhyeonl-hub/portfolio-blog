"""Production HTTPS -> actual loopback HTTP, synthetic snapshot; no game capture."""
import importlib.util
from pathlib import Path
import threading
from http.server import ThreadingHTTPServer
from playwright.sync_api import sync_playwright, expect

spec = importlib.util.spec_from_file_location('dps_bridge', Path(__file__).parents[1]/'operations/dps-bridge.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
calls = []
def reader():
    calls.append(1)
    return {'v':1,'target':'Synthetic socket test','mode':'bossTargets','timeMs':10000,'rows':[{'name':'Synthetic test','dps':123,'dmg':1234,'you':True}]}
server = ThreadingHTTPServer(('127.0.0.1',18732),m.handler('synthetic-test-key',reader))
thread = threading.Thread(target=server.serve_forever,daemon=True);thread.start()
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        page=browser.new_page()
        page.goto('https://juhyeonl.dev/lab/shadowcraft/')
        page.get_by_role('tab',name='실측 DPS',exact=True).click()
        panel=page.get_by_role('region',name='실측 실시간 DPS',exact=True)
        panel.get_by_label('a2bc 로컬 연결키',exact=True).fill('synthetic-test-key')
        panel.get_by_role('button',name='연결',exact=True).click()
        expect(panel.get_by_role('status')).to_contain_text('갱신 중단',timeout=10000)
        assert not calls  # Browser must not reach loopback before permission.
        page.context.grant_permissions(['local-network-access'], origin='https://juhyeonl.dev')
        expect(panel.get_by_role('status')).to_contain_text('수집기 연결됨',timeout=15000)
        expect(panel.locator('tbody')).to_contain_text('1,234')
        assert calls
        panel.get_by_role('button',name='연결 해제',exact=True).click()
        browser.close()
finally:
    server.shutdown();server.server_close();thread.join()
print('Production HTTPS -> actual loopback bridge with Origin/token: PASS (synthetic data; no game capture)')
