/**
 * The steps of the notices at the bottom right (D55). The failures come from Playwright, which answers the app's runs
 * in place of the server.
 */
import { expect } from '@playwright/test'
import { notices } from '../support/editor'
import { Given, When, Then } from '../support/test'

Given('the server fails every run', async ({ page }) => {
  await page.route('**/api/runs', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/problem+json',
      body: JSON.stringify({
        title: 'Internal Server Error',
        status: 500,
        detail: 'Something went wrong on the server.',
      }),
    }),
  )
})

Given('the server cannot be reached for runs', async ({ page }) => {
  await page.route('**/api/runs', (route) => route.abort())
})

When('I point at the notices', async ({ page }) => {
  const box = await notices(page).first().boundingBox()
  if (box === null) {
    throw new Error('There is no notice to point at.')
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 })
})

Then('a notice says {string}', async ({ page }, text: string) => {
  await expect(notices(page).filter({ hasText: text })).toBeVisible()
})

Then('the notice is at the bottom right of the window', async ({ page }) => {
  const box = await notices(page).boundingBox()
  const window = page.viewportSize()
  if (box === null || window === null) {
    throw new Error('The notice or the window has no size.')
  }
  expect(window.width - (box.x + box.width)).toBeLessThan(40)
  expect(box.y).toBeGreaterThan(window.height / 2)
})

// The notice stays for 8 seconds after the last message that changed it.
Then('the notice goes away by itself', async ({ page }) => {
  await expect(notices(page)).toHaveCount(0, { timeout: 12_000 })
})

Then('{int} notices are stacked, the newest in front', async ({ page }, count: number) => {
  await expect(notices(page)).toHaveCount(count)
  const places = await notices(page).evaluateAll((items) =>
    items.map((item) => Number(item.style.getPropertyValue('--reka-toast-index'))),
  )
  expect(places.toSorted()).toEqual([...Array.from({ length: count }).keys()])
  // The newest came last; it is in front.
  expect(places.at(-1)).toBe(0)
})

Then('the notices spread out, one above the other', async ({ page }) => {
  await expect(async () => {
    const boxes = await notices(page).evaluateAll((items) =>
      items.map((item) => item.getBoundingClientRect().toJSON() as DOMRect),
    )
    const [first, second] = boxes.toSorted((a, b) => a.top - b.top)
    expect(first !== undefined && second !== undefined && first.bottom <= second.top).toBe(true)
  }).toPass()
})
