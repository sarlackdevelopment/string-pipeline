import userEvent from '@testing-library/user-event'
import { render, screen, waitFor, within } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import OutputPanel from '@/components/OutputPanel.vue'
import type { RunResult } from '@/model/run'
import { grantClipboardWrite } from '@/tests/helpers/clipboard'

const result = (output: string | null): RunResult => ({ steps: new Map(), output })

function renderPanel(props: { result?: RunResult; isUpdating?: boolean; summary?: string } = {}) {
  render(OutputPanel, {
    props: {
      result: props.result,
      isUpdating: props.isUpdating ?? false,
      summary: props.summary ?? '',
    },
  })
  return screen.getByRole('region', { name: 'Output' })
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
    // A changed label alone is not announced, so a live region confirms the copy (D15).
    expect(screen.getByText('Copied the output.')).toBeInTheDocument()
  })

  it('speaks the latest run in a live region under its heading (D15)', () => {
    renderPanel({ result: result('Real Python!'), summary: 'All 2 steps ran.' })

    expect(screen.getByRole('status', { name: 'Run summary' })).toHaveTextContent(
      'All 2 steps ran.',
    )
  })
})
