import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Log the current mode to ensure it's correctly detected
  console.log(`Vite is running in ${mode} mode.`);

  // Load environment variables based on the current mode
  // This is usually handled automatically by Vite, but explicit loading can be useful for debugging
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  console.log('Loaded environment variables:', env);

  return {
    plugins: [react()],
    // Explicitly define envDir if .env files are not in the root
    envDir: './', // Assuming .env.local is in the root directory
    define: {
      // This makes process.env available in the client-side code,
      // which can sometimes resolve issues with import.meta.env not being fully populated.
      'process.env': env,
    },
  };
});
