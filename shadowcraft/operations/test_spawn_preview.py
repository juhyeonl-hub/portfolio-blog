import importlib.util
from pathlib import Path
import unittest

spec=importlib.util.spec_from_file_location('spawn',Path(__file__).with_name('build-spawn-preview.py'))
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)

class PreviewTest(unittest.TestCase):
    def setUp(self):
        self.data={'MapId':1010,'SpawnInfoList':[{'UniqueKey':123,'EnvObjIdList':[{'Value':5}],
            'Positions':[{'Location':{'X':0,'Y':0,'Z':100}}]}]}
        self.objects={5:{'Usage':'EEnvObjectUsage::GatherSource','Desc':{'Key':'item'}}}
    def test_identity_and_coordinates(self):
        row=mod.extract(self.data,self.objects,{'item':'Plant'})['markers'][0]
        self.assertEqual(row['id'],'1010:123:5:0');self.assertEqual(row['world'],[0,0,100])
        self.assertEqual((row['x'],row['y']),(500,500))
    def test_unknown_name_and_category(self):
        self.assertEqual(mod.extract(self.data,self.objects,{})['skipped']['missingName'],1)
        self.objects[5]['Usage']='EEnvObjectUsage::Quest'
        self.assertEqual(mod.extract(self.data,self.objects,{'item':'Plant'})['markers'],[])
    def test_trace_excludes_quest_objects(self):
        self.objects[5].update(Usage='EEnvObjectUsage::Normal',ResourceKey='GodFragment_05')
        self.assertEqual(mod.extract(self.data,self.objects,{'item':'Empyrean Trace: Verteron'})['markers'][0]['kind'],'trace')
        self.objects[5]['Usage']='EEnvObjectUsage::Quest'
        self.assertEqual(mod.extract(self.data,self.objects,{'item':'Empyrean Trace: Verteron'})['markers'],[])

    def test_cube_repeated_reference_is_one_candidate_set(self):
        self.objects[5]['Usage']='EEnvObjectUsage::Normal'
        self.objects[5]['ResourceKey']='HiddenCube_01_V04'
        self.data['SpawnInfoList'][0]['EnvObjIdList']*=2
        result=mod.extract(self.data,self.objects,{'item':'Hidden Cube'})
        self.assertEqual(len(result['markers']),1)
        self.assertEqual(result['markers'][0]['kind'],'cube')
        self.assertEqual(result['skipped']['duplicateReferences'],1)

    def test_npc_classification_and_names(self):
        self.data['SpawnInfoList'][0]['NpcIdList']=[{'Value':5},{'Value':6},{'Value':7}]
        npcs={5:{'NpcType':'ENpcType::Citizen','bNamed':False,'Desc':{'Key':'citizen'}},
              6:{'NpcType':'ENpcType::Monster','bNamed':True,'Desc':{'Key':'named'}},
              7:{'NpcType':'ENpcType::Monster','bNamed':False,'Desc':{'Key':'other'}}}
        rows=mod.extract(self.data,self.objects,{'item':'Plant','String_citizen_body':'Citizen','String_named_body':'Named'},npcs)['markers']
        self.assertEqual([r['kind'] for r in rows],['gather','npc','named'])
        self.assertEqual(len(set(r['id'] for r in rows)),3)
        self.assertTrue(rows[1]['id'].endswith(':npc'))

    def test_duplicate_invalid_and_bounds(self):
        self.data['SpawnInfoList']*=2
        with self.assertRaises(ValueError):mod.extract(self.data,self.objects,{'item':'Plant'})
        self.data['SpawnInfoList']=self.data['SpawnInfoList'][:1]
        loc=self.data['SpawnInfoList'][0]['Positions'][0]['Location'];loc['X']=float('nan')
        with self.assertRaises(ValueError):mod.extract(self.data,self.objects,{'item':'Plant'})
        loc['X']=1000000
        self.assertEqual(mod.extract(self.data,self.objects,{'item':'Plant'})['skipped']['outOfBounds'],1)

if __name__=='__main__':unittest.main()
