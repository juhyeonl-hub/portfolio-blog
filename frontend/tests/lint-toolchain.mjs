import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { ESLint } from 'eslint';

// ESLint 10 uses a subset of minimatch 11's API. Keep these behavioral checks
// while package.json pins the two ESLint consumers to the patched version.
// Do not extend the override to other packages without checking their APIs.
const frontend = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const config = path.join(frontend, 'eslint.config.js');
const fixture = await mkdtemp(path.join(frontend, '.lint-toolchain-'));
const files = {
  'src/App.jsx': 'export default function App() { return <main />; }\n',
  'src/한글 name.js': 'export const value = 1;\n',
  'src/unused.js': 'const unused = 1;\n',
  'src/undefined.js': 'missingCall();\n',
  'src/invalid.js': 'export const = ;\n',
  'src/Hook.jsx': "import { useState } from 'react';\nexport default function Hook({ enabled }) { if (enabled) useState(0); return <main />; }\n",
  'src/Refresh.jsx': 'export function helper() { return 1; }\nexport default function Refresh() { return <main />; }\n',
  'src/nested/keep.js': 'export const value = 1;\n',
  '.hidden.js': 'export const value = 1;\n',
  'dist/generated.js': 'this is intentionally invalid JavaScript',
  'dist-asbc/generated.js': 'this is intentionally invalid JavaScript',
  'public/shadowcraft/ocr/vendor.js': 'this is intentionally invalid JavaScript',
};
try {
  for (const [name, source] of Object.entries(files)) {
    const target = path.join(fixture, name);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, source);
  }
  const eslint = new ESLint({ cwd: fixture, overrideConfigFile: config });
  const results = await eslint.lintFiles(['.']);
  const names = results.map(r => path.relative(fixture, r.filePath).split(path.sep).join('/')).sort();
  assert.deepEqual(names, Object.keys(files).filter(n => !n.startsWith('dist') && !n.startsWith('public/')).sort());
  const messages = name => results.find(r => r.filePath === path.join(fixture, name)).messages;
  assert.deepEqual(messages('src/App.jsx'), []);
  assert.deepEqual(messages('src/한글 name.js'), []);
  assert(messages('src/unused.js').some(m => m.ruleId === 'no-unused-vars'));
  assert(messages('src/undefined.js').some(m => m.ruleId === 'no-undef'));
  assert(messages('src/invalid.js').some(m => m.fatal));
  assert(messages('src/Hook.jsx').some(m => m.ruleId === 'react-hooks/rules-of-hooks'));
  assert(messages('src/Refresh.jsx').some(m => m.ruleId === 'react-refresh/only-export-components'));

  const filtered = new ESLint({ cwd: fixture, overrideConfigFile: config, ignorePatterns: ['src/*.jsx', '!src/App.jsx'] });
  const filteredNames = (await filtered.lintFiles(['.'])).map(r => path.relative(fixture, r.filePath).split(path.sep).join('/')).sort();
  assert.deepEqual(filteredNames, names.filter(n => !n.endsWith('.jsx') || n === 'src/App.jsx'));
  const jsx = await eslint.lintFiles(['src/**/*.{js,jsx}']);
  assert.deepEqual(jsx.map(r => path.relative(fixture, r.filePath).split(path.sep).join('/')).sort(), names.filter(n => n.startsWith('src/')));

  // Check both actual consumer resolutions, including a future nested install.
  for (const consumer of ['eslint', '@eslint/config-array']) {
    const consumerRequire = createRequire(require.resolve(consumer));
    const matchEntry = consumerRequire.resolve('minimatch');
    const matcher = consumerRequire('minimatch');
    const metadata = JSON.parse(await readFile(consumerRequire.resolve('minimatch/package.json'), 'utf8'));
    assert.equal(metadata.version, '11.0.3', 'Re-review the scoped override when changing minimatch');
    assert.equal(new matcher.Minimatch('src/**/*.{js,jsx}', { dot: true }).match('src/nested/keep.js'), true);
    // The advisory's **/../ preprocessing input must remain bounded. Run in a
    // child with a time/memory cap so a future regression cannot hang the suite.
    const probe = spawnSync(process.execPath, ['--max-old-space-size=128', '--input-type=module', '-e', `
      import { createRequire } from 'node:module';
      const require = createRequire(import.meta.url);
      const { Minimatch } = require(${JSON.stringify(matchEntry)});
      for (const count of [4, 16, 64]) {
        new Minimatch('**/../'.repeat(count) + '*.js', { optimizationLevel: 2 });
      }
    `], { cwd: fixture, timeout: 5000, encoding: 'utf8' });
    assert.equal(probe.status, 0, `${consumer} pattern bound failed: ${probe.error?.message ?? probe.stderr}`);
  }
  console.log('Lint toolchain: file coverage, ignores/negation, JSX, React rules, invalid syntax and bounded glob preprocessing PASS');
} finally {
  assert.equal(path.dirname(fixture), path.resolve(frontend));
  assert(path.basename(fixture).startsWith('.lint-toolchain-'));
  await rm(fixture, { recursive: true, force: true });
}
