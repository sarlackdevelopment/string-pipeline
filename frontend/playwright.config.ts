/**
 * End-to-end tests (D23): the Gherkin features in `e2e/features` run in Chromium against the real API and the built
 * app. Playwright starts both on ports of their own and stops them afterwards, so a development server on 8080 or
 * 5173 is never touched.
 */
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, devices } from '@playwright/test'
import { defineBddConfig } from 'playwright-bdd'

const API_PORT = 8091
const APP_PORT = 4191
const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))
// With a path, so a shell that does not look in the current folder for commands still finds it.
const gradle = process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew'

const testDir = defineBddConfig({
  features: 'e2e/features/*.feature',
  steps: 'e2e/steps/*.ts',
})

export default defineConfig({
  testDir,
  forbidOnly: Boolean(process.env.CI),
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${String(APP_PORT)}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // Without the Gradle daemon the server runs inside the process tree that Playwright stops at the end.
      command: `${gradle} --no-daemon --quiet :server:bootRun --args=--server.port=${String(API_PORT)}`,
      cwd: repositoryRoot,
      url: `http://localhost:${String(API_PORT)}/api/catalog`,
      timeout: 180_000,
    },
    {
      command: `npm run build && npx vite preview --port ${String(APP_PORT)} --strictPort`,
      url: `http://localhost:${String(APP_PORT)}`,
      env: { API_PROXY_TARGET: `http://localhost:${String(API_PORT)}` },
      timeout: 180_000,
    },
  ],
})
