/**
 * The status badge of a step: a label and a tone for each state of D12, which the API names as in D42, and Off for a
 * step that is off (D48).
 */
import { StepStatus, type StepResult } from '@/model/run'

export const Tone = {
  success: 'success',
  neutral: 'neutral',
  error: 'error',
  muted: 'muted',
} as const
export type Tone = (typeof Tone)[keyof typeof Tone]

export interface StatusDisplay {
  readonly label: string
  readonly tone: Tone
  /** The step has no result yet, and a run is on its way. */
  readonly busy: boolean
}

/** A step that is off has no result: runs leave it out (D48). */
export const offStatus: StatusDisplay = { label: 'Off', tone: Tone.muted, busy: false }

/**
 * A step without a result is running while a run is on its way. Otherwise it did not run, because the run as a
 * whole failed.
 */
export function statusDisplay(result: StepResult | undefined, isUpdating: boolean): StatusDisplay {
  if (result === undefined) {
    return isUpdating
      ? { label: 'Running', tone: Tone.muted, busy: true }
      : { label: 'Not run', tone: Tone.muted, busy: false }
  }
  switch (result.status) {
    case StepStatus.executed:
      return { label: 'Executed', tone: Tone.success, busy: false }
    case StepStatus.notConfigured:
      return { label: 'Not configured', tone: Tone.neutral, busy: false }
    case StepStatus.invalidParameters:
      return { label: 'Invalid parameters', tone: Tone.error, busy: false }
    case StepStatus.failed:
      return { label: 'Failed', tone: Tone.error, busy: false }
    case StepStatus.notRun:
      return { label: 'Not run', tone: Tone.muted, busy: false }
  }
}
