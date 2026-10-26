/**
 * One file configures both Vite and Vitest.
 */
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  // vue-i18n's build flags (D52): only the Composition API, so its legacy API stays out of the bundle; messages are
  // compiled in the browser, and devtools are off in production.
  define: {
    __VUE_I18N_FULL_INSTALL__: false,
    __VUE_I18N_LEGACY_API__: false,
    __INTLIFY_DROP_MESSAGE_COMPILER__: false,
    __INTLIFY_PROD_DEVTOOLS__: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // The libraries in files of their own: they change less often than the app's code, so a browser keeps them
        // cached across the app's updates. Vue itself goes in one and the other libraries in the other, so that no file
        // passes Vite's warning size of 500 kB. A module goes to the first group it matches.
        codeSplitting: {
          groups: [
            { name: 'vue', test: /node_modules[\\/](@vue|vue)[\\/]/ },
            { name: 'vendor', test: /node_modules/ },
          ],
        },
      },
    },
  },
  server: {
    // In development the API runs on its own port; the app calls `/api` as it will in production (D22). `vite
    // preview` uses the same proxy; the end-to-end tests point it at their own API with API_PROXY_TARGET.
    proxy: { '/api': process.env.API_PROXY_TARGET ?? 'http://localhost:8080' },
  },
  test: {
    include: ['src/tests/**/*.test.ts'],
    environment: 'jsdom',
    setupFiles: ['./src/tests/helpers/setup.ts'],
    // The keyboard journey waits for several runs of 300 ms each. It takes 3 to 5 seconds on its own, and in the whole
    // suite on a busy machine it once passed 15, so the limit only guards against a test that hangs.
    testTimeout: 30_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/main.ts', 'src/tests/**'],
      reporter: ['text', 'html'],
    },
  },
})
