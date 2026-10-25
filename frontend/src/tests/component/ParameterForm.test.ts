import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import ParameterForm from '@/components/ParameterForm/ParameterForm.vue'
import { IssueSeverity, type FieldIssues } from '@/components/ParameterForm/types'
import { defaultValues, type ParameterValue, type StepValues } from '@/model/chain'
import { FieldKind, type Field } from '@/model/fields'
import { contractTransformation } from '@/tests/helpers/contract'

// Regex extract has a field of every kind the form knows: text, integer, choice and boolean.
const regexExtract = contractTransformation('regexExtract')

interface FormOptions {
  readonly fields?: readonly Field[]
  readonly values?: StepValues
  readonly issues?: FieldIssues
}

function renderForm(options: FormOptions = {}) {
  const user = userEvent.setup()
  const onChange = vi.fn<(name: string, value: ParameterValue) => void>()
  const fields = options.fields ?? regexExtract.fields
  const view = render(ParameterForm, {
    props: {
      fields,
      values: options.values ?? defaultValues(fields),
      issues: options.issues ?? {},
      onChange,
    },
  })
  return { user, onChange, view }
}

describe('ParameterForm (R2.1, D27, D43)', () => {
  it('renders each kind of field as its control, named by its title and described by its description', () => {
    renderForm()

    expect(screen.getByRole('textbox', { name: 'Pattern' })).toHaveAccessibleDescription(
      'A Java regular expression, for example \\d+ for numbers.',
    )
    expect(screen.getByRole('spinbutton', { name: 'Group' })).toHaveValue(0)
    expect(screen.getByRole('combobox', { name: 'Matches' })).toHaveValue('all')
    expect(screen.getByRole('checkbox', { name: 'Ignore case' })).not.toBeChecked()
  })

  it('takes the limits of each field from the schema', () => {
    renderForm()

    const pattern = screen.getByRole('textbox', { name: 'Pattern' })
    expect(pattern).toHaveAttribute('maxlength', '10000')
    expect(pattern).toHaveAttribute('aria-required', 'true')
    expect(screen.getByRole('spinbutton', { name: 'Group' })).toHaveAttribute('min', '0')
  })

  it('reports each value with its own type', async () => {
    const { user, onChange } = renderForm()

    await user.type(screen.getByRole('textbox', { name: 'Pattern' }), 'a')
    await user.type(screen.getByRole('spinbutton', { name: 'Group' }), '2')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Matches' }), 'first')
    await user.click(screen.getByRole('checkbox', { name: 'Ignore case' }))

    expect(onChange.mock.calls).toEqual([
      ['pattern', 'a'],
      ['group', 2],
      ['matches', 'first'],
      ['ignoreCase', true],
    ])
  })

  // Pins what IntegerField relies on: Vue reads an empty number input as '', which the field sends as no value.
  it('reports an emptied number as no value', async () => {
    const { user, onChange } = renderForm()

    await user.clear(screen.getByRole('spinbutton', { name: 'Group' }))

    expect(onChange).toHaveBeenLastCalledWith('group', null)
  })

  it('links a hint and an error to their fields, and marks only the error as invalid', () => {
    renderForm({
      issues: {
        pattern: { message: 'Enter a value', severity: IssueSeverity.hint },
        group: { message: 'Enter 0 or more', severity: IssueSeverity.error },
      },
    })

    const pattern = screen.getByRole('textbox', { name: 'Pattern' })
    expect(pattern).toHaveAccessibleDescription(/Enter a value$/)
    expect(pattern).toHaveAttribute('aria-invalid', 'false')
    const group = screen.getByRole('spinbutton', { name: 'Group' })
    expect(group).toHaveAccessibleDescription(/Enter 0 or more$/)
    expect(group).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows a notice instead of a control for a parameter it cannot edit', () => {
    const tags: Field = {
      kind: FieldKind.unsupported,
      name: 'tags',
      title: 'Tags',
      description: '',
    }

    renderForm({ fields: [tags], values: {} })

    expect(screen.getByText('Tags')).toBeInTheDocument()
    expect(screen.getByText(/cannot edit this kind of parameter yet/)).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('renders nothing for a transformation without parameters', () => {
    const { view } = renderForm({ fields: [], values: {} })

    expect(view.container).toBeEmptyDOMElement()
  })
})
