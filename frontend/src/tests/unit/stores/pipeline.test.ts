// @vitest-environment node
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Transformation } from '@/model/catalog'
import { Direction } from '@/model/chain'
import { FieldKind } from '@/model/fields'
import { usePipelineStore } from '@/stores/pipeline'

const append: Transformation = {
  id: 'append',
  name: 'Append',
  category: 'text',
  description: '',
  fields: [
    {
      kind: FieldKind.text,
      name: 'text',
      title: 'Text',
      description: '',
      required: false,
      defaultValue: '!',
      maxLength: null,
    },
  ],
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('the pipeline store (D29)', () => {
  it('starts with an empty chain', () => {
    expect(usePipelineStore().chain).toEqual({ input: '', steps: [] })
  })

  it('gives every new step an id of its own, also after a removal (D40)', () => {
    const store = usePipelineStore()

    const first = store.addStep(append)
    store.removeStep(first)
    const second = store.addStep(append)

    expect(second).not.toBe(first)
    expect(store.chain.steps.map((step) => step.id)).toEqual([second])
  })

  it('edits the chain through the model functions (R1.2)', () => {
    const store = usePipelineStore()

    store.setInput('Hello')
    const first = store.addStep(append)
    const second = store.addStep(append)
    store.setValue(second, 'text', '?')
    store.moveStep(second, Direction.up)
    store.setEnabled(first, false)

    expect(store.chain).toEqual({
      input: 'Hello',
      steps: [
        { id: second, transformationId: 'append', values: { text: '?' }, enabled: true },
        { id: first, transformationId: 'append', values: { text: '!' }, enabled: false },
      ],
    })
  })

  it('moves a step to another place, as a drag and drop does (D54)', () => {
    const store = usePipelineStore()
    const first = store.addStep(append)
    const second = store.addStep(append)

    store.moveStepTo(first, 1)

    expect(store.chain.steps.map((step) => step.id)).toEqual([second, first])
  })

  it('replaces the chain with one from a link, giving its steps new ids (D40, D49)', () => {
    const store = usePipelineStore()
    const before = store.addStep(append)

    store.load({
      input: 'Hi',
      steps: [{ transformationId: 'append', values: { text: '?' }, enabled: false }],
    })

    expect(store.chain.input).toBe('Hi')
    expect(store.chain.steps).toHaveLength(1)
    expect(store.chain.steps[0]).toMatchObject({ values: { text: '?' }, enabled: false })
    expect(store.chain.steps[0]?.id).not.toBe(before)
    expect(store.addStep(append)).not.toBe(store.chain.steps[0]?.id)
  })

  it('keeps the same chain object when an edit changes nothing', () => {
    const store = usePipelineStore()
    const before = store.chain

    store.setInput('')
    store.removeStep('missing')

    expect(store.chain).toBe(before)
  })
})
