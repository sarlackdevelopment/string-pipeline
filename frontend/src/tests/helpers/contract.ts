/**
 * Reads the shared API examples in `contract/` (D20, D46) as unknown JSON, the way the app receives a response.
 *
 * The path is built with `node:path` on purpose: Vite rewrites `new URL(\`...${name}\`, import.meta.url)` into
 * asset imports of every file in the folder, and `contract/` lies outside the frontend's root.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const contractFolder = join(dirname(fileURLToPath(import.meta.url)), '../../../../contract')

export function readContract(path: string): unknown {
  return JSON.parse(readFileSync(join(contractFolder, path), 'utf8'))
}
