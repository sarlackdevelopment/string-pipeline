import userEvent from '@testing-library/user-event'
import { render, screen, within } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import PipelineEditorView from '@/components/PipelineEditor/PipelineEditorView.vue'
import {
  CatalogStatus,
  type CatalogState,
  type RunAlert,
  type StepItem,
} from '@/components/PipelineEditor/types'
import { Direction, type ParameterValue } from '@/model/chain'
import { StepStatus } from '@/model/run'
import { contractCatalog, contractTransformation } from '@/tests/helpers/contract'

const ready: CatalogState = { status: CatalogStatus.ready, catalog: contractCatalog() }

// The chain of the brief: Replace "Fake" with "Real", then Append "!".
const steps: readonly StepItem[] = [
  {
    id: 's1',
    transformation: contractTransformation('replace'),
    values: { old: 'Fake', new: 'Real' },
    result: { status: StepStatus.executed, output: 'Real Python' },
    errors: undefined,
  },
  {
    id: 's2',
    transformation: contractTransformation('append'),
    values: { text: '!' },
    result: { status: StepStatus.executed, output: 'Real Python!' },
    errors: undefined,
  },
]

interface ViewOptions {
  readonly catalogState?: CatalogState
  readonly steps?: readonly StepItem[]
  readonly runAlert?: RunAlert | null
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
    onSetValue: vi.fn<(id: string, name: string, value: ParameterValue) => void>(),
  }
  render(PipelineEditorView, {
    props: {
      catalogState: options.catalogState ?? ready,
      input: 'Fake Python',
      inputErrors: [],
      steps: options.steps ?? steps,
      result: { steps: new Map(), output: 'Real Python!' },
      isUpdating: false,
      runAlert: options.runAlert ?? null,
      ...events,
    },
  })
  return { user, ...events }
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
})
