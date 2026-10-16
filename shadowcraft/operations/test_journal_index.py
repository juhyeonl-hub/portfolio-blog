import copy
import importlib.util
from pathlib import Path
import unittest
spec=importlib.util.spec_from_file_location('journal',Path(__file__).with_name('build-journal-index.py'))
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class JournalTests(unittest.TestCase):
    def setUp(self):
        self.tables={'Quest':[{'ID':{'Value':1},'Name':'q','QuestText':'s','NextQuestName':'None','AcquireType':'EQuestAcquireType::Npc','AcquireValue':'npc','CompleteType':'EQuestCompleteType::Auto','Race':'ERace::Light','Type':'EQuestType::Hero'}], 'QuestString':[{'Name':'s','Title':{'Key':'title'},'ShortSummary':{'Key':'summary'}}], 'QuestStep':[{'ID':{'Value':10},'QuestName':'q'}], 'Map':[{'ID':{'Value':100},'Desc':{'Key':'map'}}], 'Dungeon':[{'ID':{'Value':2},'MapId':{'Value':100},'Title':{'Key':'dungeon'},'DungeonType':'EDungeonType::Party'}]}
        self.tables['NpcData']=[{'Name':'npc','ID':{'Value':2000000},'Desc':{'Key':'npc'}}]
        self.tables['VehicleList']=[{'ID':{'Value':1001},'Desc':{'Key':'pet'},'CreatureType':'ECreatureType::Special'}]
        self.entries={'title':'Quest','summary':'Summary','String_map_body':'Map'}
    def test_identity_and_missing(self):
        d=m.build(self.tables,self.entries,'25926599')
        self.assertEqual(d['quests'][0]['stepCount'],1)
        self.assertEqual(d['quests'][0]['summary'],'Summary')
        self.assertIsNone(d['dungeons'][0]['name'])
        self.assertEqual(d['dungeons'][0]['mapName'],'Map')
    def test_broken_references(self):
        for table,field,value in [('Quest','NextQuestName','missing'),('QuestStep','QuestName','missing'),('Dungeon','MapId',{'Value':999}),('Quest','AcquireValue','missing')]:
            t=copy.deepcopy(self.tables);t[table][0][field]=value
            with self.assertRaises(ValueError):m.build(t,self.entries,'1')
    def test_duplicates(self):
        for name in self.tables:
            t=copy.deepcopy(self.tables);t[name].append(t[name][0])
            with self.assertRaises(ValueError):m.build(t,self.entries,'1')
    def test_bad_inputs(self):
        with self.assertRaises(ValueError):m.build(self.tables,self.entries,'bad')
        self.tables['Quest'][0]['ID']['Value']=True
        with self.assertRaises(ValueError):m.build(self.tables,self.entries,'1')
