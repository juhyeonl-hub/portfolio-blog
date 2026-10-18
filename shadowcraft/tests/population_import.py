"""Schema drift must never produce a partial population snapshot."""
import importlib.util
import json
import unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('population_import',Path(__file__).resolve().parents[1]/'operations/import_population.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class PopulationImportTest(unittest.TestCase):
    def source(self,change=lambda d:None,faction='Elyos'):
        counts={key:10 for key in m.CLASSES}
        data={'servers':[{'r':r,'slug':'siel','name':'Siel','path':'/servers/'+r+'/siel','n45':counts.copy()} for r in sorted(m.REGIONS)],'global':{k:50 for k in m.CLASSES}}
        change(data)
        rows=''.join('<tr><td><a href="/servers/'+r+'/siel">Siel</a></td><td>Region</td><td>'+faction+'</td><td>100</td><td>80</td></tr>' for r in sorted(m.REGIONS))
        return '<script type="application/json" id="pop-cls-data">'+json.dumps(data)+'</script><table id="pop-servers">'+rows+'</table>'
    def test_valid(self):
        result=m.normalize(self.source(),'2026-10-18T00:00:00Z')
        self.assertEqual(len(result['servers']),5)
        self.assertEqual(result['servers'][0]['counts']['elementalist'],10)
        self.assertEqual(result['servers'][0]['race'],1)
    def test_reject_drift(self):
        changes=[lambda d:d['servers'].append(d['servers'][0]),lambda d:d['servers'].pop(),lambda d:d['servers'][0]['n45'].update(assassin=-1),lambda d:d['servers'][0]['n45'].update(assassin=True),lambda d:d['servers'][0]['n45'].pop('cleric'),lambda d:d['global'].update(cleric=1)]
        for change in changes:
            with self.subTest(change=change),self.assertRaises(ValueError):m.normalize(self.source(change),'date')
        with self.assertRaises(ValueError):m.normalize(self.source(faction='Unknown'),'date')
        with self.assertRaises(ValueError):m.normalize('<html>changed</html>','date')
    def test_shipped_snapshot(self):
        data=json.loads(m.OUTPUT.read_text())
        self.assertEqual(data['scope'],'indexed-characters')
        self.assertEqual(len({s['id'] for s in data['servers']}),len(data['servers']))
        self.assertEqual({s['region'] for s in data['servers']},m.REGIONS)
        for s in data['servers']:
            self.assertIn(s['race'],[1,2]);self.assertEqual(len(s['counts']),8)
            self.assertTrue(all(type(n) is int and n>=0 for n in s['counts'].values()))

if __name__=='__main__':unittest.main()
