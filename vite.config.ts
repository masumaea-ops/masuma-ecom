
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env from the project root
  // Fix: Property 'cwd' does not exist on type 'Process'. Cast to any to access Node.js runtime method.
  const rootEnv = loadEnv(mode, (process as any).cwd(), '');
  
  // Also check the server directory for the .env file as a fallback
  // Fix: Property 'cwd' does not exist on type 'Process'. Cast to any to access Node.js runtime method.
  const serverEnv = loadEnv(mode, path.resolve((process as any).cwd(), 'server'), '');
  
  // Combine potential key names (GEMINI_API_KEY or API_KEY) from both locations
  const apiKey = rootEnv.GEMINI_API_KEY || rootEnv.API_KEY || serverEnv.GEMINI_API_KEY || serverEnv.API_KEY || "";

  return {
    plugins: [react()],
    resolve: {
      alias: {
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
      exclude: ['jspdf', 'jspdf-autotable']
    },
    build: {
      rollupOptions: {
        external: ['jspdf', 'jspdf-autotable']
      }
    },
    define: {
      // The SDK strictly looks for process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.NODE_ENV': JSON.stringify(mode),
    }
  };
});
