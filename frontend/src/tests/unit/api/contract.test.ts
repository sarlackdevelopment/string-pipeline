// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parseCatalog, parseProblem, parseRunResult, type Parsed } from '@/api/contract'
import { StepStatus } from '@/model/run'
import { readContract } from '@/tests/helpers/contract'

function value<T>(parsed: Parsed<T>): T {
  if (!parsed.ok) {
    throw new Error(parsed.detail)
  }
  return parsed.value
}

function detail<T>(parsed: Parsed<T>): string {
  if (parsed.ok) {
    throw new Error('Expected the JSON to be rejected')
  }
  return parsed.detail
}

// The contract catalog as a mutable object, to break one thing at a time.
function catalogJson(): {
  categories: { id: string; name: string }[]
  transformations: { id: string; category: string; parameters: { required: string[] } }[]
  [key: string]: unknown
} {
  return readContract('catalog.json') as ReturnType<typeof catalogJson>
}

describe('every file in contract/ parses with the app schemas (D20, D46)', () => {
  it('parses the catalog', () => {
    const catalog = value(parseCatalog(readContract('catalog.json')))

    expect(catalog.limits).toEqual({ maxInputLength: 100_000, maxSteps: 50 })
    expect(catalog.categories.map((category) => category.id)).toEqual([
      'text',
      'lines',
      'conversions',
      'regex',
    ])
    expect(catalog.transformations.map((transformation) => transformation.id)).toEqual([
      'replace',
      'append',
      'prepend',
      'substring',
      'changeCase',
      'lineOperations',
      'encode',
      'decode',
      'reformatDates',
      'regexExtract',
      'regexReplace',
    ])
  })

  it('parses the brief-chain response into results by step id', () => {
    const result = value(parseRunResult(readContract('examples/brief-chain.response.json')))

    expect(result.output).toBe('Python rocks!')
    expect(result.steps.get('s2')).toEqual({
      status: StepStatus.executed,
      output: 'Real Python rocks!',
    })
  })

  it('parses every step status of the step-statuses response', () => {
    const result = value(parseRunResult(readContract('examples/step-statuses.response.json')))

    expect(result.output).toBeNull()
    expect([...result.steps]).toEqual([
      ['s1', { status: StepStatus.executed, output: 'Price: €5' }],
      ['s2', { status: StepStatus.notConfigured, issues: { old: 'Enter a value' } }],
      [
        's3',
        {
          status: StepStatus.invalidParameters,
          issues: { replacement: 'The pattern has no group 5. Write \\$ for a dollar sign.' },
        },
      ],
      ['s4', { status: StepStatus.notRun }],
    ])
  })

  it('parses the Problem Details example', () => {
    expect(
      value(parseProblem(readContract('examples/unknown-transformation.response.json'))),
    ).toEqual({
      status: 400,
      title: 'Bad Request',
      detail: 'Invalid request content.',
      errors: [{ pointer: '#/steps/0/transformation', detail: 'Unknown transformation: reverse' }],
    })
  })
})

describe('a catalog that breaks the contract is rejected with the reason', () => {
  it('rejects an unexpected key, since both sides ship together', () => {
    const json = { ...catalogJson(), version: 2 }

    expect(detail(parseCatalog(json))).toContain('version')
  })

  it('rejects a transformation in an unlisted category', () => {
    const json = catalogJson()
    json.categories = json.categories.filter((category) => category.id !== 'regex')

    expect(detail(parseCatalog(json))).toContain('Unknown category regex')
  })

  it('rejects two transformations with the same id', () => {
    const json = catalogJson()
    json.transformations = [...json.transformations, ...json.transformations.slice(0, 1)]

    expect(detail(parseCatalog(json))).toContain('Duplicate id replace')
  })

  it('rejects a required parameter without a schema', () => {
    const json = catalogJson()
    json.transformations[0]?.parameters.required.push('missing')

    expect(detail(parseCatalog(json))).toContain('Required parameter missing has no schema')
  })
})

describe('a run response that breaks the contract is rejected with the reason', () => {
  it('rejects an unknown status', () => {
    const json = { steps: [{ id: 's1', status: 'skipped' }], output: null }

    expect(detail(parseRunResult(json))).toContain('status')
  })

  it('rejects two results for the same step id', () => {
    const step = { id: 's1', status: StepStatus.notRun }

    expect(detail(parseRunResult({ steps: [step, step], output: null }))).toContain(
      'Duplicate id s1',
    )
  })
})

describe('Problem Details', () => {
  it('accepts extension members and a problem without errors', () => {
    expect(
      value(
        parseProblem({
          type: 'about:blank',
          status: 500,
          title: 'Internal Server Error',
          traceId: 'x',
        }),
      ),
    ).toEqual({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Internal Server Error',
      errors: [],
    })
  })
})
