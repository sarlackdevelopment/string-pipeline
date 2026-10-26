/**
 * The steps of the layout (D53): what stays in view while the chain scrolls, and the header in every language.
 */
import { expect, type Page } from '@playwright/test'
import { createBdd } from 'playwright-bdd'
import { addStep, languageSelect, output, search, step } from '../support/editor'

const { Given, When, Then } = createBdd()

/** How far the page itself scrolls; 0 when it is as high as the window. */
async function pageOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
}

Given('a window of {int} by {int} pixels', async ({ page }, width: number, height: number) => {
  await page.setViewportSize({ width, height })
})

When('I add the step {string} {int} times', async ({ page }, name: string, times: number) => {
  for (let count = 0; count < times; count += 1) {
    await addStep(page, name)
  }
})

When('I scroll to the output', async ({ page }) => {
  await output(page).scrollIntoViewIfNeeded()
})

Then('step {int} is out of view', async ({ page }, position: number) => {
  await expect(step(page, position)).not.toBeInViewport()
})

Then('the header and the search for steps are in view', async ({ page }) => {
  await expect(page.getByRole('banner')).toBeInViewport({ ratio: 1 })
  await expect(search(page)).toBeInViewport({ ratio: 1 })
})

Then('the page itself does not scroll', async ({ page }) => {
  expect(await pageOverflow(page)).toBe(0)
})

Then('the page itself scrolls', async ({ page }) => {
  expect(await pageOverflow(page)).toBeGreaterThan(0)
})

// The height of the header and the row of its settings; the settings may be wider in one language than another.
Then('the header is the same in English, German and Russian', async ({ page }) => {
  const layouts: { height: number; settingsTop: number }[] = []
  for (const [name, code] of [
    ['English', 'en'],
    ['Deutsch', 'de'],
    ['Русский', 'ru'],
  ] as const) {
    await languageSelect(page).selectOption({ label: name })
    await expect(page.locator('html')).toHaveAttribute('lang', code)
    const header = await page.getByRole('banner').boundingBox()
    const settings = await languageSelect(page).boundingBox()
    layouts.push({
      height: Math.round(header?.height ?? 0),
      settingsTop: Math.round(settings?.y ?? 0),
    })
  }
  expect(layouts).toEqual([layouts[0], layouts[0], layouts[0]])
})
