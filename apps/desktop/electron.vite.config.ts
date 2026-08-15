import { defineConfig } from 'electron-vite';

export default defineConfig({
  main: {
    build: {
      outDir: 'out/main',
      rollupOptions: { input: 'src/main.ts' },
    },
  },
  preload: {
    build: {
      outDir: 'out/preload',
      rollupOptions: { input: 'src/preload.ts' },
    },
  },
});
