import userEvent from '@testing-library/user-event'
import { screen, waitFor, within } from '@testing-library/vue'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, onTestFinished } from 'vitest'
import PipelineEditor from '@/components/PipelineEditor/PipelineEditor.vue'
import {
  CATALOG_URL,
  fakeRun,
  gate,
  RUNS_URL,
  serveCatalog,
  serveNetworkError,
  serveRejectedRuns,
  serveRuns,
  type ReceivedRun,
} from '@/tests/helpers/api'
import { readContract } from '@/tests/helpers/contract'
import { renderWithProviders } from '@/tests/helpers/render'
import { server } from '@/tests/helpers/server'

// The editor against the stand-in API: real requests, real parsing, real store and queries (D33).
async function renderEditor() {
  const user = userEvent.setup()
  renderWithProviders(PipelineEditor)
  const search = await screen.findByRole('combobox', { name: 'Add a step' })
  return { user, search }
}

const output = () => screen.getByRole('region', { name: 'Output' })

// A transformation this frontend has never seen, with a mix of parameters no built-in one has (D19).
const unseenCatalog = {
  limits: { maxInputLength: 1000, maxSteps: 10 },
  categories: [{ id: 'layout', name: 'Layout' }],
  transformations: [
    {
      id: 'padToWidth',
      name: 'Pad to width',
      category: 'layout',
      description: 'Fills the text up to a width.',
      parameters: {
        type: 'object',
        properties: {
          width: {
            type: 'integer',
            title: 'Width',
            description: 'In characters.',
            default: 10,
            minimum: 1,
            maximum: 80,
          },
          fill: {
            type: 'string',
            title: 'Fill',
            description: 'One character.',
            default: '.',
            minLength: 1,
            maxLength: 1,
          },
          side: {
            type: 'string',
            title: 'Side',
            description: 'Where the fill goes.',
            default: 'left',
            oneOf: [
              { const: 'left', title: 'Left' },
              { const: 'right', title: 'Right' },
              { const: 'both', title: 'Both sides' },
            ],
          },
          trimFirst: {
            type: 'boolean',
            title: 'Trim first',
            description: 'Removes spaces before filling.',
            default: false,
          },
          tags: { type: 'array', title: 'Tags', items: { type: 'string' } },
        },
        required: ['fill'],
        additionalProperties: false,
      },
    },
  ],
}

// The server shows the parameters it received as the output, so the test can read them back.
const echoParameters = (request: ReceivedRun) => {
  const steps = request.steps.map((step) => ({
    id: step.id,
    status: 'executed',
    output: JSON.stringify(step.parameters),
  }))
  return { steps, output: steps.at(-1)?.output ?? request.input }
}

