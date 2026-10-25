/**
 * A run of the chain: the request the frontend sends and the results it gets back, matched to steps by id
 * (D40, D42).
 */
import type { Chain, StepValues } from './chain'

export interface RunRequestStep {
  readonly id: string
  readonly transformation: string
  readonly parameters: StepValues
}

export interface RunRequest {
  readonly input: string
  readonly steps: readonly RunRequestStep[]
}

export function toRunRequest(chain: Chain): RunRequest {
  return {
    input: chain.input,
    steps: chain.steps.map((step) => ({
      id: step.id,
      transformation: step.transformationId,
      parameters: step.values,
    })),
  }
}

/** The five states of a step, as in the API (D12, D42). */
export const StepStatus = {
  executed: 'executed',
  notConfigured: 'notConfigured',
  invalidParameters: 'invalidParameters',
  failed: 'failed',
  notRun: 'notRun',
} as const
export type StepStatus = (typeof StepStatus)[keyof typeof StepStatus]

/** Messages by parameter name, shown at the fields. */
export type Issues = Readonly<Record<string, string>>

export type StepResult =
  | { readonly status: typeof StepStatus.executed; readonly output: string }
  | { readonly status: typeof StepStatus.notConfigured; readonly issues: Issues }
  | { readonly status: typeof StepStatus.invalidParameters; readonly issues: Issues }
  | { readonly status: typeof StepStatus.failed; readonly message: string }
  | { readonly status: typeof StepStatus.notRun }

export interface RunResult {
  /** By step id, so the results of the previous run still fit the steps while the user edits the chain. */
  readonly steps: ReadonlyMap<string, StepResult>
  /** The last step's output when every step executed, the input for an empty chain, otherwise `null`. */
  readonly output: string | null
}
