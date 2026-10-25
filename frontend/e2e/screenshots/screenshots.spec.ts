/**
 * The screenshots in `docs/images`, taken from the running app: `npm run screenshots`. They show the brief's chain on
 * a desktop, a step with an error at phone width, the editor in a Windows contrast theme (D15) and in the dark theme
 * (D51).
 */
import { fileURLToPath, URL } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { addStep, openEditor, output, runSummary, setField, typeInput } from '../support/editor'

const images = fileURLToPath(new URL('../../../docs/images/', import.meta.url))

async function buildChainOfTheBrief(page: Page): Promise<void> {
  await typeInput(page, 'Fake Python')
  await addStep(page, 'Replace')
  await setField(page, 1, 'Find', 'Fake')
  await setField(page, 1, 'Replace with', 'Real')
  await addStep(page, 'Append')
  await setField(page, 2, 'Text', '!')
  await expect(output(page).getByText('Real Python!', { exact: true })).toBeVisible()
  await expect(runSummary(page)).toHaveText('All 2 steps ran.')
}

async function settle(page: Page): Promise<void> {
  // No caret, no focus ring and no half-finished animation in the pictures.
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  })
  await page.waitForTimeout(400)
}

test('the chain of the brief', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 900 })
  await openEditor(page)
  await buildChainOfTheBrief(page)
  await settle(page)

  await page.screenshot({ path: `${images}editor.png`, fullPage: true })
})

test('a step with an error, at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openEditor(page)
  await typeInput(page, 'Price: 5 EUR')
  await addStep(page, 'Regex replace')
  await setField(page, 1, 'Pattern', '(\\d+')
  await expect(runSummary(page)).toHaveText('Step 1, Regex replace, has an invalid value.')
  await settle(page)

  await page.screenshot({ path: `${images}editor-phone.png`, fullPage: true })
})

test('the dark theme', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 900 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await openEditor(page)
  await buildChainOfTheBrief(page)
  await settle(page)

  await page.screenshot({ path: `${images}editor-dark.png`, fullPage: true })
})

test('a Windows contrast theme', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 900 })
  await page.emulateMedia({ forcedColors: 'active', colorScheme: 'dark' })
  await openEditor(page)
  await buildChainOfTheBrief(page)
  await settle(page)
  await page.getByRole('textbox', { name: 'Input' }).focus()

  await page.screenshot({ path: `${images}editor-contrast.png`, fullPage: true })
})
