/**
 * One file configures both Vite and Vitest.
 */
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    // The app installs, and opens without the network (D56): Workbox writes a service worker at build time that keeps
    // the built files and the catalog. Runs always go to the server. `npm run dev` has no service worker.
    VitePWA({
      // A new version installs in the background and takes over at once. A page that is already open keeps the files
      // it started with, which are all of them; the next page that opens gets the new version.
      registerType: 'autoUpdate',
      // The files of public/ that the manifest does not name, kept with the build's own.
      includeAssets: ['favicon.svg', 'favicon.png', 'apple-touch-icon-180x180.png'],
      manifest: {
        id: '/',
        name: 'String Pipeline',
        short_name: 'Pipeline',
        description: 'Chain text transformations without writing code.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Only the app's own page. Docker serves the API and Swagger UI from the same origin (D22), and they always
        // come from the server.
        navigateFallbackAllowlist: [/^\/$/],
        runtimeCaching: [
          {
            // The catalog: from the server when it answers within 3 seconds, else the copy kept from the last time. The
            // server names the language in Vary (D52), so the cache keeps one copy per language. The function runs in
            // the worker, where the app's CATALOG_PATH does not exist, so it spells the path out.
            urlPattern: ({ sameOrigin, url }) => sameOrigin && url.pathname === '/api/catalog',
            handler: 'NetworkFirst',
            options: { cacheName: 'catalog', networkTimeoutSeconds: 3 },
          },
        ],
      },
    }),
  ],
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
