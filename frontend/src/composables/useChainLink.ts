/**
 * Keeps the chain and the address in step (D49). Once the catalog is there, the editor opens the chain of the link it
 * was opened with, and again whenever the fragment changes, as when a link to another chain is followed or Back
 * returns to one. After an edit the fragment is rewritten in place, without a new history entry.
 */
import { useDebounceFn, useEventListener } from '@vueuse/core'
import { onScopeDispose, shallowRef, watch, type Ref } from 'vue'
import type { Catalog } from '@/model/catalog'
import { emptyChain, type Chain, type ChainContent } from '@/model/chain'
import { fromFragment, LinkStatus, toFragment } from '@/model/link'

/** The pause after the last edit before the address follows: Safari allows 100 changes of it in 10 seconds. */
export const LINK_DELAY_MS = 300

export interface ChainLinkOptions {
  readonly chain: () => Chain
  /** `undefined` while the catalog is loading: a link can only be read against it. */
  readonly catalog: () => Catalog | undefined
  readonly load: (chain: ChainContent) => void
}

export function useChainLink(options: ChainLinkOptions): {
  /** Why the link the editor was opened with could not be opened; cleared by the next edit. */
  readonly problem: Readonly<Ref<string | null>>
} {
  const problem = shallowRef<string | null>(null)

  // `followed` is false for the link the page was opened with. A fragment without a chain then means a page without
  // one; after following a link, as with Back, it means an empty chain.
  function open(followed: boolean): void {
    const catalog = options.catalog()
    if (catalog === undefined) {
      return
    }
    const reading = fromFragment(window.location.hash, catalog)
    switch (reading.status) {
      case LinkStatus.none:
        if (followed) {
          options.load(emptyChain)
        }
        return
      case LinkStatus.chain:
        problem.value = null
        options.load(reading.chain)
        return
      case LinkStatus.invalid:
        problem.value = reading.message
        return
    }
  }

  // Once, when the catalog arrives; a catalog fetched again later must not undo the user's edits.
  watch(
    () => options.catalog() !== undefined,
    (ready) => {
      if (ready) {
        open(false)
      }
    },
    { immediate: true },
  )
  useEventListener(window, 'hashchange', () => {
    open(true)
  })

  const writeSoon = useDebounceFn((chain: Chain) => {
    problem.value = null
    write(chain)
  }, LINK_DELAY_MS)
  watch(options.chain, (chain) => {
    void writeSoon(chain)
  })
  // A write still waiting when the editor goes away must not change the address afterwards.
  onScopeDispose(writeSoon.cancel)

  return { problem }
}

function write(chain: Chain): void {
  const fragment = toFragment(chain)
  if (fragment === window.location.hash) {
    return
  }
  const address = new URL(window.location.href)
  address.hash = fragment
  try {
    window.history.replaceState(window.history.state, '', address)
  } catch {
    // An address too long for the browser stays as it was; the editor goes on working.
  }
}
