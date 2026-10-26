import userEvent from '@testing-library/user-event'
import { render, screen, within } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PipelineEditorView from '@/components/PipelineEditor/PipelineEditorView.vue'
import { StepPart } from '@/components/StepCard/types'
import {
  CatalogStatus,
  SEARCH,
  type CatalogState,
  type ExampleLink,
  type RunAlert,
  type StepItem,
} from '@/components/PipelineEditor/types'
import { Direction, type ParameterValue } from '@/model/chain'
import { StepStatus } from '@/model/run'
import { contractCatalog, contractTransformation } from '@/tests/helpers/contract'
import { drag, forgetSortables, sortables } from '@/tests/helpers/sortable'

vi.mock('sortablejs', () => import('@/tests/helpers/sortable'))
afterEach(forgetSortables)

const ready: CatalogState = { status: CatalogStatus.ready, catalog: contractCatalog() }

// The chain of the brief: Replace "Fake" with "Real", then Append "!".
const steps: readonly StepItem[] = [
  {
    id: 's1',
    transformation: contractTransformation('replace'),
    values: { old: 'Fake', new: 'Real' },
    enabled: true,
    result: { status: StepStatus.executed, output: 'Real Python' },
    errors: undefined,
  },
  {
    id: 's2',
    transformation: contractTransformation('append'),
    values: { text: '!' },
    enabled: true,
    result: { status: StepStatus.executed, output: 'Real Python!' },
    errors: undefined,
  },
]

interface ViewOptions {
  readonly catalogState?: CatalogState
  readonly steps?: readonly StepItem[]
  readonly runAlert?: RunAlert | null
  readonly shareLink?: string | null
  readonly linkProblem?: string | null
  readonly examples?: readonly ExampleLink[]
}

function renderView(options: ViewOptions = {}) {
  const user = userEvent.setup()
  const events = {
    onRetryCatalog: vi.fn<() => void>(),
    onRetryRun: vi.fn<() => void>(),
    onSetInput: vi.fn<(input: string) => void>(),
    onAddStep: vi.fn<(transformationId: string) => void>(),
    onRemoveStep: vi.fn<(id: string) => void>(),
    onMoveStep: vi.fn<(id: string, direction: Direction) => void>(),
    onMoveStepTo: vi.fn<(id: string, index: number) => void>(),
    onSetValue: vi.fn<(id: string, name: string, value: ParameterValue) => void>(),
    onSetEnabled: vi.fn<(id: string, enabled: boolean) => void>(),
  }
  const view = render(PipelineEditorView, {
    props: {
      catalogState: options.catalogState ?? ready,
      input: 'Fake Python',
      inputErrors: [],
      steps: options.steps ?? steps,
      result: { steps: new Map(), output: 'Real Python!' },
      isUpdating: false,
      runAlert: options.runAlert ?? null,
      summary: 'All 2 steps ran.',
      focusTarget: null,
      shareLink: options.shareLink ?? null,
      linkProblem: options.linkProblem ?? null,
      examples: options.examples ?? [],
      ...events,
    },
  })
  return { user, view, ...events }
}

