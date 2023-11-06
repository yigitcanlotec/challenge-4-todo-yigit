import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-ignore
import { resolve } from 'path';
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
});
