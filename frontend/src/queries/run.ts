/**
 * The run query (D11, D29, D40): runs the chain 300 ms after the last edit.
 *
 * The request itself is the query key. An edit changes the key, so TanStack Query aborts the request still running
 * for the old key through its `AbortSignal` and keeps showing the old result until the new one arrives. A run depends
 * on nothing but its request, so a cached result never goes stale: undoing an edit shows the earlier result at once.
 */
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { watchDebounced } from '@vueuse/core'
import { computed, shallowRef, toValue, type MaybeRefOrGetter } from 'vue'
import { postRun } from '@/api/client'
import type { RunRequest } from '@/model/run'
import { unwrap } from './client'

/** The pause after the last edit before the chain runs (D11). */
export const RUN_DELAY_MS = 300

export function usePipelineRun(request: MaybeRefOrGetter<RunRequest>) {
  const latest = computed(() => toValue(request))
  // A shallow ref keeps the very object it is given, so `sent` and `latest` can be compared by identity.
  // `refDebounced` would store it in a deep ref, which wraps it in a reactive proxy.
  const sent = shallowRef(latest.value)
  watchDebounced(
    latest,
    (next) => {
      sent.value = next
    },
    { debounce: RUN_DELAY_MS },
  )

  const query = useQuery({
    queryKey: computed(() => ['run', sent.value] as const),
    queryFn: async ({ queryKey: [, body], signal }) => unwrap(await postRun(body, signal)),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  })

  return {
    /** The latest result; while the next run is on its way, the previous one. */
    result: query.data,
    error: query.error,
    /** The request that the result or the error belongs to. */
    sentRequest: sent,
    /** From an edit until its result arrives: the pause, then the request. */
    isUpdating: computed(() => latest.value !== sent.value || query.isFetching.value),
    retry: () => {
      void query.refetch()
    },
  }
}
