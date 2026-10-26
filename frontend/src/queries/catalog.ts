/**
 * The catalog query (D29, D40). It loads once per page and language: the catalog changes only with a new version of
 * the server. Its texts are in the interface's language (D52); while the catalog of a newly chosen language loads,
 * the editor keeps the one it has, so it stays on the page.
 */
import { keepPreviousData, useQuery, type QueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchCatalog } from '@/api/client'
import { unwrap } from './client'

const CATALOG_KEY = 'catalog'

export function useCatalog() {
  const { locale } = useI18n()
  return useQuery({
    queryKey: computed(() => [CATALOG_KEY, locale.value] as const),
    queryFn: async ({ queryKey: [, language], signal }) =>
      unwrap(await fetchCatalog(language, signal)),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  })
}

/**
 * The first visit loads the catalog before the service worker is there to keep a copy of it (D56). Once the worker
 * takes the page over, the catalog loads again, through it, so the app finds a copy when it opens without the network.
 */
export function keepCatalogForOffline(queryClient: QueryClient): void {
  if (!('serviceWorker' in navigator) || navigator.serviceWorker.controller !== null) {
    return
  }
  navigator.serviceWorker.addEventListener(
    'controllerchange',
    () => {
      void queryClient.refetchQueries({ queryKey: [CATALOG_KEY] })
    },
    { once: true },
  )
}
