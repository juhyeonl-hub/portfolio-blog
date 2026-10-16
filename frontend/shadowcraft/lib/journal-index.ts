type NpcReference = {id: string; name: string | null} | null;
export type QuestEntry = {id: string; name: string | null; kind: string; race: string; summary: string | null; stepCount: number; acquireNpc: NpcReference; completeNpc: NpcReference; nextId: string | null};
export type DungeonEntry = {id: string; name: string | null; kind: string; mapId: string; mapName: string | null};
export type PetEntry = {id: string; name: string | null; kind: string};
export type JournalIndex = {schema: 'a2bc-journal-index-v1'; source: {buildId: string}; quests: QuestEntry[]; dungeons: DungeonEntry[]; pets: PetEntry[]};
const id = (v: unknown): v is string => typeof v === 'string' && /^[1-9]\d*$/.test(v);
const text = (v: unknown) => v === null || (typeof v === 'string' && !!v.trim() && v.length <= 20000);
export function parseJournalIndex(input: unknown): JournalIndex {
  const data = input as JournalIndex;
  const source = data?.source as Record<string, unknown> | undefined;
  if (data?.schema !== 'a2bc-journal-index-v1' || source?.kind !== 'installed-steam-client' || source.appId !== '3393110' || source.region !== 'global' || source.language !== 'en-US' || source.liveAvailabilityVerified !== false || !id(source.buildId)) throw Error('Invalid journal source');
  for (const rows of [data.quests, data.dungeons, data.pets]) {
    if (!Array.isArray(rows) || !rows.length || rows.length > 100000) throw Error('Invalid journal list');
    const ids = new Set<string>();
    for (const row of rows) {
      if (!row || !id(row.id) || ids.has(row.id) || !text(row.name) || typeof row.kind !== 'string' || !/^[A-Za-z][A-Za-z0-9_]*$/.test(row.kind)) throw Error('Invalid journal entry');
      ids.add(row.id);
    }
  }
  const ids = new Set(data.quests.map(q => q.id));
  for (const q of data.quests) {
    for (const npc of [q.acquireNpc, q.completeNpc]) if (npc !== null && (!npc || !id(npc.id) || !text(npc.name))) throw Error('Invalid quest NPC');
    if (!['All', 'Light', 'Dark'].includes(q.race) || !text(q.summary) || !Number.isSafeInteger(q.stepCount) || q.stepCount < 0 || q.stepCount > 10000 || (q.nextId !== null && (!id(q.nextId) || !ids.has(q.nextId)))) throw Error('Invalid quest reference');
  }
  for (const d of data.dungeons) if (!id(d.mapId) || !text(d.mapName)) throw Error('Invalid dungeon map');
  return data;
}
