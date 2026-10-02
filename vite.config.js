import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': process.env.ALCEO_API_ORIGIN ?? 'http://localhost:5000',
    },
  },
});
