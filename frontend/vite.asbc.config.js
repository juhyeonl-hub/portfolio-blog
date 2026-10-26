// Standalone ASBC build for its own domain (Cloudflare Pages). The blog build (vite.config.js) is unchanged.
// Output: dist-asbc/ with the planner at "/", static game data under /shadowcraft/, Pages _headers, robots.txt, sitemap.xml and the ASBC icons (shadowcraft/operations/build-asbc-icons.py).
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { copyFileSync, renameSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { asbcLocaleBundles } from './asbc-vite-plugins.js'
import base from './vite.config.js'
import { writeSeoPages } from './asbc-seo.mjs'

const out = 'dist-asbc'
export default defineConfig({
  ...base,
  plugins: [react(), tailwindcss(), asbcLocaleBundles(), {
    name: 'asbc-pages-output',
    closeBundle() {
      renameSync(`${out}/asbc.html`, `${out}/index.html`)
      for (const file of ['_headers', 'robots.txt', 'asbc-icon.svg', 'asbc-og.png', ...[16, 32, 48, 180, 512].map(size => `asbc-icon-${size}.png`)]) copyFileSync(`asbc-pages/${file}`, `${out}/${file}`)
      writeSeoPages(out)
    },
  }],
  resolve: { alias: { '@': fileURLToPath(new URL('./shadowcraft', import.meta.url)) } },
  build: { outDir: out, emptyOutDir: true, rollupOptions: { input: { asbc: 'asbc.html' } } },
})
