// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { IssueSeverity } from '@/components/ParameterForm/types'
import { fieldIssues } from '@/components/StepCard/model/issues'
import { StepStatus } from '@/model/run'

describe('the messages at the fields of a step (D12, D41, D42)', () => {
  it('shows a missing value as a hint', () => {
    const result = { status: StepStatus.notConfigured, issues: { old: 'Enter a value' } } as const

    expect(fieldIssues(result, undefined)).toEqual({
      old: { message: 'Enter a value', severity: IssueSeverity.hint },
    })
  })

  it('shows a wrong value as an error', () => {
    const result = {
      status: StepStatus.invalidParameters,
      issues: { replacement: 'The pattern has no group 5.' },
    } as const

    expect(fieldIssues(result, undefined)).toEqual({
      replacement: { message: 'The pattern has no group 5.', severity: IssueSeverity.error },
    })
  })

  it('shows nothing for a step that executed, failed or did not run', () => {
    expect(fieldIssues({ status: StepStatus.executed, output: '' }, undefined)).toEqual({})
    expect(fieldIssues({ status: StepStatus.failed, message: 'x' }, undefined)).toEqual({})
    expect(fieldIssues(undefined, undefined)).toEqual({})
  })

  it('shows what a rejected request said about a field as an error, over the older result', () => {
    const result = { status: StepStatus.notConfigured, issues: { old: 'Enter a value' } } as const
    const errors = { step: [], parameters: { old: 'This value has the wrong type.' } }

    expect(fieldIssues(result, errors)).toEqual({
      old: { message: 'This value has the wrong type.', severity: IssueSeverity.error },
    })
  })
})
