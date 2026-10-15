"""Synthetic fixtures only; no game payload or archive credentials required."""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('audit-client-export.py')
SPEC = importlib.util.spec_from_file_location('client_audit', SCRIPT)
audit_module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(audit_module)


class ClientExportAuditTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.tables = self.root / 'tables'
        self.catalogs = self.root / 'catalogs'
        self.tables.mkdir()
        self.catalogs.mkdir()
        self.rosters = []
        for index, name in enumerate(audit_module.CLASSES, 1):
            self.rosters.append({'ClassType': f'ECharacterClass::{name.capitalize()}',
                                 'SkillIdList': [index]})
            (self.catalogs / f'{name}.json').write_text(json.dumps(
                {'catalog': {'skills': [{'id': str(index)}]}}))
        for name in audit_module.REQUIRED:
            self.write_table(name, self.rosters if name == 'SkillList' else [{'ID': 1}])

    def write_table(self, name, rows):
        (self.tables / f'{name}.json').write_text(json.dumps({'Properties': {'Data': rows}}))

    def run_audit(self):
        return audit_module.audit(self.tables, self.catalogs)

    def test_complete_structure_never_approves_production_or_semantics(self):
        result = self.run_audit()
        self.assertEqual(result['status'], 'structurally-complete')
        self.assertFalse(result['mappingSemanticsVerified'])
        self.assertFalse(result['productionImportApproved'])

    def test_raw_fallback_does_not_satisfy_required_table(self):
        (self.tables / 'CraftRecipe.json').unlink()
        (self.tables / 'CraftRecipe.dat').write_bytes(b'raw fallback')
        result = self.run_audit()
        self.assertEqual(result['status'], 'incomplete')
        self.assertEqual(result['missingTables'], ['CraftRecipe'])

    def test_roster_difference_is_incomplete(self):
        self.rosters[0]['SkillIdList'] = [999]
        self.write_table('SkillList', self.rosters)
        result = self.run_audit()
        self.assertEqual(result['status'], 'incomplete')
        self.assertEqual(result['skillRosters']['assassin']['missingFromCatalog'], ['999'])
        self.assertEqual(result['skillRosters']['assassin']['missingFromOfficial'], ['1'])

    def test_invalid_skill_lists(self):
        for value in ([1, 1], [True], ['1'], [0], [], None):
            with self.subTest(value=value):
                self.rosters[0]['SkillIdList'] = value
                self.write_table('SkillList', self.rosters)
                with self.assertRaises(ValueError):
                    self.run_audit()

    def test_missing_class_rejected(self):
        self.write_table('SkillList', self.rosters[1:])
        with self.assertRaisesRegex(ValueError, 'no official skill roster'):
            self.run_audit()

    def test_duplicate_catalog_rejected(self):
        (self.catalogs / 'assassin.json').write_text(json.dumps(
            {'catalog': {'skills': [{'id': 1}, {'id': '1'}]}}))
        with self.assertRaisesRegex(ValueError, 'duplicate catalog'):
            self.run_audit()

    def test_empty_or_nonobject_rows_rejected(self):
        for rows in ([], [1], None):
            with self.subTest(rows=rows):
                self.write_table('Map', rows)
                with self.assertRaises(ValueError):
                    self.run_audit()

    def test_cli_malformed_json_returns_invalid(self):
        (self.tables / 'SkillList.json').write_text('{broken')
        result = subprocess.run([sys.executable, str(SCRIPT), str(self.tables)],
                                capture_output=True, text=True)
        self.assertEqual(result.returncode, 1)
        self.assertEqual(json.loads(result.stdout)['status'], 'invalid')

    def test_cli_empty_directory_returns_incomplete(self):
        empty = self.root / 'empty'
        empty.mkdir()
        result = subprocess.run([sys.executable, str(SCRIPT), str(empty)],
                                capture_output=True, text=True)
        self.assertEqual(result.returncode, 2)
        self.assertEqual(json.loads(result.stdout)['missingTables'], list(audit_module.REQUIRED))


if __name__ == '__main__':
    unittest.main()
