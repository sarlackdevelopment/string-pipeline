// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { runSummary } from '@/components/PipelineEditor/model/summary'
import type { StepItem } from '@/components/PipelineEditor/types'
import type { Transformation } from '@/model/catalog'
import { StepStatus, type StepResult } from '@/model/run'

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
  result,
  errors: undefined,
})

const executed: StepResult = { status: StepStatus.executed, output: 'x' }

describe('the summary of a run for the live region (D15)', () => {
  it('says nothing for an empty chain', () => {
    expect(runSummary([])).toBe('')
  })

  it('says that every step ran', () => {
    expect(runSummary([step('Replace', executed)])).toBe('The step ran.')
    expect(runSummary([step('Replace', executed), step('Append', executed)])).toBe(
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

    expect(runSummary(steps)).toBe(sentence)
  })

  it('says nothing about a step that has no result, while a run is on its way or after it failed', () => {
    expect(runSummary([step('Replace', undefined)])).toBe('')
  })

  it('leaves the output out, so typing into the input does not change the sentence', () => {
    const before = runSummary([step('Replace', { status: StepStatus.executed, output: 'a' })])
    const after = runSummary([step('Replace', { status: StepStatus.executed, output: 'ab' })])

    expect(after).toBe(before)
  })
})
