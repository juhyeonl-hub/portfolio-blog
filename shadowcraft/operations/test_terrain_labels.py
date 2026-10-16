import copy
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('terrain_labels', Path(__file__).with_name('build-terrain-labels.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class TerrainLabelTests(unittest.TestCase):
    def setUp(self):
        texture = {'ObjectName': "Texture2D'Test_00_00'"}
        self.objects = [
            {'Type': 'BP_WorldMapPlane_C', 'Name': 'Tile', 'Outer': {'ObjectName': "Level'Map:Level'"}, 'Properties': {
                'SectorTexture': texture, 'RootComponent': {'ObjectName': "StaticMeshComponent'Map:Level.Tile.Plane'"}, 'PlaneComponent': {'ObjectName': "StaticMeshComponent'Map:Level.Tile.Plane'"}}},
            {'Type': 'StaticMeshComponent', 'Name': 'Plane', 'Outer': {'ObjectName': "BP_WorldMapPlane_C'Map:Level.Tile'"}, 'Properties': {
                'RelativeLocation': {'X': 0, 'Y': 0, 'Z': 0}, 'RelativeScale3D': {'X': 10.24, 'Y': 10.24, 'Z': 1},
                'OverrideMaterials': [{'ObjectName': "MaterialInstanceDynamic'Map:Level.Tile.Material'"}]}},
            {'Type': 'MaterialInstanceDynamic', 'Name': 'Material', 'Outer': {'ObjectName': "BP_WorldMapPlane_C'Map:Level.Tile'"}, 'Properties': {
                'TextureParameterValues': [{'ParameterValue': texture}]}},
            {'Type': 'AionPreviewLocation', 'Name': 'Label', 'Outer': {'ObjectName': "Level'Map:Level'"}, 'Properties': {
                'LocationName': 'Region', 'RootComponent': {'ObjectName': "SceneComponent'Map:Level.Label.Root'"}}},
            {'Type': 'SceneComponent', 'Name': 'Root', 'Outer': {'ObjectName': "AionPreviewLocation'Map:Level.Label'"}, 'Properties': {
                'RelativeLocation': {'X': 256, 'Y': -256, 'Z': 0}}},
        ]
        self.regions = [{'MapId': {'Value': 1010}, 'WorldMapNameActor': 'Region', 'Desc': {'Key': 'Name'}}]
        self.english = {'String_Name_body': 'A region'}

    def test_explicit_local_coordinate_and_tile_binding(self):
        self.assertEqual(module.validate_layout(self.objects, 'Test', 1), 1)
        labels, unresolved = module.labels(self.objects, self.regions, self.english, 1)
        self.assertEqual(labels, [{'id': 'Region', 'name': 'A region', 'x': 750, 'y': 250}])
        self.assertEqual(unresolved, [])

    def test_missing_name_is_not_invented(self):
        self.assertEqual(module.labels(self.objects, self.regions, {}, 1), ([], ['Region']))

    def test_region_join_does_not_cross_maps(self):
        self.assertEqual(module.labels(self.objects, self.regions, self.english, 1, 1110), ([], ['Region']))

    def test_parented_plane_cannot_use_local_grid_directly(self):
        self.objects[1]['Properties']['AttachParent'] = {'ObjectName': 'Other'}
        with self.assertRaisesRegex(ValueError, 'transform'):
            module.validate_layout(self.objects, 'Test', 1)

    def test_ambiguous_label_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Ambiguous'):
            module.labels(self.objects, self.regions * 2, self.english, 1)

    def test_bad_placement_and_material_rejected(self):
        for field, value in [('RelativeLocation', {'X': 20, 'Y': 0, 'Z': 0}), ('RelativeScale3D', {'X': 1, 'Y': 1, 'Z': 1}), ('OverrideMaterials', [])]:
            objects = copy.deepcopy(self.objects)
            objects[1]['Properties'][field] = value
            with self.subTest(field=field), self.assertRaises(ValueError):
                module.validate_layout(objects, 'Test', 1)
        objects = copy.deepcopy(self.objects)
        objects[2]['Properties']['TextureParameterValues'][0]['ParameterValue'] = {'ObjectName': 'wrong'}
        with self.assertRaisesRegex(ValueError, 'disagree'):
            module.validate_layout(objects, 'Test', 1)

    def test_missing_or_duplicate_tiles_rejected(self):
        for objects in [self.objects[1:], self.objects + [self.objects[0]]]:
            with self.assertRaises(ValueError):
                module.validate_layout(objects, 'Test', 1)

    def test_bad_label_coordinate_rejected(self):
        for value in [float('nan'), float('inf'), 9000, True]:
            self.objects[-1]['Properties']['RelativeLocation']['X'] = value
            with self.assertRaises(ValueError):
                module.labels(self.objects, self.regions, self.english, 1)

    def test_audit_requires_complete_zero_remaining_coverage(self):
        log = '\n'.join(f"A2BC_OBJECT {o['Type']} {o['Name']} size=10 remaining=0" for o in self.objects) + '\nexported: 1 packages'
        module.validate_audit(self.objects, log)
        for invalid in [log.replace('remaining=0', 'remaining=2', 1), log.replace('BP_WorldMapPlane_C', 'Other'), log + '\nA2BC_OBJECT_ERROR', log.replace('1 packages', '0 packages')]:
            with self.assertRaises(ValueError):
                module.validate_audit(self.objects, invalid)
