/**
 * The steps of the layout (D53): what stays in view while the chain scrolls, and the header in every language.
 */
import { expect, type Page } from '@playwright/test'
import { addStep, input, languageSelect, output, search, step } from '../support/editor'
import { Given, When, Then } from '../support/test'

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

When('I scroll to step {int}', async ({ page }, position: number) => {
  await step(page, position).scrollIntoViewIfNeeded()
})

Then('step {int} is out of view', async ({ page }, position: number) => {
  await expect(step(page, position)).not.toBeInViewport()
})

Then('the header, the input, the search for steps and the output are in view', async ({ page }) => {
  for (const part of [page.getByRole('banner'), input(page), search(page), output(page)]) {
    await expect(part).toBeInViewport({ ratio: 1 })
  }
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
