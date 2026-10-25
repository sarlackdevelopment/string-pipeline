/**
 * End-to-end tests (D23): the Gherkin features in `e2e/features` run in Chromium against the real API and the built
 * app. Playwright starts both on ports of their own and stops them afterwards, so a development server on 8080 or
 * 5173 is never touched. A second project takes the screenshots in `docs/images` the same way.
 *
 * With E2E_BASE_URL set, the tests run against an app that is already running instead, such as the Docker image.
 */
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, devices } from '@playwright/test'
import { defineBddConfig } from 'playwright-bdd'

const API_PORT = 8091
const APP_PORT = 4191
const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))
// With a path, so a shell that does not look in the current folder for commands still finds it.
const gradle = process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew'
const runningApp = process.env.E2E_BASE_URL

const featuresDir = defineBddConfig({
  features: 'e2e/features/*.feature',
  steps: 'e2e/steps/*.ts',
})

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: runningApp ?? `http://localhost:${String(APP_PORT)}`,
    // The browser's language decides the app's at a first visit (D52), and Playwright would take the system's.
    locale: 'en-US',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'e2e', testDir: featuresDir },
    { name: 'screenshots', testDir: 'e2e/screenshots' },
  ],
  webServer:
    runningApp === undefined
      ? [
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
        ]
      : [],
})