describe('the pipeline editor', () => {
  it('builds and reorders the chain of the brief from the keyboard alone (R1.2, R1.3, D15)', async () => {
    serveCatalog()
    serveRuns()
    const { user, search } = await renderEditor()

    await user.tab()
    expect(screen.getByRole('textbox', { name: 'Input' })).toHaveFocus()
    await user.keyboard('Fake Python')

    await user.tab()
    expect(search).toHaveFocus()
    await user.keyboard('replace{Enter}')
    const replace = await screen.findByRole('group', { name: 'Step 1: Replace' })
    await waitFor(() => expect(search).toHaveValue(''))

    // The new step comes before the search field, so Shift+Tab walks back into it.
    await user.tab({ shift: true })
    expect(within(replace).getByRole('textbox', { name: 'Replace with' })).toHaveFocus()
    await user.keyboard('Real')
    await user.tab({ shift: true })
    expect(within(replace).getByRole('textbox', { name: 'Find' })).toHaveFocus()
    await user.keyboard('Fake')

    await user.tab()
    await user.tab()
    expect(search).toHaveFocus()
    await user.keyboard('append{Enter}')
    const append = await screen.findByRole('group', { name: 'Step 2: Append' })
    await user.tab({ shift: true })
    expect(within(append).getByRole('textbox', { name: 'Text' })).toHaveFocus()
    await user.keyboard('!')

    await waitFor(() => expect(output()).toHaveTextContent('Real Python!'))

    // Back past "Remove step 2" and the disabled "Move step 2 down" to "Move step 2 up".
    await user.tab({ shift: true })
    await user.tab({ shift: true })
    expect(within(append).getByRole('button', { name: 'Move step 2 up' })).toHaveFocus()
    await user.keyboard('{Enter}')

    const first = await screen.findByRole('group', { name: 'Step 1: Append' })
    const second = screen.getByRole('group', { name: 'Step 2: Replace' })
    await waitFor(() => expect(within(first).getByText('Fake Python!')).toBeInTheDocument())
    expect(within(second).getByText('Real Python!')).toBeInTheDocument()
  })

  it('removes a step from the keyboard', async () => {
    serveCatalog()
    serveRuns()
    const { user, search } = await renderEditor()
    await user.type(search, 'append{Enter}')
    await screen.findByRole('group', { name: 'Step 1: Append' })

    // From the top: the input, then the only enabled button of the only step.
    await user.click(document.body)
    await user.tab()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Remove step 1' })).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(screen.queryByRole('group', { name: 'Step 1: Append' })).not.toBeInTheDocument()
  })

  it('builds the form of a transformation it has never seen, and runs it (R2.1, D19)', async () => {
    serveCatalog(unseenCatalog)
    const received = serveRuns(echoParameters)
    const { user, search } = await renderEditor()

    await user.type(search, 'pad{Enter}')

    const step = await screen.findByRole('group', { name: 'Step 1: Pad to width' })
    const width = within(step).getByRole('spinbutton', { name: 'Width' })
    const fill = within(step).getByRole('textbox', { name: 'Fill' })
    const side = within(step).getByRole('combobox', { name: 'Side' })
    const trimFirst = within(step).getByRole('checkbox', { name: 'Trim first' })
    expect(width).toHaveValue(10)
    expect(width).toHaveAttribute('max', '80')
    expect(fill).toHaveValue('.')
    expect(fill).toHaveAttribute('maxlength', '1')
    expect(side).toHaveValue('left')
    expect(trimFirst).not.toBeChecked()
    expect(step).toHaveTextContent('Tags')
    expect(step).toHaveTextContent('cannot edit this kind of parameter yet')

    await user.clear(width)
    await user.type(width, '42')
    await user.selectOptions(side, 'both')
    await user.click(trimFirst)

    // The unsupported parameter gets no value, so the server uses its default (D43).
    const sent = { width: 42, fill: '.', side: 'both', trimFirst: true }
    await waitFor(() => expect(received.at(-1)?.steps[0]?.parameters).toEqual(sent))
    await waitFor(() => expect(within(step).getByText(JSON.stringify(sent))).toBeInTheDocument())
  })

  it('shows a new step as running until its result arrives, and keeps the previous output meanwhile', async () => {
    const held = gate()
    serveCatalog()
    serveRuns(fakeRun, (body) => (body.steps.length > 0 ? held.opened : Promise.resolve()))
    onTestFinished(held.open)
    const { user, search } = await renderEditor()
    await user.type(screen.getByRole('textbox', { name: 'Input' }), 'Hi')
    await waitFor(() => expect(output()).toHaveTextContent('Hi'))

    await user.type(search, 'append{Enter}')

    const step = await screen.findByRole('group', { name: 'Step 1: Append' })
    await waitFor(() => expect(step).toHaveTextContent('Running'))
    expect(output()).toHaveTextContent('Updating')
    expect(output()).toHaveTextContent('Hi')
    held.open()
    await waitFor(() => expect(step).toHaveTextContent('Executed'))
    expect(output()).not.toHaveTextContent('Updating')
  })

  it('says when the chain is full, after as many steps as the catalog allows (D21)', async () => {
    serveCatalog({
      ...(readContract('catalog.json') as object),
      limits: { maxInputLength: 100000, maxSteps: 2 },
    })
    serveRuns()
    const { user, search } = await renderEditor()

    await user.type(search, 'append{Enter}')
    await waitFor(() => expect(search).toHaveValue(''))
    await user.type(search, 'append{Enter}')

    await waitFor(() => expect(search).toBeDisabled())
    expect(search).toHaveAccessibleDescription('A chain can have up to 2 steps.')
  })

  describe('when something fails', () => {
    it('says that the catalog could not be loaded, and loads it on Try again', async () => {
      server.use(http.get(CATALOG_URL, () => new HttpResponse(null, { status: 503 })))
      serveRuns()
      const user = userEvent.setup()
      renderWithProviders(PipelineEditor)

      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent('The transformations could not be loaded')
      expect(alert).toHaveTextContent('HTTP 503')
      serveCatalog()
      await user.click(within(alert).getByRole('button', { name: 'Try again' }))

      expect(await screen.findByRole('combobox', { name: 'Add a step' })).toBeInTheDocument()
    })

    it('says that the server cannot be reached during a run, and runs again on Try again', async () => {
      serveCatalog()
      serveNetworkError(RUNS_URL)
      const { user } = await renderEditor()

      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent('The chain could not run')
      expect(alert).toHaveTextContent('The server cannot be reached')
      serveRuns()
      await user.click(within(alert).getByRole('button', { name: 'Try again' }))

      await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
      await user.type(screen.getByRole('textbox', { name: 'Input' }), 'Hi')
      await waitFor(() => expect(output()).toHaveTextContent('Hi'))
    })

    it('shows the errors of a rejected request at the input and at the field they name (D41)', async () => {
      serveCatalog()
      serveRejectedRuns([
        { pointer: '#/input', detail: 'Use at most 100,000 characters' },
        { pointer: '#/steps/0/parameters/text', detail: 'This value has the wrong type.' },
      ])
      const { user, search } = await renderEditor()

      await user.type(search, 'append{Enter}')

      const text = within(await screen.findByRole('group', { name: 'Step 1: Append' })).getByRole(
        'textbox',
        { name: 'Text' },
      )
      await waitFor(() => expect(text).toHaveAttribute('aria-invalid', 'true'))
      expect(text).toHaveAccessibleDescription(/This value has the wrong type\.$/)
      const input = screen.getByRole('textbox', { name: 'Input' })
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAccessibleDescription(/Use at most 100,000 characters$/)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})