describe('PipelineEditorView (D2, D26)', () => {
  describe('before the catalog is there', () => {
    it('says that the transformations are loading', () => {
      renderView({ catalogState: { status: CatalogStatus.loading } })

      expect(screen.getByText('Loading the transformations…')).toBeInTheDocument()
      expect(screen.queryByRole('textbox', { name: 'Input' })).not.toBeInTheDocument()
    })

    it('says why the catalog could not be loaded, and offers another try', async () => {
      const message = 'The server cannot be reached. Check that it is running, then try again.'
      const { user, onRetryCatalog } = renderView({
        catalogState: { status: CatalogStatus.failed, message },
      })

      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent('The transformations could not be loaded')
      expect(alert).toHaveTextContent(message)
      await user.click(within(alert).getByRole('button', { name: 'Try again' }))
      expect(onRetryCatalog).toHaveBeenCalledOnce()
    })
  })

  describe('with the catalog', () => {
    it('shows the input, the steps in order, the search that adds a step, and the output', () => {
      renderView()

      expect(screen.getByRole('textbox', { name: 'Input' })).toHaveValue('Fake Python')
      const list = screen.getByRole('region', { name: 'Steps' })
      expect(within(list).getAllByRole('listitem')).toHaveLength(2)
      expect(within(list).getByRole('group', { name: 'Step 1: Replace' })).toBeInTheDocument()
      expect(within(list).getByRole('group', { name: 'Step 2: Append' })).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: 'Add a step' })).toBeEnabled()
      expect(screen.getByRole('region', { name: 'Output' })).toHaveTextContent('Real Python!')
    })

    it('reports edits of the input and of a step, with the id of the step (R1.2)', async () => {
      const { user, onSetInput, onSetValue } = renderView()

      await user.type(screen.getByRole('textbox', { name: 'Input' }), '!')
      const append = screen.getByRole('group', { name: 'Step 2: Append' })
      await user.type(within(append).getByRole('textbox', { name: 'Text' }), '?')

      expect(onSetInput).toHaveBeenLastCalledWith('Fake Python!')
      expect(onSetValue).toHaveBeenLastCalledWith('s2', 'text', '!?')
    })

    it('reports adding, moving and removing steps (R1.3)', async () => {
      const { user, onAddStep, onMoveStep, onRemoveStep } = renderView()

      await user.type(screen.getByRole('combobox', { name: 'Add a step' }), 'prepend{Enter}')
      await user.click(screen.getByRole('button', { name: 'Move step 1 down' }))
      await user.click(screen.getByRole('button', { name: 'Remove step 2' }))

      expect(onAddStep).toHaveBeenCalledExactlyOnceWith('prepend')
      expect(onMoveStep).toHaveBeenCalledExactlyOnceWith('s1', Direction.down)
      expect(onRemoveStep).toHaveBeenCalledExactlyOnceWith('s2')
    })

    it('reports a step dragged to another place, by the id of the step (D54)', async () => {
      const { onMoveStepTo } = renderView()
      await flushPromises()
      const [sortable] = sortables
      if (sortable === undefined) {
        throw new Error('The steps cannot be dragged.')
      }

      drag(sortable, 1, 0)

      expect(sortable.element).toBe(
        screen.getByRole('region', { name: 'Steps' }).querySelector('ol'),
      )
      expect(onMoveStepTo).toHaveBeenCalledExactlyOnceWith('s2', 0)
    })

    it('reports turning a step off, with the id of the step (D48)', async () => {
      const { user, onSetEnabled } = renderView()

      await user.click(screen.getByRole('switch', { name: 'Run step 2' }))

      expect(onSetEnabled).toHaveBeenCalledExactlyOnceWith('s2', false)
    })

    it('lets the first step move only down, and the last one only up', () => {
      renderView()

      expect(screen.getByRole('button', { name: 'Move step 1 up' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Move step 1 down' })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Move step 2 up' })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Move step 2 down' })).toBeDisabled()
    })

    it('has no list of steps while the chain is empty', () => {
      renderView({ steps: [] })

      expect(screen.queryByRole('region', { name: 'Steps' })).not.toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: 'Add a step' })).toBeEnabled()
    })

    it('turns the search off once the chain has as many steps as the catalog allows (D21)', () => {
      const catalog = { ...contractCatalog(), limits: { maxInputLength: 100, maxSteps: 2 } }

      renderView({ catalogState: { status: CatalogStatus.ready, catalog } })

      expect(screen.getByRole('combobox', { name: 'Add a step' })).toBeDisabled()
    })
  })

  describe('a run that failed as a whole (D41)', () => {
    it('shows why, and offers another try when it can help', async () => {
      const { user, onRetryRun } = renderView({
        runAlert: { messages: ['The server cannot be reached.'], canRetry: true },
      })

      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent('The chain could not run')
      expect(alert).toHaveTextContent('The server cannot be reached.')
      await user.click(within(alert).getByRole('button', { name: 'Try again' }))
      expect(onRetryRun).toHaveBeenCalledOnce()
    })

    it('offers no other try when the same request would fail the same way', () => {
      renderView({ runAlert: { messages: ['Invalid request content.'], canRetry: false } })

      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent('Invalid request content.')
      expect(within(alert).queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('links (D49)', () => {
    it('offers to copy a link to the chain once there is one', async () => {
      const { view } = renderView()
      const copy = screen.getByRole('button', { name: 'Copy link' })
      expect(copy).toBeDisabled()

      await view.rerender({ shareLink: 'http://localhost:3000/#chain=e30' })

      expect(copy).toBeEnabled()
    })

    it('offers the examples as links to their chains (D50)', () => {
      renderView({
        examples: [
          { id: 'brief', name: "The brief's chain", href: '#chain=a' },
          { id: 'titleToSlug', name: 'Title to URL slug', href: '#chain=b' },
        ],
      })

      const list = screen.getByRole('list', { name: 'Or open an example:' })
      expect(within(list).getByRole('link', { name: "The brief's chain" })).toHaveAttribute(
        'href',
        '#chain=a',
      )
      expect(within(list).getAllByRole('link')).toHaveLength(2)
    })

    it('says why the link it was opened with could not be opened', () => {
      renderView({
        linkProblem: 'It uses a transformation that this app does not have: "reverse".',
      })

      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent('This link could not be opened')
      expect(alert).toHaveTextContent('"reverse"')
    })
  })

  describe('focus and announcements (D15)', () => {
    it('hands the focus target to the step it names, or to the search field', async () => {
      const { view } = renderView()

      await view.rerender({ focusTarget: { stepId: 's2', part: StepPart.firstField } })
      const append = screen.getByRole('group', { name: 'Step 2: Append' })
      expect(within(append).getByRole('textbox', { name: 'Text' })).toHaveFocus()

      await view.rerender({ focusTarget: { part: SEARCH } })
      expect(screen.getByRole('combobox', { name: 'Add a step' })).toHaveFocus()
    })

    it('passes the summary of the run to the live region', () => {
      renderView()

      expect(screen.getByRole('status', { name: 'Run summary' })).toHaveTextContent(
        'All 2 steps ran.',
      )
    })
  })
})
