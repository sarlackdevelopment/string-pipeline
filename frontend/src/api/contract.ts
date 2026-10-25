/**
 * The wire format of the API, checked with zod and turned into domain types in one pass (D20, D46).
 *
 * The envelope is strict: frontend and backend ship together, so an unexpected key is a bug to report, not to
 * ignore. Parameter schemas stay open: `model/fields.ts` reads the kinds it knows and shows the rest as unsupported
 * (D43). Problem Details stay open too, because RFC 9457 allows extension members.
 */
import { z } from 'zod'
import type { Catalog } from '@/model/catalog'
import { toFields } from '@/model/fields'
import type { Problem } from '@/model/problem'
import { StepStatus, type RunResult, type StepResult } from '@/model/run'

/** A parsed value, or why the JSON does not match the contract. */
export type Parsed<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly detail: string }

const nonEmpty = z.string().min(1)

const catalogSchema = z
  .strictObject({
    limits: z.strictObject({ maxInputLength: z.int().positive(), maxSteps: z.int().positive() }),
    categories: z.array(z.strictObject({ id: nonEmpty, name: nonEmpty })),
    transformations: z.array(
      z.strictObject({
        id: nonEmpty,
        name: nonEmpty,
        category: nonEmpty,
        description: z.string(),
        parameters: z.strictObject({
          type: z.literal('object'),
          properties: z.record(z.string(), z.unknown()),
          required: z.array(z.string()),
          additionalProperties: z.literal(false),
        }),
      }),
    ),
  })
  .superRefine((catalog, context) => {
    const categories = new Set(catalog.categories.map((category) => category.id))
    const ids = new Set<string>()
    catalog.transformations.forEach((transformation, index) => {
      const path = ['transformations', index]
      if (ids.has(transformation.id)) {
        context.addIssue({
          code: 'custom',
          path: [...path, 'id'],
          message: `Duplicate id ${transformation.id}`,
        })
      }
      ids.add(transformation.id)
      if (!categories.has(transformation.category)) {
        const message = `Unknown category ${transformation.category}`
        context.addIssue({ code: 'custom', path: [...path, 'category'], message })
      }
      for (const name of transformation.parameters.required) {
        if (!(name in transformation.parameters.properties)) {
          const message = `Required parameter ${name} has no schema`
          context.addIssue({ code: 'custom', path: [...path, 'parameters', 'required'], message })
        }
      }
    })
  })
  .transform((catalog): Catalog => ({
    limits: catalog.limits,
    categories: catalog.categories,
    transformations: catalog.transformations.map(({ parameters, ...transformation }) => ({
      ...transformation,
      fields: toFields(parameters),
    })),
  }))

const issuesSchema = z.array(z.strictObject({ parameter: nonEmpty, message: nonEmpty })).min(1)

const stepSchema = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal(StepStatus.executed), id: nonEmpty, output: z.string() }),
  z.strictObject({
    status: z.literal(StepStatus.notConfigured),
    id: nonEmpty,
    issues: issuesSchema,
  }),
  z.strictObject({
    status: z.literal(StepStatus.invalidParameters),
    id: nonEmpty,
    issues: issuesSchema,
  }),
  z.strictObject({ status: z.literal(StepStatus.failed), id: nonEmpty, message: nonEmpty }),
  z.strictObject({ status: z.literal(StepStatus.notRun), id: nonEmpty }),
])

const runResponseSchema = z
  .strictObject({ steps: z.array(stepSchema), output: z.string().nullable() })
  .superRefine((response, context) => {
    const ids = new Set<string>()
    response.steps.forEach((step, index) => {
      if (ids.has(step.id)) {
        context.addIssue({
          code: 'custom',
          path: ['steps', index, 'id'],
          message: `Duplicate id ${step.id}`,
        })
      }
      ids.add(step.id)
    })
  })
  .transform((response): RunResult => ({
    steps: new Map(response.steps.map((step) => [step.id, toStepResult(step)])),
    output: response.output,
  }))

function toStepResult(step: z.infer<typeof stepSchema>): StepResult {
  switch (step.status) {
    case StepStatus.executed:
      return { status: step.status, output: step.output }
    case StepStatus.notConfigured:
    case StepStatus.invalidParameters:
      return {
        status: step.status,
        issues: Object.fromEntries(step.issues.map((issue) => [issue.parameter, issue.message])),
      }
    case StepStatus.failed:
      return { status: step.status, message: step.message }
    case StepStatus.notRun:
      return { status: step.status }
  }
}

const problemSchema = z
  .object({
    status: z.int(),
    title: z.string().optional(),
    detail: z.string().optional(),
    errors: z.array(z.object({ pointer: z.string(), detail: z.string() })).optional(),
  })
  .transform((problem): Problem => ({
    status: problem.status,
    title: problem.title ?? '',
    detail: problem.detail ?? problem.title ?? 'The server could not handle the request.',
    errors: problem.errors ?? [],
  }))

function parseWith<T>(schema: z.ZodType<T>, json: unknown): Parsed<T> {
  const result = schema.safeParse(json)
  return result.success
    ? { ok: true, value: result.data }
    : { ok: false, detail: z.prettifyError(result.error) }
}

export function parseCatalog(json: unknown): Parsed<Catalog> {
  return parseWith(catalogSchema, json)
}

export function parseRunResult(json: unknown): Parsed<RunResult> {
  return parseWith(runResponseSchema, json)
}

export function parseProblem(json: unknown): Parsed<Problem> {
  return parseWith(problemSchema, json)
}
