/**
 * The steps of the interface's language (D52).
 */
import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'
import { escapeForRegExp, languageSelect, search } from '../support/editor'

const { Given, When, Then } = createBdd()

// The app reads the browser's languages as it starts, so they are set before the page loads.
Given('the browser prefers German', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'languages', { get: () => ['de-DE', 'de', 'en'] })
  })
})

When('I choose the language {string}', async ({ page }, name: string) => {
  await languageSelect(page).selectOption({ label: name })
})

Then('the language {string} is chosen', async ({ page }, name: string) => {
  await expect(languageSelect(page).locator('option:checked')).toHaveText(name)
})

Then('the page is marked as {string}', async ({ page }, language: string) => {
  await expect(page.locator('html')).toHaveAttribute('lang', language)
})

Then('the search for steps is called {string}', async ({ page }, name: string) => {
  await expect(search(page)).toHaveAccessibleName(name)
})

When('I search the steps for {string}', async ({ page }, text: string) => {
  await search(page).fill(text)
})

// The transformations' names come from the server, in the language the app asked for.
Then('the search offers {string}', async ({ page }, name: string) => {
  await expect(
    page.getByRole('option', { name: new RegExp(`^${escapeForRegExp(name)} `) }),
  ).toBeVisible()
})
