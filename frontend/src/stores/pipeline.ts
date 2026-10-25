/**
 * The chain being edited (D29): the client state of the editor.
 *
 * Each action calls a pure function from `model/chain`, where the rules live and are tested. Step ids come from a
 * counter: unique and never reused while the page is open, as matching run results to steps requires (D40).
 */
import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import type { Transformation } from '@/model/catalog'
import * as chains from '@/model/chain'

export const usePipelineStore = defineStore('pipeline', () => {
  // Replaced as a whole on every edit, never changed in place, so a shallow ref is enough.
  const chain = shallowRef<chains.Chain>(chains.emptyChain)
  let stepCount = 0

  function setInput(input: string): void {
    chain.value = chains.setInput(chain.value, input)
  }

  /** Adds a step at the end, with every field at its default, and returns the step's id. */
  function addStep(transformation: Transformation): string {
    stepCount += 1
    const id = `step-${String(stepCount)}`
    chain.value = chains.addStep(chain.value, transformation, id)
    return id
  }

  function removeStep(id: string): void {
    chain.value = chains.removeStep(chain.value, id)
  }

  function moveStep(id: string, direction: chains.Direction): void {
    chain.value = chains.moveStep(chain.value, id, direction)
  }

  function setValue(id: string, name: string, value: chains.ParameterValue): void {
    chain.value = chains.setValue(chain.value, id, name, value)
  }

  return { chain, setInput, addStep, removeStep, moveStep, setValue }
})
