/**
 * The editor's controller (D26, D29): joins the chain in the store, the catalog query and the run query, and gives
 * the view plain data and handlers. Only controllers touch stores and queries.
 */
import { computed, shallowRef } from 'vue'
import { ApiErrorKind } from '@/api/client'
import { findTransformation, type Catalog, type Transformation } from '@/model/catalog'
import type { Direction } from '@/model/chain'
import { locateErrors, type LocatedErrors } from '@/model/problem'
import { toRunRequest } from '@/model/run'
import { useCatalog } from '@/queries/catalog'
import { ApiFailure } from '@/queries/client'
import { usePipelineRun } from '@/queries/run'
import { usePipelineStore } from '@/stores/pipeline'
import { focusAfterAdding, focusAfterMoving, focusAfterRemoving } from './model/focus'
import { failureMessage } from './model/messages'
import { runSummary } from './model/summary'
import {
  CatalogStatus,
  type CatalogState,
  type FocusTarget,
  type RunAlert,
  type StepItem,
} from './types'

export function usePipelineEditorController() {
  const store = usePipelineStore()
  const catalogQuery = useCatalog()
  const run = usePipelineRun(() => toRunRequest(store.chain))

  const catalogState = computed<CatalogState>(() => {
    const catalog = catalogQuery.data.value
    if (catalog !== undefined) {
      return { status: CatalogStatus.ready, catalog }
    }
    const error = catalogQuery.error.value
    return error === null
      ? { status: CatalogStatus.loading }
      : { status: CatalogStatus.failed, message: failureMessage(error) }
  })

  // A rejected request (D41) points at what was wrong in it: in the request that was sent, not in the chain as it is
  // now.
  const requestErrors = computed<LocatedErrors | null>(() => {
    const error = run.error.value
    return error instanceof ApiFailure && error.error.kind === ApiErrorKind.problem
      ? locateErrors(error.error.problem, run.sentRequest.value)
      : null
  })

  const runAlert = computed<RunAlert | null>(() => {
    const error = run.error.value
    if (error === null) {
      return null
    }
    const located = requestErrors.value
    if (located === null) {
      return { messages: [failureMessage(error)], canRetry: true }
    }
    return located.general.length > 0 ? { messages: located.general, canRetry: false } : null
  })

  const steps = computed<readonly StepItem[]>(() => {
    const catalog = catalogQuery.data.value
    if (catalog === undefined) {
      return []
    }
    // A step that is off is not in the request, so what an earlier run said about its id no longer applies.
    return store.chain.steps.map((step) => ({
      id: step.id,
      transformation: transformationOf(catalog, step.transformationId),
      values: step.values,
      enabled: step.enabled,
      result: step.enabled ? run.result.value?.steps.get(step.id) : undefined,
      errors: step.enabled ? requestErrors.value?.steps.get(step.id) : undefined,
    }))
  })

  // While a run is on its way, the previous sentence stays, so the live region speaks once per result (D15).
  const summary = computed<string>((previous) =>
    run.isUpdating.value ? (previous ?? '') : runSummary(steps.value),
  )

  // Set after every edit that adds, removes or moves a step; the view hands it to the component that owns the place.
  const focusTarget = shallowRef<FocusTarget | null>(null)

  function addStep(transformationId: string): void {
    const catalog = catalogQuery.data.value
    const transformation = catalog && findTransformation(catalog, transformationId)
    if (transformation !== undefined) {
      focusTarget.value = focusAfterAdding(store.addStep(transformation))
    }
  }

  function removeStep(id: string): void {
    const target = focusAfterRemoving(store.chain, id)
    store.removeStep(id)
    focusTarget.value = target
  }

  function moveStep(id: string, direction: Direction): void {
    store.moveStep(id, direction)
    focusTarget.value = focusAfterMoving(store.chain, id, direction)
  }

  return {
    catalogState,
    input: computed(() => store.chain.input),
    inputErrors: computed(() => requestErrors.value?.input ?? []),
    steps,
    result: run.result,
    isUpdating: run.isUpdating,
    runAlert,
    summary,
    focusTarget,
    retryCatalog: () => {
      void catalogQuery.refetch()
    },
    retryRun: run.retry,
    // Pinia binds actions to their store, so they can be handed on as they are.
    setInput: store.setInput,
    addStep,
    removeStep,
    moveStep,
    setValue: store.setValue,
    setEnabled: store.setEnabled,
  }
}

// Steps are only added from the catalog, which does not change while the page is open: a step whose transformation
// is missing is a bug, and the error boundary shows it.
function transformationOf(catalog: Catalog, id: string): Transformation {
  const transformation = findTransformation(catalog, id)
  if (transformation === undefined) {
    throw new Error(`The catalog has no transformation "${id}".`)
  }
  return transformation
}
