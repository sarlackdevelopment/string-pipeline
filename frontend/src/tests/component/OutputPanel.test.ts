import userEvent from '@testing-library/user-event'
import { render, screen, waitFor, within } from '@testing-library/vue'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import OutputPanel from '@/components/OutputPanel.vue'
import type { RunResult } from '@/model/run'

const result = (output: string | null): RunResult => ({ steps: new Map(), output })

function renderPanel(props: { result?: RunResult; isUpdating?: boolean } = {}) {
  render(OutputPanel, { props: { result: props.result, isUpdating: props.isUpdating ?? false } })
  return screen.getByRole('region', { name: 'Output' })
}

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

// VueUse copies through the Clipboard API only where `clipboard-write` is granted, and falls back to
// `document.execCommand` elsewhere. jsdom has neither the Permissions API nor ClipboardItem nor execCommand, so the
// test grants the permission and provides ClipboardItem; user-event provides the clipboard.
function grantClipboardWrite(): void {
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

describe('OutputPanel (D13, D32)', () => {
  it('shows the output of the chain', () => {
    const panel = renderPanel({ result: result('Real Python!') })

    expect(within(panel).getByText('Real Python!')).toBeInTheDocument()
  })

  it('marks an empty output, and has nothing to copy', () => {
    const panel = renderPanel({ result: result('') })

    expect(within(panel).getByText('Empty text')).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: 'Copy' })).toBeDisabled()
  })

  it('says that there is no output before the first result', () => {
    const panel = renderPanel()

    expect(panel).toHaveTextContent('No output yet.')
    expect(within(panel).getByRole('button', { name: 'Copy' })).toBeDisabled()
  })

  it('says when the output waits for steps that did not run', () => {
    const panel = renderPanel({ result: result(null) })

    expect(panel).toHaveTextContent('The output appears once every step has run.')
  })

  it('marks the output while the next run is on its way', () => {
    const panel = renderPanel({ result: result('Real Python!'), isUpdating: true })

    expect(panel).toHaveTextContent('Updating')
    expect(within(panel).getByText('Real Python!')).toBeInTheDocument()
  })

  it('copies the output and says so', async () => {
    grantClipboardWrite()
    const user = userEvent.setup()
    const panel = renderPanel({ result: result('Real Python!') })

    await user.click(within(panel).getByRole('button', { name: 'Copy' }))

    await waitFor(() =>
      expect(within(panel).getByRole('button', { name: 'Copied' })).toBeInTheDocument(),
    )
    expect(await navigator.clipboard.readText()).toBe('Real Python!')
  })
})
