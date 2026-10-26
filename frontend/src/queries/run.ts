/**
 * The run query (D11, D29, D40): runs the chain 300 ms after the last edit.
 *
 * The request itself and the interface's language (D52) are the query key. An edit changes the key, so TanStack Query
 * aborts the request still running for the old key through its `AbortSignal` and keeps showing the old result until
 * the new one arrives. A run depends on nothing but its request and the language of its messages, so a cached result
 * never goes stale: undoing an edit shows the earlier result at once.
 *
 * Without the network, a run waits for it (D57). Once the browser says it went offline, TanStack Query holds a new
 * request, or the retry of one that failed, and sends it when the browser says it is back.
 */
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { useOnline, watchDebounced } from '@vueuse/core'
import { computed, shallowRef, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'
import { postRun } from '@/api/client'
import type { RunRequest } from '@/model/run'
import { isNetworkFailure, unwrap } from './client'

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

  const { locale } = useI18n()
  const query = useQuery({
    queryKey: computed(() => ['run', locale.value, sent.value] as const),
    queryFn: async ({ queryKey: [, language, body], signal }) =>
      unwrap(await postRun(body, language, signal)),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  })

  // TanStack Query holds a run only once the browser has said with an event that it went offline, which a page that
  // opens offline never hears. Its run fails to reach the server, and while the browser says it is offline, that run
  // waits for the network all the same; the browser's flag counts only after such a failure (D57).
  const online = useOnline()
  const waitsForNetwork = computed(
    () => query.isPaused.value || (!online.value && isNetworkFailure(query.error.value)),
  )
  watch(online, (isOnline) => {
    if (isOnline && isNetworkFailure(query.error.value)) {
      // TanStack Query may be sending it again already, if it had heard the browser go offline.
      void query.refetch({ cancelRefetch: false })
    }
  })

  return {
    /** The latest result; while the next run is on its way, the previous one. */
    result: query.data,
    error: query.error,
    /** The request that the result or the error belongs to. */
    sentRequest: sent,
    /** From an edit until its result arrives: the pause, then the request, which may wait for the network. */
    isUpdating: computed(
      () => latest.value !== sent.value || query.isFetching.value || waitsForNetwork.value,
    ),
    /** The run waits for the network, and goes on once the browser says it is back online (D57). */
    waitsForNetwork,
    retry: () => {
      void query.refetch()
    },
  }
}
