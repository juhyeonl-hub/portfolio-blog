import {isEndgamePointLevel,type Catalog,type Plan} from './planner';
import {recommendBuild} from './recommendation';

export type BuildPurpose='leveling'|'pve'|'pvp';
export const BUILD_PURPOSES:readonly BuildPurpose[]=['leveling','pve','pvp'];
export const PURPOSE_NAMES:Record<BuildPurpose,string>={leveling:'레벨링 (45 미만)',pve:'PvE (45부터 원정)',pvp:'PvP'};
export const PURPOSE_MODES:Record<BuildPurpose,Plan['mode']>={leveling:'damage',pve:'safe',pvp:'pvp'};
// Keep legacy saved modes compatible; a level change never changes the user's point budget.
export function buildPurpose(p:Plan):BuildPurpose{return p.mode==='pvp'?'pvp':isEndgamePointLevel(p)?'pve':'leveling'}
export function purposeAvailable(p:Plan,purpose:BuildPurpose){return purpose==='pvp'||(purpose==='pve')===isEndgamePointLevel(p)}
export function recommendPurposeBuild(c:Catalog,p:Plan):Plan{
 const purpose=buildPurpose(p);
 // Existing class boss/party priorities are a reference, not an expedition-specific simulation.
 // PvP-only stats cannot help the leveling/PvE target, even as leftover-point filler.
 const catalog=purpose==='pvp'?c:{...c,boards:c.boards.map(b=>({...b,nodes:b.nodes.filter(n=>n.autoLearn||!/^PVP(?:\s|$)/i.test(n.stat?.name||''))}))};
 return recommendBuild(catalog,{...p,mode:PURPOSE_MODES[purpose]});
}
