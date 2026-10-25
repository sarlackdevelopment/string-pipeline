/**
 * Public types of the pipeline editor (D26): what its view shows.
 */
import type { StepPart } from '@/components/StepCard/types'
import type { FocusRequest } from '@/composables/useFocusRequest'
import type { Catalog, Transformation } from '@/model/catalog'
import type { StepValues } from '@/model/chain'
import type { StepErrors } from '@/model/problem'
import type { StepResult } from '@/model/run'

export const CatalogStatus = { loading: 'loading', failed: 'failed', ready: 'ready' } as const
export type CatalogStatus = (typeof CatalogStatus)[keyof typeof CatalogStatus]

export type CatalogState =
  | { readonly status: typeof CatalogStatus.loading }
  | { readonly status: typeof CatalogStatus.failed; readonly message: string }
  | { readonly status: typeof CatalogStatus.ready; readonly catalog: Catalog }

/** A step as the editor shows it. */
export interface StepItem {
  readonly id: string
  readonly transformation: Transformation
  readonly values: StepValues
  /** The latest result for this step's id; while the next run is on its way, the previous one. */
  readonly result: StepResult | undefined
  /** What a rejected request said about this step (D41). */
  readonly errors: StepErrors | undefined
}

/** A problem with the run as a whole, shown above the steps. */
export interface RunAlert {
  readonly messages: readonly string[]
  /** False when another try cannot help, as with a rejected request. */
  readonly canRetry: boolean
}

/** The focus target of the search field that adds steps. */
export const SEARCH = 'search'

/** Where the focus goes after an edit (D15): a part of a step, or the search field. */
export type FocusTarget =
  (FocusRequest<StepPart> & { readonly stepId: string }) | FocusRequest<typeof SEARCH>
