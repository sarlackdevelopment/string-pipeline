// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { ApiErrorKind } from '@/api/client'
import { failureMessage } from '@/components/PipelineEditor/model/messages'
import { ApiFailure } from '@/queries/client'

describe('what the editor says when a call fails', () => {
  it('tells the user to check the server when it cannot be reached', () => {
    const failure = new ApiFailure({ kind: ApiErrorKind.network, message: 'Failed to fetch' })

    expect(failureMessage(failure)).toMatch(/cannot be reached/)
  })

  it('names the status of an error without Problem Details', () => {
    const failure = new ApiFailure({ kind: ApiErrorKind.http, status: 503, statusText: '' })

    expect(failureMessage(failure)).toMatch(/HTTP 503/)
  })

  it('says when the server answers in a shape the app does not know', () => {
    const failure = new ApiFailure({ kind: ApiErrorKind.invalid, detail: 'x' })

    expect(failureMessage(failure)).toMatch(/does not understand/)
  })

  it('shows the detail of Problem Details (D41)', () => {
    const problem = {
      status: 400,
      title: 'Bad Request',
      detail: 'Invalid request content.',
      errors: [],
    }
    const failure = new ApiFailure({ kind: ApiErrorKind.problem, problem })

    expect(failureMessage(failure)).toBe('Invalid request content.')
  })

  it('asks for a reload after an error in the app itself', () => {
    expect(failureMessage(new TypeError('bug'))).toMatch(/Reload the page/)
  })
})
