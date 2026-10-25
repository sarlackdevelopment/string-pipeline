/**
 * A stand-in for the API in tests that render the editor (D33). It serves a catalog and runs chains of Replace and
 * Append by the rules of D42, so a test can type, add steps and read results that look like the server's. The app
 * parses every response with its contract schemas, so the stand-in cannot drift from the wire format unnoticed.
 */
import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { readContract } from './contract'
import { jsonResponse, server } from './server'

export const CATALOG_URL = '*/api/catalog'
export const RUNS_URL = '*/api/runs'

const parameterValue = z.union([z.string(), z.number(), z.boolean(), z.null()])

const runRequestSchema = z.object({
  input: z.string(),
  steps: z.array(
    z.object({
      id: z.string(),
      transformation: z.string(),
      parameters: z.record(z.string(), parameterValue),
    }),
  ),
})

/** A run request as the server receives it. */
export type ReceivedRun = z.infer<typeof runRequestSchema>

export function serveCatalog(catalog: unknown = readContract('catalog.json')): void {
  server.use(http.get(CATALOG_URL, () => jsonResponse(catalog)))
}

/**
 * Answers every run with `respond`, after `before` has settled, and returns the requests the server received,
 * oldest first.
 */
export function serveRuns(
  respond: (request: ReceivedRun) => unknown = fakeRun,
  before: (request: ReceivedRun) => Promise<void> = () => Promise.resolve(),
): ReceivedRun[] {
  const received: ReceivedRun[] = []
  server.use(
    http.post(RUNS_URL, async ({ request }) => {
      const body = runRequestSchema.parse(await request.json())
      received.push(body)
      await before(body)
      return jsonResponse(respond(body))
    }),
  )
  return received
}

/** Rejects every run with HTTP 400 and Problem Details whose errors point into the request (D41). */
export function serveRejectedRuns(errors: readonly { pointer: string; detail: string }[]): void {
  const problem = { title: 'Bad Request', status: 400, detail: 'Invalid request content.', errors }
  server.use(
    http.post(RUNS_URL, () =>
      jsonResponse(problem, { status: 400, contentType: 'application/problem+json' }),
    ),
  )
}

/** Every call to the API fails as if the server were down. */
export function serveNetworkError(url: string): void {
  server.use(http.all(url, () => HttpResponse.error()))
}

/**
 * Replace and Append, checked and run as the server does it (D42): every step's values are checked, execution stops
 * at the first step that does not execute, and later valid steps are `notRun`.
 */
export function fakeRun(request: ReceivedRun): unknown {
  let text = request.input
  let stopped = false
  const steps = request.steps.map(({ id, transformation, parameters }) => {
    if (transformation === 'replace' && !hasText(parameters.old)) {
      stopped = true
      return {
        id,
        status: 'notConfigured',
        issues: [{ parameter: 'old', message: 'Enter a value' }],
      }
    }
    if (stopped) {
      return { id, status: 'notRun' }
    }
    text = apply(transformation, parameters, text)
    return { id, status: 'executed', output: text }
  })
  const executed = steps.every((step) => step.status === 'executed')
  return { steps, output: executed ? text : null }
}

function apply(
  transformation: string,
  parameters: ReceivedRun['steps'][number]['parameters'],
  text: string,
): string {
  switch (transformation) {
    case 'replace':
      return text.replaceAll(String(parameters.old), textOf(parameters.new))
    case 'append':
      return text + textOf(parameters.text)
    default:
      throw new Error(`The fake API cannot run ${transformation}.`)
  }
}

function hasText(value: z.infer<typeof parameterValue> | undefined): value is string {
  return typeof value === 'string' && value !== ''
}

function textOf(value: z.infer<typeof parameterValue> | undefined): string {
  return typeof value === 'string' ? value : ''
}

/** A response held back until the test opens the gate, to look at the editor while a run is on its way. */
export function gate(): { readonly opened: Promise<void>; readonly open: () => void } {
  const opening: { resolve?: () => void } = {}
  const opened = new Promise<void>((resolve) => {
    opening.resolve = resolve
  })
  return { opened, open: () => opening.resolve?.() }
}
