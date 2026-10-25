/**
 * One file configures both Vite and Vitest.
 */
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // In development the API runs on its own port; the app calls `/api` as it will in production (D22).
    proxy: { '/api': 'http://localhost:8080' },
  },
  test: {
    include: ['src/tests/**/*.test.ts'],
    environment: 'jsdom',
    setupFiles: ['./src/tests/helpers/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/main.ts', 'src/tests/**'],
      reporter: ['text', 'html'],
    },
  },
})
