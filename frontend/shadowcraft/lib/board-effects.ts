import overlay from './data/board-effects.json';

type Stat = {key?: string; name: string; value: number; format: string};
type DisplayNode = {id: string; row: number; column: number; stat?: Stat;stats?:Stat[]};
const rules = overlay.rules as Record<string, {catalogVersion:string;row:number;column:number;primary:{key:string;value:number;format:string};additional:Stat}>;

/** Display-only reviewed supplement; never rewrites catalogs or saved node allocations. */
export function nodeStats(node: DisplayNode, catalogVersion: string | null): Stat[] {
  if (node.stats?.length && node.stats.length<=10 && node.stats.every(s=>typeof s.name==='string'&&typeof s.format==='string'&&Number.isFinite(s.value))) return node.stats;
  if (!node.stat) return [];
  const rule = rules[node.id], stat = node.stat;
  if (!rule || catalogVersion !== rule.catalogVersion || node.row !== rule.row || node.column !== rule.column || stat.key !== rule.primary.key ||
      stat.value !== rule.primary.value || stat.format !== rule.primary.format) return [stat];
  return [stat, rule.additional];
}
