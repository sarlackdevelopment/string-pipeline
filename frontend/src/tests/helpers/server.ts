/**
 * The mock API server for tests (D33). It intercepts `fetch` at the network level, so the app's real request code
 * runs; each test adds the handlers it needs with `server.use(...)`.
 */
import { setupServer } from 'msw/node'

export const server = setupServer()

/** A JSON response with the given status and content type, from a value of unknown shape. */
export function jsonResponse(
  value: unknown,
  init: { status?: number; contentType?: string } = {},
): Response {
  return new Response(JSON.stringify(value), {
    status: init.status ?? 200,
    headers: { 'Content-Type': init.contentType ?? 'application/json' },
  })
}
