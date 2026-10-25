/**
 * The wire format of the API, checked with zod and turned into domain types in one pass (D20, D46).
 *
 * The envelope is strict: frontend and backend ship together, so an unexpected key is a bug to report, not to
 * ignore. Parameter schemas stay open: `model/fields.ts` reads the kinds it knows and shows the rest as unsupported
 * (D43). Problem Details stay open too, because RFC 9457 allows extension members.
 */
import { z } from 'zod'
import type { Catalog, Example, Transformation } from '@/model/catalog'
import { defaultValues } from '@/model/chain'
import { toFields } from '@/model/fields'
import type { Problem } from '@/model/problem'
import { StepStatus, type RunResult, type StepResult } from '@/model/run'

/** A parsed value, or why the JSON does not match the contract. */
export type Parsed<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly detail: string }

const nonEmpty = z.string().min(1)

// A step of an example has the shape of a step of a run request, without its id (D50).
const exampleSchema = z.strictObject({
  id: nonEmpty,
  name: nonEmpty,
  input: z.string(),
  steps: z
    .array(
      z.strictObject({
        transformation: nonEmpty,
        parameters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
      }),
    )
    .min(1),
})

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
    examples: z.array(exampleSchema),
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
    // An example is made of the catalog's own transformations and parameters (D50).
    const properties = new Map(
      catalog.transformations.map((transformation) => [
        transformation.id,
        transformation.parameters.properties,
      ]),
    )
    const exampleIds = new Set<string>()
    catalog.examples.forEach((example, index) => {
      const path = ['examples', index]
      if (exampleIds.has(example.id)) {
        context.addIssue({
          code: 'custom',
          path: [...path, 'id'],
          message: `Duplicate example id ${example.id}`,
        })
      }
      exampleIds.add(example.id)
      example.steps.forEach((step, stepIndex) => {
        const stepPath = [...path, 'steps', stepIndex]
        const known = properties.get(step.transformation)
        if (known === undefined) {
          const message = `Unknown transformation ${step.transformation}`
          context.addIssue({ code: 'custom', path: [...stepPath, 'transformation'], message })
          return
        }
        for (const name of Object.keys(step.parameters)) {
          if (!(name in known)) {
            const message = `Unknown parameter ${name} of ${step.transformation}`
            context.addIssue({ code: 'custom', path: [...stepPath, 'parameters', name], message })
          }
        }
      })
    })
  })
  .transform((catalog): Catalog => {
    const transformations = catalog.transformations.map(({ parameters, ...transformation }) => ({
      ...transformation,
      fields: toFields(parameters),
    }))
    return {
      limits: catalog.limits,
      categories: catalog.categories,
      transformations,
      examples: catalog.examples.map((example) => toExample(example, transformations)),
    }
  })

// Every field gets a value, the example's or the field's default, as a step added from the picker has.
function toExample(
  example: z.infer<typeof exampleSchema>,
  transformations: readonly Transformation[],
): Example {
  return {
    id: example.id,
    name: example.name,
    chain: {
      input: example.input,
      steps: example.steps.map((step) => {
        const fields = transformations.find(({ id }) => id === step.transformation)?.fields ?? []
        return {
          transformationId: step.transformation,
          values: { ...defaultValues(fields), ...step.parameters },
          enabled: true,
        }
      }),
    },
  }
}

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
