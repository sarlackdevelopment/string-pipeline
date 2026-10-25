/**
 * The status badge of a step: a label and a tone for each state of D12, which the API names as in D42, and Off for a
 * step that is off (D48). The label is in the interface's language (D52).
 */
import type { Translate } from '@/i18n'
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
export function offStatus(t: Translate): StatusDisplay {
  return { label: t('status.off'), tone: Tone.muted, busy: false }
}

/**
 * A step without a result is running while a run is on its way. Otherwise it did not run, because the run as a
 * whole failed.
 */
export function statusDisplay(
  result: StepResult | undefined,
  isUpdating: boolean,
  t: Translate,
): StatusDisplay {
  if (result === undefined) {
    return isUpdating
      ? { label: t('status.running'), tone: Tone.muted, busy: true }
      : { label: t('status.notRun'), tone: Tone.muted, busy: false }
  }
  switch (result.status) {
    case StepStatus.executed:
      return { label: t('status.executed'), tone: Tone.success, busy: false }
    case StepStatus.notConfigured:
      return { label: t('status.notConfigured'), tone: Tone.neutral, busy: false }
    case StepStatus.invalidParameters:
      return { label: t('status.invalidParameters'), tone: Tone.error, busy: false }
    case StepStatus.failed:
      return { label: t('status.failed'), tone: Tone.error, busy: false }
    case StepStatus.notRun:
      return { label: t('status.notRun'), tone: Tone.muted, busy: false }
  }
}
