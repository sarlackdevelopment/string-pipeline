/**
 * The two calls of the API (D20, D40). Every outcome is data: a value, or what went wrong. Each call asks for the
 * texts in the interface's language with Accept-Language (D52).
 *
 * Cancellation is the one exception: an aborted request rejects, as `fetch` does, so TanStack Query can drop it
 * (D11, D29).
 */
import type { Catalog } from '@/model/catalog'
import type { Problem } from '@/model/problem'
import type { RunRequest, RunResult } from '@/model/run'
import { parseCatalog, parseProblem, parseRunResult, type Parsed } from './contract'

export const CATALOG_PATH = '/api/catalog'
export const RUNS_PATH = '/api/runs'

const JSON_TYPE = 'application/json'
const PROBLEM_TYPE = 'application/problem+json'

export const ApiErrorKind = {
  /** No response at all: the server is down or unreachable. */
  network: 'network',
  /** An error status without Problem Details. */
  http: 'http',
  /** A response that does not match the contract. */
  invalid: 'invalid',
  /** Problem Details from the server (D41). */
  problem: 'problem',
} as const
export type ApiErrorKind = (typeof ApiErrorKind)[keyof typeof ApiErrorKind]

export type ApiError =
  | { readonly kind: typeof ApiErrorKind.network; readonly message: string }
  | {
      readonly kind: typeof ApiErrorKind.http
      readonly status: number
      readonly statusText: string
    }
  | { readonly kind: typeof ApiErrorKind.invalid; readonly detail: string }
  | { readonly kind: typeof ApiErrorKind.problem; readonly problem: Problem }

export type ApiResult<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: ApiError }

export function fetchCatalog(language: string, signal?: AbortSignal): Promise<ApiResult<Catalog>> {
  return call(
    CATALOG_PATH,
    { method: 'GET', headers: { Accept: JSON_TYPE, 'Accept-Language': language }, signal },
    parseCatalog,
  )
}

export function postRun(
  request: RunRequest,
  language: string,
  signal?: AbortSignal,
): Promise<ApiResult<RunResult>> {
  return call(
    RUNS_PATH,
    {
      method: 'POST',
      headers: { Accept: JSON_TYPE, 'Accept-Language': language, 'Content-Type': JSON_TYPE },
      body: JSON.stringify(request),
      signal,
    },
    parseRunResult,
  )
}

async function call<T>(
  path: string,
  init: RequestInit,
  parse: (json: unknown) => Parsed<T>,
): Promise<ApiResult<T>> {
  let response: Response
  let body: string
  try {
    response = await fetch(new URL(path, window.location.href), init)
    body = await response.text()
  } catch (error) {
    if (init.signal?.aborted === true) {
      throw error
    }
    return failure({
      kind: ApiErrorKind.network,
      message: error instanceof Error ? error.message : String(error),
    })
  }
  const json = readJson(body)
  if (response.ok) {
    const parsed = parse(json)
    return parsed.ok
      ? { ok: true, value: parsed.value }
      : failure({ kind: ApiErrorKind.invalid, detail: parsed.detail })
  }
  if (response.headers.get('Content-Type')?.startsWith(PROBLEM_TYPE) === true) {
    const problem = parseProblem(json)
    if (problem.ok) {
      return failure({ kind: ApiErrorKind.problem, problem: problem.value })
    }
  }
  return failure({
    kind: ApiErrorKind.http,
    status: response.status,
    statusText: response.statusText,
  })
}

// A body that is not JSON reaches the schema as `undefined`, which the schema then reports.
function readJson(body: string): unknown {
  try {
    return JSON.parse(body) as unknown
  } catch {
    return undefined
  }
}

function failure(error: ApiError): { readonly ok: false; readonly error: ApiError } {
  return { ok: false, error }
}
