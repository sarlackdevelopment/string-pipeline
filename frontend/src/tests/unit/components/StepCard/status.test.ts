// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { statusDisplay, Tone } from '@/components/StepCard/model/status'
import { StepStatus, type StepResult } from '@/model/run'

describe('the status badge of a step (D12, D42)', () => {
  it.each<[StepResult, string, Tone]>([
    [{ status: StepStatus.executed, output: 'x' }, 'Executed', Tone.success],
    [
      { status: StepStatus.notConfigured, issues: { old: 'Enter a value' } },
      'Not configured',
      Tone.neutral,
    ],
    [{ status: StepStatus.invalidParameters, issues: {} }, 'Invalid parameters', Tone.error],
    [{ status: StepStatus.failed, message: 'Timed out' }, 'Failed', Tone.error],
    [{ status: StepStatus.notRun }, 'Not run', Tone.muted],
  ])('shows %j as %s', (result, label, tone) => {
    expect(statusDisplay(result, false)).toEqual({ label, tone, busy: false })
  })

  it('keeps showing a result while the next run is on its way', () => {
    expect(statusDisplay({ status: StepStatus.executed, output: 'x' }, true).label).toBe('Executed')
  })

  it('shows a step without a result as running while a run is on its way', () => {
    expect(statusDisplay(undefined, true)).toEqual({
      label: 'Running',
      tone: Tone.muted,
      busy: true,
    })
  })

  it('shows a step without a result as not run when the run failed as a whole', () => {
    expect(statusDisplay(undefined, false)).toEqual({
      label: 'Not run',
      tone: Tone.muted,
      busy: false,
    })
  })
})
