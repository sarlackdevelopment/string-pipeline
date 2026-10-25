import userEvent from '@testing-library/user-event'
import { render, screen, within } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import { LANGUAGE_STORAGE_KEY } from '@/i18n'

describe('LanguageSwitcher (D52)', () => {
  it('names each language in itself, so a reader finds theirs whatever the page is in', () => {
    render(LanguageSwitcher)

    const select = screen.getByRole('combobox', { name: 'Language' })
    expect(
      within(select)
        .getAllByRole('option')
        .map((option) => [option.textContent.trim(), option.getAttribute('lang')]),
    ).toEqual([
      ['English', 'en'],
      ['Deutsch', 'de'],
      ['Русский', 'ru'],
    ])
    expect(select).toHaveValue('en')
  })

  it('switches the texts to the chosen language and keeps the choice', async () => {
    const user = userEvent.setup()
    render(LanguageSwitcher)

    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'Deutsch')

    expect(screen.getByRole('combobox', { name: 'Sprache' })).toHaveValue('de')
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('de')
  })
})
