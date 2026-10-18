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
    def test_projection_uses_verified_plane_extent(self):
        row=mod.extract(self.data,self.objects,{'item':'Plant'},origin=(-100,-200),span=1000)['markers'][0]
        self.assertEqual((row['x'],row['y']),(100,200))

    def test_official_world_sector_ratio(self):
        # One 102000-world-unit sector spans 1024 UI units, not 1020.
        loc=self.data['SpawnInfoList'][0]['Positions'][0]['Location']
        loc['X']=102000
        row=mod.extract(self.data,self.objects,{'item':'Plant'},world_scale=102000/1024)['markers'][0]
        self.assertEqual(row['x'],625)
        loc['X']=-408000
        self.assertEqual(mod.extract(self.data,self.objects,{'item':'Plant'},world_scale=102000/1024)['markers'][0]['x'],0)
        loc['X']=408000
        self.assertEqual(mod.extract(self.data,self.objects,{'item':'Plant'},world_scale=102000/1024)['markers'][0]['x'],1000)

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


class CompletionCategoriesTest(unittest.TestCase):
    def test_sealed_reference_chain_and_classification(self):
        dungeons=[{'DungeonType':'EDungeonType::Seal','MapId':{'Value':10}},
                  {'DungeonType':'EDungeonType::Party','MapId':{'Value':20}}]
        maps=[{'ID':{'Value':10},'EntranceName':'seal-entry'}]
        entrances=[{'Name':'seal-entry','ID':{'Value':42}}]
        sealed=mod.sealed_entrances(dungeons,maps,entrances)
        self.assertEqual(sealed,{'42'})
        data={'MapId':1010,'SpawnInfoList':[{'UniqueKey':123,'EnvObjIdList':[{'Value':5}],
            'Positions':[{'Location':{'X':0,'Y':0,'Z':100}}]}]}
        objects={5:{'Usage':'EEnvObjectUsage::EnterDungeon','UsageValue':'42','Desc':{'Key':'item'}}}
        self.assertEqual(mod.extract(data,objects,{'item':'Entrance'},sealed=sealed)['markers'][0]['kind'],'sealed')
        objects[5]['UsageValue']='43'
        self.assertEqual(mod.extract(data,objects,{'item':'Entrance'},sealed=sealed)['markers'][0]['kind'],'dungeon')
        with self.assertRaises(ValueError):mod.sealed_entrances(dungeons,[],entrances)

    def test_stronghold_quest_zone_volume_join(self):
        data={'MapId':1010,'SubzoneVolumeInfoMap':[{'Value':{
            'SubzoneTableId':7,'LabelName':'area','Location':{'X':0,'Y':0,'Z':100}}}]}
        quests=[{'ID':{'Value':3},'ExplorationType':'EExplorationType::OccupationTerritory',
                 'AcquireMapId':{'Value':1010},'AcquirableConditions':[
                     {'Type':'EQuestAcquirableCondition::SubZone','Value':'zone'}]}]
        zones=[{'ID':{'Value':7},'Name':'zone','MapId':{'Value':1010},'DisplayName':{'Key':'name'}}]
        def run():return mod.strongholds(data,quests,zones,{'String_name_body':'Camp'},(-4096,-4096),8192)
        rows=run()
        self.assertEqual(len(rows),1);self.assertEqual(rows[0]['kind'],'stronghold')
        self.assertEqual(rows[0]['locationType'],'area-center')
        self.assertEqual(rows[0]['questId'],3);self.assertEqual(rows[0]['name'],'Camp')
        self.assertEqual(rows[0]['x'],500)
        quests.append(quests[0])
        self.assertEqual(len(run()),1) # Same volume/area is not doubled by repeat quest references.
        quests[0]['AcquireMapId']['Value']=1110
        self.assertEqual(run(),[]) # Other map's quests must not leak into this one.
        quests[0]['AcquireMapId']['Value']=1010
        zones[0]['ID']['Value']=8
        with self.assertRaises(ValueError):run()
        zones[0]['ID']['Value']=7
        data['SubzoneVolumeInfoMap'][0]['Value']['Location']['X']=float('nan')
        with self.assertRaises(ValueError):run()

if __name__=='__main__':unittest.main()
