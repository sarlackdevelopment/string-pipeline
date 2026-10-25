/**
 * The catalog as the frontend sees it: limits, categories and transformations with their form fields (R2.1, D40).
 *
 * The frontend knows no transformation by name. Everything here comes from `GET /api/catalog` through
 * `api/contract.ts`, so a new transformation needs no frontend code (D19).
 */
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

export interface Catalog {
  readonly limits: Limits
  /** In display order. */
  readonly categories: readonly Category[]
  /** In display order. */
  readonly transformations: readonly Transformation[]
}

export function findTransformation(catalog: Catalog, id: string): Transformation | undefined {
  return catalog.transformations.find((transformation) => transformation.id === id)
}
