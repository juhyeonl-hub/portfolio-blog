export const CLASSES = ['assassin','gladiator','templar','ranger','elementalist','sorcerer','cleric','chanter'];

export function parseCatalog(text, key) {
  if (!CLASSES.includes(key) || Buffer.byteLength(text, 'utf8') > 3_000_000) throw Error('Invalid class or file too large');
  const input = JSON.parse(text);
  const catalog = input?.catalog ?? input;
  if (!catalog || catalog.classKey !== key || typeof catalog.version !== 'string' || !catalog.version
      || !Array.isArray(catalog.skills) || catalog.skills.length !== 35
      || !Array.isArray(catalog.boards) || (catalog.boards.length < 5 || catalog.boards.length > 8)) throw Error('Catalog class or schema mismatch');
  return catalog;
}

export async function importCatalog({origin, token, apiKey, key, catalog, fetchImpl = fetch}) {
  const base = new URL(origin);
  if (base.username || base.password || base.search || base.hash || base.pathname !== '/'
      || (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost','127.0.0.1','[::1]'].includes(base.hostname)))) throw Error('Use an HTTPS origin or local loopback HTTP');
  if (!token && !apiKey) throw Error('Admin authentication is required');
  if (!CLASSES.includes(key) || catalog.classKey !== key) throw Error('Class mismatch');
  const response = await fetchImpl(new URL(`/api/admin/shadowcraft/catalog/${key}`, base), {
    method: 'PUT', redirect: 'error', signal: AbortSignal.timeout(20000),
    headers: {'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {'X-API-Key':apiKey})},
    body: JSON.stringify(catalog),
  });
  if (!response.ok) throw Error(`Catalog import rejected (${response.status}); previous catalog retained`);
  return response.json();
}
