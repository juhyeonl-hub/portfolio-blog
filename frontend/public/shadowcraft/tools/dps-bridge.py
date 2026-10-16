"""Read-only loopback adapter for A2Tools overlay snapshots. No packet capture.
Run on the game PC with Python 3; enter the local meter key at the prompt.
"""
import getpass
import hmac
import json
import secrets
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlencode
from urllib.request import ProxyHandler, HTTPRedirectHandler, build_opener

ORIGIN = 'https://juhyeonl.dev'
LIMIT = 65536


def snapshot(value):
    def integer(x):
        return type(x) is int and 0 <= x <= 9007199254740991
    def text(x):
        return isinstance(x, str) and len(x) <= 128
    if not isinstance(value, dict) or type(value.get('v')) is not int or value['v'] != 1:
        raise ValueError('Unsupported snapshot')
    if not text(value.get('target')) or not text(value.get('mode')) or not integer(value.get('timeMs')):
        raise ValueError('Invalid fight')
    rows = value.get('rows')
    if not isinstance(rows, list) or len(rows) > 64:
        raise ValueError('Invalid rows')
    cleaned = []
    for row in rows:
        if not isinstance(row, dict) or not text(row.get('name')) or not integer(row.get('dps')) or not integer(row.get('dmg')) or type(row.get('you')) is not bool:
            raise ValueError('Invalid player')
        cleaned.append({key: row[key] for key in ('name', 'dps', 'dmg', 'you')})
    return {'v': 1, 'target': value['target'], 'mode': value['mode'], 'timeMs': value['timeMs'], 'rows': cleaned}


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise ValueError('Redirect refused')


def fetch_snapshot(key, port):
    # Fixed loopback host, no environment proxy and no redirects to other hosts.
    opener = build_opener(ProxyHandler({}), NoRedirect())
    url = 'http://127.0.0.1:%d/overlay/snapshot?' % port + urlencode({'key': key})
    with opener.open(url, timeout=2) as response:
        raw = response.read(LIMIT + 1)
    if len(raw) > LIMIT:
        raise ValueError('Oversized snapshot')
    return snapshot(json.loads(raw))


def handler(token, reader):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass  # Never log credentials or combat data.

        def reply(self, status, body=None):
            self.send_response(status)
            if self.headers.get('Origin') == ORIGIN:
                self.send_header('Access-Control-Allow-Origin', ORIGIN)
                self.send_header('Vary', 'Origin')
                self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'X-A2BC-Token')
                self.send_header('Access-Control-Allow-Private-Network', 'true')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            if body is not None:
                self.wfile.write(json.dumps(body, ensure_ascii=False).encode())

        def allowed(self):
            return self.path == '/snapshot' and self.headers.get('Host') == '127.0.0.1:18732' and self.headers.get('Origin') == ORIGIN

        def do_OPTIONS(self):
            self.reply(204 if self.allowed() else 403)

        def do_GET(self):
            if not self.allowed() or not hmac.compare_digest(self.headers.get('X-A2BC-Token', '').encode('utf-8'), token.encode('utf-8')):
                self.reply(403)
                return
            try:
                value = reader()
            except Exception:
                self.reply(502, {'error': 'Meter unavailable or invalid snapshot'})
                return
            self.reply(200, value)
    return Handler


if __name__ == '__main__':
    port = input('A2Tools stream port [18731]: ').strip() or '18731'
    if not port.isdigit() or not 1024 <= int(port) <= 65535 or int(port) == 18732:
        raise SystemExit('Invalid port')
    key = getpass.getpass('A2Tools stream key (hidden): ')
    if not key or len(key) > 256:
        raise SystemExit('Invalid key')
    token = secrets.token_urlsafe(32)
    server = ThreadingHTTPServer(('127.0.0.1', 18732), handler(token, lambda: fetch_snapshot(key, int(port))))
    print('a2bc local connection key (session only): ' + token)
    print('Listening on 127.0.0.1:18732; Ctrl+C to stop. Nothing is uploaded.')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
