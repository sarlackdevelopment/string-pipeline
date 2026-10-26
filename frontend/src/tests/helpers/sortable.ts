/**
 * A stand-in for SortableJS (D54), which needs a layout that jsdom does not have. It keeps the element and the options
 * of every instance, so that a test can play SortableJS's part with `drag`. A test file uses it in place of the
 * library:
 *
 *     vi.mock('sortablejs', () => import('@/tests/helpers/sortable'))
 */
import type { Options, SortableEvent } from 'sortablejs'
import { vi, type Mock } from 'vitest'

export interface SortableStandIn {
  readonly element: HTMLElement
  readonly options: Options
  readonly destroy: Mock<() => void>
}

/** Every instance made since the last `forgetSortables`, oldest first. */
export const sortables: SortableStandIn[] = []

export function forgetSortables(): void {
  sortables.length = 0
}

export default {
  create(element: HTMLElement, options: Options): SortableStandIn {
    const sortable = { element, options, destroy: vi.fn<() => void>() }
    sortables.push(sortable)
    return sortable
  },
}

/**
 * Drags the item at `from` to `to` as SortableJS does: its events, and in between the move in the DOM. SortableJS
 * moves the element in front of another item, or behind the last one, which is in front of anything that follows it.
 */
export function drag(sortable: SortableStandIn, from: number, to: number): void {
  const list = sortable.element
  const item = list.children[from]
  if (!(item instanceof HTMLElement)) {
    throw new Error(`The list has no item at ${String(from)}.`)
  }
  sortable.options.onStart?.({ item } as SortableEvent)
  const others = [...list.children].filter((child) => child !== item)
  list.insertBefore(item, others[to] ?? others.at(-1)?.nextSibling ?? null)
  sortable.options.onUpdate?.({ item, oldIndex: from, newIndex: to } as SortableEvent)
}
