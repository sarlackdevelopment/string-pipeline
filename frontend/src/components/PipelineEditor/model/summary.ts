/**
 * One sentence about the latest run, for the live region (D15): that every step ran, or which step stopped the chain
 * and why. It leaves the output out, so typing into the input does not repeat it at every pause. Steps that are off
 * are counted, but never stop the chain (D48).
 */
import { StepStatus } from '@/model/run'
import type { StepItem } from '../types'

export function runSummary(steps: readonly StepItem[]): string {
  const running = steps.filter((step) => step.enabled)
  const stopped = running.find((step) => step.result?.status !== StepStatus.executed)
  if (stopped === undefined) {
    return everyStepRan(running.length, steps.length - running.length)
  }
  // Named by its place in the whole chain, as its card is.
  const name = `Step ${String(steps.indexOf(stopped) + 1)}, ${stopped.transformation.name},`
  switch (stopped.result?.status) {
    // No result yet, or the run failed as a whole and an alert says so.
    case undefined:
    case StepStatus.executed:
      return ''
    case StepStatus.notConfigured:
      return `${name} needs a value.`
    case StepStatus.invalidParameters:
      return `${name} has an invalid value.`
    case StepStatus.failed:
      return `${name} failed: ${stopped.result.message}`
    case StepStatus.notRun:
      return `${name} did not run.`
  }
}

function everyStepRan(ran: number, off: number): string {
  if (off === 0) {
    if (ran === 0) {
      return ''
    }
    return ran === 1 ? 'The step ran.' : `All ${String(ran)} steps ran.`
  }
  if (ran === 0) {
    return off === 1 ? 'The step is off.' : `All ${String(off)} steps are off.`
  }
  return `${String(ran)} of ${String(ran + off)} steps ran; ${String(off)} ${off === 1 ? 'is' : 'are'} off.`
}
