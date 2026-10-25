/**
 * Public types of the step card.
 */

/** The parts of a step card that can take the focus after an edit (D15). */
export const StepPart = {
  firstField: 'firstField',
  card: 'card',
  moveUp: 'moveUp',
  moveDown: 'moveDown',
} as const
export type StepPart = (typeof StepPart)[keyof typeof StepPart]
