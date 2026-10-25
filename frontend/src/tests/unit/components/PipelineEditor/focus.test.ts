// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  focusAfterAdding,
  focusAfterMoving,
  focusAfterRemoving,
} from '@/components/PipelineEditor/model/focus'
import { SEARCH } from '@/components/PipelineEditor/types'
import { StepPart } from '@/components/StepCard/types'
import { Direction, type Chain } from '@/model/chain'

// Three steps with the ids a, b and c.
const chain: Chain = {
  input: '',
  steps: ['a', 'b', 'c'].map((id) => ({
    id,
    transformationId: 'append',
    values: {},
    enabled: true,
  })),
}

describe('where the focus goes after an edit (D15)', () => {
  it('goes to the first field of a new step', () => {
    expect(focusAfterAdding('d')).toEqual({ stepId: 'd', part: StepPart.firstField })
  })

  it('goes to the step that takes the place of a removed one', () => {
    expect(focusAfterRemoving(chain, 'b')).toEqual({ stepId: 'c', part: StepPart.card })
  })

  it('goes to the search field when the last step is removed', () => {
    expect(focusAfterRemoving(chain, 'c')).toEqual({ part: SEARCH })
  })

  it('stays on the button that moved a step while that button still applies', () => {
    expect(focusAfterMoving(chain, 'b', Direction.up)).toEqual({
      stepId: 'b',
      part: StepPart.moveUp,
    })
    expect(focusAfterMoving(chain, 'b', Direction.down)).toEqual({
      stepId: 'b',
      part: StepPart.moveDown,
    })
  })

  it('goes to the moved step itself once it reached an end, where its button is disabled', () => {
    expect(focusAfterMoving(chain, 'a', Direction.up)).toEqual({ stepId: 'a', part: StepPart.card })
    expect(focusAfterMoving(chain, 'c', Direction.down)).toEqual({
      stepId: 'c',
      part: StepPart.card,
    })
  })

  it('asks anew every time, so the same place can be asked for twice in a row', () => {
    expect(focusAfterAdding('d')).not.toBe(focusAfterAdding('d'))
  })
})
