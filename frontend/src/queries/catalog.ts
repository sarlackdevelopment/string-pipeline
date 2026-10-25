/**
 * The catalog query (D29, D40). It loads once per page: the catalog changes only with a new version of the server.
 */
import { useQuery } from '@tanstack/vue-query'
import { fetchCatalog } from '@/api/client'
import { unwrap } from './client'

export const catalogQueryKey = ['catalog'] as const

export function useCatalog() {
  return useQuery({
    queryKey: catalogQueryKey,
    queryFn: async ({ signal }) => unwrap(await fetchCatalog(signal)),
    staleTime: Infinity,
  })
}
