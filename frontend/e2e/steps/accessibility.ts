/**
 * The steps of using the editor with a keyboard or a screen reader (D15).
 */
import AxeBuilder from '@axe-core/playwright'
import { expect } from '@playwright/test'
import {
  addStepWithKeyboard,
  field,
  input,
  languageSelect,
  runSummary,
  runSwitch,
  search,
  themeOption,
} from '../support/editor'
import { Given, When, Then } from '../support/test'

Given('the page uses forced colours', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' })
})

Given('the system asks for reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
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

When('I press Escape', async ({ page }) => {
  await page.keyboard.press('Escape')
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

Then('the language has the focus and a visible outline', async ({ page }) => {
  const select = languageSelect(page)
  await expect(select).toBeFocused()
  const outline = await select.evaluate((element) => getComputedStyle(element).outlineStyle)
  expect(outline).not.toBe('none')
})

Then('the theme {string} has the focus and a visible outline', async ({ page }, name: string) => {
  const option = themeOption(page, name)
  await expect(option).toBeFocused()
  const outline = await option.evaluate((element) => getComputedStyle(element).outlineStyle)
  expect(outline).not.toBe('none')
})

// A contrast theme repaints every background that is not a system colour, which would hide the chosen option. Telling
// the backgrounds apart is not enough: a button gets the colour of buttons, the others stay transparent, and both can
// look like the page. So the chosen option has to be filled with the theme's own Highlight colour, with its label in
// HighlightText. And it has to opt out of the theme's adjustments: the theme draws a backplate in the colour of the page
// behind all text, which hid the label once.
Then('the chosen theme is filled with the highlight colour', async ({ page }) => {
  const look = await themeOption(page, 'System').evaluate((element) => {
    const probe = document.createElement('div')
    probe.style.backgroundColor = 'Highlight'
    probe.style.color = 'HighlightText'
    document.body.append(probe)
    const [chosen, system] = [getComputedStyle(element), getComputedStyle(probe)]
    const result = {
      fill: chosen.backgroundColor === system.backgroundColor,
      label: chosen.color === system.color,
      adjust: chosen.forcedColorAdjust,
    }
    probe.remove()
    return result
  })
  expect(look).toEqual({ fill: true, label: true, adjust: 'none' })
})

// A spinner of the page's own kind, added for the check: none may be on screen when the check runs.
Then('a spinner stands still', async ({ page }) => {
  const animation = await page.evaluate(() => {
    const spinner = document.createElement('div')
    spinner.className = 'animate-spin'
    document.body.append(spinner)
    const style = getComputedStyle(spinner)
    const result = { duration: style.animationDuration, count: style.animationIterationCount }
    spinner.remove()
    return result
  })
  expect(parseFloat(animation.duration)).toBeLessThan(0.001)
  expect(animation.count).toBe('1')
})

// A contrast theme paints every background in the colour of the page, unless it is a system colour. The thumb of the
// switch carries its state, so it must not vanish into the card behind it.
Then('the switch of step {int} shows that the step is off', async ({ page }, position: number) => {
  const toggle = runSwitch(page, position)
  await expect(toggle).not.toBeChecked()
  const colours = await toggle.evaluate((element) => {
    const thumb = element.querySelector('[data-slot="switch-thumb"]')
    const card = element.closest('fieldset')
    return thumb === null || card === null
      ? null
      : {
          thumb: getComputedStyle(thumb).backgroundColor,
          card: getComputedStyle(card).backgroundColor,
        }
  })
  expect(colours).not.toBeNull()
  expect(colours?.thumb).not.toBe(colours?.card)
})

// A violation names the elements it found, so a failure says where to look.
Then('axe finds no accessibility violations', async ({ page }) => {
  const { violations } = await new AxeBuilder({ page }).analyze()
  expect(
    violations.map(
      (violation) =>
        `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.html).join(', ')})`,
    ),
  ).toEqual([])
})

Then('{string} has the focus and a visible outline', async ({ page }, name: string) => {
  const control = page.getByRole('textbox', { name, exact: true })
  await expect(control).toBeFocused()
  const outline = await control.evaluate((element) => getComputedStyle(element).outlineStyle)
  expect(outline).not.toBe('none')
})

// A control shows its focus with an outline or a ring (a box shadow), on itself or on the input group around it. No
// control here has a shadow while it is not focused, so a shadow means a ring. The walk starts at the first stop of the
// page, the language in the header, before the chosen theme. It is reached from the input with Shift+Tab: browsers
// show the focus of a control that a script focuses only after keyboard use, and the scenario used the mouse last.
Then('every stop of the Tab key shows where the focus is', async ({ page }) => {
  await input(page).focus()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Shift+Tab')
  const unmarked: string[] = []
  for (let stop = 0; stop < 60; stop += 1) {
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
        (element instanceof HTMLInputElement || element instanceof HTMLSelectElement
          ? element.labels?.[0]?.textContent
          : null) ??
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
