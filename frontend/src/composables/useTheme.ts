/**
 * The theme (D51): light, dark, or the system's, which follows `prefers-color-scheme`. VueUse keeps the choice in
 * localStorage and puts `light` or `dark` on <html>, which the colour tokens follow. Where storage is blocked, VueUse
 * catches the error, and the choice lasts as long as the page.
 */
import { useColorMode } from '@vueuse/core'

/** Read by the script in index.html, which applies the theme before the first paint. */
export const THEME_STORAGE_KEY = 'string-pipeline-theme'

export const Theme = { light: 'light', dark: 'dark', system: 'auto' } as const
export type Theme = (typeof Theme)[keyof typeof Theme]

/** The chosen theme. Setting it switches the page and stores the choice. */
export function useTheme() {
  return useColorMode({ storageKey: THEME_STORAGE_KEY }).store
}
