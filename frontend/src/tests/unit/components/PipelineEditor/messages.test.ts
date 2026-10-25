// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { ApiErrorKind } from '@/api/client'
import { failureMessage, linkProblemMessage } from '@/components/PipelineEditor/model/messages'
import { Language } from '@/i18n'
import { LinkProblemKind } from '@/model/link'
import { ApiFailure } from '@/queries/client'
import { translate } from '@/tests/helpers/i18n'

const t = translate()

describe('what the editor says about a link it cannot open (D49)', () => {
  it('says when a link holds no chain', () => {
    expect(linkProblemMessage({ kind: LinkProblemKind.unreadable }, t)).toMatch(
      /does not hold a chain/,
    )
  })

  it('names a transformation that the app does not have, in the language of the interface (D52)', () => {
    const problem = { kind: LinkProblemKind.unknownTransformation, transformation: 'reverse' }

    expect(linkProblemMessage(problem, t)).toBe(
      'It uses a transformation that this app does not have: "reverse".',
    )
    expect(linkProblemMessage(problem, translate(Language.ru))).toBe(
      'В ней используется преобразование, которого нет в приложении: «reverse».',
    )
  })
})

describe('what the editor says when a call fails', () => {
  it('tells the user to check the server when it cannot be reached', () => {
    const failure = new ApiFailure({ kind: ApiErrorKind.network, message: 'Failed to fetch' })

    expect(failureMessage(failure, t)).toMatch(/cannot be reached/)
  })

  it('names the status of an error without Problem Details', () => {
    const failure = new ApiFailure({ kind: ApiErrorKind.http, status: 503, statusText: '' })

    expect(failureMessage(failure, t)).toMatch(/HTTP 503/)
  })

  it('says when the server answers in a shape the app does not know', () => {
    const failure = new ApiFailure({ kind: ApiErrorKind.invalid, detail: 'x' })

    expect(failureMessage(failure, t)).toMatch(/does not understand/)
  })

  it('shows the detail of Problem Details (D41)', () => {
    const problem = {
      status: 400,
      title: 'Bad Request',
      detail: 'Invalid request content.',
      errors: [],
    }
    const failure = new ApiFailure({ kind: ApiErrorKind.problem, problem })

    expect(failureMessage(failure, t)).toBe('Invalid request content.')
  })

  it('asks for a reload after an error in the app itself', () => {
    expect(failureMessage(new TypeError('bug'), t)).toMatch(/Reload the page/)
  })
})
