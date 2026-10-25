/**
 * The steps of the features. Elements are found by role and name, as assistive technology finds them; texts are read
 * inside those elements.
 */
import { expect, type Page } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

const { Given, When, Then } = createBdd()

const escapeForRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const search = (page: Page) => page.getByRole('combobox', { name: 'Add a step' })

const step = (page: Page, position: number) =>
  page.getByRole('group', { name: new RegExp(`^Step ${String(position)}: `) })

// A parameter is a text field or a number field, both named by the parameter's title.
const field = (page: Page, position: number, title: string) =>
  step(page, position)
    .getByRole('textbox', { name: title, exact: true })
    .or(step(page, position).getByRole('spinbutton', { name: title, exact: true }))

const output = (page: Page) => page.getByRole('region', { name: 'Output' })

Given('the editor is open', async ({ page }) => {
  await page.goto('/')
  await expect(search(page)).toBeEnabled()
})

When('I type {string} as the input', async ({ page }, text: string) => {
  await page.getByRole('textbox', { name: 'Input' }).fill(text)
})

// An option is named by the transformation's name followed by its description.
When('I add the step {string}', async ({ page }, name: string) => {
  const steps = await page.getByRole('group', { name: /^Step \d+: / }).count()
  await search(page).fill(name)
  await page.getByRole('option', { name: new RegExp(`^${escapeForRegExp(name)} `) }).click()
  await expect(
    page.getByRole('group', { name: `Step ${String(steps + 1)}: ${name}`, exact: true }),
  ).toBeVisible()
})

When(
  'I set {string} to {string} in step {int}',
  async ({ page }, title: string, value: string, position: number) => {
    await field(page, position, title).fill(value)
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
