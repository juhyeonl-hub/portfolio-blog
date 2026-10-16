import importlib.util
from pathlib import Path
import unittest
spec = importlib.util.spec_from_file_location('npc_index', Path(__file__).with_name('build-npc-index.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class NpcIndexTests(unittest.TestCase):
    def row(self, **changes):
        return dict({'ID': {'Value': 1}, 'Desc': {'Key': 'test'}, 'NpcType': 'ENpcType::Citizen'}, **changes)

    def test_names_and_missing(self):
        self.assertEqual(module.build([self.row()], {'String_test_body': ' Name '}, '25926599')['npcs'][0]['name'], 'Name')
        self.assertIsNone(module.build([self.row()], {}, '25926599')['npcs'][0]['name'])

    def test_duplicate(self):
        with self.assertRaises(ValueError): module.build([self.row(), self.row()], {}, '1')

    def test_invalid_fields(self):
        for row in [self.row(ID={'Value': True}), self.row(NpcType='Unknown'), self.row(Desc={'Key': 1})]:
            with self.assertRaises(ValueError): module.build([row], {}, '1')
        with self.assertRaises(ValueError): module.build([], {}, '1')
        with self.assertRaises(ValueError): module.build([self.row()], {}, 'invalid')
        with self.assertRaises(ValueError): module.build([self.row()], {'String_test_body': 1}, '1')
