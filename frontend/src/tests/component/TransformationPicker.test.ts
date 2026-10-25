import userEvent from '@testing-library/user-event'
import { render, screen, waitFor, within } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import TransformationPicker from '@/components/TransformationPicker/TransformationPicker.vue'
import { contractCatalog } from '@/tests/helpers/contract'

function renderPicker(full = false) {
  const user = userEvent.setup()
  const onAdd = vi.fn<(transformationId: string) => void>()
  const view = render(TransformationPicker, {
    props: { catalog: contractCatalog(), full, focusRequest: null, onAdd },
  })
  return { user, view, onAdd, search: screen.getByRole('combobox', { name: 'Add a step' }) }
}

// An option shows the name, then the description.
const namesOf = (options: readonly HTMLElement[]) =>
  options.map((option) => option.querySelector('span')?.textContent)

// The names in one group of the open list.
const optionsOf = (group: string) =>
  namesOf(within(screen.getByRole('group', { name: group })).getAllByRole('option'))

describe('TransformationPicker (R1.3, D28)', () => {
  it('lists every transformation under its category when opened', async () => {
    const { user, search } = renderPicker()

    await user.click(search)

    expect(optionsOf('Text')).toEqual(['Replace', 'Append', 'Prepend', 'Substring', 'Change case'])
    expect(optionsOf('Lines')).toEqual(['Line operations'])
    expect(optionsOf('Conversions')).toEqual(['Encode', 'Decode', 'Reformat dates'])
    expect(optionsOf('Regular expressions')).toEqual(['Regex extract', 'Regex replace'])
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

  it('points at its list and the highlighted option only while the list shows, as WAI-ARIA asks (D15)', async () => {
    const { user, search } = renderPicker()
    const target = (attribute: string) =>
      document.getElementById(search.getAttribute(attribute) ?? '')

    await user.click(search)
    await user.keyboard('{ArrowDown}')
    expect(target('aria-controls')).toBeInTheDocument()
    expect(target('aria-activedescendant')).toHaveAttribute('role', 'option')

    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })
    expect(search).not.toHaveAttribute('aria-controls')
    expect(search).not.toHaveAttribute('aria-activedescendant')
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

  it('opens its list inside the page, within the landmarks, not at the end of the body (D15)', async () => {
    const { user, view, search } = renderPicker()

    await user.click(search)

    expect(view.container).toContainElement(screen.getByRole('listbox'))
  })

  it('takes the focus on its search field when asked, after the last step was removed (D15)', async () => {
    const { view, search } = renderPicker()

    await view.rerender({ focusRequest: { part: 'search' } })

    expect(search).toHaveFocus()
  })
})
