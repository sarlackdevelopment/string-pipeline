import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  initialLanguage,
  Language,
  LANGUAGE_STORAGE_KEY,
  preferredLanguage,
  russianPlural,
  storeLanguage,
} from '@/i18n'
import { de } from '@/i18n/de'
import { en } from '@/i18n/en'
import { ru } from '@/i18n/ru'
import { translate } from '@/tests/helpers/i18n'

afterEach(() => {
  vi.restoreAllMocks()
})

function browserLanguages(languages: readonly string[]): void {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(languages)
}

function blocked(): never {
  throw new DOMException('Storage is blocked', 'SecurityError')
}

// Every text by its key, such as `app.tagline`. The keys are the same in every language, or the code would not
// compile; the values in a text are not checked by the compiler.
function texts(messages: object, prefix = ''): [string, string][] {
  return Object.entries(messages).flatMap(([key, value]): [string, string][] =>
    typeof value === 'string'
      ? [[`${prefix}${key}`, value]]
      : texts(value as object, `${prefix}${key}.`),
  )
}

function values(text: string | undefined): string[] {
  return [...new Set(text?.match(/\{\w+\}/g))].toSorted()
}

describe('the language of the interface (D52)', () => {
  it('is the first of the browser’s languages that the app speaks, a region counting as its language', () => {
    expect(preferredLanguage(['fr-FR', 'de-AT', 'en'])).toBe(Language.de)
    expect(preferredLanguage(['RU'])).toBe(Language.ru)
    expect(preferredLanguage(['fr', 'it'])).toBe(Language.en)
    expect(preferredLanguage([])).toBe(Language.en)
  })

  it('is the reader’s own choice once there is one, kept for the next visit', () => {
    browserLanguages(['de-DE'])
    expect(initialLanguage()).toBe(Language.de)

    storeLanguage(Language.ru)

    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('ru')
    expect(initialLanguage()).toBe(Language.ru)
  })

  it('ignores a stored value that is not one of its languages', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'tlh')
    browserLanguages(['ru-RU'])

    expect(initialLanguage()).toBe(Language.ru)
  })

  it('follows the browser where storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked)
    browserLanguages(['de'])

    expect(() => {
      storeLanguage(Language.ru)
    }).not.toThrow()
    expect(initialLanguage()).toBe(Language.de)
  })
})

describe('Russian plural forms (D52)', () => {
  it.each([
    [1, 0],
    [21, 0],
    [101, 0],
    [2, 1],
    [4, 1],
    [22, 1],
    [0, 2],
    [5, 2],
    [11, 2],
    [14, 2],
    [25, 2],
    [111, 2],
  ])('puts %i into form %i of one, few and many', (count, form) => {
    expect(russianPlural(count, 3)).toBe(form)
  })

  it('takes the last form a text has when it has fewer', () => {
    expect(russianPlural(5, 1)).toBe(0)
  })

  it('makes the noun agree with the count', () => {
    const t = translate(Language.ru)

    expect(t('picker.full', 1)).toBe('В цепочке может быть не больше 1 шага.')
    expect(t('picker.full', 3)).toBe('В цепочке может быть не больше 3 шагов.')
    expect(t('picker.full', 21)).toBe('В цепочке может быть не больше 21 шага.')
    expect(t('picker.full', 50)).toBe('В цепочке может быть не больше 50 шагов.')
  })
})

describe('the texts (D52)', () => {
  it.each([
    ['German', de],
    ['Russian', ru],
  ])('take the same values in %s as in English', (_, messages) => {
    const english = new Map(texts(en))

    for (const [key, text] of texts(messages)) {
      expect([key, values(text)]).toEqual([key, values(english.get(key))])
    }
  })
})
