
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        'jspdf': 'https://aistudiocdn.com/jspdf@^2.5.1',
        'jspdf-autotable': 'https://aistudiocdn.com/jspdf-autotable@^3.8.2',
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
      exclude: ['jspdf', 'jspdf-autotable', 'react-helmet-async', 'react-ga4']
    },
    build: {
      rollupOptions: {
        external: ['jspdf', 'jspdf-autotable', 'react-helmet-async', 'react-ga4']
      }
    },
    define: {
      // Safely stringify env vars to prevent "process is not defined" errors
      'process.env': JSON.stringify({
        API_KEY: env.API_KEY,
        NODE_ENV: mode,
        ...env
      })
    }
  };
});
