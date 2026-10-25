// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { locateErrors, pointerSegments, type FieldError, type Problem } from '@/model/problem'
import type { RunRequest } from '@/model/run'

const request: RunRequest = {
  input: 'abc',
  steps: [
    { id: 'first', transformation: 'append', parameters: {} },
    { id: 'second', transformation: 'replace', parameters: {} },
  ],
}

const problem = (...errors: FieldError[]): Problem => ({
  status: 400,
  title: 'Bad Request',
  detail: 'Invalid request content.',
  errors,
})

describe('placing request errors (D41)', () => {
  it('puts an error about the input at the input', () => {
    const located = locateErrors(problem({ pointer: '#/input', detail: 'Too long.' }), request)

    expect(located.input).toEqual(['Too long.'])
    expect(located.general).toEqual([])
  })

  it('puts errors about a step at the step the request had at that index', () => {
    const located = locateErrors(
      problem(
        { pointer: '#/steps/1/transformation', detail: 'Unknown transformation: reverse' },
        { pointer: '#/steps/1/parameters/colour', detail: 'Replace has no parameter colour.' },
      ),
      request,
    )

    expect(located.steps.get('second')).toEqual({
      step: ['Unknown transformation: reverse'],
      parameters: { colour: 'Replace has no parameter colour.' },
    })
    expect(located.steps.has('first')).toBe(false)
  })

  it('reads escaped parameter names (RFC 6901)', () => {
    const located = locateErrors(
      problem({ pointer: '#/steps/0/parameters/a~1b~0c', detail: 'Bad.' }),
      request,
    )

    expect(located.steps.get('first')?.parameters).toEqual({ 'a/b~c': 'Bad.' })
  })

  it('keeps errors without a better place in the general list', () => {
    const located = locateErrors(
      problem(
        { pointer: '#/steps', detail: 'Too many steps.' },
        { pointer: '#/steps/7/id', detail: 'No such step.' },
        { pointer: 'nonsense', detail: 'Something else.' },
      ),
      request,
    )

    expect(located.general).toEqual(['Too many steps.', 'No such step.', 'Something else.'])
  })

  it('shows the detail of a problem that names no field', () => {
    expect(locateErrors(problem(), request).general).toEqual(['Invalid request content.'])
  })

  it('splits a pointer into its segments', () => {
    expect(pointerSegments('#/steps/0/parameters/old')).toEqual(['steps', '0', 'parameters', 'old'])
    expect(pointerSegments('steps/0')).toEqual([])
  })
})
