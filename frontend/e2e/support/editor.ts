/**
 * The editor as the end-to-end tests see it: elements found by role and name, as assistive technology finds them.
 * The steps of the features and the screenshots share these helpers.
 */
import { expect, type Locator, type Page } from '@playwright/test'

export const escapeForRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const search = (page: Page): Locator => page.getByRole('combobox', { name: 'Add a step' })

export const step = (page: Page, position: number): Locator =>
  page.getByRole('group', { name: new RegExp(`^Step ${String(position)}: `) })

// A parameter is a text field or a number field, both named by the parameter's title.
export const field = (page: Page, position: number, title: string): Locator =>
  step(page, position)
    .getByRole('textbox', { name: title, exact: true })
    .or(step(page, position).getByRole('spinbutton', { name: title, exact: true }))

export const output = (page: Page): Locator => page.getByRole('region', { name: 'Output' })

export const runSummary = (page: Page): Locator => page.getByRole('status', { name: 'Run summary' })

export async function openEditor(page: Page): Promise<void> {
  await page.goto('/')
  await expect(search(page)).toBeEnabled()
}

export async function typeInput(page: Page, text: string): Promise<void> {
  await page.getByRole('textbox', { name: 'Input' }).fill(text)
}

// An option is named by the transformation's name followed by its description.
export async function addStep(page: Page, name: string): Promise<void> {
  const added = await nextStep(page, name)
  await search(page).fill(name)
  await page.getByRole('option', { name: new RegExp(`^${escapeForRegExp(name)} `) }).click()
  await expect(added).toBeVisible()
}

/** Adds a step as a keyboard user does: type the name, then Enter picks the first match. */
export async function addStepWithKeyboard(page: Page, name: string): Promise<void> {
  const added = await nextStep(page, name)
  await search(page).fill(name)
  await search(page).press('Enter')
  await expect(added).toBeVisible()
}

export async function setField(
  page: Page,
  position: number,
  title: string,
  value: string,
): Promise<void> {
  await field(page, position, title).fill(value)
}

async function nextStep(page: Page, name: string): Promise<Locator> {
  const count = await page.getByRole('group', { name: /^Step \d+: / }).count()
  return page.getByRole('group', { name: `Step ${String(count + 1)}: ${name}`, exact: true })
}
