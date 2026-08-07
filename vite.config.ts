import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 650,
      rollupOptions: {

        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/');

            if (!normalizedId.includes('node_modules')) {
              return undefined;
            }

            if (normalizedId.includes('/recharts/') || normalizedId.includes('/react-is/')) {
              return 'charts';
            }

            if (normalizedId.includes('/lucide-react/')) {
              return 'icons';
            }

            if (normalizedId.includes('/motion/')) {
              return 'motion';
            }

            if (normalizedId.includes('/@stripe/stripe-js/') || normalizedId.includes('/stripe/')) {
              return 'payments';
            }

            if (
              normalizedId.includes('/react/') ||
              normalizedId.includes('/react-dom/') ||
              normalizedId.includes('/scheduler/')
            ) {
              return 'react-vendor';
            }

            return undefined;
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching entirely when DISABLE_HMR is true to save CPU during agent edits.
      // Otherwise, ignore runtime data files the server writes to at runtime—without this,
      // every state save triggers a full page reload loop (the app writes -> Vite sees a
      // "source" change -> reloads -> app re-hydrates -> writes again), which looks like flicker.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/data/**', '**/logs/**', '**/public/uploads/**', '**/dev.db*'],
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  };
});
