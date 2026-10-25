/**
 * TanStack Query setup (D29): the query client, and how a failed call becomes a query error.
 *
 * The API client returns every outcome as data. A query function unwraps it and throws an `ApiFailure`, so TanStack
 * Query keeps the failure as the query's error and retries what may pass on its own: a server that cannot be reached.
 */
import { QueryClient } from '@tanstack/vue-query'
import { ApiErrorKind, type ApiError, type ApiResult } from '@/api/client'

/** Retries after the first attempt, while the server cannot be reached. */
const NETWORK_RETRIES = 2

/** A failed API call, as an `Error` so that TanStack Query treats it as one. */
export class ApiFailure extends Error {
  readonly error: ApiError

  constructor(error: ApiError) {
    super(`The API call failed: ${error.kind}`)
    this.name = 'ApiFailure'
    this.error = error
  }
}

export function unwrap<T>(result: ApiResult<T>): T {
  if (!result.ok) {
    throw new ApiFailure(result.error)
  }
  return result.value
}

/** Only an unreachable server is worth another try; the other failures would come back the same. */
export function shouldRetry(failureCount: number, error: Error): boolean {
  return (
    error instanceof ApiFailure &&
    error.error.kind === ApiErrorKind.network &&
    failureCount < NETWORK_RETRIES
  )
}

export function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: shouldRetry } } })
}
