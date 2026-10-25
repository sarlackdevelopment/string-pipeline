import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { ApiErrorKind, fetchCatalog, postRun } from '@/api/client'
import { StepStatus, type RunRequest } from '@/model/run'
import { readContract } from '@/tests/helpers/contract'
import { jsonResponse, server } from '@/tests/helpers/server'

const anyHost = (path: string) => `*${path}`

describe('fetchCatalog', () => {
  it('returns the parsed catalog', async () => {
    server.use(http.get(anyHost('/api/catalog'), () => jsonResponse(readContract('catalog.json'))))

    const result = await fetchCatalog('en')

    expect(result.ok && result.value.transformations).toHaveLength(11)
  })

  it('reports a response that breaks the contract', async () => {
    server.use(http.get(anyHost('/api/catalog'), () => jsonResponse({ transformations: [] })))

    const result = await fetchCatalog('en')

    expect(result).toMatchObject({ ok: false, error: { kind: ApiErrorKind.invalid } })
  })

  it('reports an error status without Problem Details', async () => {
    server.use(
      http.get(
        anyHost('/api/catalog'),
        () => new HttpResponse('down', { status: 503, statusText: 'Service Unavailable' }),
      ),
    )

    expect(await fetchCatalog('en')).toEqual({
      ok: false,
      error: { kind: ApiErrorKind.http, status: 503, statusText: 'Service Unavailable' },
    })
  })

  it('reports a server that cannot be reached', async () => {
    server.use(http.get(anyHost('/api/catalog'), () => HttpResponse.error()))

    expect(await fetchCatalog('en')).toMatchObject({
      ok: false,
      error: { kind: ApiErrorKind.network },
    })
  })

  it('rejects when the request is cancelled, so the caller can drop it (D11)', async () => {
    server.use(
      http.get(anyHost('/api/catalog'), async () => {
        await delay('infinite')
        return jsonResponse({})
      }),
    )
    const controller = new AbortController()

    const result = fetchCatalog('en', controller.signal)
    controller.abort()

    await expect(result).rejects.toMatchObject({ name: 'AbortError' })
  })
})

describe('postRun', () => {
  it('sends the chain and returns the results by step id', async () => {
    const request = readContract('examples/brief-chain.request.json') as RunRequest
    let received: unknown
    server.use(
      http.post(anyHost('/api/runs'), async ({ request: sent }) => {
        received = await sent.json()
        return jsonResponse(readContract('examples/brief-chain.response.json'))
      }),
    )

    const result = await postRun(request, 'en')

    expect(received).toEqual(request)
    expect(result.ok && result.value.steps.get('s3')).toEqual({
      status: StepStatus.executed,
      output: 'Python rocks!',
    })
  })

  it('returns Problem Details as data, with their pointers (D41)', async () => {
    server.use(
      http.post(anyHost('/api/runs'), () =>
        jsonResponse(readContract('examples/unknown-transformation.response.json'), {
          status: 400,
          contentType: 'application/problem+json',
        }),
      ),
    )

    const result = await postRun({ input: 'abc', steps: [] }, 'en')

    expect(result).toMatchObject({
      ok: false,
      error: {
        kind: ApiErrorKind.problem,
        problem: { errors: [{ pointer: '#/steps/0/transformation' }] },
      },
    })
  })
})

describe('the language of the texts (D52)', () => {
  it('asks for every answer in the given language', async () => {
    const languages: (string | null)[] = []
    server.use(
      http.get(anyHost('/api/catalog'), ({ request }) => {
        languages.push(request.headers.get('Accept-Language'))
        return jsonResponse(readContract('catalog.json'))
      }),
      http.post(anyHost('/api/runs'), ({ request }) => {
        languages.push(request.headers.get('Accept-Language'))
        return jsonResponse({ steps: [], output: 'abc' })
      }),
    )

    await fetchCatalog('de')
    await postRun({ input: 'abc', steps: [] }, 'ru')

    expect(languages).toEqual(['de', 'ru'])
  })
})
