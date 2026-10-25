/**
 * The steps of using the editor with a keyboard or a screen reader (D15).
 */
import AxeBuilder from '@axe-core/playwright'
import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'
import { addStepWithKeyboard, field, runSummary, search } from '../support/editor'

const { Given, When, Then } = createBdd()

Given('the page uses forced colours', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' })
})

When('I pick the step {string} with the keyboard', async ({ page }, name: string) => {
  await addStepWithKeyboard(page, name)
})

When('I open the list of transformations', async ({ page }) => {
  await search(page).click()
  await expect(page.getByRole('listbox')).toBeVisible()
})

When('I press Tab', async ({ page }) => {
  await page.keyboard.press('Tab')
})

Then(
  'the focus is in {string} of step {int}',
  async ({ page }, title: string, position: number) => {
    await expect(field(page, position, title)).toBeFocused()
  },
)

Then('the run summary says {string}', async ({ page }, text: string) => {
  await expect(runSummary(page)).toHaveText(text)
})

Then('axe finds no accessibility violations', async ({ page }) => {
  const { violations } = await new AxeBuilder({ page }).analyze()
  expect(violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([])
})

Then('{string} has the focus and a visible outline', async ({ page }, name: string) => {
  const control = page.getByRole('textbox', { name, exact: true })
  await expect(control).toBeFocused()
  const outline = await control.evaluate((element) => getComputedStyle(element).outlineStyle)
  expect(outline).not.toBe('none')
})

// A control shows its focus with an outline or a ring (a box shadow), on itself or on the input group around it. No
// control here has a shadow while it is not focused, so a shadow means a ring.
Then('every stop of the Tab key shows where the focus is', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Input' }).focus()
  const unmarked: string[] = []
  for (let stop = 0; stop < 50; stop += 1) {
    const focused = await page.evaluate(() => {
      const element = document.activeElement
      if (!(element instanceof HTMLElement) || element === document.body) {
        return null
      }
      const marked = [element, element.closest('[data-slot="input-group"]')].some((node) => {
        if (node === null) {
          return false
        }
        const style = getComputedStyle(node)
        return style.outlineStyle !== 'none' || style.boxShadow !== 'none'
      })
      const label =
        element.getAttribute('aria-label') ??
        (element instanceof HTMLInputElement ? element.labels?.[0]?.textContent : null) ??
        element.textContent
      return { label: label.trim(), marked }
    })
    if (focused === null) {
      break
    }
    if (!focused.marked) {
      unmarked.push(focused.label)
    }
    await page.keyboard.press('Tab')
  }
  expect(unmarked).toEqual([])
})
