/**
 * What the editor tells the user when a call fails or a link cannot be opened: what happened, and what to do about
 * it, in the interface's language (D52). Problem Details come from the server, already in that language.
 */
import { ApiErrorKind, type ApiError } from '@/api/client'
import type { Translate } from '@/i18n'
import { LinkProblemKind, type LinkProblem } from '@/model/link'
import { ApiFailure } from '@/queries/client'

export function failureMessage(error: Error, t: Translate): string {
  return error instanceof ApiFailure ? apiErrorMessage(error.error, t) : t('failure.app')
}

export function linkProblemMessage(problem: LinkProblem, t: Translate): string {
  switch (problem.kind) {
    case LinkProblemKind.unreadable:
      return t('link.unreadable')
    case LinkProblemKind.unknownTransformation:
      return t('link.unknownTransformation', { transformation: problem.transformation })
  }
}

function apiErrorMessage(error: ApiError, t: Translate): string {
  switch (error.kind) {
    case ApiErrorKind.network:
      return t('failure.network')
    case ApiErrorKind.http:
      return t('failure.http', { status: error.status })
    case ApiErrorKind.invalid:
      return t('failure.invalid')
    case ApiErrorKind.problem:
      return error.problem.detail
  }
}
