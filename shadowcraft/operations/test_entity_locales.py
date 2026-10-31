import importlib.util,json,hashlib,tempfile,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('entities',Path(__file__).with_name('build-entity-locales.py'));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class EntityGenerationTest(unittest.TestCase):
 def test_late_bad_language_and_source_mismatch_preserve_all_previous_files(self):
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory);tables=root/'tables';tables.mkdir();strings=root/'strings';strings.mkdir();output=root/'output'
   def save(path,data):path.write_text(json.dumps(data));return hashlib.sha256(path.read_bytes()).hexdigest()
   data={'NpcData':[{'ID':{'Value':i},'Desc':{'Key':'Npc'}} for i in range(1,10001)],'Quest':[{'ID':{'Value':i},'QuestText':'q'} for i in range(1,1001)],'QuestString':[{'Name':'q','Title':{'Key':'Title'},'ShortSummary':{'Key':'Summary'}}],'Dungeon':[{'ID':{'Value':1},'Title':{'Key':'Dungeon'}}],'Map':[{'ID':{'Value':1},'Desc':{'Key':'Map'}}],'VehicleList':[{'ID':{'Value':1},'Desc':{'Key':'Pet'}}]}
   hashes={k:save(tables/(k+'.json'),{'Properties':{'Data':v}}) for k,v in data.items()}
   entries={'String_Npc_body':'NPC','Title':'Quest','Summary':'Summary','String_Dungeon_body':'Dungeon','String_Map_body':'Map','String_Pet_body':'Pet'}
   hashes['English']=save(root/'english.json',{'Entries':entries})
   npc={'source':{'buildId':'123','sha256':hashes},'npcs':[{'id':str(i),'name':'NPC'} for i in range(1,10001)]}
   journal={'source':{'buildId':'123','sha256':hashes},'quests':[{'id':str(i),'name':'Quest'} for i in range(1,1001)],'dungeons':[{'id':'1','name':'Dungeon','mapId':'1'}],'pets':[{'id':'1','name':'Pet'}]}
   save(root/'npc.json',npc);save(root/'journal.json',journal)
   for culture in module.base.CULTURES.values():save(strings/(culture+'.json'),{'Entries':entries})
   args=[str(root/'npc.json'),str(root/'journal.json'),str(tables),str(strings),str(output),str(root/'english.json'),'456']
   first=module.build(*args);before={p.name:p.read_bytes() for p in output.iterdir()}
   self.assertEqual(first,module.build(*args),'deterministic generation')
   save(strings/'ru-RU.json',{'Entries':{}})
   with self.assertRaisesRegex(ValueError,'coverage'):module.build(*args)
   self.assertEqual(before,{p.name:p.read_bytes() for p in output.iterdir()})
   save(tables/'Quest.json',{'Properties':{'Data':[]}})
   with self.assertRaisesRegex(ValueError,'Source mismatch'):module.build(*args)
   self.assertEqual(before,{p.name:p.read_bytes() for p in output.iterdir()})
if __name__=='__main__':unittest.main()
