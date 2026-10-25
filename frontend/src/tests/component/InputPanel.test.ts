import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import InputPanel from '@/components/InputPanel.vue'

function renderPanel(text = 'Hello', errors: readonly string[] = []) {
  const user = userEvent.setup()
  const onUpdate = vi.fn<(text: string) => void>()
  render(InputPanel, {
    props: { modelValue: text, maxLength: 100, errors, 'onUpdate:modelValue': onUpdate },
  })
  return { user, onUpdate, input: screen.getByRole('textbox', { name: 'Input' }) }
}

describe('InputPanel (R1.2, D21)', () => {
  it('is a text field limited to the maximum of the catalog, described by its character count', () => {
    const { input } = renderPanel()

    expect(input).toHaveValue('Hello')
    expect(input).toHaveAttribute('maxlength', '100')
    expect(input).toHaveAccessibleDescription('5 / 100 characters')
  })

  it('counts characters as the server and maxlength do, in UTF-16 code units', () => {
    const { input } = renderPanel('👍🏽')

    expect(input).toHaveAccessibleDescription('4 / 100 characters')
  })

  it('reports what the user types', async () => {
    const { user, input, onUpdate } = renderPanel()

    await user.type(input, '!')

    expect(onUpdate).toHaveBeenLastCalledWith('Hello!')
  })

  it('shows what a rejected request said about the input (D41)', () => {
    const { input } = renderPanel('Hello', ['Use at most 100,000 characters'])

    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription(/Use at most 100,000 characters$/)
  })
})
