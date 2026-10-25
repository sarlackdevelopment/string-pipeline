// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { groupByCategory } from '@/components/TransformationPicker/model/groups'
import type { Catalog, Transformation } from '@/model/catalog'
import { contractCatalog } from '@/tests/helpers/contract'

const transformation = (id: string, category: string): Transformation => ({
  id,
  name: id,
  category,
  description: '',
  fields: [],
})

describe('the groups of the transformation picker (D28)', () => {
  it('groups the catalog of the contract by category, in display order', () => {
    const groups = groupByCategory(contractCatalog()).map((group) => [
      group.category.name,
      group.transformations.map((item) => item.name),
    ])

    expect(groups).toEqual([
      ['Text', ['Replace', 'Append', 'Prepend', 'Substring', 'Change case']],
      ['Lines', ['Line operations']],
      ['Conversions', ['Encode', 'Decode', 'Reformat dates']],
      ['Regular expressions', ['Regex extract', 'Regex replace']],
    ])
  })

  it('leaves out a category without transformations', () => {
    const catalog: Catalog = {
      limits: { maxInputLength: 10, maxSteps: 5 },
      categories: [
        { id: 'empty', name: 'Empty' },
        { id: 'text', name: 'Text' },
      ],
      transformations: [transformation('append', 'text')],
      examples: [],
    }

    expect(groupByCategory(catalog).map((group) => group.category.id)).toEqual(['text'])
  })
})
