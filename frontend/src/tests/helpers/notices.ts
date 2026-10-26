/**
 * The notices at the bottom right (D55), as a person finds them: list items in the region that F8 reaches, in the
 * order they came. Which one is in front is up to the stylesheet.
 */
import { screen, waitFor, within } from '@testing-library/vue'
import { expect } from 'vitest'

export function notices(): HTMLElement[] {
  const region = screen.queryByRole('region', { name: 'Notifications (F8)' })
  return region === null ? [] : within(region).queryAllByRole('listitem')
}

/**
 * The place in the stack of the notice that holds `text`, from 0 for the one in front: the variable that the stylesheet
 * reads (index.css).
 */
export function placeInStack(text: string): number | undefined {
  const notice = notices().find((item) => item.textContent.includes(text))
  return notice && Number(notice.style.getPropertyValue('--reka-toast-index'))
}

/** Waits for the one notice there is, and returns it. */
export async function findNotice(): Promise<HTMLElement> {
  await waitFor(() => expect(notices()).toHaveLength(1))
  const [notice] = notices()
  if (notice === undefined) {
    throw new Error('There is no notice.')
  }
  return notice
}
