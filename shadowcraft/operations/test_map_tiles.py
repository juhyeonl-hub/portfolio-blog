import copy
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('tiles', Path(__file__).with_name('audit-map-tiles.py'))
tiles = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tiles)


class TilesTest(unittest.TestCase):
    def setUp(self):
        self.settings = {'WorldMapDataTableKey': 'Test', 'SectorSize': {'X': 1, 'Y': 1}, 'SectorPlaneSize': 1024}
        self.data = [
            {'Type': 'BP_WorldMapPlane_C', 'Properties': {
                'SectorTexture': {'ObjectPath': '/Test_00_00.0'},
                'PlaneComponent': {'ObjectPath': '/Map.1'}, 'RootComponent': {'ObjectPath': '/Map.1'}}},
            {'Type': 'StaticMeshComponent', 'Properties': {
                'RelativeLocation': {'X': 0, 'Y': 0}, 'OverrideMaterials': [{'ObjectPath': '/Map.2'}]}},
            {'Type': 'MaterialInstanceDynamic', 'Properties': {'TextureParameterValues': [
                {'ParameterInfo': {'Name': 'Texture'}, 'ParameterValue': {'ObjectPath': '/Test_00_00.0'}}]}}
        ]

    def test_valid_is_not_world_projection(self):
        result = tiles.audit(self.settings, self.data)
        self.assertTrue(result['uiTileLayoutVerified'])
        self.assertFalse(result['worldProjectionVerified'])

    def test_displaced_nonfinite_and_rotated(self):
        for change in [{'RelativeLocation': {'X': 20, 'Y': 0}},
                       {'RelativeLocation': {'X': float('nan'), 'Y': 0}},
                       {'RelativeRotation': {'Yaw': 90}}, {'AttachParent': {}}]:
            with self.subTest(change=change):
                data = copy.deepcopy(self.data)
                data[1]['Properties'].update(change)
                with self.assertRaises(ValueError):
                    tiles.audit(self.settings, data)

    def test_missing_duplicate_and_material(self):
        for data in [[], self.data + [self.data[0]]]:
            with self.assertRaises(ValueError):
                tiles.audit(self.settings, data)
        self.data[2]['Properties']['TextureParameterValues'][0]['ParameterValue']['ObjectPath'] = '/Wrong.0'
        with self.assertRaisesRegex(ValueError, 'texture mismatch'):
            tiles.audit(self.settings, self.data)

    def test_explicit_world_origin_supports_translated_grid(self):
        self.settings.update(StartWorldLocation={'X':-49200,'Y':-51200},SectorWorldSize=102400)
        self.data[1]['Properties']['RelativeLocation']['X']=20
        result=tiles.audit(self.settings,self.data)
        self.assertEqual(result['planeOrigin'],[-492, -512])
        self.assertFalse(result['worldProjectionVerified'])
        self.data[1]['Properties']['RelativeLocation']['X']=21
        with self.assertRaises(ValueError):tiles.audit(self.settings,self.data)

    def test_index_and_dimensions(self):
        self.data[0]['Properties']['SectorIndex'] = {'X': 1, 'Y': 0}
        with self.assertRaises(ValueError):
            tiles.audit(self.settings, self.data)
        self.settings['SectorSize']['X'] = True
        with self.assertRaises(ValueError):
            tiles.audit(self.settings, self.data)


if __name__ == '__main__':
    unittest.main()
