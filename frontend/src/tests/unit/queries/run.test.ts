import { onlineManager } from '@tanstack/vue-query'
import { shallowRef } from 'vue'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import type { RunRequest } from '@/model/run'
import { ApiFailure } from '@/queries/client'
import { usePipelineRun } from '@/queries/run'
import { gate, RUNS_URL, serveNetworkError, serveRuns, type ReceivedRun } from '@/tests/helpers/api'
import { renderComposable } from '@/tests/helpers/composable'

// The server answers with the input as the output: enough to tell the runs apart.
const echo = (request: ReceivedRun) => ({ steps: [], output: request.input })

const request = (input: string): RunRequest => ({ input, steps: [] })

function setup(input: string) {
  const chain = shallowRef(request(input))
  const run = renderComposable(() => usePipelineRun(chain))
  return { chain, run }
}

describe('running the chain (D11, D29)', () => {
  it('runs once the edits pause, with the latest request only', async () => {
    const received = serveRuns(echo)
    const { chain, run } = setup('a')
    await vi.waitFor(() => expect(run.result.value?.output).toBe('a'))

    chain.value = request('b')
    chain.value = request('c')
    chain.value = request('d')

    await vi.waitFor(() => expect(run.result.value?.output).toBe('d'))
    expect(received.map((body) => body.input)).toEqual(['a', 'd'])
  })

  it('aborts the run still on its way when a newer one is sent', async () => {
    const first = gate()
    serveRuns(echo, (body) => (body.input === 'a' ? first.opened : Promise.resolve()))
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    onTestFinished(() => {
      first.open()
      fetchSpy.mockRestore()
    })
    const { chain, run } = setup('a')
    await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))

    chain.value = request('b')

    await vi.waitFor(() => expect(run.result.value?.output).toBe('b'))
    expect(fetchSpy.mock.calls[0]?.[1]?.signal?.aborted).toBe(true)
  })

  it('keeps the previous result while the next run is on its way (D40)', async () => {
    const second = gate()
    serveRuns(echo, (body) => (body.input === 'b' ? second.opened : Promise.resolve()))
    onTestFinished(second.open)
    const { chain, run } = setup('a')
    await vi.waitFor(() => expect(run.result.value?.output).toBe('a'))

    chain.value = request('b')
    await vi.waitFor(() => expect(run.sentRequest.value.input).toBe('b'))

    expect(run.result.value?.output).toBe('a')
    expect(run.isUpdating.value).toBe(true)
    second.open()
    await vi.waitFor(() => expect(run.result.value?.output).toBe('b'))
  })

  // Pins D32: with `refDebounced`, the sent request was a reactive proxy and never equalled the latest one.
  it('is updating from an edit until its result arrives, and then no longer', async () => {
    serveRuns(echo)
    const { chain, run } = setup('a')
    await vi.waitFor(() => expect(run.isUpdating.value).toBe(false))

    chain.value = request('b')

    expect(run.isUpdating.value).toBe(true)
    await vi.waitFor(() => expect(run.isUpdating.value).toBe(false))
    expect(run.result.value?.output).toBe('b')
  })

  it('shows the result of a request sent before at once, without asking the server again', async () => {
    const received = serveRuns(echo)
    const { chain, run } = setup('a')
    await vi.waitFor(() => expect(run.result.value?.output).toBe('a'))
    chain.value = request('b')
    await vi.waitFor(() => expect(run.result.value?.output).toBe('b'))

    chain.value = request('a')

    await vi.waitFor(() => expect(run.result.value?.output).toBe('a'))
    expect(received.map((body) => body.input)).toEqual(['a', 'b'])
  })

  it('waits while the browser is offline, still updating, and runs once it is back (D57)', async () => {
    const received = serveRuns(echo)
    const { chain, run } = setup('a')
    await vi.waitFor(() => expect(run.result.value?.output).toBe('a'))
    onlineManager.setOnline(false)
    onTestFinished(() => {
      onlineManager.setOnline(true)
    })

    chain.value = request('b')

    await vi.waitFor(() => expect(run.waitsForNetwork.value).toBe(true))
    expect(run.isUpdating.value).toBe(true)
    expect(run.result.value?.output).toBe('a')
    onlineManager.setOnline(true)
    await vi.waitFor(() => expect(run.result.value?.output).toBe('b'))
    expect(run.waitsForNetwork.value).toBe(false)
    expect(run.isUpdating.value).toBe(false)
    expect(received.map((body) => body.input)).toEqual(['a', 'b'])
  })

  it('keeps a failed call as the error, and runs again on retry', async () => {
    serveNetworkError(RUNS_URL)
    const { run } = setup('a')
    await vi.waitFor(() => expect(run.error.value).toBeInstanceOf(ApiFailure))

    serveRuns(echo)
    run.retry()

    await vi.waitFor(() => expect(run.result.value?.output).toBe('a'))
    expect(run.error.value).toBeNull()
  })
})
