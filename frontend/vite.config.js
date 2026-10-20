import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { renameSync, rmSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss(), {
    // Blog build only: ASBC lives on asbc.app. /lab/shadowcraft/ becomes the light "moved" page (data hand-over and
    // link forwarding) and the planner's game data under public/shadowcraft is left out of the blog deployment.
    // The dev server still serves the full planner at /lab/shadowcraft/ for the browser tests.
    name: 'asbc-moved-page', apply: 'build',
    closeBundle() {
      renameSync('dist/lab/shadowcraft/moved.html', 'dist/lab/shadowcraft/index.html')
      rmSync('dist/shadowcraft', { recursive: true, force: true })
    },
  }],
  resolve: { alias: { '@': fileURLToPath(new URL('./shadowcraft', import.meta.url)) } },
  build: { rollupOptions: { input: { blog: 'index.html', shadowcraft: 'lab/shadowcraft/moved.html' } } },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
