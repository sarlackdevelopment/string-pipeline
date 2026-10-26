/**
 * Puts the items of a list in another order by dragging them by their handles (D54), with SortableJS. An item is
 * dragged by its element marked `data-drag-handle`; pressing anywhere else, such as in a field, does not drag it.
 *
 * SortableJS moves the dragged element in the DOM itself, while Vue renders the list from the state. So at the drop
 * the element goes back where it was, and `onMove` reports the move; once the state has changed, Vue moves the element,
 * as for any other change of order. Without the way back, Vue would patch a DOM that is no longer the one it left.
 */
import Sortable from 'sortablejs'
import { onScopeDispose, watch } from 'vue'

/** `list` is a getter, since a list rendered only while it has items is a new element each time it appears. */
export function useDragToReorder(
  list: () => HTMLElement | null,
  onMove: (from: number, to: number) => void,
): void {
  let sortable: Sortable | undefined
  // The node that followed the dragged element when the drag started: the next item, or the empty text node with which
  // Vue marks the end of a list. In front of it, the element is exactly where Vue left it.
  let next: Node | null = null

  watch(
    list,
    (element) => {
      sortable?.destroy()
      sortable =
        element === null
          ? undefined
          : Sortable.create(element, {
              handle: '[data-drag-handle]',
              animation: 150,
              ghostClass: 'opacity-40',
              // On a touch screen SortableJS drags a copy of the item. At the end of the body, no part of the page
              // that scrolls cuts it off.
              fallbackOnBody: true,
              onStart: ({ item }) => {
                next = item.nextSibling
              },
              onUpdate: ({ item, oldIndex, newIndex }) => {
                item.parentNode?.insertBefore(item, next)
                if (oldIndex !== undefined && newIndex !== undefined) {
                  onMove(oldIndex, newIndex)
                }
              },
            })
    },
    { immediate: true, flush: 'post' },
  )
  onScopeDispose(() => {
    sortable?.destroy()
  })
}
