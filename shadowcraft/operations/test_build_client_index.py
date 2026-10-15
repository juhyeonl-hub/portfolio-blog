"""Synthetic reference/provenance tests; does not require game files."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('client_index', Path(__file__).with_name('build-client-index.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class ClientIndexTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.entries = {'String_item_body': '<b>Material</b>'}
        self.rows = {'Item': [{'ID': {'Value': 1}, 'Name': 'item', 'Desc': {'Key': 'item'}, 'ItemType': 'EItemType::Material', 'ItemGrade': 'EItemGrade::Common', 'ItemLevel': 1}],
                     'CraftRecipe': [{'ID': {'Value': 2}, 'Product': 'item', 'ProductCount': 1, 'Category': 'ECraftCategory::Cooking', 'QualificationRace': 'ERace::All', 'MasteryLevel': 1, 'ComboRecipe': 'None', 'ComponentList': [{'Item': 'item', 'Count': 2, 'Enchant': 0}]}], 'Skill': [], 'SkillList': []}
        for ci, cls in enumerate(['Assassin','Gladiator','Templar','Ranger','Elementalist','Sorcerer','Cleric','Chanter']):
            ids = list(range(1000 + ci * 35, 1035 + ci * 35))
            self.rows['SkillList'].append({'ClassType': 'ECharacterClass::'+cls, 'SkillIdList': ids})
            for key in ids:
                self.rows['Skill'].append({'ID': {'Value': key}, 'SkillString_Key': str(key)})
                self.entries['SkillString_'+str(key)+'_skill_name'] = 'Skill '+str(key)
    def build(self, build_id='123'):
        for key, rows in self.rows.items():
            (self.root/(key+'.json')).write_text(json.dumps({'Properties': {'Data': rows}}))
        language = self.root/'English.json'
        language.write_text(json.dumps({'Entries': self.entries}))
        return module.build(self.root, language, build_id)
    def test_complete(self):
        data = self.build()
        self.assertEqual(len(data['skills']), 280)
        self.assertEqual(data['items'][0]['name'], 'Material')
        self.assertIsNone(data['recipes'][0]['successRate'])
        self.assertIsNone(data['recipes'][0]['feePerAttempt'])
        self.assertFalse(data['source']['liveAvailabilityVerified'])
        self.assertEqual(len(data['source']['inputSha256']), 5)
    def test_missing_reference(self):
        self.rows['CraftRecipe'][0]['ComponentList'][0]['Item'] = 'missing'
        with self.assertRaises(KeyError): self.build()
    def test_missing_localization(self):
        del self.entries['String_item_body']
        with self.assertRaises(KeyError): self.build()
    def test_duplicate(self):
        self.rows['Item'] *= 2
        with self.assertRaises(ValueError): self.build()
    def test_missing_skill(self):
        self.rows['Skill'].pop()
        with self.assertRaises(KeyError): self.build()
    def test_bad_counts(self):
        for count in [0, -1, True, 1.5, 1000001]:
            self.rows['CraftRecipe'][0]['ProductCount'] = count
            with self.assertRaises(ValueError): self.build()
    def test_explicit_build(self):
        for value in ['', 'global', '0', 123, None]:
            with self.assertRaises(ValueError): self.build(value)
    def test_empty_text(self):
        self.entries['String_item_body'] = '<b></b>'
        with self.assertRaises(ValueError): self.build()
    def test_bad_mastery(self):
        self.rows['CraftRecipe'][0]['MasteryLevel'] = -1
        with self.assertRaises(ValueError): self.build()
    def test_missing_class(self):
        self.rows['SkillList'].pop()
        with self.assertRaises(ValueError): self.build()

if __name__ == '__main__': unittest.main()
