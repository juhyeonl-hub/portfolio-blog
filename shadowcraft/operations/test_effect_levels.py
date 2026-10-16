"""Guard against silently inventing growth relationships or filling missing levels."""
import importlib.util
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('effect_levels', Path(__file__).with_name('audit-effect-levels.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


class EffectLevelTests(unittest.TestCase):
    def test_snapshot_hash_and_determinism(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            hashes = {}
            def write(name, value):
                data = json.dumps(value).encode()
                (root / (name + '.json')).write_bytes(data)
                hashes[name] = hashlib.sha256(data).hexdigest()
            write('Skill', {'Properties': {'Data': [{'ID': {'Value': 1}, 'SkillString_Key': 'sample'}]}})
            write('English', {'Entries': {'SkillString_sample_skill_desc_effect': '{se_dmg:5:unknown}'}})
            for name in ('SkillEffect', 'SkillEffectLv', 'SkillAbnormalEffect', 'SkillAbnormalEffectLv'):
                rows = [{'ID': {'Value': 5}, 'SkillEffectLvGroupId': 'None'}] if name == 'SkillEffect' else []
                write(name, {'Properties': {'Data': rows}})
            write('index', {'skills': [{'id': '1'}], 'source': {'inputSha256': dict(hashes)}})
            args = [root / 'index.json', root / 'Skill.json', root / 'English.json', root]
            result = m.build(*args)
            self.assertEqual(result, m.build(*args))
            self.assertEqual(result['effects']['se']['counts']['no-explicit-group'], 1)
            write('English', {'Entries': {}})
            with self.assertRaisesRegex(ValueError, 'Snapshot hash mismatch: English'):
                m.build(*args)

    def test_explicit_group_and_gaps(self):
        rows = [{'ID': {'Value': i}, 'group': 'growth', 'level': lv}
                for i, lv in [(1, 2), (2, 4)]]
        groups = m.growth_index(rows, 'group', 'level', 'ID')
        actual = m.audit([9, 9], {9: {'group': 'growth'}}, groups, 'group')
        self.assertEqual(len(actual), 1)
        self.assertEqual(actual[0]['levelCount'], 2)
        self.assertEqual(actual[0]['firstLevel'], 2)
        self.assertEqual(actual[0]['lastLevel'], 4)
        self.assertEqual(actual[0]['internalGaps'], [3])
        self.assertEqual(actual[0]['status'], 'linked')

    def test_missing_group_is_not_base_fallback(self):
        actual = m.audit([1, 2], {1: {'group': 'None'}, 2: {'group': 'missing'}}, {}, 'group')
        self.assertEqual([r['status'] for r in actual], ['no-explicit-group', 'missing-group'])

    def test_missing_base_fails(self):
        with self.assertRaises(ValueError):
            m.audit([42], {}, {}, 'group')

    def test_duplicate_level_fails_even_with_distinct_ids(self):
        with self.assertRaises(ValueError):
            m.growth_index([{'ID': {'Value': i}, 'group': 'g', 'level': 2}
                            for i in (1, 2)], 'group', 'level', 'ID')

    def test_invalid_identity_and_level(self):
        for value in (True, 0, -1, '1'):
            with self.subTest(value=value), self.assertRaises(ValueError):
                m.unique([{'ID': {'Value': value}}], 'ID')
        for value in (True, 0, 101, '2'):
            with self.subTest(value=value), self.assertRaises(ValueError):
                m.growth_index([{'ID': {'Value': 1}, 'group': 'g', 'level': value}], 'group', 'level', 'ID')
        with self.assertRaises(ValueError):
            m.unique([{'ID': {'Value': 1}}, {'ID': {'Value': 1}}], 'ID')


if __name__ == '__main__':
    unittest.main()
