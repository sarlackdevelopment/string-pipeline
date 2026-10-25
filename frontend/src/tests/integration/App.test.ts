import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import App from '@/App.vue'
import { serveCatalog, serveRuns } from '@/tests/helpers/api'
import { renderWithProviders } from '@/tests/helpers/render'

describe('App', () => {
  it('renders the heading and, once the catalog has loaded, the editor', async () => {
    serveCatalog()
    serveRuns()

    renderWithProviders(App)

    expect(screen.getByRole('heading', { level: 1, name: 'String Pipeline' })).toBeInTheDocument()
    expect(await screen.findByRole('combobox', { name: 'Add a step' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Input' })).toBeInTheDocument()
  })

  it('speaks the chosen language: its own texts at once, the catalog’s once it is fetched in that language (D52)', async () => {
    const languages = serveCatalog()
    serveRuns()
    const user = userEvent.setup()
    renderWithProviders(App)
    await screen.findByRole('combobox', { name: 'Add a step' })

    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'Deutsch')

    expect(screen.getByRole('combobox', { name: 'Schritt hinzufügen' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Eingabe' })).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'de')
    await waitFor(() => {
      expect(languages).toEqual(['en', 'de'])
    })
  })

  it('replaces a broken editor with a message, instead of half a page that no longer reacts', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const broken = defineComponent({
      setup() {
        throw new Error('The editor broke.')
      },
    })

    renderWithProviders(App, { global: { stubs: { PipelineEditor: broken } } })

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong')
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument()
    expect(consoleError).toHaveBeenCalledWith(new Error('The editor broke.'))
    consoleError.mockRestore()
  })
})
