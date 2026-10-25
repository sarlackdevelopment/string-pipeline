/**
 * The interface's language (D52). Setting it switches the app's own texts at once, and the catalog and the run follow
 * with a call in the new language; the choice is stored for the next visit.
 */
import { computed, type WritableComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { isLanguage, Language, storeLanguage } from '@/i18n'

export function useLanguage(): WritableComputedRef<Language> {
  const { locale } = useI18n()
  return computed({
    get: () => (isLanguage(locale.value) ? locale.value : Language.en),
    set: (language) => {
      locale.value = language
      storeLanguage(language)
    },
  })
}
