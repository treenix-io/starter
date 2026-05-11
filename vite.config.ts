import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import treenixPlugin from '@treenx/react/vite-plugin-treenix'
import { treenixServer } from './vite-plugin-treenix'

export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  plugins: [
    treenixServer(),
    treenixPlugin({ modsDirs: [resolve(import.meta.dirname, 'mods')] }),
    tailwindcss(),
    react({ babel: { plugins: ['babel-plugin-react-compiler'] } }),
  ],
  optimizeDeps: {
    include: [
      'use-sync-external-store/shim', 'use-sync-external-store/shim/with-selector',
      'react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime',
      'immer', 'valtio', 'dayjs', 'sift',
      '@tanstack/react-query', '@trpc/client',
      '@tiptap/react', 'react-grid-layout',
      'highlight.js', 'highlight.js/lib/core', 'lowlight',
    ],
  },
  server: {
    port: 3210,
    host: '0.0.0.0',
    proxy: {
      '/trpc/': { target: 'http://127.0.0.1:3211', changeOrigin: true },
      '/api/': { target: 'http://127.0.0.1:3211', changeOrigin: true },
    },
  },
})
