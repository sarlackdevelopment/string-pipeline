/**
 * The picker's groups (D28): the catalog's categories in display order, each with its transformations.
 */
import type { Catalog, Category, Transformation } from '@/model/catalog'

export interface TransformationGroup {
  readonly category: Category
  /** In display order. */
  readonly transformations: readonly Transformation[]
}

/** Categories without transformations are left out. */
export function groupByCategory(catalog: Catalog): readonly TransformationGroup[] {
  return catalog.categories
    .map((category) => ({
      category,
      transformations: catalog.transformations.filter(
        (transformation) => transformation.category === category.id,
      ),
    }))
    .filter((group) => group.transformations.length > 0)
}
