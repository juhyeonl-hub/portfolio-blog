import type {Catalog} from './planner';
import assassin from './data/catalogs/assassin.json';
const loaders={
 assassin:()=>Promise.resolve({default:assassin}),
 gladiator:()=>import('./data/catalogs/gladiator.json'),
 templar:()=>import('./data/catalogs/templar.json'),
 ranger:()=>import('./data/catalogs/ranger.json'),
 elementalist:()=>import('./data/catalogs/elementalist.json'),
 sorcerer:()=>import('./data/catalogs/sorcerer.json'),
 cleric:()=>import('./data/catalogs/cleric.json'),
 chanter:()=>import('./data/catalogs/chanter.json'),
};
export async function loadBundledCatalog(key:string):Promise<Catalog>{const load=loaders[key as keyof typeof loaders];if(!load)throw Error('지원하지 않는 직업입니다.');return (await load()).default as Catalog}
