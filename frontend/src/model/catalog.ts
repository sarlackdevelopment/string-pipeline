/**
 * The catalog as the frontend sees it: limits, categories, transformations with their form fields (R2.1, D40), and
 * example chains (D50).
 *
 * The frontend knows no transformation by name. Everything here comes from `GET /api/catalog` through
 * `api/contract.ts`, so a new transformation needs no frontend code (D19), and neither does a new example.
 */
import type { ChainContent } from './chain'
import type { Field } from './fields'

export interface Limits {
  readonly maxInputLength: number
  readonly maxSteps: number
}

export interface Category {
  readonly id: string
  readonly name: string
}

export interface Transformation {
  readonly id: string
  readonly name: string
  /** The id of its category. */
  readonly category: string
  readonly description: string
  readonly fields: readonly Field[]
}

/** A ready-made chain to start from (D50). */
export interface Example {
  readonly id: string
  readonly name: string
  /** Every field of every step has a value: the one the example sets, or the field's default. */
  readonly chain: ChainContent
}

export interface Catalog {
  readonly limits: Limits
  /** In display order. */
  readonly categories: readonly Category[]
  /** In display order. */
  readonly transformations: readonly Transformation[]
  /** In display order. */
  readonly examples: readonly Example[]
}

export function findTransformation(catalog: Catalog, id: string): Transformation | undefined {
  return catalog.transformations.find((transformation) => transformation.id === id)
}
