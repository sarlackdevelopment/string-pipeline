/**
 * The steps of working without the network (D56). Playwright takes the browser offline; the service worker runs only
 * in the scenarios tagged @service-worker (support/test.ts).
 */
import { expect } from '@playwright/test'
import { openEditor, search } from '../support/editor'
import { Given, When, Then } from '../support/test'

// The service worker takes the page over once it is installed, and the app then loads the catalog through it.
Given('the editor has been open with the network', async ({ page }) => {
  const catalogKept = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/catalog' && response.fromServiceWorker(),
  )
  await openEditor(page)
  await catalogKept
})

When('the network is gone', async ({ context }) => {
  await context.setOffline(true)
})

When('I open the address {string}', async ({ page }, address: string) => {
  await page.goto(address)
})

Then("the page shows the server's JSON, not the app", async ({ page }) => {
  await expect(page.locator('body')).toContainText('"transformations"')
  await expect(search(page)).toHaveCount(0)
})
