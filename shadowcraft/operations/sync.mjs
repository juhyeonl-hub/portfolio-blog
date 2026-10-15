// Import one reviewed, locally supplied JSON catalog. No external catalog crawling.
// Authentication is read from environment and never logged or written to the repository.
import {readFile,stat} from 'node:fs/promises';
import {parseCatalog,importCatalog} from './catalog-import.mjs';
const [key,flag,path] = process.argv.slice(2);
if (flag !== '--file' || !path) {
  console.error('Usage: node shadowcraft/operations/sync.mjs <classKey> --file <reviewed-catalog.json>');
  process.exitCode = 1;
} else {
  try {
    if ((await stat(path)).size > 3_000_000) throw Error('Catalog file exceeds 3 MB');
    const catalog = parseCatalog(await readFile(path,'utf8'),key);
    const result = await importCatalog({origin:process.env.SHADOWCRAFT_ORIGIN || 'http://127.0.0.1:8081',
      token:process.env.SHADOWCRAFT_ADMIN_TOKEN,apiKey:process.env.A2BC_API_KEY,key,catalog});
    console.log(`${key}: imported ${result.catalog.version}; recommendation review required: ${result.catalog.reviewRequired}`);
  } catch (error) {
    // Avoid dumping request headers, environment, catalog or nested network errors.
    console.error(error instanceof Error ? error.message : 'Catalog import failed');
    process.exitCode = 1;
  }
}
