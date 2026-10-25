import userEvent from '@testing-library/user-event'
import { screen, waitFor, within } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import PipelineEditor from '@/components/PipelineEditor/PipelineEditor.vue'
import type { ChainContent } from '@/model/chain'
import { fromFragment, LinkStatus, toFragment } from '@/model/link'
import { serveCatalog, serveRuns } from '@/tests/helpers/api'
import { contractCatalog } from '@/tests/helpers/contract'
import { renderWithProviders } from '@/tests/helpers/render'

// The chain of the brief.
const brief: ChainContent = {
  input: 'Fake Python',
  steps: [
    { transformationId: 'replace', values: { old: 'Fake', new: 'Real' }, enabled: true },
    { transformationId: 'append', values: { text: '!' }, enabled: true },
  ],
}

const output = () => screen.getByRole('region', { name: 'Output' })
const input = () => screen.getByRole('textbox', { name: 'Input' })

/** Opens the editor at its address with `fragment`, as a browser does when a link is followed. */
async function openAt(fragment: string) {
  window.history.replaceState(null, '', `/${fragment}`)
  serveCatalog()
  serveRuns()
  const user = userEvent.setup()
  renderWithProviders(PipelineEditor)
  await screen.findByRole('combobox', { name: 'Add a step' })
  return user
}

/** The chain that the address holds now. */
function chainInAddress(): ChainContent | null {
  const reading = fromFragment(window.location.hash, contractCatalog())
  return reading.status === LinkStatus.chain ? reading.chain : null
}

describe('the chain in a link (D49)', () => {
  it('opens the chain of the link the page was opened with', async () => {
    await openAt(toFragment(brief))

    const replace = await screen.findByRole('group', { name: 'Step 1: Replace' })
    expect(within(replace).getByRole('textbox', { name: 'Find' })).toHaveValue('Fake')
    expect(input()).toHaveValue('Fake Python')
    await waitFor(() => expect(output()).toHaveTextContent('Real Python!'))
  })

  it('writes the chain into the address after an edit, without a new history entry', async () => {
    const user = await openAt('')
    const entries = window.history.length

    await user.type(input(), 'Hi')

    await waitFor(() => expect(chainInAddress()).toEqual({ input: 'Hi', steps: [] }))
    expect(window.history.length).toBe(entries)
  })

  it('opens another chain when a link to it is followed in the same page, as with Back', async () => {
    await openAt(toFragment(brief))
    await screen.findByRole('group', { name: 'Step 2: Append' })

    window.location.hash = toFragment({ input: 'abc', steps: [] })

    await waitFor(() => expect(input()).toHaveValue('abc'))
    expect(screen.queryByRole('region', { name: 'Steps' })).not.toBeInTheDocument()
  })

  it('empties the editor when a followed address holds no chain, as Back to a page without one', async () => {
    await openAt(toFragment(brief))
    await screen.findByRole('group', { name: 'Step 2: Append' })

    window.location.hash = ''

    await waitFor(() => expect(input()).toHaveValue(''))
    expect(screen.queryByRole('region', { name: 'Steps' })).not.toBeInTheDocument()
  })

  it('opens an example from its link, made of the catalog it came with (D50)', async () => {
    const user = await openAt('')

    await user.click(screen.getByRole('link', { name: 'Title to URL slug' }))

    expect(await screen.findByRole('group', { name: 'Step 1: Change case' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Step 2: Prepend' })).toBeInTheDocument()
    expect(input()).toHaveValue('10 Tips for Better Regular Expressions')
  })

  it('says why a link cannot be opened, starts empty, and drops the message after the next edit', async () => {
    const user = await openAt('#chain=eyJpbnB1dCI6')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('This link could not be opened')
    expect(input()).toHaveValue('')
    await user.type(input(), 'Hi')

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(chainInAddress()).toEqual({ input: 'Hi', steps: [] })
  })
})
