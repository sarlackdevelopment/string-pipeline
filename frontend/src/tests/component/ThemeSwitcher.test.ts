import userEvent from '@testing-library/user-event'
import { render, screen, waitFor, within } from '@testing-library/vue'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import { THEME_STORAGE_KEY } from '@/composables/useTheme'

const page = document.documentElement
const radio = (name: string) => screen.getByRole('radio', { name })

/** A system that prefers a dark theme. jsdom has no `matchMedia` of its own. */
function preferDark(): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(prefers-color-scheme: dark)',
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }))
  onTestFinished(() => {
    vi.unstubAllGlobals()
  })
}

describe('ThemeSwitcher (D51)', () => {
  it('offers light, dark and the system theme as a radio group, with the system theme chosen at first', () => {
    render(ThemeSwitcher)

    const group = screen.getByRole('radiogroup', { name: 'Theme' })
    expect(
      within(group)
        .getAllByRole('radio')
        .map((each) => each.textContent.trim()),
    ).toEqual(['Light', 'Dark', 'System'])
    expect(radio('System')).toBeChecked()
  })

  it('switches the page to the chosen theme and keeps the choice', async () => {
    const user = userEvent.setup()
    render(ThemeSwitcher)

    await user.click(radio('Dark'))

    await waitFor(() => expect(page).toHaveClass('dark'))
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    await user.click(radio('Light'))
    await waitFor(() => expect(page).toHaveClass('light'))
    expect(page).not.toHaveClass('dark')
  })

  it('follows the system while the system theme is chosen', async () => {
    preferDark()

    render(ThemeSwitcher)

    await waitFor(() => expect(page).toHaveClass('dark'))
    expect(radio('System')).toBeChecked()
  })

  it('starts from the choice it kept', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')

    render(ThemeSwitcher)

    expect(radio('Dark')).toBeChecked()
  })

  it('is one stop of the Tab key, and the arrow keys move the choice', async () => {
    const user = userEvent.setup()
    render(ThemeSwitcher)

    await user.tab()
    expect(radio('System')).toHaveFocus()
    // Reka UI checks the radio an arrow key moved the focus to if the key is still down a moment later, as it is when
    // a person presses it. user-event lets go at once, so the key is held here.
    await user.keyboard('{ArrowLeft>}')

    await waitFor(() => expect(radio('Dark')).toBeChecked())
    await user.keyboard('{/ArrowLeft}')
    expect(radio('Dark')).toHaveFocus()
    await user.tab()
    expect(document.body).toHaveFocus()
  })
})
