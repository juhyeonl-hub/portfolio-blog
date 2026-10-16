import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('observation', Path(__file__).with_name('audit-crafting-observation.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ObservationTests(unittest.TestCase):
    def rows(self):
        return [{'Gap': k, 'Rate': v * 1_000_000 + 500_000} for k, v in module.OBSERVED.items()]

    def test_full_curve_and_missing_point(self):
        rows = self.rows()
        self.assertEqual(len(rows), 57)
        self.assertTrue(module.matches(rows))
        self.assertFalse(module.matches(rows[:-1]))

    def test_wrong_units_and_boundary(self):
        rows = self.rows()
        rows[0]['Rate'] = 68_000_000
        self.assertFalse(module.matches(rows))
        self.assertFalse(module.matches([{'Gap': 0, 'Rate': 67}]))

    def test_invalid_and_duplicate_data(self):
        for rows in [[{'Gap': 0, 'Rate': True}], [{'Gap': -1, 'Rate': 1}],
                     [{'Gap': 0, 'Rate': 100_000_001}], self.rows() + self.rows()]:
            with self.assertRaises(ValueError):
                module.matches(rows)
