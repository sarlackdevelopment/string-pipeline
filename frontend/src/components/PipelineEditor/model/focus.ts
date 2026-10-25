/**
 * Where the focus goes after an edit (D15), so keyboard and screen reader users keep their place: to a new step's
 * first field; after a removal, to the step that took its place, or to the search field when the last step went;
 * after a move, back to the button that moved the step, or to the whole step once that button no longer applies.
 *
 * Every call returns a new object, so the same place can be asked for twice in a row.
 */
import { StepPart } from '@/components/StepCard/types'
import { Direction, type Chain } from '@/model/chain'
import { SEARCH, type FocusTarget } from '../types'

export function focusAfterAdding(stepId: string): FocusTarget {
  return { stepId, part: StepPart.firstField }
}

/** `chain` is the chain before the removal. */
export function focusAfterRemoving(chain: Chain, stepId: string): FocusTarget {
  const index = chain.steps.findIndex((step) => step.id === stepId)
  const next = index === -1 ? undefined : chain.steps[index + 1]
  return next === undefined ? { part: SEARCH } : { stepId: next.id, part: StepPart.card }
}

/** `chain` is the chain after the move. */
export function focusAfterMoving(chain: Chain, stepId: string, direction: Direction): FocusTarget {
  const index = chain.steps.findIndex((step) => step.id === stepId)
  const canMoveOn = index !== -1 && chain.steps[index + direction] !== undefined
  if (!canMoveOn) {
    return { stepId, part: StepPart.card }
  }
  return { stepId, part: direction === Direction.up ? StepPart.moveUp : StepPart.moveDown }
}
