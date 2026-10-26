import { render } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, Fragment, h, shallowRef, type PropType } from 'vue'
import { useDragToReorder } from '@/composables/useDragToReorder'
import { drag, forgetSortables, sortables } from '@/tests/helpers/sortable'

vi.mock('sortablejs', () => import('@/tests/helpers/sortable'))

// A list as a template renders it: a v-for inside the list, so Vue marks its start and end with empty text nodes. The
// list is only there while it has items.
const List = defineComponent({
  props: { items: { type: Array as PropType<readonly string[]>, required: true } },
  emits: { move: (from: number, to: number) => from >= 0 && to >= 0 },
  setup(props, { emit }) {
    const list = shallowRef<HTMLElement | null>(null)
    useDragToReorder(
      () => list.value,
      (from, to) => {
        emit('move', from, to)
      },
    )
    return () =>
      props.items.length === 0
        ? null
        : h('ol', { ref: list }, [
            h(
              Fragment,
              props.items.map((item) => h('li', { key: item }, item)),
            ),
          ])
  },
})

/** The list's nodes in order: an item by its text, an empty text node as `|`. */
function nodes(list: Element): string[] {
  return [...list.childNodes].map((node) =>
    node.nodeType === Node.TEXT_NODE ? '|' : (node.textContent ?? ''),
  )
}

function firstSortable() {
  const [sortable] = sortables
  if (sortable === undefined) {
    throw new Error('No SortableJS was made.')
  }
  return sortable
}

/** Renders the list and waits for SortableJS, which is made after the render, once Vue has put the list in its ref. */
async function renderList(items: readonly string[]) {
  const view = render(List, { props: { items } })
  await flushPromises()
  return view
}

afterEach(forgetSortables)

describe('useDragToReorder (D54)', () => {
  it('drags by the handle only, and moves the other items aside', async () => {
    await renderList(['a', 'b'])

    expect(firstSortable().options).toMatchObject({ handle: '[data-drag-handle]', animation: 150 })
  })

  it('puts a dragged item back where Vue left it and reports the move, so Vue renders the new order', async () => {
    const view = await renderList(['a', 'b', 'c'])
    const sortable = firstSortable()
    const list = sortable.element
    expect(nodes(list)).toEqual(['|', 'a', 'b', 'c', '|'])

    // The last item, with Vue's mark of the end behind it. Put back by its index, behind the last of the others, it
    // would land behind that mark, where Vue no longer looks for it.
    drag(sortable, 2, 1)

    expect(nodes(list)).toEqual(['|', 'a', 'b', 'c', '|'])
    expect(view.emitted('move')).toEqual([[2, 1]])
    await view.rerender({ items: ['a', 'c', 'b'] })
    await view.rerender({ items: ['a', 'c', 'b', 'd'] })
    expect(nodes(list)).toEqual(['|', 'a', 'c', 'b', 'd', '|'])
  })

  it('makes a new SortableJS for a list that comes back, and destroys each one with its list', async () => {
    const view = await renderList(['a'])

    await view.rerender({ items: [] })
    await view.rerender({ items: ['b'] })
    await flushPromises()
    view.unmount()

    expect(sortables).toHaveLength(2)
    expect(sortables[1]?.element).not.toBe(sortables[0]?.element)
    expect(sortables.map(({ destroy }) => destroy.mock.calls.length)).toEqual([1, 1])
  })
})
