/**
 * Test setup: jest-dom matchers, the app's texts for every component, DOM cleanup after every test, and the mock API
 * server. Vitest runs without globals, so Testing Library cannot register its own afterEach. A request that no test
 * prepared never reaches the network: MSW logs an error and the request fails like an unreachable server (D33).
 */
import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/vue'
import { config } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { createAppI18n, Language } from '@/i18n'
import { server } from './server'

// findBy and waitFor give up after 3 s instead of 1: a run takes the 300 ms pause and the response, and longer on a
// busy machine. A check that passes still returns as soon as it does.
configure({ asyncUtilTimeout: 3_000 })

// jsdom (30) has no layout and no Element.scrollIntoView, which Reka UI calls to keep the highlighted option in view
// (probe tests of step 12). The tests of the model run in Node, where there is no Element at all.
const scrollNowhere = (): void => {
  // Without a layout there is nothing to scroll.
}

// Nor does it capture pointers, which a toast of Reka UI asks about when a press inside it ends, to tell a swipe from a
// click (D55). Without a layout, no press is a swipe.
const capturesNothing = (): boolean => false
const captureNothing = (): void => {
  // Without a layout there is no pointer to capture.
}

if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = scrollNowhere
  Element.prototype.hasPointerCapture = capturesNothing
  Element.prototype.setPointerCapture = captureNothing
  Element.prototype.releasePointerCapture = captureNothing
}

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
})

// Every component gets the app's texts in English (D52). Each test gets its own instance, so a language that one test
// chooses does not carry over into the next. Vue Test Utils adds these plugins to those a test passes itself.
beforeEach(() => {
  config.global.plugins = [createAppI18n(Language.en)]
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  // Every test starts at the app's own address, without a link in it (D49), without a chosen theme (D51) or language
  // (D52).
  if (typeof window !== 'undefined') {
    window.history.replaceState(null, '', '/')
    window.localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.removeAttribute('lang')
  }
})

afterAll(() => {
  server.close()
})
