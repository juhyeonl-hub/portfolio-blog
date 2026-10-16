import copy
import importlib.util
from pathlib import Path
import unittest
spec=importlib.util.spec_from_file_location('coverage',Path(__file__).with_name('audit-mapping-coverage.py'))
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class CoverageTests(unittest.TestCase):
    def setUp(self):
        self.schemas=[{'name':name,'totalCount':1,'chain':[{'name':name,'ownCount':1,'offset':0,'namedCount':1}], 'properties':[{'index':0,'name':'Value','type':'IntProperty'}]} for name in sorted(m.TARGETS)]
        self.trace='\n'.join(f'A2BC_PROPERTY {name} index=0 nonzero=True name=Value type=IntProperty' for name in sorted(m.TARGETS))
    def test_coverage_does_not_certify(self):
        result=m.audit(self.schemas,self.trace)
        self.assertTrue(result['indexCoveragePassed'])
        for field in ['fieldSemanticsVerified','wholePackageVerified','worldProjectionVerified']:self.assertFalse(result[field])
    def test_missing_index(self):
        trace=self.trace+'\nA2BC_PROPERTY MaterialInstanceDynamic index=24 nonzero=True name=MISSING type=MISSING'
        result=m.audit(self.schemas,trace)
        self.assertFalse(result['indexCoveragePassed'])
        self.assertEqual(next(r for r in result['classes'] if r['name']=='MaterialInstanceDynamic')['issues'][0]['reason'],'missing-index')
    def test_unknown_type(self):
        self.schemas[0]['properties'][0]['type']='Unknown'
        trace=self.trace.replace('AionWorldSettings index=0 nonzero=True name=Value type=IntProperty','AionWorldSettings index=0 nonzero=True name=Value type=Unknown')
        self.assertFalse(m.audit(self.schemas,trace)['indexCoveragePassed'])
    def test_mixed_snapshot(self):
        with self.assertRaises(ValueError):m.audit(self.schemas,self.trace.replace('name=Value','name=Different'))
    def test_incomplete_or_malformed_trace(self):
        for trace in ['',self.trace+'\nA2BC_PROPERTY bad']:
            with self.assertRaises(ValueError):m.audit(self.schemas,trace)
    def test_invalid_schema(self):
        for change in [lambda s:s.append(s[0]),lambda s:s[0].update(totalCount=2),lambda s:s[0]['properties'].append(s[0]['properties'][0])]:
            schemas=copy.deepcopy(self.schemas);change(schemas)
            with self.assertRaises(ValueError):m.audit(schemas,self.trace)
