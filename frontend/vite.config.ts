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
        // The libraries in a file of their own: they change less often than the app's code, so a browser keeps them
        // cached across the app's updates, and neither file passes Vite's warning size of 500 kB.
        codeSplitting: { groups: [{ name: 'vendor', test: /node_modules/ }] },
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
    // The keyboard journey waits for several runs of 300 ms each. It takes 1 to 2 seconds, but on a busy machine it
    // passed the default of 5 seconds, so the limit only guards against a test that hangs.
    testTimeout: 15_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/main.ts', 'src/tests/**'],
      reporter: ['text', 'html'],
    },
  },
})
