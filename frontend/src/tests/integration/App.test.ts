import { screen } from '@testing-library/vue'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import App from '@/App.vue'
import { readContract } from '@/tests/helpers/contract'
import { renderWithProviders } from '@/tests/helpers/render'
import { jsonResponse, server } from '@/tests/helpers/server'

describe('App', () => {
  it('renders the heading and, once the catalog has loaded, the editor', async () => {
    server.use(http.get('*/api/catalog', () => jsonResponse(readContract('catalog.json'))))

    renderWithProviders(App)

    expect(screen.getByRole('heading', { level: 1, name: 'String Pipeline' })).toBeInTheDocument()
    expect(await screen.findByRole('combobox', { name: 'Add a step' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Input' })).toBeInTheDocument()
  })
})
