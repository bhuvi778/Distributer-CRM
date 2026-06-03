import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 3020,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5010',
          changeOrigin: true,
        },
      },
    },
    define: {
      // Make VITE_API_URL available — set in Vercel env vars
      __API_URL__: JSON.stringify(env.VITE_API_URL || ''),
    },
  };
});
