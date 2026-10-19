/**
 * Moving saved planner data from the old address (juhyeonl.dev/lab/shadowcraft/) to ASBC's own domain.
 * Browser storage is per origin, so the old page hands its entries to the new page with postMessage.
 * Both sides check the exact counterpart origin and a one-time nonce; only planner keys are copied.
 */
// Build-time Vite variables (absent when unit tests import this module directly).
const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
export const OLD_ORIGIN: string = env.VITE_ASBC_OLD_ORIGIN || 'https://juhyeonl.dev';
/** Empty until the new domain is live; the move banner and import screen stay hidden. */
export const NEW_ORIGIN: string = env.VITE_ASBC_NEW_ORIGIN || '';
/** Planner path on the new origin ("/" on the standalone domain; tests point it at the dev-server path). */
export const NEW_PATH: string = env.VITE_ASBC_NEW_PATH || '/';

export const TRANSFER_PREFIXES = ['shadowcraft-', 'a2bc-', 'asbc-'];
// Limits keep a hostile or corrupt message from filling storage: 5 MB of text, 2000 keys, 512-char keys.
export const MAX_TRANSFER_CHARS = 5_000_000;
const MAX_KEYS = 2000, MAX_KEY_LENGTH = 512;

export type Entries = Record<string, string>;
export type TransferRequest = { type: 'asbc-transfer-request'; nonce: string };
export type TransferData = { type: 'asbc-transfer-data'; nonce: string; entries: Entries };

const ownKey = (key: string) => TRANSFER_PREFIXES.some(prefix => key.startsWith(prefix));

/** Planner entries from this origin's localStorage (the community session lives in sessionStorage and is not moved). */
export function collectEntries(storage: Storage): Entries {
  const out: Entries = {};
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && ownKey(key)) { const value = storage.getItem(key); if (value !== null) out[key] = value; }
  }
  return out;
}

/** Returns validated entries, or null when the payload is not a well-formed planner transfer. */
export function validEntries(value: unknown): Entries | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const pairs = Object.entries(value as Record<string, unknown>);
  if (pairs.length > MAX_KEYS) return null;
  let size = 0;
  const out: Entries = {};
  for (const [key, item] of pairs) {
    if (typeof item !== 'string' || key.length > MAX_KEY_LENGTH || !ownKey(key)) return null;
    size += key.length + item.length;
    if (size > MAX_TRANSFER_CHARS) return null;
    out[key] = item;
  }
  return out;
}

export function summarize(entries: Entries) {
  const keys = Object.keys(entries);
  const count = (test: (key: string) => boolean) => keys.filter(test).length;
  return {
    total: keys.length,
    plans: count(key => key.startsWith('shadowcraft-plan-v1')),
    library: count(key => key.startsWith('a2bc-build-library-v1')),
    maps: count(key => key.startsWith('a2bc-map')),
  };
}

/** Keys that already hold a different value on this origin. */
export function conflicts(storage: Storage, entries: Entries): string[] {
  return Object.keys(entries).filter(key => { const current = storage.getItem(key); return current !== null && current !== entries[key]; });
}

/** Writes the entries; existing different values are kept unless overwrite is true. */
export function applyEntries(storage: Storage, entries: Entries, overwrite: boolean): { written: number; kept: number } {
  let written = 0, kept = 0;
  for (const [key, value] of Object.entries(entries)) {
    const current = storage.getItem(key);
    if (current !== null && current !== value && !overwrite) { kept++; continue; }
    storage.setItem(key, value); written++;
  }
  return { written, kept };
}

export function isTransferRequest(data: unknown): data is TransferRequest {
  return !!data && typeof data === 'object' && (data as TransferRequest).type === 'asbc-transfer-request'
    && typeof (data as TransferRequest).nonce === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test((data as TransferRequest).nonce);
}
