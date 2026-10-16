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
    def test_mastery_ranges(self):
        entries = {'String_UI_MASTERYGRADE_BEGINNER_body': 'Novice', 'String_UI_MASTERYGRADE_INTERMEDIATE_body': 'Professional'}
        rows = [{'CraftMasteryLevel': i, 'CraftMasteryGrade': 'ECraftMasteryGrade::' + ('Beginner' if i <= 50 else 'Intermediate')} for i in range(1, 101)]
        grades = module.mastery_grades(rows, entries)
        self.assertEqual([(g['min'], g['max']) for g in grades], [(1,50),(51,100)])
        self.assertEqual(grades[1]['min'] + 5 - 1, 55)
        for broken in [[], rows[1:], rows + rows[:1], [rows[0], {**rows[1], 'CraftMasteryLevel': True}]]:
            with self.assertRaises(ValueError): module.mastery_grades(broken, entries)
        with self.assertRaises(KeyError): module.mastery_grades(rows, {})

    def test_rate_validation(self):
        valid = [{'Name': 'test', 'Rates': [{'Gap': 0, 'Rate': 67506212}, {'Gap': 1, 'Rate': 68198244}]}]
        self.assertEqual(module.craft_curves(valid)['test'], [67506212, 68198244])
        for records in [[], valid + valid, [{'Name': 'test', 'Rates': []}],
                        [{'Name': 'test', 'Rates': [{'Gap': 1, 'Rate': 1}]}],
                        [{'Name': 'test', 'Rates': [{'Gap': 0, 'Rate': True}]}],
                        [{'Name': 'test', 'Rates': [{'Gap': 0, 'Rate': 100000001}]}]]:
            with self.assertRaises(ValueError):
                module.craft_curves(records)

    def test_rate_links_and_missing_group(self):
        self.rows['CraftRecipeRate'] = [{'Name': 'test', 'Rates': [{'Gap': 0, 'Rate': 67506212}]}]
        self.rows['CraftRecipe'][0]['CraftRateGroup'] = 'test'
        data = self.build()
        self.assertEqual(data['recipes'][0]['baseRateCurve']['rawRates'], [67506212])
        self.assertIn('CraftRecipeRate', data['source']['inputSha256'])
        self.rows['CraftRecipe'][0]['CraftRateGroup'] = 'None'
        self.assertIsNone(self.build()['recipes'][0]['baseRateCurve'])
        self.rows['CraftRecipe'][0]['CraftRateGroup'] = 'missing'
        with self.assertRaises(ValueError):
            self.build()

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.entries = {'String_item_body': '<b>Material</b>'}
        self.rows = {'Item': [{'ID': {'Value': 1}, 'Name': 'item', 'Desc': {'Key': 'item'}, 'ItemType': 'EItemType::Material', 'ItemGrade': 'EItemGrade::Common', 'ItemLevel': 1}],
                     'CraftRecipe': [{'ID': {'Value': 2}, 'Name': 'recipe', 'Product': 'item', 'ProductCount': 1, 'Category': 'ECraftCategory::Cooking', 'QualificationRace': 'ERace::All', 'MasteryLevel': 1, 'ComboRecipe': 'None', 'ComponentList': [{'Item': 'item', 'Count': 2, 'Enchant': 0}]}], 'Skill': [], 'SkillList': [], 'SkillAcquireData': []}
        for ci, cls in enumerate(['Assassin','Gladiator','Templar','Ranger','Elementalist','Sorcerer','Cleric','Chanter']):
            ids = list(range(1000 + ci * 35, 1035 + ci * 35))
            self.rows['SkillList'].append({'ClassType': 'ECharacterClass::'+cls, 'SkillIdList': ids})
            for key in ids:
                self.rows['Skill'].append({'ID': {'Value': key}, 'SkillString_Key': str(key)})
                self.rows['SkillAcquireData'].append({'SkillId': {'Value': key}, 'SkillLevel': 1, 'ClassType': 'ECharacterClass::'+cls, 'bAutoLearn': True, 'NeedCharacterLevel': 1, 'CostSkillPoint': 0, 'CostStigmaPoint': 0, 'NeedAscensionGrade': 'EAscensionGrade::None', 'NeedPrevSkillDataList': [], 'CostItemDataList': []})
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
        self.assertEqual(len(data['source']['inputSha256']), 6)
    def test_official_description(self):
        key = 'SkillString_1000_skill_desc_effect'
        self.entries[key] = '<unique>Deals {se:123:value} damage.</>\nRestores 100 MP.'
        desc = self.build()['skills'][0]['description']
        self.assertEqual(desc, {'text': 'Deals [unresolved value] damage.\nRestores 100 MP.', 'unresolvedValues': 1})
        self.entries[key] = 'Broken {value'
        with self.assertRaises(ValueError): self.build()

    def test_combo_reference(self):
        import copy
        second = copy.deepcopy(self.rows['CraftRecipe'][0])
        second.update(ID={'Value': 3}, Name='combo')
        self.rows['CraftRecipe'].append(second)
        self.rows['CraftRecipe'][0]['ComboRecipe'] = 'combo'
        self.assertEqual(self.build()['recipes'][0]['comboRecipeId'], '3')
        self.rows['CraftRecipe'][0]['ComboRecipe'] = 'missing'
        with self.assertRaises(KeyError): self.build()

    def test_duplicate_recipe_name(self):
        import copy
        second = copy.deepcopy(self.rows['CraftRecipe'][0])
        second['ID']['Value'] = 3
        self.rows['CraftRecipe'].append(second)
        with self.assertRaises(ValueError): self.build()

    def test_explicit_succession_candidates(self):
        row = self.rows['CraftRecipe'][0]
        row.update(Type='ECraftType::Succession', SuccessionComponentCandidateList=['item'])
        result = self.build()['recipes'][0]
        self.assertEqual(result['craftType'], 'Succession')
        self.assertEqual(result['successionCandidateItemIds'], ['1'])
        self.assertEqual(result['ingredients'], [{'itemId': '1', 'quantity': 2, 'enchant': 0}])
        row['SuccessionComponentCandidateList'] = ['missing']
        with self.assertRaises(KeyError): self.build()

    def test_bad_succession_metadata(self):
        row = self.rows['CraftRecipe'][0]
        for kind, candidates in [('ECraftType::Unknown', []), ('ECraftType::Common', ['item']), ('ECraftType::Succession', ['item', 'item']), ('ECraftType::Succession', None)]:
            row.update(Type=kind, SuccessionComponentCandidateList=candidates)
            with self.subTest(kind=kind, candidates=candidates), self.assertRaises(ValueError): self.build()

    def test_learning_requirements(self):
        self.rows['SkillAcquireData'][0]['NeedAscensionGrade'] = 'EAscensionGrade::AscensionGrade_3'
        data = self.build()
        self.assertEqual(data['skills'][0]['learning'][0]['ascensionRequirement'], 'AscensionGrade_3')
    def test_invalid_learning(self):
        row = self.rows['SkillAcquireData'][0]
        for field, bad in [('SkillLevel', 2), ('SkillLevel', True), ('ClassType', 'ECharacterClass::Cleric'), ('CostSkillPoint', -1), ('bAutoLearn', 1), ('NeedAscensionGrade', 'unknown'), ('CostItemDataList', [{}]), ('NeedPrevSkillDataList', [{}])]:
            old = row[field]
            row[field] = bad
            with self.subTest(field=field, value=bad), self.assertRaises(ValueError): self.build()
            row[field] = old
    def test_duplicate_learning(self):
        self.rows['SkillAcquireData'].append(self.rows['SkillAcquireData'][0])
        with self.assertRaises(ValueError): self.build()
    def test_missing_learning(self):
        self.rows['SkillAcquireData'].pop()
        with self.assertRaises(ValueError): self.build()
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
