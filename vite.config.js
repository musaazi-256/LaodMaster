import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // maplibre-gl loads its tile-parsing logic in a Web Worker, built as a separate
  // file (maplibre-gl-worker.mjs) that it locates relative to its own module URL.
  // Vite's dev-time dependency pre-bundling rewrites/copies maplibre-gl into
  // node_modules/.vite/deps without that worker file alongside it, so the relative
  // URL 404s and the map silently never renders any tiles. Excluding it from
  // pre-bundling serves it straight from node_modules, where the worker file is
  // actually next to it.
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
  server: {
    proxy: {
      // Forwards to the local Express + SQLite API (server/index.js). Proxying here
      // means the browser sees same-origin requests (no CORS needed) whether you're
      // on localhost or hitting this machine's LAN IP from a phone.
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
