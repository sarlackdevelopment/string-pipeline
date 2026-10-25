/**
 * Public types of the parameter form: the message a field shows below its control (D12, D42).
 */

export const IssueSeverity = {
  /** A value is missing: a neutral hint, since the user may simply not have got there yet. */
  hint: 'hint',
  /** A value is wrong. */
  error: 'error',
} as const
export type IssueSeverity = (typeof IssueSeverity)[keyof typeof IssueSeverity]

export interface FieldIssue {
  readonly message: string
  readonly severity: IssueSeverity
}

/** By parameter name. */
export type FieldIssues = Readonly<Record<string, FieldIssue>>
