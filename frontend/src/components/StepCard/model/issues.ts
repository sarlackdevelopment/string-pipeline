/**
 * The message each field of a step shows (D12, D41, D42): from the step's result, or from a rejected request that
 * names the field. A missing value is a hint; a wrong one, and every request error, is an error.
 */
import { IssueSeverity, type FieldIssue, type FieldIssues } from '@/components/ParameterForm/types'
import type { StepErrors } from '@/model/problem'
import { StepStatus, type StepResult } from '@/model/run'

export function fieldIssues(
  result: StepResult | undefined,
  errors: StepErrors | undefined,
): FieldIssues {
  const fromRequest = Object.entries(errors?.parameters ?? {}).map(
    ([name, message]) => [name, { message, severity: IssueSeverity.error }] as const,
  )
  // Later entries win, so a request error replaces what an older result said about the same field.
  return Object.fromEntries([...resultIssues(result), ...fromRequest])
}

function resultIssues(result: StepResult | undefined): (readonly [string, FieldIssue])[] {
  if (
    result?.status !== StepStatus.notConfigured &&
    result?.status !== StepStatus.invalidParameters
  ) {
    return []
  }
  const severity =
    result.status === StepStatus.notConfigured ? IssueSeverity.hint : IssueSeverity.error
  return Object.entries(result.issues).map(
    ([name, message]) => [name, { message, severity }] as const,
  )
}
