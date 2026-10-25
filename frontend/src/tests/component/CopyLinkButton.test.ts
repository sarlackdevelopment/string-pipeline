import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import CopyLinkButton from '@/components/CopyLinkButton.vue'
import { grantClipboardWrite } from '@/tests/helpers/clipboard'

const link = 'http://localhost:3000/#chain=eyJpbnB1dCI6IkhpIiwic3RlcHMiOltdfQ'

describe('CopyLinkButton (D49)', () => {
  it('copies the link to the chain and says so', async () => {
    grantClipboardWrite()
    const user = userEvent.setup()
    render(CopyLinkButton, { props: { link } })

    await user.click(screen.getByRole('button', { name: 'Copy link' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument())
    expect(await navigator.clipboard.readText()).toBe(link)
    // A changed label alone is not announced, so a live region confirms the copy (D15).
    expect(screen.getByText('Copied the link.')).toBeInTheDocument()
  })

  it('has nothing to copy while the chain is empty', () => {
    render(CopyLinkButton, { props: { link: null } })

    expect(screen.getByRole('button', { name: 'Copy link' })).toBeDisabled()
  })
})
