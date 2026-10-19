// Standalone ASBC build for its own domain (Cloudflare Pages). The blog build (vite.config.js) is unchanged.
// Output: dist-asbc/ with the planner at "/", static game data under /shadowcraft/, and Pages _headers.
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { copyFileSync, renameSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import base from './vite.config.js'

const out = 'dist-asbc'
export default defineConfig({
  ...base,
  plugins: [react(), tailwindcss(), {
    name: 'asbc-pages-output',
    closeBundle() {
      renameSync(`${out}/asbc.html`, `${out}/index.html`)
      copyFileSync('asbc-pages/_headers', `${out}/_headers`)
    },
  }],
  resolve: { alias: { '@': fileURLToPath(new URL('./shadowcraft', import.meta.url)) } },
  build: { outDir: out, emptyOutDir: true, rollupOptions: { input: { asbc: 'asbc.html' } } },
})
