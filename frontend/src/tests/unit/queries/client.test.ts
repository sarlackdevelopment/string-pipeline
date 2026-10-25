// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { ApiErrorKind, type ApiError } from '@/api/client'
import { ApiFailure, shouldRetry, unwrap } from '@/queries/client'

const network: ApiError = { kind: ApiErrorKind.network, message: 'Failed to fetch' }
const http503: ApiError = {
  kind: ApiErrorKind.http,
  status: 503,
  statusText: 'Service Unavailable',
}

describe('unwrap', () => {
  it('returns the value of a successful call', () => {
    expect(unwrap({ ok: true, value: 42 })).toBe(42)
  })

  it('throws the failure as an ApiFailure, so TanStack Query keeps it as the error (D29)', () => {
    expect(() => unwrap({ ok: false, error: network })).toThrow(ApiFailure)
  })
})

describe('shouldRetry (D29)', () => {
  it('retries twice while the server cannot be reached', () => {
    const failure = new ApiFailure(network)

    expect([0, 1, 2].map((count) => shouldRetry(count, failure))).toEqual([true, true, false])
  })

  it('does not retry an answer from the server, which would come back the same', () => {
    expect(shouldRetry(0, new ApiFailure(http503))).toBe(false)
  })

  it('does not retry an error from the app itself', () => {
    expect(shouldRetry(0, new TypeError('bug'))).toBe(false)
  })
})
