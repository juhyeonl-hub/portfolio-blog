import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('tile_layout', Path(__file__).with_name('audit-tile-layout.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class TileLayoutTests(unittest.TestCase):
    def setUp(self):
        self.exports = []
        for y in range(8):
            for x in range(8):
                name = f'actor_{x}_{y}'
                self.exports.extend([
                    {'Type': 'BP_WorldMapPlane_C', 'Name': name, 'Properties': {
                        'SectorIndex': {'X': x, 'Y': y},
                        'SectorTexture': {'ObjectName': f"Texture2D'World_L_A_{x:02}_{y:02}'"},
                        'RootComponent': {'ObjectPath': '/Game/UI/Map/WorldMap/World_L_A/WorldMap_World_L_A.' + str(len(self.exports)+1)}}},
                    {'Type': 'StaticMeshComponent', 'Outer': {'ObjectName': f"BP_WorldMapPlane_C'Level.{name}'"},
                     'Properties': {'RelativeLocation': {'X': -3584+1024*x, 'Y': -3584+1024*y, 'Z': 0},
                                    'RelativeScale3D': {'X': 10.24, 'Y': 10.24, 'Z': 1}}}])

    def test_roundoff_and_no_certification(self):
        self.exports[1]['Properties']['RelativeLocation']['X'] += 0.0001
        result = module.audit(self.exports)
        self.assertEqual(len(result['tiles']), 64)
        self.assertTrue(result['researchOnly'])
        self.assertFalse(result['worldProjectionVerified'])
        self.assertFalse(result['wholePackageVerified'])

    def test_incomplete_and_duplicate(self):
        with self.assertRaises(ValueError):
            module.audit(self.exports[:-2])
        with self.assertRaises(ValueError):
            module.audit(self.exports + [self.exports[0]])

    def test_wrong_reference_and_owner(self):
        self.exports[0]['Properties']['RootComponent']['ObjectPath'] = 'Other.1'
        with self.assertRaises(ValueError):
            module.audit(self.exports)
        self.setUp()
        self.exports[1]['Outer']['ObjectName'] = "Actor'other'"
        with self.assertRaises(ValueError):
            module.audit(self.exports)

    def test_invalid_transforms(self):
        for value in (float('nan'), float('inf'), True, '0', -3583):
            self.exports[1]['Properties']['RelativeLocation']['X'] = value
            with self.assertRaises(ValueError):
                module.audit(self.exports)

    def test_transposed_texture_and_invalid_sector(self):
        self.exports[2]['Properties']['SectorTexture']['ObjectName'] = "Texture2D'World_L_A_00_01'"
        with self.assertRaises(ValueError):
            module.audit(self.exports)
        self.setUp()
        self.exports[0]['Properties']['SectorIndex']['X'] = True
        with self.assertRaises(ValueError):
            module.audit(self.exports)
