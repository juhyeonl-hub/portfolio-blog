import copy
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('map_coordinates', Path(__file__).with_name('audit-map-coordinates.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class MapCoordinateTests(unittest.TestCase):
    def setUp(self):
        self.settings = {'WorldMapDataTableKey': 'World_L_A', 'SectorWorldSize': 102000,
                         'SectorPlaneSize': 1024,
                         'LabelMap': [{'Key': 'camp', 'Value': {'Location': {'X': 10, 'Y': 20}}}]}
        self.regions = [{'MapId': {'Value': 1010}, 'bEnableWorldMap': True,
                         'WorldMapNameActor': 'CAMP', 'SubzoneId': {'Value': 7}}]
        self.map = {'MapId': 1010, 'SubzoneVolumeInfoMap': [
            {'Value': {'SubzoneTableId': 7, 'Points': [{'X': x, 'Y': y} for x, y in
                                                    [(950, 1950), (1050, 1950), (1050, 2050), (950, 2050)]]}}]}

    def run_audit(self):
        return module.audit(self.settings, self.regions, self.map)

    def test_ambiguous_scales_never_certify_projection(self):
        report = self.run_audit()
        self.assertEqual(report['joinedCount'], 1)
        self.assertEqual(len(report['candidates']), 16)
        matches = [c for c in report['candidates'] if c['insideCount'] == 1]
        self.assertEqual({c['scale'] for c in matches}, {100, 99.609375})
        self.assertEqual(len(matches), 2)
        self.assertFalse(report['worldProjectionVerified'])
        self.assertFalse(report['markerSupport'])

    def test_polygon_boundary_concavity_and_distance(self):
        polygon = [(0, 0), (4, 0), (4, 1), (1, 1), (1, 4), (0, 4), (0, 0)]
        for p in [(0, 0), (4, 1), (0.5, 3)]:
            self.assertEqual(module.polygon_distance(p, polygon), 0)
        self.assertEqual(module.polygon_distance((3, 3), polygon), 2)
        self.assertEqual(module.polygon_distance((7, 1), polygon), 3)
        self.assertEqual(module.polygon_distance((3, 3), list(reversed(polygon))), 2)

    def test_multiple_volumes_are_retained(self):
        extra = copy.deepcopy(self.map['SubzoneVolumeInfoMap'][0])
        for p in extra['Value']['Points']:
            p['X'] += 10000
        self.map['SubzoneVolumeInfoMap'].insert(0, extra)
        self.assertEqual(sum(c['insideCount'] for c in self.run_audit()['candidates']), 2)

    def test_missing_references_reported_and_no_join_rejected(self):
        missing = copy.deepcopy(self.regions[0])
        missing.update(WorldMapNameActor='missing', SubzoneId={'Value': 99})
        self.regions.append(missing)
        self.assertEqual(self.run_audit()['unresolved'][0]['missing'], ['label', 'subzone'])
        self.regions.pop(0)
        with self.assertRaisesRegex(ValueError, 'No joined'):
            self.run_audit()

    def test_duplicate_labels_and_regions_rejected(self):
        self.regions.append(copy.deepcopy(self.regions[0]))
        with self.assertRaisesRegex(ValueError, 'Duplicate region'):
            self.run_audit()
        self.regions.pop()
        self.settings['LabelMap'].append({'Key': 'CAMP', 'Value': {'Location': {'X': 1, 'Y': 1}}})
        with self.assertRaisesRegex(ValueError, 'Duplicate label'):
            self.run_audit()

    def test_invalid_inputs_rejected(self):
        for value in (float('nan'), float('inf'), True, '1'):
            with self.assertRaises(ValueError):
                module.point({'X': value, 'Y': 0})
        for value in (0, -1, float('nan'), True):
            self.settings['SectorPlaneSize'] = value
            with self.assertRaisesRegex(ValueError, 'sector size'):
                self.run_audit()
        with self.assertRaisesRegex(ValueError, 'Degenerate'):
            module.polygon_distance((0, 0), [(1, 1), (2, 2)])
        with self.assertRaisesRegex(ValueError, 'Degenerate'):
            module.polygon_distance((0, 0), [(1, 1), (2, 2), (3, 3)])
        self.map['MapId'] = 1020
        with self.assertRaisesRegex(ValueError, 'identity'):
            self.run_audit()
