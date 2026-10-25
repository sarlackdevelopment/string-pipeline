/**
 * Reads the shared API examples in `contract/` (D20, D46) as unknown JSON, the way the app receives a response, or
 * as the domain after the app's own parser has read them.
 *
 * The path is built with `node:path` on purpose: Vite rewrites `new URL(\`...${name}\`, import.meta.url)` into
 * asset imports of every file in the folder, and `contract/` lies outside the frontend's root.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCatalog } from '@/api/contract'
import { findTransformation, type Catalog, type Transformation } from '@/model/catalog'

const contractFolder = join(dirname(fileURLToPath(import.meta.url)), '../../../../contract')

export function readContract(path: string): unknown {
  return JSON.parse(readFileSync(join(contractFolder, path), 'utf8'))
}

/** The catalog of the contract, read by the app's parser. */
export function contractCatalog(): Catalog {
  const parsed = parseCatalog(readContract('catalog.json'))
  if (!parsed.ok) {
    throw new Error(parsed.detail)
  }
  return parsed.value
}

export function contractTransformation(id: string): Transformation {
  const transformation = findTransformation(contractCatalog(), id)
  if (transformation === undefined) {
    throw new Error(`The contract's catalog has no transformation "${id}".`)
  }
  return transformation
}
