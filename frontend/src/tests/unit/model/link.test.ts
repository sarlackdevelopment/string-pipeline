// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { Catalog } from '@/model/catalog'
import { defaultValues, emptyChain, type ChainContent } from '@/model/chain'
import { FieldKind } from '@/model/fields'
import { fromFragment, LinkStatus, toFragment } from '@/model/link'
import { contractCatalog, contractTransformation } from '@/tests/helpers/contract'

const catalog = contractCatalog()

// The chain of the brief with its second step off, on a text whose characters take up to four bytes in UTF-8.
const chain: ChainContent = {
  input: 'Fake Python 👍🏽 ü',
  steps: [
    { transformationId: 'replace', values: { old: 'Fake', new: 'Real' }, enabled: true },
    { transformationId: 'append', values: { text: '!' }, enabled: false },
  ],
}

/** A fragment that holds `json` the way a link does, encoded by Node rather than by the app. */
const fragmentOf = (json: string) => `#chain=${Buffer.from(json).toString('base64url')}`

const unreadable = 'It does not hold a chain that this app can read.'

describe('the chain in a link (D49)', () => {
  it('opens the chain it was made from, with its steps that are off', () => {
    expect(fromFragment(toFragment(chain), catalog)).toEqual({ status: LinkStatus.chain, chain })
  })

  it('holds a run request without step ids, as URL-safe Base64 of its JSON', () => {
    const fragment = toFragment(chain)

    expect(fragment).toMatch(/^#chain=[\w-]+$/)
    const json: unknown = JSON.parse(
      Buffer.from(fragment.slice('#chain='.length), 'base64url').toString('utf8'),
    )
    expect(json).toEqual({
      input: 'Fake Python 👍🏽 ü',
      steps: [
        { transformation: 'replace', parameters: { old: 'Fake', new: 'Real' } },
        { transformation: 'append', parameters: { text: '!' }, enabled: false },
      ],
    })
  })

  it('needs no fragment for an empty chain, and finds no chain in a fragment without one', () => {
    expect(toFragment(emptyChain)).toBe('')
    expect(fromFragment('', catalog)).toEqual({ status: LinkStatus.none })
    expect(fromFragment('#top', catalog)).toEqual({ status: LinkStatus.none })
  })

  it.each([
    ['nothing after the key', '#chain='],
    ['characters outside Base64', '#chain=a%21b'],
    ['JSON that was cut off', fragmentOf('{"input":')],
    ['JSON of another shape', fragmentOf('{"input":5,"steps":[]}')],
    ['bytes that are not UTF-8', `#chain=${Buffer.from([0xff, 0xfe]).toString('base64url')}`],
  ])('cannot read %s', (_, fragment) => {
    const reading = fromFragment(fragment, catalog)

    expect(reading).toEqual({
      status: LinkStatus.invalid,
      message: expect.stringContaining(unreadable) as unknown,
    })
  })

  it('names a transformation that the catalog does not have', () => {
    const fragment = fragmentOf(
      '{"input":"","steps":[{"transformation":"reverse","parameters":{}}]}',
    )

    expect(fromFragment(fragment, catalog)).toEqual({
      status: LinkStatus.invalid,
      message: 'It uses a transformation that this app does not have: "reverse".',
    })
  })

  it('fits the values to the fields: defaults for missing and wrong ones, nothing without a field', () => {
    const fragment = fragmentOf(
      JSON.stringify({
        input: 'a',
        steps: [
          { transformation: 'replace', parameters: { old: 'a', new: 5, colour: 'red' } },
          { transformation: 'changeCase', parameters: { to: 'shouting' } },
          { transformation: 'substring', parameters: { start: 1.5, end: null } },
        ],
      }),
    )

    const reading = fromFragment(fragment, catalog)

    if (reading.status !== LinkStatus.chain) {
      throw new Error(`The link was not read: ${reading.status}`)
    }
    expect(reading.chain.steps.map((step) => step.values)).toEqual([
      { old: 'a', new: '' },
      defaultValues(contractTransformation('changeCase').fields),
      { ...defaultValues(contractTransformation('substring').fields), end: null },
    ])
  })

  it('keeps the value of a field that the editor cannot show, for the server to check (D43)', () => {
    const withTags: Catalog = {
      ...catalog,
      transformations: [
        {
          id: 'tag',
          name: 'Tag',
          category: 'text',
          description: '',
          fields: [{ kind: FieldKind.unsupported, name: 'tags', title: 'Tags', description: '' }],
        },
      ],
    }
    const fragment = fragmentOf(
      '{"input":"","steps":[{"transformation":"tag","parameters":{"tags":"a,b"}}]}',
    )

    const reading = fromFragment(fragment, withTags)

    expect(reading.status === LinkStatus.chain && reading.chain.steps[0]?.values).toEqual({
      tags: 'a,b',
    })
  })
})
