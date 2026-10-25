import userEvent from '@testing-library/user-event'
import { render, screen, within } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import StepCard from '@/components/StepCard/StepCard.vue'
import { Direction, type ParameterValue } from '@/model/chain'
import type { StepErrors } from '@/model/problem'
import { StepStatus, type StepResult } from '@/model/run'
import { contractTransformation } from '@/tests/helpers/contract'

const replace = contractTransformation('replace')

interface CardOptions {
  readonly result?: StepResult
  readonly errors?: StepErrors
  readonly isUpdating?: boolean
  readonly canMoveUp?: boolean
  readonly canMoveDown?: boolean
}

// Step 2 of a chain: Replace "Fake" with "Real".
function renderCard(options: CardOptions = {}) {
  const user = userEvent.setup()
  const events = {
    onMove: vi.fn<(direction: Direction) => void>(),
    onRemove: vi.fn<() => void>(),
    onChange: vi.fn<(name: string, value: ParameterValue) => void>(),
  }
  render(StepCard, {
    props: {
      number: 2,
      transformation: replace,
      values: { old: 'Fake', new: 'Real' },
      result: options.result,
      errors: options.errors,
      isUpdating: options.isUpdating ?? false,
      canMoveUp: options.canMoveUp ?? true,
      canMoveDown: options.canMoveDown ?? true,
      ...events,
    },
  })
  return { user, ...events, card: screen.getByRole('group', { name: 'Step 2: Replace' }) }
}

describe('StepCard', () => {
  it('is a group named after its position and transformation, holding its form (D15, R2.1)', () => {
    const { card } = renderCard()

    expect(card).toHaveTextContent(replace.description)
    expect(within(card).getByRole('textbox', { name: 'Find' })).toHaveValue('Fake')
    expect(within(card).getByRole('textbox', { name: 'Replace with' })).toHaveValue('Real')
  })

  it('reports a changed value with the name of its parameter', async () => {
    const { user, onChange } = renderCard()

    await user.type(screen.getByRole('textbox', { name: 'Find' }), 's')

    expect(onChange).toHaveBeenLastCalledWith('old', 'Fakes')
  })

  it('moves up, moves down and removes itself (R1.3)', async () => {
    const { user, onMove, onRemove } = renderCard()

    await user.click(screen.getByRole('button', { name: 'Move step 2 up' }))
    await user.click(screen.getByRole('button', { name: 'Move step 2 down' }))
    await user.click(screen.getByRole('button', { name: 'Remove step 2' }))

    expect(onMove.mock.calls).toEqual([[Direction.up], [Direction.down]])
    expect(onRemove).toHaveBeenCalledOnce()
  })

  it('cannot move past either end of the chain', () => {
    renderCard({ canMoveUp: false, canMoveDown: false })

    expect(screen.getByRole('button', { name: 'Move step 2 up' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move step 2 down' })).toBeDisabled()
  })

  describe('its result (D12, D13)', () => {
    it('shows its own output once it has executed', () => {
      const { card } = renderCard({
        result: { status: StepStatus.executed, output: 'Real Python' },
      })

      expect(card).toHaveTextContent('Executed')
      expect(within(card).getByText('Real Python')).toBeInTheDocument()
    })

    it('marks an empty output, which would otherwise look like no output at all', () => {
      const { card } = renderCard({ result: { status: StepStatus.executed, output: '' } })

      expect(within(card).getByText('Empty text')).toBeInTheDocument()
    })

    it('says why it failed', () => {
      const message = 'The regular expression took longer than 2 seconds.'
      const { card } = renderCard({ result: { status: StepStatus.failed, message } })

      expect(card).toHaveTextContent('Failed')
      expect(within(card).getByText(message)).toBeInTheDocument()
    })

    it('says that it waits for the steps above when it did not run', () => {
      const { card } = renderCard({ result: { status: StepStatus.notRun } })

      expect(card).toHaveTextContent('Not run')
      expect(card).toHaveTextContent('This step runs once every step above it has run.')
    })

    it('is running while it has no result and a run is on its way', () => {
      const { card } = renderCard({ isUpdating: true })

      expect(card).toHaveTextContent('Running')
    })

    it('shows a missing value as a hint at its field, not as an error (D42)', () => {
      renderCard({ result: { status: StepStatus.notConfigured, issues: { old: 'Enter a value' } } })

      const find = screen.getByRole('textbox', { name: 'Find' })
      expect(find).toHaveAccessibleDescription(/Enter a value/)
      expect(find).toHaveAttribute('aria-invalid', 'false')
    })

    it('shows a wrong value as an error at its field', () => {
      const issues = { new: 'The pattern has no group 5.' }
      renderCard({ result: { status: StepStatus.invalidParameters, issues } })

      const replaceWith = screen.getByRole('textbox', { name: 'Replace with' })
      expect(replaceWith).toHaveAccessibleDescription(/The pattern has no group 5\./)
      expect(replaceWith).toHaveAttribute('aria-invalid', 'true')
    })

    it('shows what a rejected request said about the step and its fields (D41)', () => {
      renderCard({
        errors: {
          step: ['Unknown transformation: reverse'],
          parameters: { new: 'This value has the wrong type.' },
        },
      })

      expect(screen.getByText('Unknown transformation: reverse')).toBeInTheDocument()
      const replaceWith = screen.getByRole('textbox', { name: 'Replace with' })
      expect(replaceWith).toHaveAccessibleDescription(/This value has the wrong type\./)
      expect(replaceWith).toHaveAttribute('aria-invalid', 'true')
    })
  })
})
