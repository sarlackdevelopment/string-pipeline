/**
 * Test setup: jest-dom matchers, DOM cleanup after every test, and the mock API server. Vitest runs without
 * globals, so Testing Library cannot register its own afterEach. A request that no test prepared never reaches the
 * network: MSW logs an error and the request fails like an unreachable server (D33).
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/vue'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './server'

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
