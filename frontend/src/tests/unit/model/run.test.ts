// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parseCatalog } from '@/api/contract'
import { findTransformation } from '@/model/catalog'
import { addStep, emptyChain, setInput, setValue } from '@/model/chain'
import { toRunRequest } from '@/model/run'
import { readContract } from '@/tests/helpers/contract'

describe('the run request (D40)', () => {
  it('builds exactly the brief-chain example of the contract', () => {
    const parsed = parseCatalog(readContract('catalog.json'))
    if (!parsed.ok) {
      throw new Error(parsed.detail)
    }
    const transformation = (id: string) => {
      const found = findTransformation(parsed.value, id)
      if (found === undefined) {
        throw new Error(`No transformation ${id}`)
      }
      return found
    }

    let chain = setInput(emptyChain, 'Fake Python')
    chain = addStep(chain, transformation('replace'), 's1')
    chain = setValue(setValue(chain, 's1', 'old', 'Fake'), 's1', 'new', 'Real')
    chain = setValue(addStep(chain, transformation('append'), 's2'), 's2', 'text', ' rocks!')
    chain = setValue(addStep(chain, transformation('substring'), 's3'), 's3', 'start', 5)

    expect(toRunRequest(chain)).toEqual(readContract('examples/brief-chain.request.json'))
  })

  it('sends an empty chain as the input alone', () => {
    expect(toRunRequest(setInput(emptyChain, 'abc'))).toEqual({ input: 'abc', steps: [] })
  })
})
