import tailwindcss from '@tailwindcss/vite';
import treenixServer from '@treenx/core/vite-plugin';
import treenixPlugin from '@treenx/react/vite-plugin';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
    conditions: ['development', 'browser', 'import'],
  },
  plugins: [
    treenixServer({ configPath: 'root.json', args: ['--deployment', 'native-deployment.json'] }),
    treenixPlugin({ modsDirs: [resolve(import.meta.dirname, 'mods')] }),
    tailwindcss(),
    react(),
  ],
  optimizeDeps: {
    include: [
      'use-sync-external-store/shim', 'use-sync-external-store/shim/with-selector',
      'use-sync-external-store/shim/index.js', 'use-sync-external-store/shim/with-selector.js',
      'react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime',
      'immer', 'valtio', 'dayjs', 'sift',
      '@tanstack/react-query',
      'react-grid-layout',
      'highlight.js', 'highlight.js/lib/core', 'lowlight',
    ],
  },
  server: {
    port: 3210,
    host: '0.0.0.0',
    proxy: {
      '/twp': { target: 'http://127.0.0.1:3211', changeOrigin: true },
      '/auth/': { target: 'http://127.0.0.1:3211', changeOrigin: true },
      '/api/': { target: 'http://127.0.0.1:3211', changeOrigin: true },
    },
  },
})
