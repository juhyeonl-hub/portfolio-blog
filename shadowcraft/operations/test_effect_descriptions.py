"""Reviewed Global samples plus conservative formatter failures, without game files."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('client_index', Path(__file__).with_name('build-client-index.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


class EffectDescriptionTests(unittest.TestCase):
    def setUp(self):
        # Global build 25926599: Throw Shadowblade slow and Flash Slice PC blind.
        self.effects = {
            'SkillEffect': {
                '1302000012': {'EffectValueList': ['5000', '5000', '100000041', '1', '10000']},
                '1305000022': {'EffectValueList': ['3000', '3000', '100000701', '1', '4000']},
            },
            'SkillAbnormalEffect': {
                '1000000412': {'Values': ['MoveSpeed', '-4000', '0', '0', '1']},
            },
        }

    def test_global_slow(self):
        actual = m.description('Reduces Move Speed by {abe:1000000412:value02:divide100abs}% for {se:1302000012:effect_value02:time}.', self.effects)
        self.assertEqual(actual['text'], 'Reduces Move Speed by 40% for 5s.')
        self.assertEqual(actual['unresolvedValues'], 0)
        self.assertEqual(actual['valueScope'], 'base-client-values')
        self.assertEqual(len(actual['resolvedReferences']), 2)

    def test_global_blind_and_damage(self):
        text = '{se_dmg:1305000021:SkillUIMinDmgsum} damage; {se:1305000022:effect_value05:divide100}% Blind for {se:1305000022:effect_value02:time}.'
        actual = m.description(text, self.effects)
        self.assertEqual(actual['text'], '[unresolved value] damage; 40% Blind for 3s.')
        self.assertEqual(actual['unresolvedValues'], 1)

    def test_exact_decimal_and_sign(self):
        self.effects['SkillAbnormalEffect']['1000000412']['Values'][1] = '-125'
        for suffix, expected in [('', '-125'), (':noneabs', '125'), (':divide100', '-1.25'), (':divide100abs', '1.25'), (':divide1000', '-0.125')]:
            self.assertEqual(m.resolve_effect('abe:1000000412:value02'+suffix, self.effects), expected)

    def test_unsupported_never_evaluated(self):
        for token in ['se:1302000012:effect_value02:total', 'se_dmg:1302000012:SkillUIMinDmg', 'se:1302000012:value02', 'abe:1000000412:effect_value02']:
            self.assertIsNone(m.resolve_effect(token, self.effects))
        for raw in ['Attack*100', '__import__("os")', 'NaN', 'Infinity', '1e6', True, '1' * 50]:
            self.effects['SkillEffect']['1302000012']['EffectValueList'][1] = raw
            self.assertIsNone(m.resolve_effect('se:1302000012:effect_value02', self.effects))

    def test_missing_reference_and_index_fail(self):
        for token in ['se:99:effect_value02', 'se:1302000012:effect_value00', 'abe:1000000412:value99']:
            with self.subTest(token=token), self.assertRaises(ValueError):
                m.resolve_effect(token, self.effects)

    def test_raw_prose_and_no_effect_input(self):
        self.assertEqual(m.description('Restores 100 MP.')['text'], 'Restores 100 MP.')
        self.assertEqual(m.description('{se:1302000012:effect_value02:time}')['unresolvedValues'], 1)

if __name__ == '__main__': unittest.main()
