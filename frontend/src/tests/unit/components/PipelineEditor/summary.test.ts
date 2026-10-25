// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { runSummary } from '@/components/PipelineEditor/model/summary'
import type { StepItem } from '@/components/PipelineEditor/types'
import { Language } from '@/i18n'
import type { Transformation } from '@/model/catalog'
import { StepStatus, type StepResult } from '@/model/run'
import { translate } from '@/tests/helpers/i18n'

const t = translate()

const transformation = (name: string): Transformation => ({
  id: name.toLowerCase(),
  name,
  category: 'text',
  description: '',
  fields: [],
})

const step = (name: string, result: StepResult | undefined): StepItem => ({
  id: name,
  transformation: transformation(name),
  values: {},
  enabled: true,
  result,
  errors: undefined,
})

// A step that is off has no result (D48).
const off = (name: string): StepItem => ({ ...step(name, undefined), enabled: false })

const executed: StepResult = { status: StepStatus.executed, output: 'x' }

describe('the summary of a run for the live region (D15)', () => {
  it('says nothing for an empty chain', () => {
    expect(runSummary([], t)).toBe('')
  })

  it('says that every step ran', () => {
    expect(runSummary([step('Replace', executed)], t)).toBe('The step ran.')
    expect(runSummary([step('Replace', executed), step('Append', executed)], t)).toBe(
      'All 2 steps ran.',
    )
  })

  it.each<[StepResult, string]>([
    [{ status: StepStatus.notConfigured, issues: {} }, 'Step 2, Append, needs a value.'],
    [{ status: StepStatus.invalidParameters, issues: {} }, 'Step 2, Append, has an invalid value.'],
    [
      { status: StepStatus.failed, message: 'The text grew too long.' },
      'Step 2, Append, failed: The text grew too long.',
    ],
  ])('names the step that stopped the chain, and why: %j', (result, sentence) => {
    const steps = [step('Replace', executed), step('Append', result), step('Prepend', undefined)]

    expect(runSummary(steps, t)).toBe(sentence)
  })

  it('says nothing about a step that has no result, while a run is on its way or after it failed', () => {
    expect(runSummary([step('Replace', undefined)], t)).toBe('')
  })

  it('counts the steps that are off, and says when every step is off (D48)', () => {
    expect(runSummary([step('Replace', executed), off('Append')], t)).toBe(
      '1 of 2 steps ran; 1 is off.',
    )
    expect(runSummary([off('Replace'), step('Append', executed), off('Prepend')], t)).toBe(
      '1 of 3 steps ran; 2 are off.',
    )
    expect(runSummary([off('Replace')], t)).toBe('The step is off.')
    expect(runSummary([off('Replace'), off('Append')], t)).toBe('All 2 steps are off.')
  })

  it('names a step that stopped the chain by its place in the whole chain, steps that are off included', () => {
    const steps = [off('Replace'), step('Append', { status: StepStatus.notConfigured, issues: {} })]

    expect(runSummary(steps, t)).toBe('Step 2, Append, needs a value.')
  })

  it('speaks the language of the interface (D52)', () => {
    const stopped = [
      step('Ersetzen', executed),
      step('Anhängen', { status: StepStatus.notConfigured, issues: {} }),
    ]
    const someOff = [step('Replace', executed), off('Append'), off('Prepend')]

    expect(runSummary(stopped, translate(Language.de))).toBe(
      'Schritt 2, Anhängen, braucht einen Wert.',
    )
    expect(runSummary(someOff, translate(Language.ru))).toBe(
      'Выполнено шагов: 1 из 3, выключено: 2.',
    )
  })

  it('leaves the output out, so typing into the input does not change the sentence', () => {
    const before = runSummary([step('Replace', { status: StepStatus.executed, output: 'a' })], t)
    const after = runSummary([step('Replace', { status: StepStatus.executed, output: 'ab' })], t)

    expect(after).toBe(before)
  })
})
