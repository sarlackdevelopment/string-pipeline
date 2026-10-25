/**
 * The editor's controller (D26, D29): joins the chain in the store, the catalog query and the run query, and gives
 * the view plain data and handlers. Only controllers touch stores and queries.
 */
import { computed } from 'vue'
import { ApiErrorKind } from '@/api/client'
import { findTransformation, type Catalog, type Transformation } from '@/model/catalog'
import { locateErrors, type LocatedErrors } from '@/model/problem'
import { toRunRequest } from '@/model/run'
import { useCatalog } from '@/queries/catalog'
import { ApiFailure } from '@/queries/client'
import { usePipelineRun } from '@/queries/run'
import { usePipelineStore } from '@/stores/pipeline'
import { failureMessage } from './model/messages'
import { CatalogStatus, type CatalogState, type RunAlert, type StepItem } from './types'

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
    return store.chain.steps.map((step) => ({
      id: step.id,
      transformation: transformationOf(catalog, step.transformationId),
      values: step.values,
      result: run.result.value?.steps.get(step.id),
      errors: requestErrors.value?.steps.get(step.id),
    }))
  })

  function addStep(transformationId: string): void {
    const catalog = catalogQuery.data.value
    const transformation = catalog && findTransformation(catalog, transformationId)
    if (transformation !== undefined) {
      store.addStep(transformation)
    }
  }

  return {
    catalogState,
    input: computed(() => store.chain.input),
    inputErrors: computed(() => requestErrors.value?.input ?? []),
    steps,
    result: run.result,
    isUpdating: run.isUpdating,
    runAlert,
    retryCatalog: () => {
      void catalogQuery.refetch()
    },
    retryRun: run.retry,
    // Pinia binds actions to their store, so they can be handed on as they are.
    setInput: store.setInput,
    addStep,
    removeStep: store.removeStep,
    moveStep: store.moveStep,
    setValue: store.setValue,
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
