/**
 * The chain being edited: the input text and the steps with their values (R1.2, R1.3, D1).
 *
 * Pure functions that return a new chain, or the same object when nothing changes. The store calls them (D29);
 * nothing here knows about Vue or the network.
 */
import type { Transformation } from './catalog'
import { FieldKind, type Field } from './fields'

export type ParameterValue = string | number | boolean | null

export type StepValues = Readonly<Record<string, ParameterValue>>

export interface Step {
  /**
   * Chosen by the caller, unique and never reused, so a result of an older run can never land on a newer step
   * (D40).
   */
  readonly id: string
  readonly transformationId: string
  readonly values: StepValues
}

export interface Chain {
  readonly input: string
  readonly steps: readonly Step[]
}

export const Direction = { up: -1, down: 1 } as const
export type Direction = (typeof Direction)[keyof typeof Direction]

export const emptyChain: Chain = { input: '', steps: [] }

/** Every field at its default. Unsupported fields get no value, so the server uses its own default. */
export function defaultValues(fields: readonly Field[]): StepValues {
  return Object.fromEntries(
    fields.flatMap((field) =>
      field.kind === FieldKind.unsupported ? [] : [[field.name, field.defaultValue] as const],
    ),
  )
}

export function setInput(chain: Chain, input: string): Chain {
  return input === chain.input ? chain : { ...chain, input }
}

/** Adds `transformation` at the end, with every field at its default. */
export function addStep(chain: Chain, transformation: Transformation, id: string): Chain {
  const step: Step = {
    id,
    transformationId: transformation.id,
    values: defaultValues(transformation.fields),
  }
  return { ...chain, steps: [...chain.steps, step] }
}

export function removeStep(chain: Chain, id: string): Chain {
  const steps = chain.steps.filter((step) => step.id !== id)
  return steps.length === chain.steps.length ? chain : { ...chain, steps }
}

/** Swaps a step with its neighbour; at either end of the chain nothing changes. */
export function moveStep(chain: Chain, id: string, direction: Direction): Chain {
  const from = chain.steps.findIndex((step) => step.id === id)
  const to = from + direction
  const moving = chain.steps[from]
  const neighbour = chain.steps[to]
  if (moving === undefined || neighbour === undefined) {
    return chain
  }
  return { ...chain, steps: chain.steps.with(from, neighbour).with(to, moving) }
}

export function setValue(chain: Chain, id: string, name: string, value: ParameterValue): Chain {
  const index = chain.steps.findIndex((step) => step.id === id)
  const step = chain.steps[index]
  if (step === undefined || step.values[name] === value) {
    return chain
  }
  return {
    ...chain,
    steps: chain.steps.with(index, { ...step, values: { ...step.values, [name]: value } }),
  }
}
