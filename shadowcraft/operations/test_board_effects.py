import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('board_effects',Path(__file__).with_name('build-board-effects.py'))
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class BoardEffectsTests(unittest.TestCase):
    def setUp(self):
        temp=tempfile.TemporaryDirectory();self.addCleanup(temp.cleanup)
        self.root=Path(temp.name);self.catalogs=self.root/'catalogs';self.catalogs.mkdir()
        self.source=self.root/'nodes.json'
        coverage=patch.object(module,'EXPECTED_COVERAGE',(1,1,3,1));coverage.start();self.addCleanup(coverage.stop)
        self.rows=[];self.nodes=[]
        for i in range(1,4):
            row={'ID':{'Value':i},'Board':{'Value':1},'Row':1,'Col':i,'bAutoLearn':False,'NeedLevel':45,'CostDaevanionPoint':2,'ResetGold':500,'NeedConditionType':'EDaevanionNodeConditionType::None','NeedConditionValue':'','Type':'EDaevanionNodeType::Stat',**{f'Value{x:02}':'' for x in range(1,11)}}
            node={'id':str(i),'row':1,'column':i,'autoLearn':False,'requiredLevel':45,'pointCost':2,'resetGold':500}
            self.rows.append(row);self.nodes.append(node)
        self.rows[0].update(Value01='PvPAccuracy',Value02='5',Value03='PvPEvasion',Value04='3')
        self.rows[1].update(Value01='PvPEvasion',Value02='3')
        self.rows[2].update(Type='EDaevanionNodeType::SkillLevel',Value01='100',Value02='1')
        self.nodes[0]['stat']={'key':'PvPAccuracy','name':'PVP 명중','value':5,'format':'{v:0}'}
        self.nodes[1]['stat']={'key':'PvPEvasion','name':'PVP 회피','value':3,'format':'{v:0}'}
        self.nodes[2].update(skill={'id':'100'},skillLevels=1)
    def run_build(self):
        self.source.write_text(json.dumps({'Properties':{'Data':self.rows}}))
        (self.catalogs/'assassin.json').write_text(json.dumps({'version':'test','boards':[{'id':'1','nodes':self.nodes}]}))
        return module.build(self.source,self.catalogs)
    def test_verified_integer_overlay(self):
        result=self.run_build();self.assertEqual(result['rules']['1']['additional']['value'],3)
        self.assertEqual(result['nodesChecked'],3);self.assertEqual(result['skillEffectsChecked'],1)
        self.assertFalse(result['wholeCatalogVerified'])
    def test_cost_and_skill_mismatch_rejected(self):
        self.rows[0]['CostDaevanionPoint']=3
        with self.assertRaises(ValueError):self.run_build()
        self.rows[0]['CostDaevanionPoint']=2;self.rows[2]['Value02']='2'
        with self.assertRaises(ValueError):self.run_build()
    def test_unknown_effect_and_scaling_rejected(self):
        self.rows[0]['Value03']='Unknown'
        with self.assertRaises(ValueError):self.run_build()
        self.rows[0]['Value03']='PvPEvasion';self.nodes[0]['stat']['format']='{v:0}%'
        with self.assertRaises(ValueError):self.run_build()
    def test_extra_slot_condition_and_duplicate_rejected(self):
        self.rows[0]['Value05']='Other'
        with self.assertRaises(ValueError):self.run_build()
        self.rows[0]['Value05']='';self.rows[0]['NeedConditionValue']='required'
        with self.assertRaises(ValueError):self.run_build()
        self.rows[0]['NeedConditionValue']='';self.rows.append(self.rows[0])
        with self.assertRaises(ValueError):self.run_build()
