/**
 * Test setup: jest-dom matchers, DOM cleanup after every test, and the mock API server. Vitest runs without
 * globals, so Testing Library cannot register its own afterEach. A request that no test prepared never reaches the
 * network: MSW logs an error and the request fails like an unreachable server (D33).
 */
import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/vue'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './server'

// findBy and waitFor give up after 3 s instead of 1: a run takes the 300 ms pause and the response, and longer on a
// busy machine. A check that passes still returns as soon as it does.
configure({ asyncUtilTimeout: 3_000 })

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
