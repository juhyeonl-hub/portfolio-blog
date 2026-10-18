import importlib.util
from pathlib import Path
import unittest

spec=importlib.util.spec_from_file_location('map_npc_icons',Path(__file__).with_name('build-map-npc-icons.py'))
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class MapNpcIcons(unittest.TestCase):
    def test_roles_and_explicit_subtypes(self):
        rows=[{'ID':{'Value':i},'NpcType':kind,'NpcSubType':sub,'FunctionType':func,'Grade':99} for i,kind,sub,func in [
            (1,'ENpcType::Citizen','ENpcSubType::NormalCitizen','ENpcFuncType::BuySell'),
            (2,'ENpcType::Citizen','ENpcSubType::NormalCitizen','ENpcFuncType::Storage'),
            (3,'ENpcType::Monster','ENpcSubType::HeroMonster','ENpcFuncType::None'),
            (4,'ENpcType::Monster','ENpcSubType::NormalMonster','ENpcFuncType::Storage')]]
        maps=[{'markers':[{'kind':'npc','objectId':i} for i in range(1,5)]}]
        self.assertEqual(module.build(rows,maps),{'1':'shop','2':'storage','3':'named'})
        self.assertEqual(module.build(rows,[{'markers':[{'kind':'gather','objectId':1}]}]),{})
        with self.assertRaises(ValueError):module.build(rows+[rows[0]],maps)
        with self.assertRaises(KeyError):module.build(rows,[{'markers':[{'kind':'npc','objectId':999}]}])

if __name__=='__main__':unittest.main()
