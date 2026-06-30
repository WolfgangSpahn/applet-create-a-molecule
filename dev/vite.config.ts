// dev/vite.config.ts

import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  base: './',

  plugins: [
    tailwindcss(),
    solidPlugin(),
  ],

  root: resolve(__dirname),

  resolve: {
    alias: {
      '@src': resolve(__dirname, '../src'),
    },
  },

  publicDir: resolve(__dirname, 'assets'),

  build: {
    // Keep build artifacts outside dev/ so the sandbox remains source-driven.
    outDir: resolve(__dirname, '../dist-dev'),
    emptyOutDir: true,
    target: 'esnext',
  },

  server: {
    port: 3000,
  },
});