/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // .env files aren't in process.env for the config itself — load them explicitly so the dev proxy
  // target follows VITE_API_PROXY_TARGET. Defaults to the .NET API's dev port (:5056).
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = env.VITE_API_PROXY_TARGET ?? 'http://localhost:5056';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      // antd is a large but well-cached single vendor chunk (~1MB minified, ~300KB gzipped). Set the
      // threshold above its known size so the build stays clean; the app/index chunk is separate and
      // still small, so genuine app bloat would surface elsewhere.
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            antd: ['antd', '@ant-design/icons'],
            query: ['@tanstack/react-query', 'axios'],
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        // Requests for live resources (MSW off for them) proxy to the .NET API in dev.
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
      clearMocks: true,
    },
  };
});
