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

  function nextId(): string {
    stepCount += 1
    return `step-${String(stepCount)}`
  }

  function setInput(input: string): void {
    chain.value = chains.setInput(chain.value, input)
  }

  /** Adds a step at the end, with every field at its default, and returns the step's id. */
  function addStep(transformation: Transformation): string {
    const id = nextId()
    chain.value = chains.addStep(chain.value, transformation, id)
    return id
  }

  function removeStep(id: string): void {
    chain.value = chains.removeStep(chain.value, id)
  }

  function moveStep(id: string, direction: chains.Direction): void {
    chain.value = chains.moveStep(chain.value, id, direction)
  }

  function moveStepTo(id: string, index: number): void {
    chain.value = chains.moveStepTo(chain.value, id, index)
  }

  function setValue(id: string, name: string, value: chains.ParameterValue): void {
    chain.value = chains.setValue(chain.value, id, name, value)
  }

  function setEnabled(id: string, enabled: boolean): void {
    chain.value = chains.setEnabled(chain.value, id, enabled)
  }

  /** Replaces the whole chain, as a link does (D49); its steps get new ids. */
  function load(content: chains.ChainContent): void {
    chain.value = chains.withIds(content, nextId)
  }

  return { chain, setInput, addStep, removeStep, moveStep, moveStepTo, setValue, setEnabled, load }
})
