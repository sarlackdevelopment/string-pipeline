// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { Transformation } from '@/model/catalog'
import {
  addStep,
  defaultValues,
  Direction,
  emptyChain,
  moveStep,
  removeStep,
  setInput,
  setValue,
  type Chain,
} from '@/model/chain'
import { FieldKind, type Field } from '@/model/fields'

const text = (name: string, defaultValue = ''): Field => ({
  kind: FieldKind.text,
  name,
  title: name,
  description: '',
  required: false,
  defaultValue,
  maxLength: null,
})

const transformation = (id: string, fields: readonly Field[] = [text('text')]): Transformation => ({
  id,
  name: id,
  category: 'text',
  description: '',
  fields,
})

const ids = (chain: Chain) => chain.steps.map((step) => step.id)

// A chain of three appends with the ids a, b and c.
function threeSteps(): Chain {
  const append = transformation('append')
  return addStep(addStep(addStep(emptyChain, append, 'a'), append, 'b'), append, 'c')
}

describe('adding steps (R1.2)', () => {
  it('adds a step at the end, with every field at its default', () => {
    const chain = addStep(
      emptyChain,
      transformation('replace', [text('old'), text('new', '-')]),
      's1',
    )

    expect(chain.steps).toEqual([
      { id: 's1', transformationId: 'replace', values: { old: '', new: '-' } },
    ])
  })

  it('keeps two steps of the same transformation apart by id', () => {
    const replace = transformation('replace', [text('old')])
    const chain = setValue(
      addStep(addStep(emptyChain, replace, 's1'), replace, 's2'),
      's2',
      'old',
      'x',
    )

    expect(chain.steps.map((step) => step.values)).toEqual([{ old: '' }, { old: 'x' }])
  })

  it('gives unsupported fields no value, so the server uses its default', () => {
    const fields: Field[] = [
      text('kept'),
      { kind: FieldKind.unsupported, name: 'tags', title: 'Tags', description: '' },
    ]

    expect(defaultValues(fields)).toEqual({ kept: '' })
  })
})

describe('removing and moving steps', () => {
  it('removes a step by id', () => {
    expect(ids(removeStep(threeSteps(), 'b'))).toEqual(['a', 'c'])
  })

  it('moves a step up or down', () => {
    expect(ids(moveStep(threeSteps(), 'b', Direction.up))).toEqual(['b', 'a', 'c'])
    expect(ids(moveStep(threeSteps(), 'b', Direction.down))).toEqual(['a', 'c', 'b'])
  })

  it('returns the same chain when nothing changes', () => {
    const chain = threeSteps()

    expect(moveStep(chain, 'a', Direction.up)).toBe(chain)
    expect(moveStep(chain, 'c', Direction.down)).toBe(chain)
    expect(moveStep(chain, 'missing', Direction.down)).toBe(chain)
    expect(removeStep(chain, 'missing')).toBe(chain)
  })
})

describe('editing', () => {
  it('sets one value of one step', () => {
    const chain = setValue(threeSteps(), 'b', 'text', '!')

    expect(chain.steps.map((step) => step.values['text'])).toEqual(['', '!', ''])
  })

  it('returns the same chain when the value or the input does not change', () => {
    const chain = threeSteps()

    expect(setValue(chain, 'b', 'text', '')).toBe(chain)
    expect(setValue(chain, 'missing', 'text', 'x')).toBe(chain)
    expect(setInput(chain, '')).toBe(chain)
  })

  it('never changes the chain it was given', () => {
    const chain = Object.freeze(threeSteps())

    const edited = setInput(setValue(removeStep(chain, 'a'), 'b', 'text', '!'), 'input')

    expect(edited).not.toBe(chain)
    expect(chain.input).toBe('')
    expect(ids(chain)).toEqual(['a', 'b', 'c'])
  })
})
