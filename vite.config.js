import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks: {
          'three-core': ['three'],
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react', 'canvas-confetti', 'axios']
        }
      }
    }
  }
});
