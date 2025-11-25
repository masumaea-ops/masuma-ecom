import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
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