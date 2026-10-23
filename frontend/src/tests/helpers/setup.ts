/**
 * Test setup: jest-dom matchers, plus DOM cleanup after every test. Vitest runs without
 * globals, so Testing Library cannot register its own afterEach.
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/vue'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
