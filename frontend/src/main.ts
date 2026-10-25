/**
 * Entry point: mounts the application shell with the store and the query client (D29).
 */
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { createQueryClient } from './queries/client'
import './index.css'

createApp(App)
  .use(createPinia())
  .use(VueQueryPlugin, { queryClient: createQueryClient() })
  .mount('#app')
