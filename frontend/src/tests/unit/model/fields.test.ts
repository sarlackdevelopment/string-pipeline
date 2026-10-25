// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parseCatalog } from '@/api/contract'
import type { Catalog, Transformation } from '@/model/catalog'
import { FieldKind, toFields, type ParametersSchema } from '@/model/fields'
import { readContract } from '@/tests/helpers/contract'

function contractCatalog(): Catalog {
  const parsed = parseCatalog(readContract('catalog.json'))
  if (!parsed.ok) {
    throw new Error(parsed.detail)
  }
  return parsed.value
}

function transformation(id: string): Transformation {
  const found = contractCatalog().transformations.find((candidate) => candidate.id === id)
  if (found === undefined) {
    throw new Error(`No transformation ${id} in the contract catalog`)
  }
  return found
}

function schema(properties: Record<string, unknown>, required: string[] = []): ParametersSchema {
  return { properties, required }
}

const annotations = { title: 'Title', description: 'Description.' }

describe('form fields from the catalog (R2.1, D43)', () => {
  it('reads a required text and an optional one with its default', () => {
    expect(transformation('replace').fields).toEqual([
      {
        kind: FieldKind.text,
        name: 'old',
        title: 'Find',
        description: 'The text to look for.',
        required: true,
        defaultValue: '',
        maxLength: 10_000,
      },
      {
        kind: FieldKind.text,
        name: 'new',
        title: 'Replace with',
        description: 'Leave empty to delete every match.',
        required: false,
        defaultValue: '',
        maxLength: 10_000,
      },
    ])
  })

  it('reads integers with a default, a minimum, or neither', () => {
    const [start, end] = transformation('substring').fields
    const [, group] = transformation('regexExtract').fields

    expect(start).toMatchObject({ kind: FieldKind.integer, defaultValue: 0, minimum: null })
    expect(end).toMatchObject({ kind: FieldKind.integer, defaultValue: null, minimum: null })
    expect(group).toMatchObject({
      kind: FieldKind.integer,
      defaultValue: 0,
      minimum: 0,
      maximum: null,
    })
  })

  it('reads a choice with its labelled options', () => {
    const matches = transformation('regexExtract').fields.find((field) => field.name === 'matches')

    expect(matches).toMatchObject({
      kind: FieldKind.choice,
      defaultValue: 'all',
      options: [
        { value: 'first', title: 'First match' },
        { value: 'all', title: 'All matches' },
      ],
    })
  })

  it('reads booleans', () => {
    const ignoreCase = transformation('regexReplace').fields.find(
      (field) => field.name === 'ignoreCase',
    )

    expect(ignoreCase).toMatchObject({
      kind: FieldKind.boolean,
      defaultValue: false,
      title: 'Ignore case',
    })
  })

  it('keeps the display order of the server', () => {
    expect(transformation('regexExtract').fields.map((field) => field.name)).toEqual([
      'pattern',
      'group',
      'matches',
      'ignoreCase',
      'multiline',
      'dotAll',
    ])
  })

  it('shows an unknown kind as unsupported instead of guessing', () => {
    const fields = toFields(schema({ tags: { type: 'array', ...annotations } }))

    expect(fields).toEqual([
      { kind: FieldKind.unsupported, name: 'tags', title: 'Title', description: '' },
    ])
  })

  it('names an unsupported field after its parameter when it has no title', () => {
    expect(toFields(schema({ tags: { type: 'array' } }))).toEqual([
      { kind: FieldKind.unsupported, name: 'tags', title: 'tags', description: '' },
    ])
  })

  it('treats a known kind with a mistyped keyword as unsupported', () => {
    const fields = toFields(schema({ count: { type: 'integer', ...annotations, default: 'one' } }))

    expect(fields[0]?.kind).toBe(FieldKind.unsupported)
  })

  it('ignores keywords it does not know, as JSON Schema does', () => {
    const fields = toFields(schema({ when: { type: 'string', format: 'date', ...annotations } }))

    expect(fields[0]?.kind).toBe(FieldKind.text)
  })
})
