export type NpcIndex = {
  schema: 'a2bc-npc-index-v1';
  source: {buildId: string};
  npcs: {id: string; name: string | null; kind: string}[];
};
export function parseNpcIndex(input: unknown): NpcIndex {
  const data = input as NpcIndex;
  const source = data?.source as Record<string, unknown> | undefined;
  if (data?.schema !== 'a2bc-npc-index-v1' || source?.kind !== 'installed-steam-client' || source.appId !== '3393110' || source.region !== 'global' || source.language !== 'en-US' || source.liveAvailabilityVerified !== false || typeof source.buildId !== 'string' || !/^[1-9]\d*$/.test(source.buildId) || !Array.isArray(data.npcs) || !data.npcs.length || data.npcs.length > 100000) throw Error('Invalid NPC source');
  const ids = new Set<string>();
  for (const npc of data.npcs) {
    if (!npc || typeof npc.id !== 'string' || !/^[1-9]\d*$/.test(npc.id) || ids.has(npc.id) || !['Monster', 'Citizen', 'Summon', 'Bot', 'Etc'].includes(npc.kind) || (npc.name !== null && (typeof npc.name !== 'string' || !npc.name.trim() || npc.name.length > 1000))) throw Error('Invalid NPC record');
    ids.add(npc.id);
  }
  return data;
}
