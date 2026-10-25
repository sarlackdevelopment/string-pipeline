/**
 * The languages of the interface (D52): English, German and Russian. The app's own texts are here, in vue-i18n; the
 * transformations' texts come from the API, which every call asks for in the same language with Accept-Language.
 *
 * The reader's choice is kept in localStorage. Without one, the first of the browser's languages that the app speaks
 * decides, else English.
 */
import { createI18n } from 'vue-i18n'
import { de } from './de'
import { en, type Messages } from './en'
import { ru } from './ru'

export const LANGUAGE_STORAGE_KEY = 'string-pipeline-language'

export const Language = { en: 'en', de: 'de', ru: 'ru' } as const
export type Language = (typeof Language)[keyof typeof Language]

/** In the order the switcher lists them, each named in itself, so a reader finds theirs whatever the page is in. */
export const LANGUAGES: readonly { readonly code: Language; readonly name: string }[] = [
  { code: Language.en, name: 'English' },
  { code: Language.de, name: 'Deutsch' },
  { code: Language.ru, name: 'Русский' },
]

/** What models get to write a text: vue-i18n's `t`, with keys checked against the English texts. */
export type Translate = ReturnType<typeof createAppI18n>['global']['t']

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some((language) => language.code === value)
}

/** The first of `preferences`, such as `navigator.languages`, that the app speaks; `de-AT` counts as German. */
export function preferredLanguage(preferences: readonly string[]): Language {
  for (const tag of preferences) {
    const code = tag.split('-')[0]?.toLowerCase()
    if (isLanguage(code)) {
      return code
    }
  }
  return Language.en
}

/** The stored choice, else the browser's languages. */
export function initialLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (isLanguage(stored)) {
      return stored
    }
  } catch {
    // Storage is blocked, so there is no stored choice.
  }
  return preferredLanguage(navigator.languages)
}

export function storeLanguage(language: Language): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch {
    // Storage is blocked: the choice lasts as long as the page.
  }
}

const russianRules = new Intl.PluralRules('ru')
const russianForms: Partial<Record<Intl.LDMLPluralRule, number>> = { one: 0, few: 1, many: 2 }

/**
 * vue-i18n picks a plural form by its index. Russian has three: one (1, 21, 31…), few (2–4, 22–24…) and many (0,
 * 5–20, 25–30…), and `Intl.PluralRules` knows which is which from Unicode's CLDR data.
 */
export function russianPlural(count: number, forms: number): number {
  return Math.min(russianForms[russianRules.select(count)] ?? 2, forms - 1)
}

export function createAppI18n(language: Language) {
  return createI18n({
    legacy: false,
    locale: language,
    fallbackLocale: Language.en,
    messages: { en, de, ru },
    pluralRules: { ru: russianPlural },
  })
}

declare module 'vue-i18n' {
  // Checks the keys given to `t` against the English texts.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefineLocaleMessage extends Messages {}
}
