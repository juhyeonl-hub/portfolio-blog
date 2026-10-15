import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
spec=importlib.util.spec_from_file_location('ascension_rules',Path(__file__).with_name('build-ascension-rules.py'))
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
class AscensionRulesTests(unittest.TestCase):
    def test_first_level_and_future_conditions(self):
        data={'schema':'a2bc-client-index-v1','source':{'region':'global','appId':3393110},'skills':[{'id':'1','learning':[{'level':1,'ascensionRequirement':'AscensionGrade_3'},{'level':2,'ascensionRequirement':'None'}]}]}
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'index.json'
            def build():
                path.write_text(json.dumps(data))
                return module.build(path)
            self.assertEqual(build()['requiredFromLevel'],{'1':1})
            data['skills'][0]['learning'][0]['ascensionRequirement']='AscensionGrade_4'
            with self.assertRaises(ValueError):build()
            data['skills'][0]['learning'][0]['ascensionRequirement']='None'
            with self.assertRaises(ValueError):build()
            data['source']['region']='kr'
            with self.assertRaises(ValueError):build()
