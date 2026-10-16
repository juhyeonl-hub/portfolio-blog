export type DpsSnapshot = {v: 1; target: string; mode: string; timeMs: number; rows: {name: string; dps: number; dmg: number; you: boolean}[]};
export function parseDpsSnapshot(value: unknown): DpsSnapshot {
  const fail = (): never => {throw Error('Invalid measured DPS snapshot');};
  const obj = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : fail();
  const text = (v: unknown) => typeof v === 'string' && v.length <= 128;
  const num = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
  const data = obj(value);
  if (data.v !== 1 || !text(data.target) || !text(data.mode) || !num(data.timeMs) || !Array.isArray(data.rows) || data.rows.length > 64) fail();
  for (const entry of data.rows as unknown[]) {
    const row = obj(entry);
    if (!text(row.name) || !num(row.dps) || !num(row.dmg) || typeof row.you !== 'boolean') fail();
  }
  return data as DpsSnapshot;
}
