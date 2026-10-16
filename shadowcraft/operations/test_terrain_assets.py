import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from PIL import Image
spec=importlib.util.spec_from_file_location('terrain_assets',Path(__file__).with_name('build-terrain-assets.py'))
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
class TerrainAssetsTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name);self.source=self.root/'source';self.source.mkdir()
        for name,value in [('GRID',2),('PIXELS',8)]:
            p=patch.object(module,name,value);p.start();self.addCleanup(p.stop)
        for x in range(2):
            for y in range(2):Image.new('RGB',(8,8),(20,30,40)).save(self.source/f'World_L_A_{x:02}_{y:02}.png')
        self.settings=self.root/'settings.json';self.settings.write_text(json.dumps({'Properties':{'Data':{'WorldMapDataTableKey':'World_L_A','SectorSize':{'X':2,'Y':2},'SectorTextureSize':8}}}))
        self.out=self.root/'output'
    def test_complete(self):
        result=module.package(self.source,self.settings,self.out,self.root/'display.json')
        display=json.loads((self.root/'display.json').read_text())
        self.assertEqual(display,{k:result[k] for k in ['name','source','gridSize','basePath']})
        self.assertEqual(len(result['tiles']),4);self.assertEqual(len(result['seams']),4)
        self.assertFalse(result['worldProjectionVerified']);self.assertFalse(result['markerSupport'])
        self.assertTrue((self.out/'manifest.json').exists())
        with self.assertRaises(ValueError):module.package(self.source,self.settings,self.out)
    def test_altgard_actual_mip_dimensions(self):
        data=json.loads(self.settings.read_text())
        data['Properties']['Data']['WorldMapDataTableKey']='World_D_A'
        self.settings.write_text(json.dumps(data))
        for x in range(2):
            for y in range(2):
                Image.new('RGB',(1024,1024),(20,30,40)).save(self.source/f'World_D_A_{x:02}_{y:02}.png')
        result=module.package(self.source,self.settings,self.out)
        self.assertEqual(result['name'],'Altgard')
        self.assertEqual(result['sourceTilePixels'],1024)
        self.assertTrue(result['basePath'].endswith('/altgard'))
        self.assertEqual(result['mapKey'],'World_D_A')

    def test_missing(self):
        (self.source/'World_L_A_01_01.png').unlink()
        with self.assertRaises(FileNotFoundError):module.package(self.source,self.settings,self.out)
        self.assertFalse(self.out.exists())
    def test_dimensions(self):
        Image.new('RGB',(4,4)).save(self.source/'World_L_A_00_00.png')
        with self.assertRaises(ValueError):module.package(self.source,self.settings,self.out)
        self.assertFalse(self.out.exists())
    def test_seam(self):
        Image.new('RGB',(8,8),'white').save(self.source/'World_L_A_00_00.png')
        with self.assertRaisesRegex(ValueError,'seam'):module.package(self.source,self.settings,self.out)
        self.assertFalse(self.out.exists())
    def test_settings(self):
        self.settings.write_text(json.dumps({'Properties':{'Data':{'WorldMapDataTableKey':'other'}}}))
        with self.assertRaises(ValueError):module.package(self.source,self.settings,self.out)
        self.assertFalse(self.out.exists())
