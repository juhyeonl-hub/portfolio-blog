import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from urllib.error import HTTPError

spec = importlib.util.spec_from_file_location('acquire', Path(__file__).with_name('acquire-public-sources.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class AcquisitionTests(unittest.TestCase):
    def test_server_validation(self):
        row = {'raceId': 1, 'serverId': 1301, 'serverName': 'Siel'}
        module.validate({'serverList': [row]}, 'servers')
        for rows in ([], [row, row], [{**row, 'raceId': 3}], ['invalid']):
            with self.assertRaises(ValueError):
                module.validate({'serverList': rows}, 'servers')

    def test_empty_rankings_are_valid_but_not_samples(self):
        self.assertEqual(module.validate({'rankingList': []}, 'ranking')['rankingList'], [])
        with self.assertRaises(ValueError):
            module.validate({'rankingList': None}, 'ranking')

    def test_reject_html_and_oversized_json(self):
        for raw in (b'<html>gate</html>', b'null', b' ' * (module.LIMIT + 1)):
            with self.assertRaises(ValueError):
                module.decode_json(raw)

    def test_pagination(self):
        self.assertIsNone(module.next_cursor({'hasMore': False}, set()))
        self.assertEqual(module.next_cursor({'hasMore': True, 'contentList': [{'id': '7'}]}, {'0'}), '7')
        for rows in ([], [{'id': '0'}]):
            with self.assertRaises(ValueError):
                module.next_cursor({'hasMore': True, 'contentList': rows}, {'0'})

    def test_archive_hash_and_separate_runs(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp) / 'run'
            collector = module.Collector(folder, lambda u, h: b'{"rankingList": []}')
            collector.get('ranking.json', 'https://example.test', 'ranking')
            record = collector.save_manifest({})['requests'][0]
            self.assertEqual(record['count'], 0)
            self.assertEqual(len(record['sha256']), 64)
            with self.assertRaises(FileExistsError):
                module.Collector(folder)
            with self.assertRaises(ValueError):
                collector.get('../outside', 'https://example.test')

    def test_failed_fetch_does_not_write_body_or_credentials(self):
        def fail(url, headers):
            raise HTTPError(url, 401, 'secret should not appear', {}, None)
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp) / 'run'
            collector = module.Collector(folder, fail)
            self.assertIsNone(collector.get('data.json', 'https://example.test', headers={'Authorization': 'secret'}))
            manifest = collector.save_manifest({})
            self.assertEqual(manifest['requests'][0]['reason'], 'HTTP-401')
            self.assertNotIn('secret', json.dumps(manifest))
            self.assertFalse((folder / 'data.json').exists())

    def test_html_gate_not_archived_as_source(self):
        with tempfile.TemporaryDirectory() as tmp:
            collector = module.Collector(Path(tmp) / 'run', lambda u, h: b'<!-- AI gate -->')
            self.assertIsNone(collector.get('source.html', 'https://example.test', 'text'))


if __name__ == '__main__':
    unittest.main()
