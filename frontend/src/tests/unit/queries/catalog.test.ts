import { QueryClient } from '@tanstack/vue-query'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { keepCatalogForOffline } from '@/queries/catalog'

// The browser's service workers as the page sees them: whether one serves the page, and the event when that changes.
function serviceWorkers(controller: ServiceWorker | null): EventTarget {
  const container = Object.assign(new EventTarget(), { controller })
  Object.defineProperty(navigator, 'serviceWorker', { value: container, configurable: true })
  onTestFinished(() => {
    Reflect.deleteProperty(navigator, 'serviceWorker')
  })
  return container
}

function queryClientSpy() {
  const queryClient = new QueryClient()
  return { queryClient, refetch: vi.spyOn(queryClient, 'refetchQueries').mockResolvedValue() }
}

describe('keeping the catalog for offline use (D56)', () => {
  it('loads the catalog again once a service worker takes the page over, so the worker keeps a copy', () => {
    const container = serviceWorkers(null)
    const { queryClient, refetch } = queryClientSpy()
    keepCatalogForOffline(queryClient)

    container.dispatchEvent(new Event('controllerchange'))
    container.dispatchEvent(new Event('controllerchange'))

    expect(refetch).toHaveBeenCalledExactlyOnceWith({ queryKey: ['catalog'] })
  })

  it('leaves a page alone that a service worker served from the start, which loaded the catalog through it', () => {
    const container = serviceWorkers({} as ServiceWorker)
    const { queryClient, refetch } = queryClientSpy()
    keepCatalogForOffline(queryClient)

    container.dispatchEvent(new Event('controllerchange'))

    expect(refetch).not.toHaveBeenCalled()
  })

  it('does nothing in a browser without service workers, or on a page served over plain HTTP', () => {
    const { queryClient, refetch } = queryClientSpy()

    keepCatalogForOffline(queryClient)

    expect('serviceWorker' in navigator).toBe(false)
    expect(refetch).not.toHaveBeenCalled()
  })
})
