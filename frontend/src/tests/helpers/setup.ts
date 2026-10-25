/**
 * Test setup: jest-dom matchers, DOM cleanup after every test, and the mock API server. Vitest runs without
 * globals, so Testing Library cannot register its own afterEach. A request that no test prepared never reaches the
 * network: MSW logs an error and the request fails like an unreachable server (D33).
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/vue'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './server'

// jsdom (30) has no layout and no Element.scrollIntoView, which Reka UI calls to keep the highlighted option in view
// (probe tests of step 12). The tests of the model run in Node, where there is no Element at all.
const scrollNowhere = (): void => {
  // Without a layout there is nothing to scroll.
}

if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = scrollNowhere
}

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
