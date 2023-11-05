import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  root: './',
  plugins: [react()],
  lib: {
    // Could also be a dictionary or array of multiple entry points
    entry: resolve(__dirname, 'src/components/Message.tsx'),
    name: 'Message',
    // the proper extensions will be added
    fileName: 'Message.tsx',
  },
  build: {
    outDir: 'dist',
  },
});
