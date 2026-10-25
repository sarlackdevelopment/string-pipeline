/**
 * The catalog query (D29, D40). It loads once per page and language: the catalog changes only with a new version of
 * the server. Its texts are in the interface's language (D52); while the catalog of a newly chosen language loads,
 * the editor keeps the one it has, so it stays on the page.
 */
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchCatalog } from '@/api/client'
import { unwrap } from './client'

export function useCatalog() {
  const { locale } = useI18n()
  return useQuery({
    queryKey: computed(() => ['catalog', locale.value] as const),
    queryFn: async ({ queryKey: [, language], signal }) =>
      unwrap(await fetchCatalog(language, signal)),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  })
}
