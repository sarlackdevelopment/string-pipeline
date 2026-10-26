/**
 * The steps of working without the network (D56, D57). Playwright takes the browser offline and back; the service
 * worker runs only in the scenarios tagged @service-worker (support/test.ts).
 */
import { expect, type Page } from '@playwright/test'
import { openEditor, output, search } from '../support/editor'
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

// The inputs of the runs that could not reach the server since the network went.
const failedRuns = new WeakMap<Page, string[]>()

When('the network is gone', async ({ page, context }) => {
  const failed: string[] = []
  failedRuns.set(page, failed)
  page.on('requestfailed', (request) => {
    if (new URL(request.url()).pathname === '/api/runs') {
      failed.push((request.postDataJSON() as { input: string }).input)
    }
  })
  await context.setOffline(true)
})

When('the network is back', async ({ context }) => {
  await context.setOffline(false)
})

When('I open the address {string}', async ({ page }, address: string) => {
  await page.goto(address)
})

Then("the page shows the server's JSON, not the app", async ({ page }) => {
  await expect(page.locator('body')).toContainText('"transformations"')
  await expect(search(page)).toHaveCount(0)
})

// Sent, failed, and waiting: not a run still in the pause after an edit, which the network coming back would let pass.
Then('the run of {string} waits for the network', async ({ page }, input: string) => {
  await expect.poll(() => failedRuns.get(page)?.includes(input)).toBe(true)
  await expect(output(page)).toContainText('Waiting for the network')
})

Then('the output waits for the network', async ({ page }) => {
  await expect(output(page)).toContainText('Waiting for the network')
})
