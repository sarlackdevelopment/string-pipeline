/**
 * Renders a component with what `main.ts` installs: a fresh Pinia store and a fresh query client per test, so no
 * state leaks from one test into the next (D29). The query client does not retry, so a failure shows at once.
 */
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { render, type RenderOptions } from '@testing-library/vue'
import { createPinia } from 'pinia'
import type { Component } from 'vue'

export function renderWithProviders<C extends Component>(
  component: C,
  options: RenderOptions<C> = {},
): ReturnType<typeof render> {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(component, {
    ...options,
    global: {
      ...options.global,
      plugins: [createPinia(), [VueQueryPlugin, { queryClient }]],
    },
  })
}
