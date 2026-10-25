/**
 * Request errors from the server, placed where the user can act on them (D41).
 *
 * The server's JSON pointers name a field of the request: `#/input`, `#/steps/1/parameters/old`. Each error goes to
 * the input, to a step (by the id that step had in the request), or to a general list for anything else.
 */
import type { RunRequest } from './run'

export interface FieldError {
  readonly pointer: string
  readonly detail: string
}

/** Problem Details (RFC 9457), reduced to what the UI shows. */
export interface Problem {
  readonly status: number
  readonly title: string
  readonly detail: string
  readonly errors: readonly FieldError[]
}

export interface StepErrors {
  /** Problems with the step itself, such as an unknown transformation. */
  readonly step: readonly string[]
  /** Problems with a parameter, by its name. */
  readonly parameters: Readonly<Record<string, string>>
}

export interface LocatedErrors {
  readonly input: readonly string[]
  /** By step id. */
  readonly steps: ReadonlyMap<string, StepErrors>
  /** Everything without a better place; the problem's own detail when no error names a field. */
  readonly general: readonly string[]
}

/** `#/steps/1/parameters/a~1b` gives `steps`, `1`, `parameters`, `a/b` (RFC 6901). */
export function pointerSegments(pointer: string): readonly string[] {
  if (!pointer.startsWith('#/')) {
    return []
  }
  return pointer
    .slice(2)
    .split('/')
    .map((segment) => segment.replaceAll('~1', '/').replaceAll('~0', '~'))
}

export function locateErrors(problem: Problem, request: RunRequest): LocatedErrors {
  const input: string[] = []
  const general: string[] = []
  const steps = new Map<string, { step: string[]; parameters: Record<string, string> }>()
  for (const error of problem.errors) {
    const segments = pointerSegments(error.pointer)
    const [root, index, part, name] = segments
    if (root === 'input' && segments.length === 1) {
      input.push(error.detail)
      continue
    }
    const step = root === 'steps' && index !== undefined ? request.steps[Number(index)] : undefined
    if (step === undefined) {
      general.push(error.detail)
      continue
    }
    const errors = steps.get(step.id) ?? { step: [], parameters: {} }
    steps.set(step.id, errors)
    if (part === 'parameters' && name !== undefined && segments.length === 4) {
      errors.parameters[name] = error.detail
    } else {
      errors.step.push(error.detail)
    }
  }
  if (problem.errors.length === 0) {
    general.push(problem.detail)
  }
  return { input, steps, general }
}
