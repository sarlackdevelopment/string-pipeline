// @vitest-environment node
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
import { THEME_STORAGE_KEY } from '@/composables/useTheme'

// The script in index.html that applies the theme before the first paint (D51), run on its own with a stand-in page.
const html = readFileSync(new URL('../../../index.html', import.meta.url), 'utf8')
const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? ''

interface Situation {
  readonly stored?: string | null
  readonly systemDark?: boolean
  readonly storageThrows?: boolean
}

/** Runs the script and returns the classes it put on <html>. */
function classesAfter({
  stored = null,
  systemDark = false,
  storageThrows = false,
}: Situation): string[] {
  const classes: string[] = []
  runInNewContext(script, {
    localStorage: {
      getItem: (key: string) => {
        if (storageThrows) {
          throw new Error('The storage is blocked.')
        }
        return key === THEME_STORAGE_KEY ? stored : null
      },
    },
    matchMedia: (query: string) => ({
      matches: systemDark && query === '(prefers-color-scheme: dark)',
    }),
    document: { documentElement: { classList: { add: (name: string) => classes.push(name) } } },
  })
  return classes
}

describe('the theme before the first paint (D51)', () => {
  it('reads the key that the app stores the choice under', () => {
    expect(script).toContain(`'${THEME_STORAGE_KEY}'`)
  })

  it.each<[string, Situation, string[]]>([
    ['a stored dark theme', { stored: 'dark' }, ['dark']],
    ['a stored light theme on a dark system', { stored: 'light', systemDark: true }, ['light']],
    ['the system theme on a dark system', { stored: 'auto', systemDark: true }, ['dark']],
    ['no choice yet on a light system', {}, ['light']],
    ['no choice yet on a dark system', { systemDark: true }, ['dark']],
  ])('applies %s', (_, situation, expected) => {
    expect(classesAfter(situation)).toEqual(expected)
  })

  it('leaves the choice to the app when the storage cannot be read', () => {
    expect(classesAfter({ storageThrows: true })).toEqual([])
  })
})
