import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',

  plugins: [
    tailwindcss(),
    solidPlugin(),
  ],

  build: {
    target: 'esnext',
    outDir: 'dist',
    emptyOutDir: true,

    lib: {
      entry: 'src/index.tsx',
      name: 'CreateAMolecule',
      cssFileName: 'style',

      fileName: (format) => {
        if (format === 'es') return 'index.js';
        if (format === 'cjs') return 'index.cjs';
        return `index.${format}.js`;
      },

      formats: ['es', 'cjs'],
    },

    rollupOptions: {
      external: ['solid-js'],

      output: {
        exports: 'named',
        globals: {
          'solid-js': 'solidjs',
        },
      },
    },
  },
});