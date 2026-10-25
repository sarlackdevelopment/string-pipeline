/**
 * The app's texts for tests of models (D52): vue-i18n's `t` for one language, as a component would hand it on.
 */
import { createAppI18n, Language, type Translate } from '@/i18n'

export function translate(language: Language = Language.en): Translate {
  return createAppI18n(language).global.t
}
