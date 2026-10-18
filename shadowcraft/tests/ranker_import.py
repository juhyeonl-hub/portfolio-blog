import importlib.util,json,unittest
from pathlib import Path
from datetime import datetime
root=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('rankers',root/'shadowcraft/operations/import_rankers.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Tests(unittest.TestCase):
 def test_missing_source(self):
  with self.assertRaises(ValueError):m.parse_leaders('<html>changed</html>',{})
 def test_snapshot(self):
  data=json.loads((root/'frontend/shadowcraft/lib/data/rankers.json').read_text());rows=data['entries']
  m.validate_entries(rows)
  if "verifiedAt" in data:
   start,end=map(datetime.fromisoformat,[data["fetchedAt"],data["verifiedAt"]])
   self.assertTrue(all(start<=datetime.fromisoformat(r["verifiedAt"])<=end for r in rows))
  self.assertEqual(len(rows),80)
  self.assertEqual(len({(r['region'],r['serverId'],r['characterId']) for r in rows}),80)
  for key in m.KEYS.values():
   group=[r for r in rows if r['classKey']==key];self.assertEqual([r['rank'] for r in group],list(range(1,11)))
   self.assertTrue(all(a['combatPower']>=b['combatPower'] for a,b in zip(group,group[1:])))
   for row in group:
    self.assertTrue(row['verifiedAt']);self.assertTrue(row['equipment']);self.assertTrue(row['skills'])
    self.assertEqual(len({s['id'] for s in row['skills']}),len(row['skills']))
    self.assertTrue(all(isinstance(s['skillLevel'],int) and 0<=s['skillLevel']<=999 for s in row['skills']))
if __name__=='__main__':unittest.main()
