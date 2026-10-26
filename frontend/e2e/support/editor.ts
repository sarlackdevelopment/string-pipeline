/**
 * The editor as the end-to-end tests see it: elements found by role and name, as assistive technology finds them.
 * The steps of the features and the screenshots share these helpers.
 *
 * The names come from the app's own texts in every language it speaks (D52), so a helper finds its element whatever
 * language the page is in; a feature names what it expects to read in the language it chose.
 */
import { expect, type Locator, type Page } from '@playwright/test'
import { de } from '../../src/i18n/de'
import { en, type Messages } from '../../src/i18n/en'
import { ru } from '../../src/i18n/ru'

export const escapeForRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const languages: readonly Messages[] = [en, de, ru]

/** One of the app's texts in any of its languages, with `{number}` filled in, as a pattern that matches it whole. */
function inAnyLanguage(text: (messages: Messages) => string, number?: number): RegExp {
  const texts = languages.map((messages) =>
    escapeForRegExp(text(messages).replace('{number}', String(number))),
  )
  return new RegExp(`^(?:${texts.join('|')})$`)
}

// The start of a step's legend, up to the transformation's name: "Step 2: ", "Schritt 2: ", "Шаг 2: ". `number` is a
// number, or a pattern such as \d+.
function stepLegend(number: string): string {
  const starts = languages.map((messages) => {
    const [before = '', after = ''] = (messages.step.legend.split('{name}')[0] ?? '').split(
      '{number}',
    )
    return `${escapeForRegExp(before)}${number}${escapeForRegExp(after)}`
  })
  return `^(?:${starts.join('|')})`
}

export const search = (page: Page): Locator =>
  page.getByRole('combobox', { name: inAnyLanguage((messages) => messages.picker.label) })

export const step = (page: Page, position: number): Locator =>
  page.getByRole('group', { name: new RegExp(stepLegend(String(position))) })

/** Every step of the chain. */
export const steps = (page: Page): Locator =>
  page.getByRole('group', { name: new RegExp(stepLegend('\\d+')) })

// A parameter is a text field or a number field, both named by the parameter's title.
export const field = (page: Page, position: number, title: string): Locator =>
  step(page, position)
    .getByRole('textbox', { name: title, exact: true })
    .or(step(page, position).getByRole('spinbutton', { name: title, exact: true }))

/** The switch that turns a step on and off (D48). */
export const runSwitch = (page: Page, position: number): Locator =>
  step(page, position).getByRole('switch', {
    name: inAnyLanguage((messages) => messages.step.run, position),
  })

/** One option of the theme in the header (D51). */
export const themeOption = (page: Page, name: string): Locator =>
  page
    .getByRole('radiogroup', { name: inAnyLanguage((messages) => messages.theme.label) })
    .getByRole('radio', { name, exact: true })

/** The language in the header (D52): its options are named in themselves, whatever the page is in. */
export const languageSelect = (page: Page): Locator =>
  page.getByRole('combobox', { name: inAnyLanguage((messages) => messages.language.label) })

export const input = (page: Page): Locator =>
  page.getByRole('textbox', { name: inAnyLanguage((messages) => messages.input.label) })

export const output = (page: Page): Locator =>
  page.getByRole('region', { name: inAnyLanguage((messages) => messages.output.label) })

export const runSummary = (page: Page): Locator =>
  page.getByRole('status', { name: inAnyLanguage((messages) => messages.output.summary) })

export async function openEditor(page: Page): Promise<void> {
  await page.goto('/')
  await expect(search(page)).toBeEnabled()
}

export async function typeInput(page: Page, text: string): Promise<void> {
  await input(page).fill(text)
}

// An option is named by the transformation's name followed by its description.
export async function addStep(page: Page, name: string): Promise<void> {
  const added = await nextStep(page, name)
  await search(page).fill(name)
  await page.getByRole('option', { name: new RegExp(`^${escapeForRegExp(name)} `) }).click()
  await expect(added).toBeVisible()
}

/**
 * Drags step `from` by its handle onto step `to`, as a mouse does (D54). It lets go over the top left quarter of the
 * other step, so the dragged one lands in front of it, in one column or in two.
 */
export async function dragStep(page: Page, from: number, to: number): Promise<void> {
  const target = step(page, to)
  const box = await target.boundingBox()
  if (box === null) {
    throw new Error(`Step ${String(to)} is not on the page.`)
  }
  await step(page, from)
    .locator('[data-drag-handle]')
    .dragTo(target, { targetPosition: { x: box.width / 4, y: box.height / 4 } })
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
  const count = await steps(page).count()
  return page.getByRole('group', {
    name: new RegExp(`${stepLegend(String(count + 1))}${escapeForRegExp(name)}$`),
  })
}
