import userEvent from '@testing-library/user-event'
import { render, screen, waitFor, within } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import TransformationPicker from '@/components/TransformationPicker/TransformationPicker.vue'
import { contractCatalog } from '@/tests/helpers/contract'

function renderPicker(full = false) {
  const user = userEvent.setup()
  const onAdd = vi.fn<(transformationId: string) => void>()
  render(TransformationPicker, { props: { catalog: contractCatalog(), full, onAdd } })
  return { user, onAdd, search: screen.getByRole('combobox', { name: 'Add a step' }) }
}

// An option shows the name, then the description.
const namesOf = (options: readonly HTMLElement[]) =>
  options.map((option) => option.querySelector('span')?.textContent)

// Reka renders the list in a portal at the end of the body, so the options are found through `screen`.
describe('TransformationPicker (R1.3, D28)', () => {
  it('lists every transformation under its category when opened', async () => {
    const { user, search } = renderPicker()

    await user.click(search)

    const text = screen.getByRole('group', { name: 'Text' })
    const regex = screen.getByRole('group', { name: 'Regular expressions' })
    expect(namesOf(within(text).getAllByRole('option'))).toEqual([
      'Replace',
      'Append',
      'Prepend',
      'Substring',
    ])
    expect(namesOf(within(regex).getAllByRole('option'))).toEqual([
      'Regex extract',
      'Regex replace',
    ])
  })

  it('finds a transformation by a word of its description', async () => {
    const { user, search } = renderPicker()

    await user.type(search, 'slice')

    expect(namesOf(screen.getAllByRole('option'))).toEqual(['Substring'])
  })

  it('ignores case and accents while searching', async () => {
    const { user, search } = renderPicker()

    await user.type(search, 'RÉGEX')

    expect(namesOf(screen.getAllByRole('option'))).toEqual(['Regex extract', 'Regex replace'])
  })

  it('adds the first match with Enter', async () => {
    const { user, search, onAdd } = renderPicker()

    await user.type(search, 'regex{Enter}')

    expect(onAdd).toHaveBeenCalledExactlyOnceWith('regexExtract')
  })

  // Pins the empty model value: with a value of its own, the combobox would show the id after a pick and stay silent
  // when the same item is picked again.
  it('adds the same transformation twice in a row, and clears the search after each pick', async () => {
    const { user, search, onAdd } = renderPicker()

    await user.type(search, 'append{Enter}')
    await waitFor(() => expect(search).toHaveValue(''))
    await user.type(search, 'append{Enter}')

    expect(onAdd.mock.calls).toEqual([['append'], ['append']])
  })

  it('adds nothing once the chain is full, and says why', () => {
    const { search } = renderPicker(true)

    expect(search).toBeDisabled()
    expect(search).toHaveAccessibleDescription('A chain can have up to 50 steps.')
  })
})
