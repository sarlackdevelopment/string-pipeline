/**
 * Moving the focus after an edit (D15). A container decides where the focus goes and hands the component that owns
 * that place a request; the component focuses the requested part once the DOM has updated, like a React effect that
 * depends on the request. Every request is a new object, so the same place can be asked for twice in a row.
 */
import { onMounted, watch } from 'vue'

export interface FocusRequest<Part extends string> {
  readonly part: Part
}

/** Calls `focus` for the request a component mounts with, and for every new request after that. */
export function useFocusRequest<Part extends string>(
  request: () => FocusRequest<Part> | null,
  focus: (part: Part) => void,
): void {
  onMounted(() => {
    const current = request()
    if (current !== null) {
      focus(current.part)
    }
  })
  watch(
    request,
    (next) => {
      if (next !== null) {
        focus(next.part)
      }
    },
    { flush: 'post' },
  )
}
