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
  setEnabled,
  setInput,
  setValue,
  withIds,
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
      { id: 's1', transformationId: 'replace', values: { old: '', new: '-' }, enabled: true },
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

describe('a chain from a link (D49)', () => {
  it('gets ids from the caller, one for each step', () => {
    let count = 0
    const nextId = () => {
      count += 1
      return `n${String(count)}`
    }
    const step = { transformationId: 'append', values: {}, enabled: true }

    const chain = withIds({ input: 'a', steps: [step, { ...step, enabled: false }] }, nextId)

    expect(ids(chain)).toEqual(['n1', 'n2'])
    expect(chain.steps.map((each) => each.enabled)).toEqual([true, false])
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

describe('turning steps off (D48)', () => {
  it('turns a step off and on again, keeping its values', () => {
    const off = setEnabled(setValue(threeSteps(), 'b', 'text', '!'), 'b', false)

    expect(off.steps.map((step) => step.enabled)).toEqual([true, false, true])
    expect(off.steps[1]?.values).toEqual({ text: '!' })
    expect(setEnabled(off, 'b', true).steps.map((step) => step.enabled)).toEqual([true, true, true])
  })

  it('returns the same chain when nothing changes', () => {
    const chain = threeSteps()

    expect(setEnabled(chain, 'a', true)).toBe(chain)
    expect(setEnabled(chain, 'missing', false)).toBe(chain)
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
