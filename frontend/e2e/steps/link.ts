/**
 * The steps of links: sharing a chain (D49), and the examples, which are links to chains too (D50).
 */
import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'
import { input, search, steps } from '../support/editor'

const { When, Then } = createBdd()

// A fresh page, not the same one: the link has to carry the whole chain on its own.
When('I copy the link to the chain and open it in a fresh page', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.getByRole('button', { name: 'Copy link' }).click()
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible()
  const link = await page.evaluate(() => navigator.clipboard.readText())
  await page.goto('about:blank')
  await page.goto(link)
  await expect(search(page)).toBeEnabled()
})

// The fragment holds the start of a chain's JSON, `{"input":`, and nothing more.
When('I open a link whose chain was cut off', async ({ page }) => {
  await page.goto('about:blank')
  await page.goto('/#chain=eyJpbnB1dCI6')
  await expect(search(page)).toBeEnabled()
})

When('I open the example {string}', async ({ page }, name: string) => {
  await page.getByRole('link', { name, exact: true }).click()
})

When('I go back', async ({ page }) => {
  await page.goBack()
})

Then('the address holds the chain', async ({ page }) => {
  await expect(page).toHaveURL(/#chain=/)
})

Then('the input is {string}', async ({ page }, text: string) => {
  await expect(input(page)).toHaveValue(text)
})

Then('the chain has no steps', async ({ page }) => {
  await expect(steps(page)).toHaveCount(0)
})

Then('the page says {string}', async ({ page }, text: string) => {
  await expect(page.getByRole('alert')).toContainText(text)
})
