/**
 * The chain being edited: the input text and the steps with their values (R1.2, R1.3, D1), each of which can be
 * turned off (D48).
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
  /** A step that is off stays in the chain, but runs leave it out: the text passes through it unchanged (D48). */
  readonly enabled: boolean
}

export interface Chain {
  readonly input: string
  readonly steps: readonly Step[]
}

/** A chain without step ids, as a link holds it (D49); the store gives its steps new ids. */
export interface ChainContent {
  readonly input: string
  readonly steps: readonly Omit<Step, 'id'>[]
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

/** The chain of `content`, with ids from `nextId`, which must never return the same id twice (D40). */
export function withIds(content: ChainContent, nextId: () => string): Chain {
  return {
    input: content.input,
    steps: content.steps.map((step) => ({ ...step, id: nextId() })),
  }
}

export function setInput(chain: Chain, input: string): Chain {
  return input === chain.input ? chain : { ...chain, input }
}

/** Adds `transformation` at the end, turned on, with every field at its default. */
export function addStep(chain: Chain, transformation: Transformation, id: string): Chain {
  const step: Step = {
    id,
    transformationId: transformation.id,
    values: defaultValues(transformation.fields),
    enabled: true,
  }
  return { ...chain, steps: [...chain.steps, step] }
}

export function removeStep(chain: Chain, id: string): Chain {
  const steps = chain.steps.filter((step) => step.id !== id)
  return steps.length === chain.steps.length ? chain : { ...chain, steps }
}

/** Swaps a step with its neighbour; at either end of the chain nothing changes. */
export function moveStep(chain: Chain, id: string, direction: Direction): Chain {
  return moveStepTo(chain, id, chain.steps.findIndex((step) => step.id === id) + direction)
}

/**
 * Takes a step out and puts it back at `index`, as a drag and drop does (D54); the steps between move up or down by
 * one. An index outside the chain changes nothing.
 */
export function moveStepTo(chain: Chain, id: string, index: number): Chain {
  const from = chain.steps.findIndex((step) => step.id === id)
  const moving = chain.steps[from]
  if (moving === undefined || index === from || chain.steps[index] === undefined) {
    return chain
  }
  return { ...chain, steps: chain.steps.toSpliced(from, 1).toSpliced(index, 0, moving) }
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

/** Turns a step on or off; its values stay as they are. */
export function setEnabled(chain: Chain, id: string, enabled: boolean): Chain {
  const index = chain.steps.findIndex((step) => step.id === id)
  const step = chain.steps[index]
  if (step === undefined || step.enabled === enabled) {
    return chain
  }
  return { ...chain, steps: chain.steps.with(index, { ...step, enabled }) }
}
