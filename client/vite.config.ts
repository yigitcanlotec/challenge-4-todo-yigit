import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import resolve from '@rollup/plugin-node-resolve';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    resolve({
      extensions: ['.mjs', '.js', '.json', '.node', '.jsx', '.tsx'], // Add .jsx here if needed
    }),
  ],

  build: {
    outDir: 'dist',
  },
});
