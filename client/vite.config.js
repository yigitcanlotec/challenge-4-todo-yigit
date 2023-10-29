import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  root: './',
  build: {
    outDir: 'dist',
  },
  plugins: [react()],
  build: {
    rollupOptions: {
      input: '/public/index.html',
    },
  },
});
