/**
 * Runs a composable inside a component that has the store and the query client: Vue's counterpart of React's
 * `renderHook`. Controllers need a component, because `useQuery`, `useId` and Pinia read its context. Testing
 * Library unmounts it after the test, like any rendered component.
 */
import { defineComponent } from 'vue'
import { renderWithProviders } from './render'

export function renderComposable<T>(composable: () => T): T {
  const result: { value?: T } = {}
  renderWithProviders(
    defineComponent({
      setup() {
        result.value = composable()
        return () => null
      },
    }),
  )
  if (result.value === undefined) {
    throw new Error('The composable did not run.')
  }
  return result.value
}
