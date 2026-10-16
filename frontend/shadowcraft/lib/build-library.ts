import {validStoredPlan} from './plan-memory';
import type {Plan} from './planner';
export type SavedBuild = {id: string; name: string; catalogVersion: string; savedAt: string; plan: Plan};
export type BuildLibrary = {schema: 'a2bc-build-library-v1'; classKey: string; entries: SavedBuild[]; recovery: SavedBuild | null};
export type StoragePort = {getItem(key: string): string | null; setItem(key: string, value: string): void};
const classes = ['assassin','gladiator','templar','ranger','elementalist','sorcerer','cleric','chanter'];
export function libraryKey(classKey: string) {
  if (!classes.includes(classKey)) throw Error('지원하지 않는 직업입니다.');
  return 'a2bc-build-library-v1:' + classKey;
}
export function parseLibrary(raw: string | null, classKey: string): BuildLibrary {
  libraryKey(classKey);
  if (raw === null) return {schema:'a2bc-build-library-v1',classKey,entries:[],recovery:null};
  if (raw.length > 2000000) throw Error('보관함 용량 제한을 초과했습니다.');
  const data = JSON.parse(raw) as BuildLibrary;
  if (!data || data.schema !== 'a2bc-build-library-v1' || data.classKey !== classKey || !Array.isArray(data.entries) || data.entries.length > 20) throw Error('보관함 형식이 올바르지 않습니다.');
  const ids = new Set<string>();
  for (const entry of [...data.entries, ...(data.recovery === null ? [] : [data.recovery])]) {
    if (!entry || typeof entry.id !== 'string' || !entry.id || typeof entry.name !== 'string' || !entry.name.trim() || entry.name.length > 60 || typeof entry.catalogVersion !== 'string' || !entry.catalogVersion || entry.catalogVersion.length > 100 || typeof entry.savedAt !== 'string' || !Number.isFinite(Date.parse(entry.savedAt)) || !validStoredPlan(entry.plan,classKey) || new TextEncoder().encode(JSON.stringify({schema:'shadowcraft-v1',catalogVersion:entry.catalogVersion,plan:entry.plan})).length > 150000) throw Error('손상된 빌드가 있습니다. 기존 보관함을 유지합니다.');
  }
  for (const entry of data.entries) {
    if (ids.has(entry.id)) throw Error('중복 빌드 ID입니다.');
    ids.add(entry.id);
  }
  return data;
}
// Compare the exact loaded bytes before any write so another tab's changes survive.
export function writeLibrary(storage: StoragePort, classKey: string, expected: string | null, next: BuildLibrary): string {
  const raw = JSON.stringify(next);
  parseLibrary(raw,classKey);
  if (storage.getItem(libraryKey(classKey)) !== expected) throw Error('다른 탭에서 보관함이 변경되었습니다. 다시 불러오세요.');
  storage.setItem(libraryKey(classKey),raw);
  return raw;
}
export function snapshot(plan: Plan, classKey: string, name: string, catalogVersion: string, id: string): SavedBuild {
  if (!validStoredPlan(plan,classKey)) throw Error('현재 직업과 일치하는 올바른 계획이 필요합니다.');
  const entry = {id,name:name.trim(),catalogVersion,savedAt:new Date().toISOString(),plan:JSON.parse(JSON.stringify({...plan,classKey}))};
  parseLibrary(JSON.stringify({schema:'a2bc-build-library-v1',classKey,entries:[entry],recovery:null}),classKey);
  return entry;
}
