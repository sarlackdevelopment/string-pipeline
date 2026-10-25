/**
 * What the editor tells the user when a call fails: what happened, and what to do about it.
 */
import { ApiErrorKind, type ApiError } from '@/api/client'
import { ApiFailure } from '@/queries/client'

export function failureMessage(error: Error): string {
  return error instanceof ApiFailure
    ? apiErrorMessage(error.error)
    : 'Something went wrong in the app. Reload the page to start again.'
}

function apiErrorMessage(error: ApiError): string {
  switch (error.kind) {
    case ApiErrorKind.network:
      return 'The server cannot be reached. Check that it is running, then try again.'
    case ApiErrorKind.http:
      return `The server answered with HTTP ${String(error.status)}. Try again in a moment.`
    case ApiErrorKind.invalid:
      return 'The server sent an answer that this app does not understand. The app and the server may be from different versions.'
    case ApiErrorKind.problem:
      return error.problem.detail
  }
}
