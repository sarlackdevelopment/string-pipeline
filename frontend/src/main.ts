/**
 * Entry point: mounts the application shell with the store, the query client (D29) and the texts in the reader's
 * language (D52).
 */
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { createAppI18n, initialLanguage } from './i18n'
import { createQueryClient } from './queries/client'
import './index.css'

createApp(App)
  .use(createPinia())
  .use(VueQueryPlugin, { queryClient: createQueryClient() })
  .use(createAppI18n(initialLanguage()))
  .mount('#app')
