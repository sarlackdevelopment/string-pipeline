/**
 * Entry point: mounts the application shell with the store, the query client (D29) and the texts in the reader's
 * language (D52). The service worker that keeps the app for offline use registers itself from index.html (D56).
 */
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { createAppI18n, initialLanguage } from './i18n'
import { keepCatalogForOffline } from './queries/catalog'
import { createQueryClient } from './queries/client'
import './index.css'

const queryClient = createQueryClient()
keepCatalogForOffline(queryClient)

createApp(App)
  .use(createPinia())
  .use(VueQueryPlugin, { queryClient })
  .use(createAppI18n(initialLanguage()))
  .mount('#app')
