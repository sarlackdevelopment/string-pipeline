import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import App from '@/App.vue'

describe('App', () => {
  it('renders the application heading', () => {
    render(App)

    expect(screen.getByRole('heading', { level: 1, name: 'String Pipeline' })).toBeInTheDocument()
  })
})
