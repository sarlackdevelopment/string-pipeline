import { http, HttpResponse } from 'msw'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { CatalogStatus, SEARCH } from '@/components/PipelineEditor/types'
import { usePipelineEditorController } from '@/components/PipelineEditor/usePipelineEditorController'
import { StepPart } from '@/components/StepCard/types'
import { Direction } from '@/model/chain'
import { StepStatus } from '@/model/run'
import {
  CATALOG_URL,
  fakeRun,
  gate,
  RUNS_URL,
  serveCatalog,
  serveNetworkError,
  serveRejectedRuns,
  serveRuns,
} from '@/tests/helpers/api'
import { renderComposable } from '@/tests/helpers/composable'
import { server } from '@/tests/helpers/server'

const setup = () => renderComposable(() => usePipelineEditorController())

/** A rejected run (D41) whose errors point at the given places. */
function rejectRuns(pointers: readonly string[]): void {
  serveRejectedRuns(pointers.map((pointer) => ({ pointer, detail: `Wrong at ${pointer}` })))
}

async function ready(editor: ReturnType<typeof setup>): Promise<void> {
  await vi.waitFor(() => expect(editor.catalogState.value.status).toBe(CatalogStatus.ready))
}

describe('the editor controller (D26)', () => {
  describe('the catalog', () => {
    it('is loading, then ready', async () => {
      serveCatalog()
      serveRuns()
      const editor = setup()

      expect(editor.catalogState.value.status).toBe(CatalogStatus.loading)
      await ready(editor)
    })

    it('reports a catalog that cannot be loaded, and loads it on retry', async () => {
      server.use(http.get(CATALOG_URL, () => new HttpResponse(null, { status: 503 })))
      serveRuns()
      const editor = setup()
      await vi.waitFor(() =>
        expect(editor.catalogState.value).toEqual({
          status: CatalogStatus.failed,
          message: expect.stringMatching(/HTTP 503/) as unknown,
        }),
      )

      serveCatalog()
      editor.retryCatalog()

      await ready(editor)
    })
  })

  describe('the steps (R1.2)', () => {
    it('adds a step by the id of its transformation, with its defaults, and gives it its result', async () => {
      serveCatalog()
      serveRuns()
      const editor = setup()
      await ready(editor)

      editor.setInput('Hi')
      editor.addStep('append')

      expect(editor.steps.value).toMatchObject([
        { transformation: { name: 'Append' }, values: { text: '' } },
      ])
      await vi.waitFor(() =>
        expect(editor.steps.value[0]?.result).toEqual({
          status: StepStatus.executed,
          output: 'Hi',
        }),
      )
    })

    it('ignores an id that the catalog does not have', async () => {
      serveCatalog()
      serveRuns()
      const editor = setup()
      await ready(editor)

      editor.addStep('reverse')

      expect(editor.steps.value).toEqual([])
    })

    it('matches the results to the steps by id after a move (D40)', async () => {
      serveCatalog()
      serveRuns()
      const editor = setup()
      await ready(editor)
      editor.setInput('Fake Python')
      editor.addStep('replace')
      editor.addStep('append')
      const [replace, append] = editor.steps.value.map((step) => step.id)
      if (replace === undefined || append === undefined) {
        throw new Error('Two steps were added.')
      }
      editor.setValue(replace, 'old', 'Fake')
      editor.setValue(replace, 'new', 'Real')
      editor.setValue(append, 'text', '!')

      editor.moveStep(append, Direction.up)

      await vi.waitFor(() =>
        expect(editor.steps.value.map((step) => [step.transformation.name, step.result])).toEqual([
          ['Append', { status: StepStatus.executed, output: 'Fake Python!' }],
          ['Replace', { status: StepStatus.executed, output: 'Real Python!' }],
        ]),
      )
    })
  })

  describe('a run that fails as a whole (D41)', () => {
    it('offers another try when the server cannot be reached', async () => {
      serveCatalog()
      serveNetworkError(RUNS_URL)
      const editor = setup()
      await vi.waitFor(() =>
        expect(editor.runAlert.value).toEqual({
          messages: [expect.stringMatching(/cannot be reached/) as unknown],
          canRetry: true,
        }),
      )

      serveRuns()
      editor.retryRun()

      // A query that never had data drops its error as soon as it fetches again, so wait for the result.
      await vi.waitFor(() => expect(editor.result.value?.output).toBe(''))
      expect(editor.runAlert.value).toBeNull()
    })

    it('places the errors of a rejected request at the input, the step and its field', async () => {
      serveCatalog()
      rejectRuns(['#/input', '#/steps/0', '#/steps/0/parameters/text'])
      const editor = setup()
      await ready(editor)

      editor.addStep('append')

      await vi.waitFor(() =>
        expect(editor.steps.value[0]?.errors).toEqual({
          step: ['Wrong at #/steps/0'],
          parameters: { text: 'Wrong at #/steps/0/parameters/text' },
        }),
      )
      expect(editor.inputErrors.value).toEqual(['Wrong at #/input'])
      expect(editor.runAlert.value).toBeNull()
    })

    it('shows errors without such a place as an alert, without another try', async () => {
      serveCatalog()
      rejectRuns(['#/steps'])
      const editor = setup()

      await vi.waitFor(() =>
        expect(editor.runAlert.value).toEqual({ messages: ['Wrong at #/steps'], canRetry: false }),
      )
    })
  })

  describe('focus and announcements (D15)', () => {
    it('asks for the focus after adding, moving and removing a step', async () => {
      serveCatalog()
      serveRuns()
      const editor = setup()
      await ready(editor)
      const idAt = (index: number) => editor.steps.value[index]?.id ?? 'missing'

      editor.addStep('append')
      const first = idAt(0)
      expect(editor.focusTarget.value).toEqual({ stepId: first, part: StepPart.firstField })
      editor.addStep('prepend')
      const second = idAt(1)
      editor.moveStep(second, Direction.up)
      expect(editor.focusTarget.value).toEqual({ stepId: second, part: StepPart.card })
      editor.removeStep(second)
      expect(editor.focusTarget.value).toEqual({ stepId: first, part: StepPart.card })
      editor.removeStep(first)
      expect(editor.focusTarget.value).toEqual({ part: SEARCH })
    })

    it('keeps the summary of the last run while the next one is on its way', async () => {
      const held = gate()
      serveCatalog()
      serveRuns(fakeRun, (body) => (body.steps.length === 2 ? held.opened : Promise.resolve()))
      onTestFinished(held.open)
      const editor = setup()
      await ready(editor)
      editor.setInput('a')
      editor.addStep('append')
      await vi.waitFor(() => expect(editor.summary.value).toBe('The step ran.'))

      editor.addStep('replace')
      await vi.waitFor(() => expect(editor.isUpdating.value).toBe(true))

      expect(editor.summary.value).toBe('The step ran.')
      held.open()
      await vi.waitFor(() => expect(editor.summary.value).toBe('Step 2, Replace, needs a value.'))
    })
  })
})
