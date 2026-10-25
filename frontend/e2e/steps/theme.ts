/**
 * The steps of choosing a theme (D51).
 */
import { expect, type Page } from '@playwright/test'
import { createBdd } from 'playwright-bdd'
import { search, themeOption } from '../support/editor'

const { Given, When, Then } = createBdd()

const linear = (byte: number): number => {
  const channel = byte / 255
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

/**
 * The relative luminance of the page's background, from 0 for black to 1 for white. Chromium gives the computed colour
 * in OKLCH, as the tokens define it, so a canvas turns it into sRGB first.
 */
async function backgroundLuminance(page: Page): Promise<number> {
  const [red = 0, green = 0, blue = 0] = await page.evaluate(() => {
    const context = document.createElement('canvas').getContext('2d')
    if (context === null) {
      return []
    }
    context.fillStyle = getComputedStyle(document.body).backgroundColor
    context.fillRect(0, 0, 1, 1)
    const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data
    return [r, g, b]
  })
  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue)
}

Given('the system prefers a dark theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
})

When('I choose the theme {string}', async ({ page }, name: string) => {
  await themeOption(page, name).click()
})

When('I reload the page', async ({ page }) => {
  await page.reload()
  await expect(search(page)).toBeEnabled()
})

// A person holds a key for a moment, and Reka UI checks the radio that an arrow key moved the focus to while it is down.
When('I press the left arrow key', async ({ page }) => {
  await page.keyboard.press('ArrowLeft', { delay: 50 })
})

Then('the theme {string} is chosen', async ({ page }, name: string) => {
  await expect(themeOption(page, name)).toBeChecked()
})

Then('the editor is dark', async ({ page }) => {
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  expect(await backgroundLuminance(page)).toBeLessThan(0.1)
})

Then('the editor is light', async ({ page }) => {
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
  expect(await backgroundLuminance(page)).toBeGreaterThan(0.8)
})

// With the app's own scripts blocked, only the small script in index.html can have chosen the theme: the page is dark
// from its first paint, and does not flash white while the app loads.
Then('the page is dark before the app runs', async ({ page }) => {
  const appScripts = /\/assets\/[^/]+\.js$/
  await page.route(appScripts, (route) => route.abort())
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  expect(await backgroundLuminance(page)).toBeLessThan(0.1)
  await page.unroute(appScripts)
})
