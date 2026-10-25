/**
 * The chain in a link (D49). The fragment of the address holds it: `#chain=` and the chain as JSON, in UTF-8 and
 * URL-safe Base64 (RFC 4648). The JSON is a run request without step ids, and a step that is off says
 * `"enabled": false`. A fragment never reaches a server, and changing it does not reload the page.
 *
 * A link comes from outside, so reading one checks it: its shape with zod, its transformations against the catalog.
 * A value that no longer fits its field, as in a link from an older version of the app, gives way to the field's
 * default.
 */
import { z } from 'zod'
import { findTransformation, type Catalog } from './catalog'
import {
  defaultValues,
  type ChainContent,
  type ParameterValue,
  type Step,
  type StepValues,
} from './chain'
import { FieldKind, type Field } from './fields'

const KEY = 'chain'

const parameterValue = z.union([z.string(), z.number(), z.boolean(), z.null()])

// Extra keys are ignored: a link may come from a newer version of the app.
const linkSchema = z.object({
  input: z.string(),
  steps: z.array(
    z.object({
      transformation: z.string(),
      parameters: z.record(z.string(), parameterValue),
      enabled: z.boolean().optional(),
    }),
  ),
})

export const LinkStatus = { none: 'none', chain: 'chain', invalid: 'invalid' } as const
export type LinkStatus = (typeof LinkStatus)[keyof typeof LinkStatus]

/** Why a link cannot be opened. The editor says it in the interface's language (D52). */
export const LinkProblemKind = {
  unreadable: 'unreadable',
  unknownTransformation: 'unknownTransformation',
} as const

export type LinkProblem =
  | { readonly kind: typeof LinkProblemKind.unreadable }
  | {
      readonly kind: typeof LinkProblemKind.unknownTransformation
      readonly transformation: string
    }

export type LinkReading =
  | { readonly status: typeof LinkStatus.none }
  | { readonly status: typeof LinkStatus.chain; readonly chain: ChainContent }
  | { readonly status: typeof LinkStatus.invalid; readonly problem: LinkProblem }

/** The fragment of a link to `chain`; `''` for an empty chain, which needs none. */
export function toFragment(chain: ChainContent): string {
  if (chain.input === '' && chain.steps.length === 0) {
    return ''
  }
  const json = JSON.stringify({
    input: chain.input,
    steps: chain.steps.map((step) => ({
      transformation: step.transformationId,
      parameters: step.values,
      ...(step.enabled ? {} : { enabled: false }),
    })),
  })
  return `#${KEY}=${toBase64Url(json)}`
}

/** Reads the chain in a fragment, such as `location.hash`. */
export function fromFragment(fragment: string, catalog: Catalog): LinkReading {
  const encoded = new URLSearchParams(fragment.replace(/^#/, '')).get(KEY)
  if (encoded === null) {
    return { status: LinkStatus.none }
  }
  const parsed = linkSchema.safeParse(readJson(fromBase64Url(encoded)))
  if (!parsed.success) {
    return { status: LinkStatus.invalid, problem: { kind: LinkProblemKind.unreadable } }
  }
  const steps: Omit<Step, 'id'>[] = []
  for (const step of parsed.data.steps) {
    const transformation = findTransformation(catalog, step.transformation)
    if (transformation === undefined) {
      return {
        status: LinkStatus.invalid,
        problem: {
          kind: LinkProblemKind.unknownTransformation,
          transformation: step.transformation,
        },
      }
    }
    steps.push({
      transformationId: transformation.id,
      values: fitValues(transformation.fields, step.parameters),
      enabled: step.enabled ?? true,
    })
  }
  return { status: LinkStatus.chain, chain: { input: parsed.data.input, steps } }
}

/** Every field gets the link's value where it fits, and its default elsewhere; values without a field are dropped. */
function fitValues(
  fields: readonly Field[],
  given: Readonly<Record<string, ParameterValue>>,
): StepValues {
  const values: Record<string, ParameterValue> = { ...defaultValues(fields) }
  for (const field of fields) {
    const value = given[field.name]
    if (value !== undefined && fits(field, value)) {
      values[field.name] = value
    }
  }
  return values
}

// An unsupported field takes whatever the link holds: the server checks it (D43).
function fits(field: Field, value: ParameterValue): boolean {
  switch (field.kind) {
    case FieldKind.text:
      return typeof value === 'string'
    case FieldKind.integer:
      return value === null || Number.isInteger(value)
    case FieldKind.boolean:
      return typeof value === 'boolean'
    case FieldKind.choice:
      return field.options.some((option) => option.value === value)
    case FieldKind.unsupported:
      return true
  }
}

function toBase64Url(text: string): string {
  const binary = Array.from(new TextEncoder().encode(text), (byte) => String.fromCharCode(byte))
  return btoa(binary.join('')).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

/** `null` for anything that is not URL-safe Base64 of UTF-8 text. */
function fromBase64Url(encoded: string): string | null {
  try {
    const binary = atob(encoded.replaceAll('-', '+').replaceAll('_', '/'))
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return null
  }
}

// Text that is not JSON reaches the schema as `undefined`, which the schema then rejects.
function readJson(text: string | null): unknown {
  try {
    return text === null ? undefined : (JSON.parse(text) as unknown)
  } catch {
    return undefined
  }
}
