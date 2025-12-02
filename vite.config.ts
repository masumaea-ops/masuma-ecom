
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        // Keep jspdf aliased if you want to load it from CDN or handle it specifically
        // Otherwise, removing aliases allows normal node_modules resolution
      }
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
          secure: false,
        },
        '/media': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    optimizeDeps: {
      // Only exclude heavy libraries if you specifically want to load them from CDN
      exclude: ['jspdf', 'jspdf-autotable']
    },
    build: {
      rollupOptions: {
        // react-helmet-async and react-ga4 are now bundled locally
        external: ['jspdf', 'jspdf-autotable']
      }
    },
    define: {
      'process.env': JSON.stringify({
        API_KEY: env.API_KEY,
        NODE_ENV: mode,
        ...env
      })
    }
  };
});
