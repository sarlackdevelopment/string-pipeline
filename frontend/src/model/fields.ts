/**
 * Form fields from the backend's JSON Schema (R2.1, D18, D27, D43).
 *
 * Four kinds are understood: text, integer, boolean and choice. A property in any other shape becomes an
 * `unsupported` field, which the form shows as a notice instead of guessing, so a new parameter kind on the server
 * cannot break the editor.
 */
import { z } from 'zod'

export const FieldKind = {
  text: 'text',
  integer: 'integer',
  boolean: 'boolean',
  choice: 'choice',
  unsupported: 'unsupported',
} as const
export type FieldKind = (typeof FieldKind)[keyof typeof FieldKind]

interface FieldBase {
  /** The parameter name: the key in a run request. */
  readonly name: string
  readonly title: string
  readonly description: string
}

export interface TextField extends FieldBase {
  readonly kind: typeof FieldKind.text
  /** A required text must not stay empty. */
  readonly required: boolean
  readonly defaultValue: string
  readonly maxLength: number | null
}

export interface IntegerField extends FieldBase {
  readonly kind: typeof FieldKind.integer
  /** `null` when the field may stay empty. */
  readonly defaultValue: number | null
  readonly minimum: number | null
  readonly maximum: number | null
}

export interface BooleanField extends FieldBase {
  readonly kind: typeof FieldKind.boolean
  readonly defaultValue: boolean
}

export interface ChoiceOption {
  readonly value: string
  readonly title: string
}

export interface ChoiceField extends FieldBase {
  readonly kind: typeof FieldKind.choice
  readonly defaultValue: string
  readonly options: readonly ChoiceOption[]
}

export interface UnsupportedField extends FieldBase {
  readonly kind: typeof FieldKind.unsupported
}

export type Field = TextField | IntegerField | BooleanField | ChoiceField | UnsupportedField

/** The parameters object of a transformation as the catalog sends it; property schemas stay unknown until read. */
export interface ParametersSchema {
  readonly properties: Readonly<Record<string, unknown>>
  readonly required: readonly string[]
}

// Unknown keywords are ignored, as JSON Schema ignores them; a known keyword with the wrong type is not.
const annotations = { title: z.string(), description: z.string() }

const choiceSchema = z.object({
  type: z.literal('string'),
  ...annotations,
  default: z.string(),
  oneOf: z.array(z.object({ const: z.string(), title: z.string() })).min(1),
})

const textSchema = z.object({
  type: z.literal('string'),
  ...annotations,
  default: z.string().optional(),
  maxLength: z.int().nonnegative().optional(),
})

const integerSchema = z.object({
  type: z.literal('integer'),
  ...annotations,
  default: z.int().optional(),
  minimum: z.int().optional(),
  maximum: z.int().optional(),
})

const booleanSchema = z.object({ type: z.literal('boolean'), ...annotations, default: z.boolean() })

const titledSchema = z.object({ title: z.string() })

/** The form fields of one transformation, in the server's display order. */
export function toFields(parameters: ParametersSchema): readonly Field[] {
  return Object.entries(parameters.properties).map(([name, schema]) =>
    toField(name, schema, parameters.required.includes(name)),
  )
}

// Choice before text: both are strings, and only a choice has `oneOf`.
function toField(name: string, schema: unknown, required: boolean): Field {
  const choice = choiceSchema.safeParse(schema)
  if (choice.success) {
    const { title, description, oneOf } = choice.data
    const options = oneOf.map((option) => ({ value: option.const, title: option.title }))
    return {
      kind: FieldKind.choice,
      name,
      title,
      description,
      defaultValue: choice.data.default,
      options,
    }
  }
  const text = textSchema.safeParse(schema)
  if (text.success) {
    const { title, description } = text.data
    return {
      kind: FieldKind.text,
      name,
      title,
      description,
      required,
      defaultValue: text.data.default ?? '',
      maxLength: text.data.maxLength ?? null,
    }
  }
  const integer = integerSchema.safeParse(schema)
  if (integer.success) {
    const { title, description } = integer.data
    return {
      kind: FieldKind.integer,
      name,
      title,
      description,
      defaultValue: integer.data.default ?? null,
      minimum: integer.data.minimum ?? null,
      maximum: integer.data.maximum ?? null,
    }
  }
  const bool = booleanSchema.safeParse(schema)
  if (bool.success) {
    const { title, description } = bool.data
    return { kind: FieldKind.boolean, name, title, description, defaultValue: bool.data.default }
  }
  const titled = titledSchema.safeParse(schema)
  return {
    kind: FieldKind.unsupported,
    name,
    title: titled.success ? titled.data.title : name,
    description: '',
  }
}
