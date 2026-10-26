/**
 * The test that runs the features, and the functions that define their steps. It is playwright-bdd's, with service
 * workers blocked (D56) except in the scenarios tagged `@service-worker`: a service worker would answer requests that
 * Playwright's routes have to see, with which several features stand in for the server, and a reload would take the
 * app's files from the worker's cache.
 */
import { createBdd, test as base } from 'playwright-bdd'

export const test = base.extend({
  serviceWorkers: async ({ $tags }, use) => {
    await use($tags.includes('@service-worker') ? 'allow' : 'block')
  },
})

export const { Given, When, Then } = createBdd(test)
