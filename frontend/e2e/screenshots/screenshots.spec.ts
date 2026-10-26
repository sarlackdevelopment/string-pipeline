/**
 * The screenshots in `docs/images`, taken from the running app: `npm run screenshots`. They show the brief's chain on
 * a desktop, a step with an error at phone width, the editor in a Windows contrast theme (D15), in the dark theme (D51)
 * and in German (D52).
 */
import { fileURLToPath, URL } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import {
  addStep,
  input,
  languageSelect,
  openEditor,
  output,
  runSummary,
  setField,
  typeInput,
} from '../support/editor'

const images = fileURLToPath(new URL('../../../docs/images/', import.meta.url))
// A laptop's window: wide enough for two columns of steps, and the header and footer stay in place (D53), so a
// picture of the whole page is a picture of the window.
const DESKTOP = { width: 1280, height: 800 }

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
  await page.setViewportSize(DESKTOP)
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
  await page.setViewportSize(DESKTOP)
  await page.emulateMedia({ colorScheme: 'dark' })
  await openEditor(page)
  await buildChainOfTheBrief(page)
  await settle(page)

  await page.screenshot({ path: `${images}editor-dark.png`, fullPage: true })
})

test('a Windows contrast theme', async ({ page }) => {
  await page.setViewportSize(DESKTOP)
  await page.emulateMedia({ forcedColors: 'active', colorScheme: 'dark' })
  await openEditor(page)
  await buildChainOfTheBrief(page)
  await settle(page)
  await input(page).focus()

  await page.screenshot({ path: `${images}editor-contrast.png`, fullPage: true })
})

// The brief's chain from its example, since the steps' names and fields are German too.
test('the editor in German', async ({ page }) => {
  await page.setViewportSize(DESKTOP)
  await openEditor(page)
  await languageSelect(page).selectOption({ label: 'Deutsch' })
  await page.getByRole('link', { name: 'Die Kette aus der Aufgabe', exact: true }).click()
  await expect(output(page).getByText('Real Python!', { exact: true })).toBeVisible()
  await expect(runSummary(page)).toHaveText('Alle 2 Schritte wurden ausgeführt.')
  await settle(page)

  await page.screenshot({ path: `${images}editor-de.png`, fullPage: true })
})
