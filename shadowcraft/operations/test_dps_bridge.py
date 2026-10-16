import importlib.util
import json
from pathlib import Path
import threading
import unittest
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer

spec = importlib.util.spec_from_file_location('bridge', Path(__file__).with_name('dps-bridge.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


def sample():
    return {'v': 1, 'target': 'Test target', 'mode': 'bossTargets', 'timeMs': 10000,
            'rows': [{'name': 'Synthetic test', 'dps': 123, 'dmg': 1234, 'you': True, 'private': 'discard'}]}


class BridgeTests(unittest.TestCase):
    def test_measured_values_preserved_not_recomputed(self):
        data = m.snapshot(sample())
        self.assertEqual(data['rows'][0]['dps'], 123)
        self.assertEqual(data['rows'][0]['dmg'], 1234)
        self.assertNotIn('private', data['rows'][0])

    def test_invalid(self):
        for key, value in [('v', True), ('v', 2), ('timeMs', -1), ('timeMs', 1.5), ('rows', [None]), ('rows', [sample()['rows'][0]] * 65)]:
            data = sample(); data[key] = value
            with self.assertRaises(ValueError): m.snapshot(data)
        for key, value in [('dps', True), ('dmg', 2**53), ('you', 1), ('name', 'x' * 129)]:
            data = sample(); data['rows'][0][key] = value
            with self.assertRaises(ValueError): m.snapshot(data)

    def test_origin_host_auth_and_no_capture(self):
        calls = []
        server = ThreadingHTTPServer(('127.0.0.1', 0), m.handler('test-token', lambda: (calls.append(1), m.snapshot(sample()))[1]))
        thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
        try:
            def request(headers, method='GET'):
                client = HTTPConnection(*server.server_address, timeout=2)
                client.request(method, '/snapshot', headers=headers)
                response = client.getresponse(); result = (response.status, dict(response.getheaders()), response.read()); client.close(); return result
            valid = {'Host': '127.0.0.1:18732', 'Origin': m.ORIGIN, 'X-A2BC-Token': 'test-token'}
            for patch in [{'Origin': 'https://evil.example'}, {'Host': 'evil.example'}, {'X-A2BC-Token': 'bad'}]:
                self.assertEqual(request({**valid, **patch})[0], 403)
            self.assertFalse(calls)
            status, headers, body = request(valid)
            self.assertEqual(status, 200); self.assertEqual(headers['Access-Control-Allow-Origin'], m.ORIGIN)
            self.assertEqual(headers['Cache-Control'], 'no-store')
            self.assertEqual(json.loads(body)['rows'][0]['dps'], 123)
            self.assertEqual(request(valid, 'OPTIONS')[0], 204)
            self.assertEqual(len(calls), 1)
        finally:
            server.shutdown(); server.server_close(); thread.join()

    def test_download_matches_reviewed_tool(self):
        self.assertEqual(Path(__file__).with_name('dps-bridge.py').read_bytes(), (Path(__file__).parents[2] / 'frontend/public/shadowcraft/tools/dps-bridge.py').read_bytes())
