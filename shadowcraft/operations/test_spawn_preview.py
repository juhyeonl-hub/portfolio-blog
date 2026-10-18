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
    def test_duplicate_invalid_and_bounds(self):
        self.data['SpawnInfoList']*=2
        with self.assertRaises(ValueError):mod.extract(self.data,self.objects,{'item':'Plant'})
        self.data['SpawnInfoList']=self.data['SpawnInfoList'][:1]
        loc=self.data['SpawnInfoList'][0]['Positions'][0]['Location'];loc['X']=float('nan')
        with self.assertRaises(ValueError):mod.extract(self.data,self.objects,{'item':'Plant'})
        loc['X']=1000000
        self.assertEqual(mod.extract(self.data,self.objects,{'item':'Plant'})['skipped']['outOfBounds'],1)

if __name__=='__main__':unittest.main()
