/**
 * One sentence about the latest run, for the live region (D15): that every step ran, or which step stopped the chain
 * and why. It leaves the output out, so typing into the input does not repeat it at every pause.
 */
import { StepStatus } from '@/model/run'
import type { StepItem } from '../types'

export function runSummary(steps: readonly StepItem[]): string {
  const stopped = steps.find((step) => step.result?.status !== StepStatus.executed)
  if (stopped === undefined) {
    if (steps.length === 0) {
      return ''
    }
    return steps.length === 1 ? 'The step ran.' : `All ${String(steps.length)} steps ran.`
  }
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
