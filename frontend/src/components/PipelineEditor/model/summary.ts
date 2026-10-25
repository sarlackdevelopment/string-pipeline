/**
 * One sentence about the latest run, for the live region (D15): that every step ran, or which step stopped the chain
 * and why. It leaves the output out, so typing into the input does not repeat it at every pause. Steps that are off
 * are counted, but never stop the chain (D48). The sentence is in the interface's language (D52).
 */
import type { Translate } from '@/i18n'
import { StepStatus } from '@/model/run'
import type { StepItem } from '../types'

export function runSummary(steps: readonly StepItem[], t: Translate): string {
  const running = steps.filter((step) => step.enabled)
  const stopped = running.find((step) => step.result?.status !== StepStatus.executed)
  if (stopped === undefined) {
    return everyStepRan(running.length, steps.length - running.length, t)
  }
  // Named by its place in the whole chain, as its card is.
  const step = { number: steps.indexOf(stopped) + 1, name: stopped.transformation.name }
  switch (stopped.result?.status) {
    // No result yet, or the run failed as a whole and an alert says so.
    case undefined:
    case StepStatus.executed:
      return ''
    case StepStatus.notConfigured:
      return t('summary.needsValue', step)
    case StepStatus.invalidParameters:
      return t('summary.invalidValue', step)
    case StepStatus.failed:
      return t('summary.failed', { ...step, message: stopped.result.message })
    case StepStatus.notRun:
      return t('summary.notRun', step)
  }
}

function everyStepRan(ran: number, off: number, t: Translate): string {
  if (off === 0) {
    if (ran === 0) {
      return ''
    }
    return ran === 1 ? t('summary.oneRan') : t('summary.allRan', { n: ran })
  }
  if (ran === 0) {
    return off === 1 ? t('summary.oneOff') : t('summary.allOff', { n: off })
  }
  return t('summary.someOff', { ran, total: ran + off, off }, off)
}
