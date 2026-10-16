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

    def rewards(self):
        self.tables['Item'] = [{'ID': {'Value': 10}, 'Name': 'gold', 'Desc': {'Key': 'gold'}}]
        self.entries['String_gold_body'] = 'Kinah'
        self.tables['QuestReward'] = [{'Group': '1', 'ExpReward': 1133,
            'ItemRewards': [{'Item': 'gold', 'Count': 1400, 'EnchantedLevel': 0}],
            'ItemNormalRewards': [], 'ItemSelectRewards': [], 'RandomReward': 'None'}]

    def test_reward_categories_and_absence(self):
        self.assertNotIn('rewards', m.build(self.tables,self.entries,'1')['quests'][0])
        self.rewards()
        r=m.build(self.tables,self.entries,'1')['quests'][0]['rewards']
        self.assertEqual(r['experience'],1133)
        self.assertEqual(r['items'][0],{'id':'10','name':'Kinah','count':1400,'enchantLevel':0})
        self.assertEqual(r['selectionItems'],[])
        self.assertIsNone(r['randomGroup'])
        self.tables['QuestReward']=[]
        self.assertIsNone(m.build(self.tables,self.entries,'1')['quests'][0]['rewards'])

    def test_reward_broken_references_and_values(self):
        self.rewards()
        original=copy.deepcopy(self.tables)
        for field,value in [('Group','missing'),('ExpReward',True),('ExpReward',-1),('RandomReward','bad group')]:
            self.tables=copy.deepcopy(original);self.tables['QuestReward'][0][field]=value
            with self.subTest(field=field),self.assertRaises(ValueError):m.build(self.tables,self.entries,'1')

        for field,value in [('Item','missing'),('Count',0),('Count',1.5),('Count',1_000_000_001),('EnchantedLevel',-1)]:
            self.tables=copy.deepcopy(original);self.tables['QuestReward'][0]['ItemRewards'][0][field]=value
            with self.subTest(field=field),self.assertRaises(ValueError):m.build(self.tables,self.entries,'1')

    def test_class_rewards_are_separate_and_validated(self):
        self.rewards()
        row=copy.deepcopy(self.tables['QuestReward'][0]);row.pop('ExpReward');row['Class']='ECharacterClass::Gladiator'
        self.tables['QuestClassReward']=[row]
        r=m.build(self.tables,self.entries,'1')['quests'][0]['rewards']
        self.assertEqual(r['classRewards'][0]['classKey'],'gladiator')
        self.assertEqual(r['items'][0]['count'],1400)
        self.tables['QuestClassReward'].append(row)
        with self.assertRaises(ValueError):m.build(self.tables,self.entries,'1')

    def test_levels_and_member_ranges(self):
        q=self.tables['Quest'][0];q.update(UnlockLevel=10,RecommendedLevel=15,AcquirableConditions=[])
        d=self.tables['Dungeon'][0];d.update(RecommendLevel=45,RecommendMinMember=2,RecommendMaxMember=5,DungeonDifficulty='EDungeonDifficulty::Hard')
        result=m.build(self.tables,self.entries,'1')
        self.assertEqual(result['quests'][0]['levels']['unlock'],10)
        self.assertEqual(result['dungeons'][0]['recommendation']['difficulty'],'Hard')
        d['RecommendMinMember']=6
        with self.assertRaises(ValueError):m.build(self.tables,self.entries,'1')
