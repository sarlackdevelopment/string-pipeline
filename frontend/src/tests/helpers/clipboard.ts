/**
 * The clipboard in jsdom, for the buttons that copy (D32, D49).
 *
 * VueUse copies through the Clipboard API only where `clipboard-write` is granted, and falls back to
 * `document.execCommand` elsewhere. jsdom has neither the Permissions API nor ClipboardItem nor execCommand, so a test
 * grants the permission and gets ClipboardItem from here; user-event provides the clipboard, which the test reads
 * back with `navigator.clipboard.readText()`.
 */
import { onTestFinished, vi } from 'vitest'

/** jsdom's stand-in for the browser's ClipboardItem, read back by user-event's clipboard. */
class ClipboardItemStub {
  readonly #data: Readonly<Record<string, string>>

  constructor(data: Readonly<Record<string, string>>) {
    this.#data = data
  }

  get types(): string[] {
    return Object.keys(this.#data)
  }

  getType(type: string): Promise<Blob> {
    return Promise.resolve(new Blob([this.#data[type] ?? ''], { type }))
  }
}

/** Grants `clipboard-write` until the end of the test. */
export function grantClipboardWrite(): void {
  vi.stubGlobal('ClipboardItem', ClipboardItemStub)
  const granted = Object.assign(new EventTarget(), { state: 'granted' })
  Object.defineProperty(navigator, 'permissions', {
    configurable: true,
    value: { query: () => Promise.resolve(granted) },
  })
  onTestFinished(() => {
    vi.unstubAllGlobals()
    Reflect.deleteProperty(navigator, 'permissions')
  })
}
