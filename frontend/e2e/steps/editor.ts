/**
 * The steps of building a chain. Elements are found by role and name; texts are read inside them.
 */
import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'
import {
  addStep,
  escapeForRegExp,
  field,
  openEditor,
  output,
  setField,
  step,
  typeInput,
} from '../support/editor'

const { Given, When, Then } = createBdd()

Given('the editor is open', async ({ page }) => {
  await openEditor(page)
})

When('I type {string} as the input', async ({ page }, text: string) => {
  await typeInput(page, text)
})

When('I add the step {string}', async ({ page }, name: string) => {
  await addStep(page, name)
})

When(
  'I set {string} to {string} in step {int}',
  async ({ page }, title: string, value: string, position: number) => {
    await setField(page, position, title, value)
  },
)

Then('step {int} shows {string}', async ({ page }, position: number, text: string) => {
  await expect(step(page, position).getByText(text, { exact: true })).toBeVisible()
})

Then(
  'step {int} says {string} at {string}',
  async ({ page }, position: number, message: string, title: string) => {
    const control = field(page, position, title)
    await expect(control).toHaveAttribute('aria-invalid', 'true')
    await expect(control).toHaveAccessibleDescription(new RegExp(escapeForRegExp(message)))
  },
)

Then('the output is {string}', async ({ page }, text: string) => {
  await expect(output(page).getByText(text, { exact: true })).toBeVisible()
})

Then('there is no output until every step has run', async ({ page }) => {
  await expect(output(page)).toContainText('The output appears once every step has run.')
})
